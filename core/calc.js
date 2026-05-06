// core/calc.js
// Orchestrateur principal : mot de passe → tableau de résultats.
//
// Pipeline :
//   1. analyzePatterns(password)    → context (flags, métriques)
//   2. estimateRank(password, opts) → { standard, optimistic, worst_case, details }
//   3. rankToAllSeconds(rank)       → { md5, sha1, sha256, ntlm, bcrypt, argon2 }
//
// Les deux couches sont strictement séparées :
//   - Couche 1 (rank/) : "combien de tentatives ?"
//   - Couche 2 (time)  : "combien de temps ?"
//
// Ce module ne contient aucune logique de rang ni de vitesse GPU directement.

'use strict';

import { analyzePatterns }                   from './patterns.js';
import { estimateRank }                      from './rank/index.js';
import { rankToSeconds, rankToAllSeconds, HASH_RATES } from './time.js';
export { init as initMarkov, isReady as isMarkovReady } from './rank/markov.js';
export { init as initPCFG,   isReady as isPCFGReady   } from './rank/pcfg.js';

/**
 * Calcule le temps de crack pour un mot de passe.
 *
 * @param {string} password
 * @param {object} [options]
 * @param {Set<string>|null} [options.dictWords]   - Wordlist de la langue active
 * @param {boolean}          [options.isHibpHit]   - Présent dans HIBP
 * @param {number|null}      [options.hibpRank]    - Rang HIBP si connu
 * @param {string}           [options.profile]     - Profil d'attaquant (experienced par défaut)
 * @param {string}           [options.lang]        - Langue (fr, en, etc.) pour modèles Markov/PCFG
 *
 * @returns {CrackResult}
 *
 * @typedef {Object} CrackResult
 * @property {PasswordContext} context       - Analyse du mot de passe
 * @property {RankEstimate}    rank          - Rang de devinette (couche 1)
 * @property {AlgoTimes}       times         - Temps par algo, scénario standard (couche 2)
 * @property {AlgoTimes}       times_optimistic  - Temps scénario optimiste (attaquant ciblé)
 * @property {AlgoTimes}       times_worst_case  - Temps borne supérieure (force brute)
 * @property {string}          best_attack   - Nom de l'attaque la plus efficace
 * @property {number|null}     best_attack_seconds  - Temps (sec) de la meilleure attaque
 * @property {string}          profile       - Profil d'attaquant utilisé
 */
export function calcCrackTime(password, options = {}) {
  const {
    dictWords   = null,
    isHibpHit   = false,
    hibpRank    = null,
    profile     = 'experienced',
    lang        = 'en',
  } = options;

  // === PROFILER: Mesurer chaque couche ===
  const tPatterns0 = performance.now();

  // Couche 0 : analyse des patterns (contexte)
  const context = analyzePatterns(password, dictWords);

  const tPatterns1 = performance.now();
  const timePatterns = tPatterns1 - tPatterns0;

  // Couche 1 : estimation du rang de devinette
  const tRank0 = performance.now();
  const rank = estimateRank(password, { dictWords, isHibpHit, hibpRank, looksPassphrase: context.looksPassphrase, hybridVuln: context.hybridVuln, lang });
  const tRank1 = performance.now();
  const timeRank = tRank1 - tRank0;

  // Couche 2 : conversion rang → temps pour les 3 scénarios × 6 algorithmes
  const tTime0 = performance.now();
  const times            = rankToAllSeconds(rank.standard,    profile);
  const times_optimistic = rankToAllSeconds(rank.optimistic,  profile);
  const times_worst_case = rankToAllSeconds(rank.worst_case,  profile);

  // Temps de la meilleure attaque (pour affichage "Attaque la plus rapide")
  // Cherche le minimum parmi tous les algorithmes pour cette attaque
  const bestAttackRank = rank.details[rank.best_attack]?.rank ?? null;
  let bestAttackSeconds = null;
  if (bestAttackRank !== null) {
    // Calcule le temps pour chaque algo et prend le minimum
    const allAlgos = Object.keys(HASH_RATES);
    const timesForBestAttack = allAlgos.map(algo => rankToSeconds(bestAttackRank, algo, profile));
    bestAttackSeconds = Math.min(...timesForBestAttack);
  }
  const tTime1 = performance.now();
  const timeTime = tTime1 - tTime0;

  // === LOG PROFILER (à la console du navigateur) ===
  if (typeof window !== 'undefined' && window.__TIME2CRACK_DEBUG) {
    console.log(`[calcCrackTime PROFILER]`);
    console.log(`  analyzePatterns:  ${timePatterns.toFixed(2)} ms`);
    console.log(`  estimateRank:     ${timeRank.toFixed(2)} ms`);
    console.log(`  rankToAllSeconds: ${timeTime.toFixed(2)} ms`);
    console.log(`  Total:            ${(timePatterns + timeRank + timeTime).toFixed(2)} ms`);
  }

  return {
    context,
    rank,
    times,
    times_optimistic,
    times_worst_case,
    best_attack: rank.best_attack,
    best_attack_seconds: bestAttackSeconds,
    profile,
    _profiler: {
      timePatterns,
      timeRank,
      timeTime,
    },
  };
}

/**
 * Retourne les temps de crack pour un rang et un algo donnés, tous profils confondus.
 * Utile pour l'affichage du sélecteur de profil d'attaquant.
 *
 * @param {number} rank
 * @param {string} algo
 * @returns {{ amateur: number, experienced: number, professional: number, nation_state: number }}
 */
export function rankToAllProfiles(rank, algo) {
  return {
    amateur:      rankToSeconds(rank, algo, 'amateur'),
    experienced:  rankToSeconds(rank, algo, 'experienced'),
    professional: rankToSeconds(rank, algo, 'professional'),
    nation_state: rankToSeconds(rank, algo, 'nation_state'),
  };
}

/**
 * Liste des algorithmes de hachage supportés.
 */
export const ALGORITHMS = Object.keys(HASH_RATES);
