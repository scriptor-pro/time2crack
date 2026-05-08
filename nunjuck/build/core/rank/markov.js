// core/rank/markov.js
// Rang Markov : probabilité de trigrammes entraînée sur corpus réel.
//
// Architecture :
//   - Les données sont chargées via init(data) au démarrage de l'app (fetch async)
//   - Avant init(), rankMarkov() retourne { rank: null } (modèle non disponible)
//   - Après init(), utilise les trigrammes/bigrammes/starts du corpus
//
// Algorithme :
//   P(password) = P(c1) × P(c2|c1) × P(c3|c1,c2) × P(c4|c2,c3) × ...
//   rank ≈ 1 / P(password) × C_len  (C_len = normalisation par longueur)
//
// Détection hors-distribution :
//   Si logP(password) < FLOOR_LOG_PROB, le mot de passe est hors de la distribution
//   humaine → rank: null (l'attaque Markov ne s'applique pas efficacement).
//
// Source : Dürmuth, M. et al. (2015). "OMEN: Faster Password Guessing Using an
//   Improved Probabilistic Context-Free Grammar." ESSoS, LNCS 8978.

'use strict';

// ─── État interne ─────────────────────────────────────────────────────────────

let DATA = null; // Données chargées via init()

// Seuil hors-distribution : logP/len < FLOOR = mot de passe trop improbable.
// Calibré sur corpus (rockyou 1M, 2026-04) :
//   Mots de passe humains courants : logP/len entre -0.8 et -1.4
//   Mots de passe aléatoires (gestionnaire) : logP/len entre -2.5 et -3.2
//
// Seuil à -2.0 : sépare les deux populations sans faux positifs significatifs.
// Validation empirique (tests/rank-units.mjs) :
//   - ≥95% des passwords générés par crypto.randomBytes rejetés (rank: null)
//   - <5% des passwords rockyou top 100 rejetés (acceptés comme vrais positifs)
// Source : OMEN (Dürmuth et al. 2015) — détection hors-distribution par logP threshold.
const FLOOR_LOG_PROB_PER_CHAR = -2.0;

/**
 * Initialise le modèle avec les données entraînées sur corpus.
 * Doit être appelé avant tout appel à rankMarkov().
 *
 * Les données de train-markov.mjs sont déjà en format natif (clés = caractères Unicode).
 * Aucune conversion n'est nécessaire.
 *
 * @param {Object} data - Contenu de data/calibration/markov-ngrams.json
 */
export function init(data) {
  DATA = data;
}

/**
 * Retourne true si le modèle est initialisé.
 */
export function isReady() {
  return DATA !== null;
}

// ─── Calcul de probabilité ────────────────────────────────────────────────────

/**
 * Calcule log10(P(password)) via la chaîne de Markov d'ordre 3.
 * Utilise le fallback bigramme puis unigramme si le trigramme est absent.
 *
 * @param {string[]} chars - Tableau de code points
 * @returns {number} log10(P)
 */
function logProbability(chars) {
  const { starts, starts_total, bigrams, bigram_totals, trigrams, trigram_totals, char_totals, char_grand_total } = DATA;

  let logP = 0;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    let prob;

    if (i === 0) {
      // Probabilité du premier caractère
      const cnt = starts[c] ?? 1;
      prob = cnt / starts_total;

    } else if (i === 1) {
      // Bigramme
      const bg  = chars[0] + c;
      const cnt = bigrams[bg] ?? 1;
      const tot = bigram_totals[chars[0]] ?? (char_totals[chars[0]] ?? 1);
      prob = cnt / tot;

    } else {
      // Trigramme (ordre 3) avec fallback bigramme
      const tg     = chars[i - 2] + chars[i - 1] + c;
      const prefix = chars[i - 2] + chars[i - 1];

      if (trigrams[tg] && trigram_totals[prefix]) {
        prob = trigrams[tg] / trigram_totals[prefix];
      } else {
        // Fallback : bigramme
        const bg  = chars[i - 1] + c;
        const cnt = bigrams[bg] ?? 1;
        const tot = bigram_totals[chars[i - 1]] ?? (char_totals[chars[i - 1]] ?? 1);
        prob = cnt / tot;
      }
    }

    // Lissage de Laplace léger : plancher à 1e-6 pour éviter log(0)
    logP += Math.log10(Math.max(prob, 1e-6));
  }

  return logP;
}

// ─── Conversion probabilité → rang ───────────────────────────────────────────

/**
 * Estime le rang depuis logP.
 *
 * rank = 1 / P(password)
 * En log : log10(rank) = -logP
 *
 * Intuition : P(password) est la probabilité que le modèle Markov génère
 * exactement ce mot de passe. L'attaquant doit tirer en moyenne 1/P essais
 * avant de le produire. C'est la définition du rang de Bonneau (2012).
 *
 * Note : lenCount était précédemment utilisé ici, mais c'est une erreur —
 * il multiplierait le rang par ~10^6 et violerait l'invariant rank_markov ≤ rank_brute.
 * Source : Dürmuth et al. (2015) OMEN, Weir et al. (2009) PCFG.
 *
 * @param {number} logP
 * @returns {number}
 */
function logProbToRank(logP) {
  // log10(rank) = -logP
  return Math.pow(10, -logP);
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Estime le rang Markov d'un mot de passe.
 *
 * Retourne { rank: null } si :
 *   - Le modèle n'est pas encore initialisé
 *   - Le mot de passe est hors de la distribution humaine (trop aléatoire)
 *
 * @param {string} password
 * @returns {{ rank: number, model: 'markov' } | { rank: null, model: 'markov' }}
 */
export function rankMarkov(password) {
  if (!DATA) return { rank: null, model: 'markov' };

  const chars = [...password];
  const len   = chars.length;

  const logP = logProbability(chars);

  // Détection hors-distribution
  const floor = FLOOR_LOG_PROB_PER_CHAR * len;
  if (logP < floor) {
    return { rank: null, model: 'markov' };
  }

  const rank = logProbToRank(logP);

  return { rank, model: 'markov' };
}
