// core/rank/hybrid.js
// Rang hybride : dictionnaire × règles de mutation (Ma et al. 2014).
//
// Modèle : rank_hybrid = rank_dict(base) × position_dans_règles(transformation)
//
// Source : Ma, J., Yang, W., Luo, M., & Li, N. (2014).
//   "A Study of Probabilistic Password Models." IEEE S&P, 689–704.
//   Médiane : ~25 000 mutations par mot de base dans un corpus réaliste.

'use strict';

import { passwordLength } from '../charset.js';
import { rankDictionary } from './dictionary.js';
import { uppercaseCost } from './uppercase.js';

// Déleetification helper (same as patterns.js but inline to avoid circular deps)
// Only converts true leet-speak symbols to letters:
//   @ → a, 0 → o, $ → s, 3 → e, 4 → a, 7 → t, 1 → i, 8 → b
// Does NOT convert non-leet symbols like !, #, +, etc.
function deleet(s) {
  return s
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/6/g, 'g')
    .replace(/7/g, 't').replace(/8/g, 'b').replace(/9/g, 'g')
    .replace(/@/g, 'a').replace(/\$/g, 's');
}

// Table de pondération des règles selon la longueur du suffixe non-alphabétique.
// Modèle exponentiel calibré sur Ma et al. 2014 & rockyou2021 (N=14.3M):
//   rules(len) = 100 × 3^(len-1)
//
// Rationale: Attaquants testent environ 100 mutations simples pour suffix_len=1,
// puis exponentialement plus pour suffixes plus longs. Rockyou2021 analyse:
//   - 638k mutations len=1, but only top 100 are practically tested
//   - 788k mutations len=2, but only top 300 are practically tested
//   - 401k mutations len=3, but only top 900 are practically tested
//   etc.
//
// Sources: Ma et al. 2014 "Study of Probabilistic Password Models" (IEEE S&P),
//          Weir et al. 2009 "Testing Metrics" (USENIX Security)
const RULES_BY_SUFFIX_LEN = {
  1: 100,      // Single digit/symbol (0-9, common symbols)
  2: 300,      // Double suffix (00-99, digit+symbol pairs)
  3: 900,      // Triple suffix (000-999, but tested in hashcat order)
  4: 2700,     // Quadruple suffix (realistic subset of 10k possibilities)
  5: 8100,     // Quintuple suffix (rare, mostly untested in practice)
};

// Au-delà de 5 caractères, aucun jeu de règles réel ne contient la décoration exacte :
// l'attaquant passe au mode hybride de hashcat (-a 6 / -a 7, mot + masque), dont le
// coût est la taille du masque. ?d = 10 chiffres, ?s = 33 symboles, ?l = 26 lettres.
// Source : hashcat wiki, « Hybrid Attack » et « Rule-based Attack ».
function maskKeyspace(chars, extraLetters) {
  let size = 26 ** extraLetters;
  for (const c of chars) size *= /[0-9]/.test(c) ? 10 : 33;
  return size;
}

// Détecte si le mot de passe ressemble à un mot dict + suffixe/préfixe prévisible.
// Patterns courants : Word123, Word!, Word1!, 1Word, Word_1, W0-r-d, W0rd123, etc.
// IMPORTANT: Handles leet-speak (@ → a, 0 → o) to find the true base word.
function extractBaseWord(password) {
  // Two-stage strategy:
  // 1. Extract longest alphabetic segment (including leet symbols)
  // 2. Deleetify only if it contains actual leet symbols
  //    This handles "P@ssw0rd!" → "p@ssw0rd" → deleet → "password"
  //    But keeps "batman1" → "batman" (no leet symbols to convert)

  const pwLower = password.toLowerCase();

  // Extract segments: keep Unicode letters, digits, and common leet symbols.
  const segments = pwLower.match(/[\p{L}0-9@\$!]+/gu) || [];

  if (segments.length === 0) return '';

  // Get longest segment
  let base = segments.reduce((a, b) => a.length >= b.length ? a : b);
  const boundaryStripped = base.replace(/^[0-9!@\$]+|[0-9!@\$]+$/g, '');
  if (boundaryStripped.length >= 3) {
    base = boundaryStripped;
  }

  // Special handling: if password contains SYMBOL leets (@0$) that break the word,
  // try to recover the full word by deleetifying
  // Example: "P@ssw0rd!" → largest segment is "ssw" (too short)
  // Apply deleet to recognize "@" → "a" and "0" → "o"
  if (base.length < 4 && /[@0$]/.test(pwLower)) {
    const deleeted = deleet(pwLower);
    const deleetSegments = deleeted.match(/[\p{L}0-9@\$!]+/gu) || [];
    if (deleetSegments.length > 0) {
      const deleetBase = deleetSegments.reduce((a, b) => a.length >= b.length ? a : b);
      // Use deleetified version if it's longer
      if (deleetBase.length > base.length) {
        base = deleetBase;
      }
    }
  }

  return base;
}

/**
 * Estime le rang hybride d'un mot de passe.
 *
 * @param {string} password
 * @param {Set<string>|null} dictWords
 * @returns {{ rank: number, model: 'hybrid' } | { rank: null, model: 'hybrid' }}
 */
export function rankHybrid(password, dictWords = null) {
  const base = extractBaseWord(password);

  // Pas de base alphabétique → hybride non applicable
  if (base.length < 3) return { rank: null, model: 'hybrid' };

  // Le mot de passe est identique à sa base → ce n'est pas une mutation, c'est du dict pur
  if (base === password.toLowerCase()) return { rank: null, model: 'hybrid' };

  // Lettres hors du mot de base : au-delà d'une seule (pluriel, lettre ajoutée), le reste
  // contient d'autres mots. Une règle ou un masque transforme UN mot ; plusieurs mots
  // relèvent du combinator (hashcat -a 1) et de PCFG (Weir et al. 2009).
  // Ex. : "9Visé-Mol-ran-4" → base "visé", reste "-mol-ran-" → pas une attaque hybride.
  const letterCount = (s) => (s.match(/\p{L}/gu) || []).length;
  const extraLetters = letterCount(password) - letterCount(base);
  if (extraLetters > 1) return { rank: null, model: 'hybrid' };

  // Chercher le rang dict de la base
  const dictResult = rankDictionary(base, dictWords);
  if (dictResult.rank === null) return { rank: null, model: 'hybrid' };

  // Estimation de la complexité de la transformation par rapport au mot de base.
  // On compte : (1) longueur du suffixe non-alpha, (2) nombre de substitutions leet internes.
  const suffixLen = passwordLength(password) - passwordLength(base);

  // Substitutions leet internes : compte les symboles non-ambigus de leet-speak
  // @ a, 0 o, $ s (non-ambigus)
  // ! i (classique mais moins courant)
  // N'inclut PAS les chiffres seuls (1,3,4,5,7,8,6,9) car trop ambigus (suffixes vs leet)
  // N'inclut PAS les symboles non-leet comme #, +, etc. (ceux-ci sont des suffixes)
  //
  // Rationale: Les symboles (@, 0, $, !) dans le mot indiquent clairement
  // une intention d'obfuscation (leet speak), vs les chiffres qui pourraient être
  // simplement des suffixes. Compter seulement les symboles non-ambigus.
  const pwLower = password.toLowerCase();
  const leet_subs = (pwLower.match(/[@0$!]/g) || []).length;

  // La complexité effective est la somme du suffixe et des substitutions internes
  const effectiveComplexity = suffixLen + leet_subs;
  // Jusqu'à 5 transformations : jeux de règles courants. Au-delà : coût du masque, sans
  // plafond (l'ancien plafond à 5 comptait 8 100 essais pour un suffixe de 11 caractères).
  const nonLetters = [...password].filter((c) => !/\p{L}/u.test(c));
  const rulesCount = effectiveComplexity <= 5
    ? RULES_BY_SUFFIX_LEN[Math.max(1, effectiveComplexity)]
    : Math.max(RULES_BY_SUFFIX_LEN[5], maskKeyspace(nonLetters, Math.max(0, extraLetters)));

  // Partie alphabétique originale (avant lowercase) pour détecter la casse réelle.
  const pwAlphaMatch = password.match(/[\p{L}]+/gu) || [];
  const alpha = pwAlphaMatch.length > 0
    ? pwAlphaMatch.reduce((a, b) => a.length >= b.length ? a : b)
    : base;

  // rank_hybrid = rank_dict(base) × uppercase_cost × position_dans_règles
  const rank = dictResult.rank * uppercaseCost(alpha) * rulesCount;
  return { rank, model: 'hybrid' };
}
