// core/rank/combinator.js
// Rang combinator : concaténation de mots de dictionnaire (passphrases).
//
// Sources : hashcat wiki « Combinator Attack » (produit cartésien de deux listes) ;
//   Weir et al. (2009), PCFG : segments devinés séparément ;
//   Wheeler (2016), zxcvbn : rang = produit des rangs des segments.

'use strict';

import { rankDictionary } from './dictionary.js';
import { uppercaseCost } from './uppercase.js';

// Coût du séparateur : espace et tiret sont les plus fréquents dans les passphrases.
const SEPARATOR_ADJUSTMENT = {
  '':  2.0,
  ' ': 1.0,
  '-': 1.0,
  '_': 2.5,
  '.': 5.0,
};

/**
 * Estime le rang combinator d'un mot de passe de type passphrase.
 *
 * Modèle (2026-10-17) : coût cartésien de l'attaque combinator de hashcat (-a 1 / -a 12),
 * segment par segment comme PCFG (Weir et al. 2009) et zxcvbn (Wheeler 2016) :
 *   rang = Π coût(segment de lettres) × 10^chiffres × 33^symboles × séparateur
 *   coût(segment) = min(rang dictionnaire, 26^longueur) × coût de la casse
 * Un segment court absent du dictionnaire (« mol », « ran ») est deviné par masque
 * (?l^n) au lieu de faire échouer toute l'attaque. Il faut au moins un mot du
 * dictionnaire : sans mot connu, c'est du masque pur (rankMask).
 *
 * L'ancien modèle ignorait chiffres et majuscules, abandonnait dès qu'un mot manquait
 * au dictionnaire de la langue, et multipliait par un facteur dictSize^1.1…2.5 dont la
 * calibration citée (tests/calibrate-multipliers.mjs) n'existe pas.
 *
 * @param {string} password
 * @param {Set<string>|null} dictWords
 * @param {boolean} looksPassphrase - Flag issu de analyzePatterns()
 * @returns {{ rank: number, model: 'combinator' } | { rank: null, model: 'combinator' }}
 */
export function rankCombinator(password, dictWords, looksPassphrase) {
  if (!looksPassphrase) return { rank: null, model: 'combinator' };
  if (!(dictWords instanceof Set) || dictWords.size === 0) {
    return { rank: null, model: 'combinator' };
  }

  // Découpage en blocs : lettres, chiffres, symboles. Le séparateur est le premier bloc de
  // symboles d'un seul caractère situé entre deux blocs (mots ou chiffres).
  const runs = password.match(/\p{L}+|[0-9]+|[^\p{L}0-9]+/gu) || [];
  const isSymbols = (r) => /^[^\p{L}0-9]+$/u.test(r);
  const interior = (i) => i > 0 && i < runs.length - 1;
  const sepRun = runs.find((r, i) => interior(i) && isSymbols(r) && [...r].length === 1);
  const sep = sepRun ?? '';

  const segments = password.match(/\p{L}+/gu) || [];
  if (segments.length < 2) return { rank: null, model: 'combinator' };

  let rank = 1;
  let dictHits = 0;
  for (const seg of segments) {
    const lower = seg.toLowerCase();
    const maskCost = 26 ** [...lower].length;
    const dictRank = lower.length >= 3 && dictWords.has(lower)
      ? rankDictionary(lower, dictWords).rank
      : null;
    if (dictRank !== null) dictHits++;
    rank *= Math.min(dictRank ?? Infinity, maskCost) * uppercaseCost(seg);
  }
  if (dictHits === 0) return { rank: null, model: 'combinator' };

  // Décorations : chiffres (?d) et symboles (?s). Seul le séparateur placé ENTRE deux blocs est
  // gratuit ; un symbole en début ou en fin, ou un groupe comme "-.", se paie caractère par caractère.
  runs.forEach((r, i) => {
    if (/^[0-9]+$/.test(r)) rank *= 10 ** r.length;
    else if (isSymbols(r) && !(interior(i) && r === sep)) rank *= 33 ** [...r].length;
  });

  // Coût du séparateur ; sans séparateur unique, les symboles ont déjà été comptés un par un
  const hasSymbols = runs.some(isSymbols);
  rank *= sep ? SEPARATOR_ADJUSTMENT[sep] ?? 3.0 : hasSymbols ? 1 : SEPARATOR_ADJUSTMENT[''];

  return { rank: Math.round(rank), model: 'combinator' };
}
