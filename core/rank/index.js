// core/rank/index.js
// Orchestrateur de la couche 1 : estimation du rang de devinette.
//
// Fait tourner plusieurs modèles en parallèle et retourne :
//   - standard   : score global lissé, robuste aux bascules entre attaques
//   - attack_rank: meilleur rang brut parmi les attaques applicables
//   - optimistic : min(dict, hybrid) — attaquant avec accès à wordlists (cas favorable)
//   - worst_case : brute force — borne supérieure garantie
//   - best_attack : quel modèle donne le rang le plus bas
//   - details    : rang de chaque modèle individuellement
//
// Source principale : Bonneau (2012) — définition formelle du rang de devinette.

'use strict';

import { rankBrute }      from './brute.js';
import { rankDictionary } from './dictionary.js';
import { rankHybrid }     from './hybrid.js';
import { rankPCFG }       from './pcfg.js';
import { rankMarkov }     from './markov.js';
import { rankMask }       from './mask.js';
import { rankCombinator } from './combinator.js';

/**
 * Estime le rang de devinette d'un mot de passe.
 *
 * @param {string} password
 * @param {object} [options]
 * @param {Set<string>|null} [options.dictWords]       - Mots du dictionnaire chargé
 * @param {boolean}          [options.isHibpHit]       - Présent dans HIBP
 * @param {number|null}      [options.hibpRank]        - Position dans HIBP si connue
 * @param {boolean}          [options.looksPassphrase] - Flag passphrase (depuis analyzePatterns)
 * @param {string}           [options.lang]            - Langue (pour modèles Markov/PCFG)
 *
 * @returns {{
 *   standard:    number,
 *   attack_rank: number,
 *   optimistic:  number,
 *   worst_case:  number,
 *   best_attack: string,
 *   details: {
 *     brute:      { rank: number,      model: string },
 *     dictionary: { rank: number|null, model: string },
 *     hybrid:     { rank: number|null, model: string },
 *     pcfg:       { rank: number,      model: string },
 *     markov:     { rank: number,      model: string },
 *     mask:       { rank: number|null, model: string },
 *   }
 * }}
 */
export function estimateRank(password, options = {}) {
  const { dictWords = null, isHibpHit = false, hibpRank = null, looksPassphrase = false, hybridVuln = true, lang = 'en' } = options;

  // Court-circuit : si le rang HIBP est connu et très bas, inutile de tout calculer
  if (isHibpHit && hibpRank !== null && hibpRank < 1_000) {
    const brute = rankBrute(password);
    return {
      standard:    hibpRank,
      attack_rank: hibpRank,
      optimistic:  hibpRank,
      worst_case:  brute.rank,
      best_attack: 'dictionary',
      details: {
        brute,
        dictionary: { rank: hibpRank, model: 'dictionary' },
        hybrid:     hybridVuln ? { rank: null, model: 'hybrid' } : { rank: null, model: 'hybrid' },
        pcfg:       rankPCFG(password),
        markov:     rankMarkov(password),
        mask:       rankMask(password, lang),
      },
    };
  }

  // Calcul de tous les modèles
  const raw = {
    brute:      rankBrute(password),
    dictionary: rankDictionary(password, dictWords),
    hybrid:     hybridVuln ? rankHybrid(password, dictWords) : { rank: null, model: 'hybrid' },
    pcfg:       rankPCFG(password),
    markov:     rankMarkov(password),
    mask:       rankMask(password, lang),
    combinator: rankCombinator(password, dictWords, looksPassphrase),
  };

  const bruteRank = raw.brute.rank;

  // Cap chaque rang à la borne brute force (invariant absolu : aucun modèle ne peut dépasser brute).
  // Si un modèle dépasse, console.warn() alerte le développeur immédiatement.
  // Signale un bug d'algorithme : la formule du modèle a produit un résultat > brute force.
  function cappedRank(r, modelName) {
    if (r === null) return null;
    if (r > bruteRank) {
      console.warn(`[RANK CAP] ${modelName}: ${r.toExponential(2)} → ${bruteRank.toExponential(2)} (brute force)`);
      return bruteRank;
    }
    return r;
  }

  // Résultats avec rangs cappés (les details exposent les valeurs cappées, pas les brutes)
  const results = {
    brute:      raw.brute,
    dictionary: { ...raw.dictionary, rank: cappedRank(raw.dictionary.rank, 'dictionary') },
    hybrid:     { ...raw.hybrid,     rank: cappedRank(raw.hybrid.rank, 'hybrid') },
    pcfg:       { ...raw.pcfg,       rank: cappedRank(raw.pcfg.rank, 'pcfg') },
    markov:     { ...raw.markov,     rank: cappedRank(raw.markov.rank, 'markov') },
    mask:       { ...raw.mask,       rank: cappedRank(raw.mask.rank, 'mask') },
    combinator: { ...raw.combinator, rank: cappedRank(raw.combinator.rank, 'combinator') },
  };

  const dictRank       = results.dictionary.rank;
  const hybridRank     = results.hybrid.rank;
  const pcfgRank       = results.pcfg.rank;
  const markovRank     = results.markov.rank;
  const maskRank       = results.mask.rank;
  const combinatorRank = results.combinator.rank;

  // attack_rank = min de tous les modèles non-null applicables
  const attackCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank, bruteRank,
  ].filter(r => r !== null);
  const attack_rank = Math.min(...attackCandidates);

  // standard = score global lissé.
  // On prend une moyenne géométrique sur les familles applicables, ce qui :
  // - réduit les bascules brutales quand un modèle change de vainqueur
  // - reste monotone dans chaque famille
  // - évite de laisser un seul modèle dicter toute la sortie
  const stableCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank,
  ].filter(r => r !== null && r > 0);
  const standard = stableCandidates.length > 0
    ? Math.pow(
        10,
        stableCandidates.reduce((sum, r) => sum + Math.log10(r), 0) / stableCandidates.length,
      )
    : bruteRank;

  // optimistic = min des modèles à ancrage empirique direct
  const optimisticCandidates = [dictRank, hybridRank, combinatorRank].filter(r => r !== null);
  const optimistic = optimisticCandidates.length > 0
    ? Math.min(...optimisticCandidates)
    : standard;

  // Identifier quelle attaque produit le rang standard
  const modelRanks = {
    dictionary: dictRank,
    hybrid:     hybridRank,
    pcfg:       pcfgRank,
    markov:     markovRank,
    mask:       maskRank,
    combinator: combinatorRank,
    brute:      bruteRank,
  };
  const best_attack = Object.entries(modelRanks)
    .filter(([, r]) => r !== null)
    .sort(([, a], [, b]) => a - b)[0][0];

  return {
    standard,
    attack_rank,
    optimistic,
    worst_case: bruteRank,
    best_attack,
    details: results,
  };
}
