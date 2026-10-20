// core/time.js
// Couche 2 : conversion rang → temps en secondes.
//
// Responsabilité unique : rank / hash_rate
// Ne dépend pas des modèles probabilistes — uniquement des benchmarks GPU.
//
// Vitesses GPU : benchmarks Hashcat v6.2.6, 12× RTX 5090 (Blackwell, 2025).
// Estimation : +35% vs RTX 4090 pour hashes compute-bound (MD5, SHA, NTLM),
// +25% pour hashes memory-bound (bcrypt, Argon2id).
// Source : Hashcat official RTX 4090 + gain architectural Blackwell estimé.
// TODO: remplacer par benchmarks hashcat.net officiels RTX 5090 dès disponibles.

'use strict';

// Vitesses de hachage en H/s pour 12× RTX 5090
export const HASH_RATES = {
  md5:    2_737e9,   // 2 737 GH/s  (+35% vs RTX 4090 : 2 027 GH/s)
  sha1:   824e9,     //   824 GH/s  (+35% vs RTX 4090 :   610 GH/s)
  sha256: 367e9,     //   367 GH/s  (+35% vs RTX 4090 :   272 GH/s)
  ntlm:   4_674e9,   // 4 674 GH/s  (+35% vs RTX 4090 : 3 462 GH/s)
  bcrypt: 2_760e3,   // 2 760 kH/s  (+25% vs RTX 4090 : 2 208 kH/s, cost 5, memory-bound)
  argon2: 1_000,     // 1 000 H/s   (+25% vs RTX 4090 :   800 H/s, Argon2id, memory-bound)
};

// Multiplicateurs de vitesse par profil d'attaquant (relatif à 12× RTX 5090)
export const ATTACKER_MULTIPLIERS = {
  amateur:      1 / 12,      // 1× RTX 5090
  experienced:  1,           // 12× RTX 5090 — défaut
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
