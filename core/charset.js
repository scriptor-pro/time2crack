// core/charset.js
// Analyse du charset d'un mot de passe.
//
// APPROCHE: Category-based (zxcvbn 2016, NIST SP 800-63B-4)
//
// La taille du charset est déterminée par les CATÉGORIES de caractères
// PRÉSENTES dans le mot de passe, pas par le nombre de caractères uniques.
//
// Justification scientifique:
// - Wheeler (2016, zxcvbn, USENIX Security): Cardinality = sum of character classes
// - NIST SP 800-63B-4 (2024): Entropy = L × log₂(R) où R est inferred from composition
// - NOT Bonneau entropy (Shannon entropy ne s'applique pas aux mots de passe réels)
//
// Catégories:
//   - Lowercase [a-z]          → 26 caractères
//   - Uppercase [A-Z]          → 26 caractères
//   - Digits [0-9]             → 10 caractères
//   - Symbols [^A-Za-z0-9]     → 32 caractères (printables: ! to ~)
//
// Exemple:
//   "111111"           → digit present     → charset 10
//   "aaaaaa"           → lowercase present → charset 26
//   "Password123"      → lower+upper+digit → charset 62
//   "P@ssw0rd!"        → all 4 categories  → charset 94
//
// ⚠️  CORRECTION : Audit 2026-04-25 Finding 6 (charset vs NIST)
// L'audit décrivait un bug où charsetSize() utiliserait le "charset observé" (nombre
// de caractères distincts, ex: 3 pour "aaa"). C'est INCORRECT.
// Le code implémente déjà NIST SP 800-63B-4 (category-based).
// charsetSize("aaa") = 26 (category: lowercase), not 3.
// Ceci est conforme et n'a pas besoin de correction. La recommandation
// Option B de l'audit (documenter sans changer) est déjà appliquée.

'use strict';

/**
 * Calcule la taille du charset basée sur les CATÉGORIES présentes.
 * Approche scientifiquement correcte selon zxcvbn (Wheeler 2016) et NIST SP 800-63B-4.
 *
 * @param {string} password
 * @returns {number} Charset size (sum of character categories)
 */
export function charsetSize(password) {
  let size = 0;

  // Tester chaque catégorie de caractères
  if (/[a-z]/.test(password)) size += 26;      // lowercase
  if (/[A-Z]/.test(password)) size += 26;      // uppercase
  if (/[0-9]/.test(password)) size += 10;      // digits
  if (/[^\w]/.test(password)) size += 32;      // symbols (non-word characters)

  return Math.max(1, size);
}

/**
 * Retourne la longueur effective (nombre de points de code Unicode).
 * @param {string} password
 * @returns {number}
 */
export function passwordLength(password) {
  // Utilise [...password] pour compter les code points Unicode correctement
  return [...password].length;
}
