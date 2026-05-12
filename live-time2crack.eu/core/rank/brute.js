// core/rank/brute.js
// Rang force brute : borne supérieure garantie analytique.
// rank_brute(p) = cs^len / 2
//
// Source : Bonneau (2012) — la force brute est l'unique borne supérieure
// calculable sans corpus. Tous les autres modèles doivent retourner rank ≤ rank_brute.

'use strict';

import { charsetSize, passwordLength } from '../charset.js';

/**
 * Estime le rang force brute d'un mot de passe.
 * C'est une borne supérieure : aucun autre modèle ne peut dépasser ce rang.
 *
 * @param {string} password
 * @returns {{ rank: number, model: 'brute' }}
 */
export function rankBrute(password) {
  const cs  = charsetSize(password);
  const len = passwordLength(password);
  // cs^len / 2 — en moyenne, l'attaquant trouve le mot de passe à mi-parcours
  const rank = Math.pow(cs, len) / 2;
  return { rank, model: 'brute' };
}
