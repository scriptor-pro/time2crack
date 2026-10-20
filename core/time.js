// core/time.js
// Couche 2 : conversion rang → temps en secondes.
//
// Responsabilité unique : rank / hash_rate
// Ne dépend pas des modèles probabilistes — uniquement des benchmarks GPU.
//
// Vitesses GPU : benchmarks Hashcat mesurés sur 1× RTX 5090 (Blackwell), × 12.
// Sources :
//  - MD5, NTLM, SHA-256, bcrypt : Specops Software, publié par BleepingComputer
//    (2026-04-08), "Is a $30,000 GPU good at password cracking?"
//  - SHA1 : hashcat.net forum, thread "[Benchmark] GeForce RTX 5090" (hashcat
//    v6.2.6, 1 GPU, CUDA 12.8)
//  - Argon2id : pas de benchmark RTX 5090 publié → estimation (+25 % vs RTX 4090).
// bcrypt : mode hashcat 3200, cost 5 (valeur par défaut du benchmark).

'use strict';

// Vitesses de hachage en H/s pour 12× RTX 5090
export const HASH_RATES = {
  md5:    2_634e9,   // 2 634 GH/s  (219,5 GH/s × 12)
  sha1:   837e9,     //   837 GH/s  ( 69,8 GH/s × 12)
  sha256: 332e9,     //   332 GH/s  ( 27,7 GH/s × 12)
  ntlm:   4_081e9,   // 4 081 GH/s  (340,1 GH/s × 12)
  bcrypt: 3_658e3,   // 3 658 kH/s  (304,8 kH/s × 12, cost 5)
  argon2: 1_000,     // 1 000 H/s   (estimation, aucun benchmark RTX 5090 publié)
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
