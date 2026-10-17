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

  // Séparateur principal : le caractère entre deux segments de lettres
  const sepMatch = password.match(/[\p{L}]{2,}([ \-_.])[\p{L}]{2,}/u);
  const sep = sepMatch ? sepMatch[1] : '';

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

  // Décorations hors mots : chiffres (?d) et symboles autres que le séparateur (?s)
  for (const c of password.replace(/\p{L}+/gu, '')) {
    if (/[0-9]/.test(c)) rank *= 10;
    else if (c !== sep) rank *= 33;
  }

  rank *= SEPARATOR_ADJUSTMENT[sep] ?? 3.0;

  return { rank: Math.round(rank), model: 'combinator' };
}
