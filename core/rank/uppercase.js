'use strict';

// Coefficient binomial C(n, k) calculé itérativement (pas de factorielles).
function nCk(n, k) {
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1);
  return Math.round(result);
}

/**
 * Coût combinatoire des variantes de casse (Wheeler 2016, zxcvbn).
 *
 * Retourne le nombre d'essais qu'un attaquant hashcat doit faire pour
 * atteindre le pattern de casse donné depuis le mot en all-lowercase.
 *
 * @param {string} alpha - Partie alphabétique du mot de passe (lettres uniquement).
 * @returns {number} Multiplicateur ≥ 1.
 */
export function uppercaseCost(alpha) {
  const U = (alpha.match(/[A-Z]/g) || []).length;
  const L = (alpha.match(/[a-z]/g) || []).length;

  if (U === 0) return 1; // all-lower : déjà couvert par dict, pas de surcoût
  if (L === 0) return 2; // all-caps : lower + upper = 2 essais

  // StartCap : seule la première lettre est majuscule
  if (alpha[0] !== alpha[0].toLowerCase() && alpha.slice(1) === alpha.slice(1).toLowerCase()) return 2;

  // EndCap : seule la dernière lettre est majuscule
  if (alpha[alpha.length - 1] !== alpha[alpha.length - 1].toLowerCase()
      && alpha.slice(0, -1) === alpha.slice(0, -1).toLowerCase()) return 2;

  // Cas général : ∑C(U+L, i) pour i ∈ [1..min(U,L)]
  // Identique à uppercase_variations dans zxcvbn (Wheeler 2016).
  let sum = 0;
  const minUL = Math.min(U, L);
  for (let i = 1; i <= minUL; i++) sum += nCk(U + L, i);
  return sum;
}
