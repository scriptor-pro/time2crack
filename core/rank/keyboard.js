// core/rank/keyboard.js
// Rang keyboard walk : espace réduit par la topologie du clavier.
//
// Source : Wheeler (2016) zxcvbn — adjacency graphs QWERTY/AZERTY.
// rank = (NB_WALKS × 2^len_walk) / 2
//
// NB_WALKS = 460 : sous-séquences de longueur ≥ 3 extraites des séquences
// principales QWERTY, AZERTY, numpad (directes + inversées).

'use strict';

import { passwordLength } from '../charset.js';

const NB_WALKS = 460;

/**
 * Estime le rang keyboard-walk d'un mot de passe.
 *
 * @param {string} password
 * @param {boolean} kbPat - Flag depuis analyzePatterns()
 * @returns {{ rank: number, model: 'keyboard' } | { rank: null, model: 'keyboard' }}
 */
export function rankKeyboard(password, kbPat) {
  if (!kbPat) return { rank: null, model: 'keyboard' };

  const len = passwordLength(password);
  // Variantes de casse : 2^len (chaque position peut être maj ou min)
  // Capé à 2^20 pour éviter des nombres astronomiques sur les walks très longs
  const caseVariants = Math.pow(2, Math.min(len, 20));
  const rank = Math.round((NB_WALKS * caseVariants) / 2);
  return { rank, model: 'keyboard' };
}
