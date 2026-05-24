// core/rank/repeat.js
// Rang repeat : espace analytique fermé pour répétitions, cycles et séquences.
//
// Formule (Wheeler 2016) :
//   rank = charset^len_motif × 2^len_total
//
// Pour pattern mixte (reste non null) :
//   rank = charset^len_motif × 2^len_repeat × charset^len_reste

'use strict';

import { charsetSize, passwordLength } from '../charset.js';

/**
 * @param {string} password
 * @param {{ type: string, motif: string, len_motif: number, len_total: number, reste: string|null } | null} repeatResult
 * @returns {{ rank: number, model: 'repeat' } | { rank: null, model: 'repeat' }}
 */
export function rankRepeat(password, repeatResult) {
  if (!repeatResult) return { rank: null, model: 'repeat' };

  const { type, motif, len_motif, len_total, reste } = repeatResult;

  let baseRank;
  if (type === 'sequence') {
    // Séquence consécutive : espace = nb de points de départ × 2 directions
    // Pour digits (10 chars) : 10 × 2 = 20 séquences possibles
    // Pour lettres (26 chars) : 26 × 2 = 52 séquences possibles
    const csMotif = charsetSize(motif);
    baseRank = csMotif * 2;
  } else {
    // Répétition pure ou cycle : charset^len_motif × 2^len_total (Wheeler 2016)
    const csMotif      = charsetSize(motif);
    const caseVariants = Math.pow(2, Math.min(len_total, 20));
    baseRank = Math.pow(csMotif, len_motif) * caseVariants;
  }

  let rank;
  if (reste === null) {
    rank = Math.round(baseRank);
  } else {
    const csReste  = charsetSize(reste);
    const lenReste = passwordLength(reste);
    rank = Math.round(baseRank * Math.pow(csReste, lenReste));
  }

  return { rank, model: 'repeat' };
}
