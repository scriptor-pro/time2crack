// core/time.js
// Couche 2 : conversion rang → temps en secondes.
//
// Responsabilité unique : rank / hash_rate
// Ne dépend pas des modèles probabilistes — uniquement des benchmarks GPU.
//
// Vitesses GPU : benchmarks Hashcat v6.2.6, 12× RTX 4090.
// Source : Hashcat official + Hive Systems 2025.

'use strict';

// Vitesses de hachage en H/s pour 12× RTX 4090
export const HASH_RATES = {
  md5:    2_027e9,   // 2 027 GH/s
  sha1:   610e9,     // 610 GH/s
  sha256: 272e9,     // 272 GH/s
  ntlm:   3_462e9,   // 3 462 GH/s
  bcrypt: 2_208e3,   // 2 208 kH/s (cost 5)
  argon2: 800,       // 800 H/s (Argon2id — estimation conservative)
};

// Multiplicateurs de vitesse par profil d'attaquant (relatif à 12× RTX 4090)
export const ATTACKER_MULTIPLIERS = {
  amateur:      1 / 12,      // 1× RTX 4090
  experienced:  1,           // 12× RTX 4090 — défaut
  professional: 100 / 12,    // ~100 GPUs (AWS P4d cluster)
  nation_state: 10_000 / 12, // ~10 000 GPUs
};

/**
 * Convertit un rang en secondes pour un algorithme de hachage donné.
 *
 * @param {number} rank
 * @param {string} algo - Clé de HASH_RATES (md5, sha1, sha256, ntlm, bcrypt, argon2)
 * @param {string} [profile='experienced'] - Profil d'attaquant
 * @returns {number} Temps en secondes
 */
export function rankToSeconds(rank, algo, profile = 'experienced') {
  const baseRate = HASH_RATES[algo];
  if (!baseRate) throw new Error(`Algorithme inconnu : ${algo}`);
  const multiplier = ATTACKER_MULTIPLIERS[profile] ?? 1;
  return rank / (baseRate * multiplier);
}

/**
 * Convertit un rang en objet de temps pour tous les algorithmes.
 *
 * @param {number} rank
 * @param {string} [profile='experienced']
 * @returns {Object.<string, number>} Temps en secondes par algorithme
 */
export function rankToAllSeconds(rank, profile = 'experienced') {
  return Object.fromEntries(
    Object.keys(HASH_RATES).map(algo => [algo, rankToSeconds(rank, algo, profile)])
  );
}
