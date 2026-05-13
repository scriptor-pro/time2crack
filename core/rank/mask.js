// core/rank/mask.js
// Rang mask : estimation par structure positionnelle prévisible.
//
// L'attaque mask cible les patterns humains comme :
//   - [Majuscule][minuscules][chiffres]
//   - [minuscules][chiffres]
//   - [minuscules][chiffres][symbole]
//   - [chiffres] seuls
//
// Le rang est le nombre de candidats générés par le mask avant d'atteindre ce mot de passe.
//
// Calibration Phase 2 (2026-04, RockYou 14M) :
// L'espace alphabétique 26^n surestimait massivement (médiane +6.79 OdM).
// Un attaquant mask utilise un dictionnaire de mots (pas un charset pur) pour les
// segments lettre, ce qui correspond à environ L_WORD_COUNT[n] mots distincts.
// Ces valeurs sont alignées avec PCFG SEGMENT_SIZES.Ln (même source empirique).

'use strict';

import { passwordLength } from '../charset.js';

// Nombre de mots lettre distincts de longueur n courants dans les mots de passe.
// Calibré empiriquement sur 1M premier RockYou (suite à découverte que hardcoded
// sous-estimait par ×3-28, donnant des rangs mask trop bas).
// Un attaquant mask combiné avec un dictionnaire (maskdict dans hashcat) teste
// ces mots dans l'ordre de probabilité, pas en balayant 26^n.
//
// Données empiriques 1M RockYou (2026-04-15) :
//   L[3]=4,841 vs 200 (hardcoded) — 24× sous-estime
//   L[4]=7,739 vs 800  — 10× sous-estime
//   L[5]=33,234 vs 2,000 — 17× sous-estime
//   L[6]=113,145 vs 4,000 — 28× sous-estime (CRITIQUE)
//
// Calibration française (2026-04-17, corpus 2.47M FR) :
//   L[4]=0.7530 (75.3% of 4-char passwords are letters only)
//   L[5]=0.7815 (78.1% of 5-char passwords are letters only)
//   L[6]=0.5551 → ~181K distinct French 6-letter words
//   L[7]=0.4392 → ~189K distinct French 7-letter words
//   L[8]=0.3774 → ~210K distinct French 8-letter words
const L_WORD_COUNT = {
  en: {
    3:   5_000, 4:   8_000, 5: 33_000, 6: 113_000,
    7: 82_000, 8: 77_000, 9: 49_000, 10: 32_000,
    11: 16_000, 12: 9_000, 13: 5_000, 14: 3_000, 15: 1_500,
  },
  fr: {
    4:  10_160, 5:  22_600, 6: 40_218, 7: 48_283,
    8:  59_197, 9:  58_078, 10: 54_733, 11: 45_652,
    12: 34_620, 13: 19_595, 14:  7_217, 15:  1_892,
  },
  de: {
    4:   9_482, 5:  19_152, 6:  28_730, 7:  40_746,
    8:  61_601, 9:  95_068, 10: 136_449, 11: 170_716,
    12: 191_742, 13: 192_905, 14: 183_229, 15: 169_032,
  },
  nl: {
    4:  57_500, 5: 124_700, 6: 205_000, 7: 255_000,
    8: 274_000, 9: 270_000, 10: 256_000, 11: 226_000,
    12: 193_000, 13: 163_000, 14: 136_000, 15: 112_000,
    16: 91_000, 17: 72_000, 18: 56_000, 19: 42_000,
    20: 31_000,
  },
};
//
// Calibration corpus sources :
// - EN: rockyou 1M (2026-04), analysé via scripts/build-wordcount.mjs
// - FR: corpus natif 2.47M (2026-04-17, TF-IDF filtrés depuis Wikipedia + kkrypt0nn)
// - DE: corpus fusionné de wordlists allemandes + AlleDeutschenWoerter (2026-05-03)
// - NL: opensubtitles-nl (~5.3M Dutch subtitles, 2026-04, lemmatisé)
//
// Marge d'erreur estimée : ±20% selon corpus source (risque: > 6 chars avec corpus de grande taille)

/**
 * Détecte le mask positionnel dominant du mot de passe.
 * Retourne une description du pattern et la taille de l'espace correspondant.
 *
 * IMPORTANT: Les patterns sont testés en ordre décroissant de spécificité.
 * Les patterns 4-5 composants DOIVENT être testés avant les patterns 3-2 composants.
 * Sinon /^L+D+$/ correspondrait aussi à /^L+D+S+$/, donnant le mauvais espace.
 *
 * @param {string} password
 * @param {string} lang - Language code ('en', 'fr', etc.)
 * @returns {{ pattern: string, space: number } | null}
 */
function detectMask(password, lang = 'en') {
  const chars = [...password];
  const len = chars.length;

  // Convertit chaque caractère en classe positionnelle
  // Inclut accents français et autres diacritiques (à, é, ç, etc.)
  const classes = chars.map(c => {
    if (/\p{L}/u.test(c)) {
      return /\p{Lu}/u.test(c) ? 'U' : 'L';
    }
    if (/[0-9]/.test(c)) return 'D'; // Digit
    return 'S';                       // Symbol
  });

  const classStr = classes.join('');

  // Nombre de mots (lettres) courants pour la partie alpha du mask.
  // Utilise la table calibrée si la longueur est connue, sinon extrapolation.
  // Pour n > 15, les vraies données montrent une décroissance exponentielle (courbe en cloche),
  // non pas une croissance linéaire. Utiliser base * 0.6^(n-15) qui décroît réalistement.
  function letterSpace(n) {
    const langTable = L_WORD_COUNT[lang] || L_WORD_COUNT.en;
    if (n <= 2) return 50;
    if (n <= 15 && langTable[n]) return langTable[n];
    // Extrapolation logarithmique décroissante pour n >= 16
    // Les mots très longs sont exponentiellement plus rares
    if (n >= 16) {
      const base = langTable[15] ?? 1_500;
      return Math.max(10, Math.round(base * Math.pow(0.6, n - 15)));
    }
    // Fallback pour gaps dans la table (n < 15 mais absent)
    return Math.round(5_000 * (n - 2));
  }

  // === PATTERNS 5 COMPOSANTS (les plus spécifiques) ===

  // Pattern L+ + D+ + S... (ex: sunshine1!, password2@)
  if (/^L+D+S+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    return {
      pattern: 'L+D+S+',
      space: letterSpace(lCount) * Math.pow(10, dCount) * Math.pow(32, sCount),
    };
  }

  // Pattern U + L... + D... + S... (ex: Summer2024!)
  if (/^UL+D+S+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    return {
      pattern: 'UL+D+S+',
      space: letterSpace(lCount + 1) * Math.pow(10, dCount) * Math.pow(32, sCount),
    };
  }

  // Pattern D+ + S+ + U+L+ (ex: 123!Password)
  if (/^D+S+UL+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'D+S+UL+',
      space: Math.pow(10, dCount) * Math.pow(32, sCount) * letterSpace(lCount + 1),
    };
  }

  // Pattern D+ + S+ + L+ (ex: 123!password)
  if (/^D+S+L+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'D+S+L+',
      space: Math.pow(10, dCount) * Math.pow(32, sCount) * letterSpace(lCount),
    };
  }

  // Pattern S+ + D+ + U+L+ (ex: !123Password)
  if (/^S+D+UL+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'S+D+UL+',
      space: Math.pow(32, sCount) * Math.pow(10, dCount) * letterSpace(lCount + 1),
    };
  }

  // Pattern S+ + D+ + L+ (ex: !123password)
  if (/^S+D+L+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'S+D+L+',
      space: Math.pow(32, sCount) * Math.pow(10, dCount) * letterSpace(lCount),
    };
  }

  // Pattern U + L+ + S + D (ex: Password!1, Sunshine@2)
  if (/^UL+S+D+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    return {
      pattern: 'UL+S+D+',
      space: letterSpace(lCount + 1) * Math.pow(32, sCount) * Math.pow(10, dCount),
    };
  }

  // Pattern L+ + S + D (ex: password!1, sunshine@2)
  if (/^L+S+D+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    return {
      pattern: 'L+S+D+',
      space: letterSpace(lCount) * Math.pow(32, sCount) * Math.pow(10, dCount),
    };
  }

  // === PATTERNS 4 COMPOSANTS ===

  // Pattern U + L+ + D+ (ex: Password123) — AVANT L+D+ car plus spécifique
  if (/^UL+D+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    return {
      pattern: 'UL+D+',
      space: letterSpace(lCount + 1) * Math.pow(10, dCount),
    };
  }

  // Pattern L+ + D+ (ex: sunshine1) — APRÈS UL+D+ et AVANT patterns 5-composants
  if (/^L+D+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    return {
      pattern: 'L+D+',
      space: letterSpace(lCount) * Math.pow(10, dCount),
    };
  }

  // Pattern D+ + U+L+ (ex: 123Password, 999Sunshine)
  if (/^D+UL+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'D+UL+',
      space: Math.pow(10, dCount) * letterSpace(lCount + 1),
    };
  }

  // Pattern D+ + L+ (ex: 123password, 999sunshine)
  if (/^D+L+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'D+L+',
      space: Math.pow(10, dCount) * letterSpace(lCount),
    };
  }

  // Pattern U + L+ + S (ex: Password!, Sunshine@)
  if (/^UL+S+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    return {
      pattern: 'UL+S+',
      space: letterSpace(lCount + 1) * Math.pow(32, sCount),
    };
  }

  // Pattern L+ + S (ex: password!, sunshine@)
  if (/^L+S+$/.test(classStr)) {
    const lCount = (classStr.match(/L/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    return {
      pattern: 'L+S+',
      space: letterSpace(lCount) * Math.pow(32, sCount),
    };
  }

  // Pattern U+D+S+ (ex: SUNSHINE2!, PASSWORD1@)
  if (/^U+D+S+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    const uCount = len - dCount - sCount;
    return {
      pattern: 'U+D+S+',
      space: letterSpace(uCount) * Math.pow(10, dCount) * Math.pow(32, sCount),
    };
  }

  // Pattern U+S+ (ex: SUNSHINE!, PASSWORD@)
  if (/^U+S+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const uCount = len - sCount;
    return {
      pattern: 'U+S+',
      space: letterSpace(uCount) * Math.pow(32, sCount),
    };
  }

  // Pattern U+D+ (ex: PASSWORD2024, SUNSHINE123)
  if (/^U+D+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const uCount = len - dCount;
    return {
      pattern: 'U+D+',
      space: letterSpace(uCount) * Math.pow(10, dCount),
    };
  }

  // Pattern S+ + U+L+ (ex: !Password, @Sunshine)
  if (/^S+UL+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'S+UL+',
      space: Math.pow(32, sCount) * letterSpace(lCount + 1),
    };
  }

  // Pattern S+ + L+ (ex: !password, @sunshine)
  if (/^S+L+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const lCount = (classStr.match(/L/g) || []).length;
    return {
      pattern: 'S+L+',
      space: Math.pow(32, sCount) * letterSpace(lCount),
    };
  }

  // Pattern S+ + D+ (ex: !123, @999)
  if (/^S+D+$/.test(classStr)) {
    const sCount = (classStr.match(/S/g) || []).length;
    const dCount = (classStr.match(/D/g) || []).length;
    return {
      pattern: 'S+D+',
      space: Math.pow(32, sCount) * Math.pow(10, dCount),
    };
  }

  // Pattern D+ + S+ (ex: 123!, 999@)
  if (/^D+S+$/.test(classStr)) {
    const dCount = (classStr.match(/D/g) || []).length;
    const sCount = (classStr.match(/S/g) || []).length;
    return {
      pattern: 'D+S+',
      space: Math.pow(10, dCount) * Math.pow(32, sCount),
    };
  }

  // === PATTERNS 3 COMPOSANTS (intermédiaires) ===

  // Pattern UL+ seulement (ex: Password) — AVANT U+L+ car plus spécifique
  if (/^UL+$/.test(classStr)) {
    return {
      pattern: 'UL+',
      space: letterSpace(len),
    };
  }

  // Pattern U+ + L+ (ex: SunShine, MyPassword)
  if (/^U+L+$/.test(classStr)) {
    return {
      pattern: 'U+L+',
      space: letterSpace(len),
    };
  }

  // Pattern U+ seulement (ex: SUNSHINE, PASSWORD)
  if (/^U+$/.test(classStr)) {
    return {
      pattern: 'U+',
      space: letterSpace(len),
    };
  }

  // Pattern L+ seulement (ex: password, sunshine)
  if (/^L+$/.test(classStr)) {
    return {
      pattern: 'L+',
      space: letterSpace(len),
    };
  }

  // Pattern D+ seulement (ex: 123456)
  if (/^D+$/.test(classStr)) {
    return {
      pattern: 'D+',
      space: Math.pow(10, len),
    };
  }

  // Pattern S+ seulement (ex: !@#, symbols only)
  if (/^S+$/.test(classStr)) {
    return {
      pattern: 'S+',
      space: Math.pow(32, len),
    };
  }

  // Pattern non reconnu — mask non applicable
  return null;
}

// Vérifie si un pattern mask est statistiquement réaliste (crée par humain, pas aléatoire).
// Les vrais humains créent des patterns prévisibles avec une structure claire.
// Les mots de passe aléatoires (ex: aBc!#%D, x7K#mP2@qR!zABCDEFG) matchent structurellement
// mais montrent trop d'alternance ou une longueur excessive pour être crédibles.
function isRealisticMask(pattern, length) {
  // Règle 1 : Compter les « runs » (segments continus du même type)
  // Exemple: L+ (1 run), L+D+ (2 runs), L+D+S+ (3 runs), UL+D+S+ (4 runs)
  // Patterns réalistes : ≤ 4 runs typiquement, 5 acceptable pour structures très complexes
  // Au-delà de 6 = alternance pathologique = aléatoire pur
  const runs = (pattern.match(/[ULDS]+/g) || []).length;
  if (runs > 6) return false;

  // Règle 2 : Vérifier des alternances pathologiques
  // Symboles intercalés au milieu de lettres = non-réaliste
  // Exemple: L+S+L+ ou L+S+U+ (password!Secure) — personne ne crée ça intentionnellement
  // Symboles & chiffres devraient être en suffixe (password!) ou préfixe (!password)
  if (/[UL]+S+[UL]+/.test(pattern)) return false;

  // Règle 3 : Chiffres intercalés au milieu de lettres = peu probable
  // Exemple: L+D+L+ (pass1word) — rare en pratique
  // Les humains ajoutent généralement les chiffres au début ou fin
  if (/[UL]+D+[UL]+/.test(pattern)) return false;

  // Règle 4 : Symboles ET chiffres intercalés = trop aléatoire
  // Exemple: S+D+S+ ou D+S+D+ (échange constant entre symbols et digits)
  // Cas réaliste : D+S+ ou S+D+ (suffix or prefix), pas interleaved
  if (/S+D+S+/.test(pattern) || /D+S+D+/.test(pattern)) return false;

  return true;
}

/**
 * Estime le rang mask d'un mot de passe.
 *
 * @param {string} password
 * @param {string} lang - Language code ('en', 'fr', etc.)
 * @returns {{ rank: number, model: 'mask' } | { rank: null, model: 'mask' }}
 */
export function rankMask(password, lang = 'en') {
  const mask = detectMask(password, lang);

  if (!mask) return { rank: null, model: 'mask' };

  // Vérifier que le pattern est statistiquement réaliste avant d'estimer
  if (!isRealisticMask(mask.pattern, password.length)) {
    return { rank: null, model: 'mask' };
  }

  // Le rang mask est la moitié de l'espace (en moyenne, trouvé à mi-parcours)
  const rank = Math.round(mask.space / 2);
  return { rank, model: 'mask', pattern: mask.pattern };
}
