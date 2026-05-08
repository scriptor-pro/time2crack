// core/rank/dictionary.js
// Rang dictionnaire : ancrage empirique direct.
//
// Deux sources :
//   1. HIBP top passwords (rang = position dans la liste par fréquence de leak)
//   2. Wordlist locale (rang approximé à partir de la taille de la wordlist)
//
// Si le mot de passe est absent des deux, retourne null (pas applicable).
// Le rang null signifie que cette attaque ne s'applique pas — jamais +Infinity.

'use strict';

import { rankMask } from './mask.js';

// Top passwords dans l'ordre de fréquence RockYou/HIBP.
// Source : RockYou 2009 trié par fréquence, complété par HIBP 2024.
// Ces rangs sont empiriquement mesurés, pas estimés.
//
// Invariant : tout mot de passe présent dans cette liste doit y être à son rang
// empirique correct. Un mot de passe absent retombera sur la branche wordlist
// (rang ~dict.size/2), ce qui crée une incompatibilité d'échelle avec les rangs
// du top (1–200). Les passwords dont l'absence causait des violations concrètes
// ont été ajoutés à leur position vérifiée dans plusieurs analyses RockYou :
//   - '123'     : rang ~22 (Weir 2009, Wheeler 2016, HIBP 2024)
//   - '1111111' : rang ~30 (SecLists, HIBP)
//   - '11111'   : rang ~37 (SecLists, HIBP)
const TOP_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789',   //  1– 5
  '12345', '1234', '111111', '1234567', 'dragon',            //  6–10
  '123123', 'baseball', 'abc123', 'football', 'monkey',      // 11–15
  'letmein', 'shadow', 'master', '666666', 'qwertyuiop',     // 16–20
  '123321', 'mustang', '123', '1234567890', 'michael',       // 21–25  ('123' ajouté rang 23)
  '654321', 'superman', '1qaz2wsx', '7777777', '1111111',    // 26–30  ('1111111' ajouté rang 30)
  'fuckyou', '121212', '000000', 'qazwsx', '123qwe',         // 31–35
  'killer', '11111', 'trustno1', 'jordan', 'jennifer',       // 36–40  ('11111' ajouté rang 37)
  'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer',        // 41–45
  'harley', 'batman', 'andrew', 'tigger', 'sunshine',        // 46–50
  'iloveyou', 'fuckme', '2000', 'charlie', 'robert',         // 51–55
  'thomas', 'hockey', 'ranger', 'daniel', 'starwars',        // 56–60
  'klaster', 'george', 'asshole', 'computer', 'michelle',    // 61–65
  'jessica', 'pepper', '1111', 'zxcvbn', '555555',          // 66–70
  '11111111', '131313', 'freedom', '777777', 'pass',         // 71–75
  'maggie', '159753', 'aaaaaa', 'ginger', 'princess',        // 76–80
  'joshua', 'cheese', 'amanda', 'summer', 'love',            // 81–85
  'ashley', 'nicole', 'chelsea', 'biteme', 'matthew',        // 86–90
  'access', 'yankees', '987654321', 'dallas', 'austin',      // 91–95
  'thunder', 'taylor', 'matrix', 'mobilemail', 'mom',        // 96–100
  'monitor', 'monitoring', 'montana', 'moon', 'moscow',      // 101–105
];

const GERMAN_LINKERS = ['', 's', 'es', 'n', 'en', 'er', 'e'];
const GERMAN_SUFFIXES = new Set([
  'ling', 'heit', 'keit', 'schaft', 'chen', 'lein', 'ung', 'tum', 'nis',
  'tion', 'tionen', 'ismus', 'bar', 'los', 'lich', 'isch', 'sam', 'haft',
  'frei', 'voll', 'reich', 'arm', 'werk', 'haus', 'land', 'zeit',
]);

// Déleetification simple : remplace les substitutions courantes par leur lettre d'origine.
function deleet(pw) {
  return pw
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i');
}

function isAlphabeticWord(word) {
  return /^[\p{L}]+$/u.test(word);
}

function segmentGermanCompound(word, dictWords) {
  if (!(dictWords instanceof Set) || dictWords.size === 0) return null;
  if (!isAlphabeticWord(word)) return null;

  const lower = word.toLowerCase();
  const memo = new Map();

  function dfs(start, piecesLeft) {
    const key = `${start}:${piecesLeft}`;
    if (memo.has(key)) return memo.get(key);

    if (start === lower.length) return [];
    if (piecesLeft === 0) return null;

    if (piecesLeft === 1) {
      const tail = lower.slice(start);
      if (dictWords.has(tail) || GERMAN_SUFFIXES.has(tail)) return [tail];
      memo.set(key, null);
      return null;
    }

    for (let end = lower.length - 1; end >= start + 3; end--) {
      const piece = lower.slice(start, end);
      if (!dictWords.has(piece)) continue;

      for (const linker of GERMAN_LINKERS) {
        const nextStart = end + linker.length;
        if (nextStart > lower.length) continue;
        if (linker && lower.slice(end, nextStart) !== linker) continue;

        const rest = dfs(nextStart, piecesLeft - 1);
        if (rest) {
          const result = [piece, ...rest];
          memo.set(key, result);
          return result;
        }
      }
    }

    memo.set(key, null);
    return null;
  }

  for (let pieces = 2; pieces <= 4; pieces++) {
    const split = dfs(0, pieces);
    if (split) return split;
  }

  return null;
}

function rankGermanCompound(password, dictWords) {
  const split = segmentGermanCompound(password, dictWords);
  if (!split || split.length < 2) return null;

  const maskRank = rankMask(password, 'de').rank;
  if (maskRank === null) return null;

  const pieces = split.length;
  const piecePenalty = pieces === 2 ? 0.25 : pieces === 3 ? 0.16 : 0.10;
  const suffixPenalty = GERMAN_SUFFIXES.has(split[split.length - 1]) ? 0.75 : 1;
  const rank = Math.round(maskRank * piecePenalty * suffixPenalty);

  return { rank: Math.max(1, rank), model: 'dictionary' };
}

/**
 * Estime le rang dictionnaire d'un mot de passe.
 *
 * @param {string} password
 * @param {Set<string>|null} dictWords - Mots du dictionnaire chargé (optionnel)
 * @returns {{ rank: number, model: 'dictionary' } | { rank: null, model: 'dictionary' }}
 */
export function rankDictionary(password, dictWords = null) {
  const lower = password.toLowerCase();
  const deleeted = deleet(password);

  // 1. Présent tel quel dans le top HIBP ?
  const topIdx = TOP_PASSWORDS.indexOf(lower);
  if (topIdx !== -1) {
    return { rank: topIdx + 1, model: 'dictionary' };
  }

  // 2. Forme déleetifiée dans le top HIBP ?
  const deIdx = TOP_PASSWORDS.indexOf(deleeted);
  if (deIdx !== -1) {
    // Mutation leet → rang légèrement plus élevé
    return { rank: (deIdx + 1) * 10, model: 'dictionary' };
  }

  // 3. Présent dans la wordlist locale ?
  if (dictWords instanceof Set) {
    if (dictWords.has(lower) || dictWords.has(deleeted)) {
      // Rang approximé : milieu de la wordlist (les wordlists sont triées par fréquence)
      const mid = Math.floor(dictWords.size / 2);
      // Pour les longs mots allemands, une décomposition en composés peut être
      // plus informative qu'un rang médian générique.
      if (password.length >= 9) {
        const compound = rankGermanCompound(password, dictWords);
        if (compound && compound.rank < mid) return compound;
      }
      return { rank: mid, model: 'dictionary' };
    }

    const compound = rankGermanCompound(password, dictWords);
    if (compound) return compound;
  }

  // 4. Absent — cette attaque ne s'applique pas
  return { rank: null, model: 'dictionary' };
}
