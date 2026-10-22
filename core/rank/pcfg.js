// core/rank/pcfg.js
// Rang PCFG : estimation par structure probabiliste entraînée sur corpus réel.
//
// Architecture :
//   - Les données sont chargées via init(data) au démarrage de l'app (fetch async)
//   - Avant init(), rankPCFG() retourne { rank: null }
//   - Après init(), utilise les fréquences de squelettes du corpus
//
// Algorithme (Weir et al. 2009) :
//   1. Extraire le squelette : "Summer2024!" → "L6D4S1"
//   2. P(skeleton) = count(skeleton) / total_passwords
//   3. Taille de l'espace des segments : word_count[L6] × 10^4 × 32^1
//   4. rank = (1 / P(skeleton)) × segment_space
//
// Détection hors-distribution :
//   Si le squelette est vu < threshold fois dans le corpus, le mot de passe
//   est structurellement hors-distribution → rank: null.
//
// Source : Weir, M. et al. (2009). "Password Cracking Using Probabilistic
//   Context-Free Grammars." IEEE S&P, 391–405.

'use strict';

import { charsetSize, passwordLength } from '../charset.js';
import { uppercaseCost } from './uppercase.js';

// ─── État interne ─────────────────────────────────────────────────────────────

let DATA = null;

/**
 * Initialise le modèle avec les données entraînées sur corpus.
 * @param {Object} data - Contenu de data/calibration/pcfg-data.json
 */
export function init(data) {
  DATA = data;
}

export function isReady() {
  return DATA !== null;
}

// ─── Extraction du squelette ──────────────────────────────────────────────────

/**
 * Extrait le squelette PCFG d'un mot de passe.
 * Ex: "Summer2024!" → "L6D4S1"
 *
 * @param {string} password
 * @returns {string}
 */
function extractSkeleton(password) {
  let skeleton = '';
  let i = 0;
  const chars = [...password];

  while (i < chars.length) {
    const c = chars[i];
    let cls;

    if (/\p{L}/u.test(c))       cls = 'L';
    else if (/[0-9]/.test(c))   cls = 'D';
    else                         cls = 'S';

    let j = i;
    while (j < chars.length) {
      if (cls === 'L' && !/\p{L}/u.test(chars[j])) break;
      if (cls === 'D' && !/[0-9]/.test(chars[j]))    break;
      if (cls === 'S' && (/\p{L}/u.test(chars[j]) || /[0-9]/.test(chars[j]))) break;
      j++;
    }

    skeleton += cls + (j - i);
    i = j;
  }

  return skeleton;
}

// ─── Calcul de l'espace des segments ─────────────────────────────────────────

// Nombre de mots du dictionnaire par longueur, calculé une fois par Set.
const DICT_LENGTHS = new WeakMap();

function dictCountByLength(dictWords) {
  let counts = DICT_LENGTHS.get(dictWords);
  if (!counts) {
    counts = new Map();
    for (const w of dictWords) {
      const n = [...w].length;
      counts.set(n, (counts.get(n) || 0) + 1);
    }
    DICT_LENGTHS.set(dictWords, counts);
  }
  return counts;
}

/**
 * Calcule log10 de la taille de l'espace des segments d'un mot de passe.
 *
 * Segment lettres (Weir et al. 2009 : les lettres viennent d'un dictionnaire) :
 *   - mot du dictionnaire → nombre de mots de cette longueur × variantes de casse
 *   - sinon (ou dictionnaire absent) → 26^n × variantes de casse : le PCFG
 *     n'aide pas pour un segment qui n'est pas un mot.
 * Chiffres et symboles : espace empirique du corpus, sinon théorique (10^n, 32^n).
 *
 * @param {string} password
 * @param {Set<string>|null} dictWords
 * @returns {number} log10(segment_space)
 */
function logSegmentSpace(password, dictWords) {
  const segments = password.match(/\p{L}+|[0-9]+|[^\p{L}0-9]+/gu) || [];
  const counts = dictWords instanceof Set && dictWords.size > 0 ? dictCountByLength(dictWords) : null;
  let logSpace = 0;

  for (const seg of segments) {
    const n = [...seg].length;
    const segData = (cls) => DATA.segments?.[cls]?.[String(n)];

    if (/^\p{L}/u.test(seg)) {
      const caseCost = uppercaseCost(seg);
      const inDict = counts && dictWords.has(seg.toLowerCase());
      const words = inDict ? Math.min(counts.get(n) || 1, Math.pow(26, n)) : Math.pow(26, n);
      logSpace += Math.log10(Math.max(words, 1)) + Math.log10(caseCost);

    } else if (/^[0-9]/.test(seg)) {
      const space = segData('D')?.space;
      logSpace += space ? Math.log10(space) : n;

    } else {
      const space = segData('S')?.space;
      logSpace += space ? Math.log10(space) : n * Math.log10(32);
    }
  }

  return logSpace;
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Estime le rang PCFG d'un mot de passe avec interpolation Bayésienne.
 *
 * Mixe probabilité empirique PCFG avec probabilité théorique brute force,
 * pondéré par la confiance basée sur la fréquence du squelette.
 *
 * Formule (moyenne pondérée des ordres de grandeur) :
 *   log(rank_combined) = confidence × log(rank_pcfg) + (1-confidence) × log(rank_brute)
 * où confidence = skeleton_count / (skeleton_count + CONFIDENCE_FLOOR)
 *
 * Une moyenne linéaire ne convient pas : rank_brute est souvent 10¹⁰ fois plus
 * grand que rank_pcfg, si bien que même 0,3 % de son poids écrasait le résultat
 * (Password123 avec un squelette vu 6 472 fois : 8×10¹⁶ au lieu de ~10⁹).
 *
 * Rationale :
 *   - Squelette observé beaucoup (count >> FLOOR): confidence ≈ 1, utilise PCFG
 *   - Squelette rare (count ≈ FLOOR): confidence ≈ 0.5, mixe PCFG et brute
 *   - Squelette inconnu (count = 0): confidence ≈ 0, utilise brute force
 *
 * Cela évite les cliff effects des approches threshold/Laplace classiques.
 *
 * @param {string} password
 * @param {Set<string>|null} [dictWords] - Dictionnaire chargé (segments lettres)
 * @returns {{ rank: number, model: 'pcfg', skeleton: string, confidence?: number }}
 */
export function rankPCFG(password, dictWords = null) {
  const skeleton = extractSkeleton(password);

  // Données absentes ou dans un autre format (ex. pcfg-data-pt.json) : non applicable
  if (!DATA?.skeletons || !DATA.skeleton_total) return { rank: null, model: 'pcfg', skeleton };

  // CALIBRAGE : CONFIDENCE_FLOOR = Laplace smoothing pour squelettes rares.
  // Détermine le point d'inflexion où confidence = 0.5 (Bayesian interpolation).
  // - FLOOR=10: squelettes observés 10× reçoivent 50% confiance
  // - FLOOR=100: squelettes observés 100× reçoivent 50% confiance
  //
  // Choix : FLOOR=20 = compromis (Weir et al. 2009, PCFG Password Cracking)
  //   - Squelettes communs (count > 100): confidence > 83% → confidence PCFG dominante
  //   - Squelettes rares (count = 5): confidence ≈ 20% → interpolation PCFG/brute
  //   - Squelettes inconnus (count = 0): confidence = 0% → pur brute force
  //
  // Calibration : rockyou 1M (2026-04, scripts/train-pcfg.mjs)
  // Impact : ±1 ordre de grandeur de variation possible sur autre corpus
  // Référence : Weir, M. et al. (2009). "Password Cracking Using Probabilistic
  //   Context-Free Grammars." IEEE S&P.
  //
  const CONFIDENCE_FLOOR = 20;

  // Estimation PCFG (utilise Laplace α=1.0 classique)
  const LAPLACE_ALPHA = 1.0;
  const vocabSize = Object.keys(DATA.skeletons).length;
  const skeletonCount = DATA.skeletons[skeleton] ?? 0;
  const smoothedCount = skeletonCount + LAPLACE_ALPHA;
  const smoothedTotal = DATA.skeleton_total + LAPLACE_ALPHA * vocabSize;
  const skelProb = smoothedCount / smoothedTotal;
  const logRankPCFG = -Math.log10(skelProb) + logSegmentSpace(password, dictWords);

  // Estimation brute force (importer depuis brute.js)
  // Pour éviter une dépendance circulaire, on calcule brute force ici
  const logRankBrute = Math.log10(computeBruteForceRank(password));

  // Interpolation Bayésienne, sur les ordres de grandeur
  const confidence = skeletonCount / (skeletonCount + CONFIDENCE_FLOOR);
  const logPCFG = Math.min(logRankPCFG, logRankBrute);
  let rankCombined = Math.pow(10, confidence * logPCFG + (1 - confidence) * logRankBrute);

  // Pour les squelettes jamais observés (count=0), appliquer une pénalité très légère
  // pour garantir que rankPCFG < rankBrute (plutôt que égal due aux arrondis).
  // Pénalité: multiplier par 0.99 pour les unseen, 1.0 pour les observés.
  if (skeletonCount === 0) {
    rankCombined *= 0.99;
  }

  return { rank: rankCombined, model: 'pcfg', skeleton, confidence };
}

/**
 * Calcule le rang brute force pour un mot de passe (implémentation locale).
 * @param {string} password
 * @returns {number}
 */
function computeBruteForceRank(password) {
  return Math.pow(charsetSize(password), passwordLength(password)) / 2;
}
