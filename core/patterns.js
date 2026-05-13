// core/patterns.js
// Détection de patterns structurels dans un mot de passe.
// Produit le contexte utilisé par tous les modèles de rang.
//
// Séparation claire des responsabilités :
//   - patterns.js : analyse du mot de passe → flags booléens + métriques
//   - rank/*.js   : utilise ces flags pour estimer le rang
//   - time.js     : convertit le rang en temps

'use strict';

import { charsetSize, passwordLength } from './charset.js';

// Séquences clavier courantes (QWERTY, AZERTY, DVORAK)
const KEYBOARD_SEQUENCES = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',   // QWERTY lignes
  'azertyuiop', 'qsdfghjklm', 'wxcvbn',    // AZERTY lignes
  'qwerty', 'azerty', 'qwert', 'azert',
  'asdf', 'zxcv', 'poiuy', 'lkjhg',
  '1qaz', '2wsx', '3edc', 'qazwsx',
];

// Séquences alphabétiques et numériques
const ALPHA_SEQUENCES = ['abcdef', 'abcde', 'abcd', 'bcde', 'cdef'];
const NUM_SEQUENCES   = ['123456', '234567', '12345', '23456', '11111', '00000'];

/**
 * Détecte les patterns présents dans un mot de passe.
 *
 * @param {string} password
 * @param {Set<string>|null} dictWords - Mots du dictionnaire (optionnel)
 * @returns {PasswordContext}
 *
 * @typedef {Object} PasswordContext
 * @property {string}       pw              - Mot de passe original
 * @property {number}       len             - Longueur (code points Unicode)
 * @property {number}       cs              - Taille du charset effectif
 * @property {number}       full            - Keyspace brute : cs^len
 * @property {boolean}      kbPat           - Séquence clavier détectée
 * @property {boolean}      seq             - Séquence alpha/numérique
 * @property {boolean}      rep             - Caractère répété dominant
 * @property {boolean}      dt              - Date détectée dans le mot de passe
 * @property {boolean}      dictWord        - Mot (ou mutation) présent dans dictWords
 * @property {boolean}      hybridVuln      - Éligible à l'attaque hybride (dict + mutations)
 * @property {boolean}      looksPassphrase - Ressemble à une passphrase (mots concaténés)
 * @property {string|null}  datePattern     - Format de date détecté (ex: 'YYYY', 'DDMM')
 */
export function analyzePatterns(password, dictWords = null) {
  const len = passwordLength(password);
  const cs  = charsetSize(password);
  const pw  = password;
  const lower = password.toLowerCase();

  // --- Séquences clavier ---
  const kbPat = KEYBOARD_SEQUENCES.some(seq =>
    lower.includes(seq) || lower.includes(reverseStr(seq))
  );

  // --- Séquences alpha/numériques ---
  const seq = ALPHA_SEQUENCES.some(s => lower.includes(s))
           || NUM_SEQUENCES.some(s => pw.includes(s));

  // --- Répétition dominante ---
  // Vrai si un seul caractère représente ≥ 50% du mot de passe
  const charCounts = {};
  for (const c of [...pw]) {
    charCounts[c] = (charCounts[c] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(charCounts));
  const rep = len > 3 && maxCount / len >= 0.5;

  // --- Détection de date ---
  const dateResult = detectDate(pw);
  const dt          = dateResult !== null;
  const datePattern = dateResult;

  // --- Mot dictionnaire ---
  let dictWord = false;
  if (dictWords instanceof Set) {
    const deleeted = deleet(lower);

    // Extract alphabetic core, handling leet-speak properly:
    // "P@ssw0rd!" → remove non-leet symbols (!) → "p@ssw0rd" → deleet → "password" ✓
    // "Ramassis*488-p" → "ramassisp" → "ramassisp" (no leet) ✓
    // Key: deleetify BEFORE extracting letters to handle @ → a, 0 → o, etc.
    const cleanedForDeleet = lower.replace(/[^\p{L}0-9@$]/gu, ''); // Keep letters + leet symbols
    const strippedViaDeleet = deleet(cleanedForDeleet).replace(/[^\p{L}]/gu, '');

    dictWord = dictWords.has(lower)
            || dictWords.has(deleeted)
            || (strippedViaDeleet.length >= 4 && dictWords.has(strippedViaDeleet));

    // Cherche aussi dans les segments séparés par ponctuation/symboles
    // PRESERVES accents — français a des lettres accentuées essentielles
    if (!dictWord) {
      const segments = pw.toLowerCase()
        .split(/[^\p{L}]+/u)
        .filter(s => s.length >= 4);
      dictWord = segments.some(s => dictWords.has(s) || dictWords.has(deleet(s)));
    }

    // Detect capitalized words in passphrases (e.g., "Think Differently 2024" → detects "think", "differently")
    // This catches words that appear in dictWord context but are capitalized (passphrase-like)
    // e.g., "ThinkDifferently" should detect ["think", "differently"] if they're in the dictionary
    if (!dictWord && pw.length >= 4) {
      // Try to find dictionary words even if capitalized as a single blob
      // "ThinkDifferently" → try ["think", "differently", "thinkdifferently"]
      const lowerBlob = pw.toLowerCase();

      // First: check if whole thing is a dictionary word (less likely for long strings)
      if (dictWords.has(lowerBlob) || dictWords.has(deleet(lowerBlob))) {
        dictWord = true;
      }
    }
  }

  // --- Vulnérabilité hybride ---
  // Cas 1 : mot dict + suffixe/préfixe non-alphabétique (ex: batman123, 1sunshine)
  const hasNonAlpha = pw !== lower.replace(/[^\p{L}]/gu, '');
  // Cas 2 (ex-YY) : mot dict + exactement 2 chiffres isolés formant une année courte
  //   ex: soleil99, hunter85 — capturé ici plutôt que dans detectDate()
  const hasShortYear = dictWord && /(?<!\d)(?:[6-9]\d|0\d)(?!\d)/.test(pw)
                    && !(pw.match(/\d+/g) || []).some(n => n.length > 2);

  // Vérifier que les mutations de Hashcat peuvent réellement générer cette variante
  // Mutations standard Hashcat : leet-speak classique (@ a, 0 o, 1 i, etc.) + majuscules + chiffres
  // MAIS PAS les accents spéciaux (é, ü, €, etc.) qui ne sont pas dans les alphabets leet standard
  const hasSpecialSymbols = /[€£¥©®™]/.test(pw); // Symboles qui ne sont pas mutables

  const hybridVuln = dictWord && (hasNonAlpha || hasShortYear) && !hasSpecialSymbols;

  // --- Passphrase ---
  // Détecte des mots séparés par espace, tiret, ou concaténés (si dictWords disponible)
  const looksPassphrase = detectPassphrase(pw, dictWords);

  return {
    pw,
    len,
    cs,
    full: Math.pow(cs, len),
    kbPat,
    seq,
    rep,
    dt,
    datePattern,
    dictWord,
    hybridVuln,
    looksPassphrase,
  };
}

// ─── Fonctions internes ───────────────────────────────────────────────────────

function reverseStr(s) {
  return [...s].reverse().join('');
}

function deleet(s) {
  return s
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/6/g, 'g')
    .replace(/7/g, 't').replace(/8/g, 'b').replace(/9/g, 'g')
    .replace(/@/g, 'a').replace(/\$/g, 's');
}

/**
 * Détecte la présence d'une date dans le mot de passe.
 * Retourne une description du format trouvé ou null.
 */
function detectDate(pw) {
  // YYYY (ex: 2024, 1987, 2000)
  if (/(?:19|20)\d{2}/.test(pw)) return 'YYYY';

  // DD/MM ou MM/DD (avec séparateur explicite)
  // Utilise (?<!\d)/(?!\d) plutôt que \b : \b échoue entre lettre et chiffre (ex: born31-12)
  if (/(?<!\d)(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])(?!\d)/.test(pw)) return 'DD/MM';

  // DDMM ou MMDD (sans séparateur) — exige que les 4 chiffres soient isolés
  // (non précédés ni suivis d'autres chiffres) pour limiter les faux positifs
  if (/(?<!\d)(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?!\d)/.test(pw)) return 'DDMM';

  // YY supprimé — cas [mot][année_courte] absorbé par hybridVuln (option D)

  return null;
}

/**
 * Détecte si le mot de passe peut être décomposé en 2+ mots dictionnaire.
 * Utilise un algorithme récursif avec memoization.
 *
 * Exemple: "sunshinesoleil" → sunshine + soleil → TRUE
 * Exemple: "treestonedogcat" → tree + stone + dog + cat → TRUE
 *
 * Logique: cherche une décomposition telle que :
 *   1. CHAQUE segment est un mot dict valide (pas de "reste")
 *   2. Au moins 2 segments (passphrase, pas un mot seul)
 *
 * @param {string} pw - Mot de passe
 * @param {Set<string>} dictWords - Mots dictionnaire valides
 * @returns {boolean}
 */
function detectPassphraseConcatenated(pw, dictWords) {
  if (!dictWords || pw.length < 8) return false;

  const lower = pw.toLowerCase();
  const memo = new Map();

  /**
   * Récursif: peut-on couvrir s en mots dict valides?
   * Retourne [minWords, wordList] ou [Infinity, null] si impossible.
   *
   * @param {string} s - string à décomposer
   * @returns {[number, string[]|null]} nombre de mots et liste de mots
   */
  function minWordsToDecompose(s) {
    if (memo.has(s)) return memo.get(s);

    // Cas base: string vide → couverte en 0 mots
    if (s.length === 0) {
      const result = [0, []];
      memo.set(s, result);
      return result;
    }

    // Cas base: string trop court pour au moins 1 mot → impossible
    if (s.length < 3) {
      const result = [Infinity, null];
      memo.set(s, result);
      return result;
    }

    // Cas récursif: essayer tous les prefixes dict valides (min 3 chars pour passphrases)
    let minWords = Infinity;
    let bestWordList = null;
    for (let i = 3; i <= s.length; i++) {
      const prefix = s.slice(0, i);
      if (dictWords.has(prefix) || dictWords.has(deleet(prefix))) {
        const rest = s.slice(i);
        const [restMin, restWords] = minWordsToDecompose(rest);
        if (restMin !== Infinity) {
          const totalWords = 1 + restMin;
          if (totalWords < minWords) {
            minWords = totalWords;
            bestWordList = [prefix, ...(restWords || [])];
          }
        }
      }
    }

    const result = [minWords, bestWordList];
    memo.set(s, result);
    return result;
  }

  // Chercher décomposition en 2+ mots
  const [minWords, wordList] = minWordsToDecompose(lower);

  // Vérifier qu'il y a au moins 2 mots DISTINCTS
  // (rejette "quatquat" = ["quat", "quat"] et "quatquatquat" = ["quat", "quat", "quat"])
  if (minWords >= 2 && minWords !== Infinity && wordList) {
    const uniqueWords = new Set(wordList);
    // Accepter seulement si au moins 2 mots sont DISTINCTS
    // Rejette: "quatquat" (2 copies), "quatquatquat" (3 copies), etc.
    return uniqueWords.size >= 2;
  }

  return false;
}

/**
 * Détecte si le mot de passe ressemble à une passphrase.
 * Accepte:
 *   1. Mots séparés explicitement (espace ou tiret)
 *   2. Mots concaténés (reconnus via dict)
 *
 * Rationale: Un vrai passphrase a des mots (séparés ou concaténés).
 * Mot simple mal orthographié (ex: "peinttture") reste rejeté.
 */
function detectPassphrase(pw, dictWords) {
  // Séparateurs explicites (espace, tiret ou underscore entre mots alphabétiques)
  // IMPORTANT: Use [ _-] to match the literal separators, NOT [ -] which is a range.
  // [ -] matches ASCII 32-45, including unintended characters (!, ", #, $, %, etc.)
  if (/[\p{L}]{2,}[ _-][\p{L}]{2,}/u.test(pw)) return true;

  // Passphrases concaténées (mots dict reconnus)
  if (detectPassphraseConcatenated(pw, dictWords)) return true;

  return false;
}
