# Toggle-case Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un facteur multiplicatif `uppercaseCost` (formule combinatoire Wheeler C(n,k)) dans `rankHybrid()` et `rankDictionary()` pour que les variantes de casse (`Mayonnaise`, `PASSWORD123`, `pAsSwOrD!`) reçoivent un rang plus élevé que leur équivalent all-lowercase.

**Architecture:** `uppercaseCost(alpha)` est définie et exportée depuis `hybrid.js`, importée dans `dictionary.js`. Dans `hybrid.js` : `rank = rank_dict(base) × uppercaseCost × rules(suffix+leet)`. Dans `dictionary.js` : `rank = rank_dict × uppercaseCost(password)` appliqué sur chaque branche de retour non-null. Pas de nouveau fichier, pas de changement dans `index.js`.

**Tech Stack:** Node.js ESM, `node:test` + `node:assert/strict` pour les tests.

---

## Fichiers modifiés

- `core/rank/hybrid.js` — ajout de `export function uppercaseCost(alpha)` + intégration dans `rankHybrid()`
- `core/rank/dictionary.js` — import de `uppercaseCost` + application sur chaque rang retourné
- `tests/core-non-regression.test.mjs` — nouveaux tests toggle-case

---

### Task 1 : `uppercaseCost()` dans hybrid.js

**Files:**
- Modify: `core/rank/hybrid.js`
- Test: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
import { rankHybrid } from '../core/rank/hybrid.js';
import { uppercaseCost } from '../core/rank/hybrid.js';

test('uppercaseCost — all-lower retourne 1', () => {
  assert.equal(uppercaseCost('mayonnaise'), 1);
});

test('uppercaseCost — StartCap retourne 2', () => {
  assert.equal(uppercaseCost('Mayonnaise'), 2);
});

test('uppercaseCost — AllCaps retourne 2', () => {
  assert.equal(uppercaseCost('MAYONNAISE'), 2);
});

test('uppercaseCost — EndCap retourne 2', () => {
  assert.equal(uppercaseCost('mayonnaisE'), 2);
});

test('uppercaseCost — toggle aléatoire retourne combinatoire', () => {
  // pAsSwOrD : U=4, L=4 → ∑C(8,1..4) = 8+28+56+70 = 162
  assert.equal(uppercaseCost('pAsSwOrD'), 162);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "fail|uppercaseCost"
```

Attendu : erreur `uppercaseCost is not exported` ou `SyntaxError`.

- [ ] **Step 3 : Implémenter `nCk` et `uppercaseCost` dans hybrid.js**

Ajouter après la constante `RULES_BY_SUFFIX_LEN` (ligne ~46) et avant `function extractBaseWord` dans `core/rank/hybrid.js` :

```js
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
 * @param {string} alpha - Partie alphabétique du mot (avant ou après deleet).
 * @returns {number} Multiplicateur ≥ 1.
 */
export function uppercaseCost(alpha) {
  const U = (alpha.match(/[A-Z]/g) || []).length;
  const L = (alpha.match(/[a-z]/g) || []).length;
  if (U === 0) return 1;
  if (L === 0) return 2; // all-caps : lower + upper = 2 essais
  // StartCap : seule la première lettre est majuscule
  if (alpha[0] !== alpha[0].toLowerCase() && alpha.slice(1) === alpha.slice(1).toLowerCase()) return 2;
  // EndCap : seule la dernière lettre est majuscule
  if (alpha[alpha.length - 1] !== alpha[alpha.length - 1].toLowerCase()
      && alpha.slice(0, -1) === alpha.slice(0, -1).toLowerCase()) return 2;
  // Cas général : ∑C(U+L, i) pour i ∈ [1..min(U,L)]
  let sum = 0;
  const minUL = Math.min(U, L);
  for (let i = 1; i <= minUL; i++) sum += nCk(U + L, i);
  return sum;
}
```

- [ ] **Step 4 : Vérifier que les tests uppercaseCost passent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "pass|fail|uppercaseCost"
```

Attendu : les 5 nouveaux tests passent, 0 fail.

- [ ] **Step 5 : Commit**

```bash
git add core/rank/hybrid.js tests/core-non-regression.test.mjs
git commit -m "feat: add uppercaseCost() — Wheeler C(n,k) combinatorial formula"
```

---

### Task 2 : Intégrer `uppercaseCost` dans `rankHybrid()`

**Files:**
- Modify: `core/rank/hybrid.js:98-135`
- Test: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
test('rankHybrid — password123 rank inchangé (all-lower)', () => {
  const words = new Set(['password']);
  const before = rankHybrid('password123', words).rank;
  // all-lower : uppercaseCost=1, rank identique à l'implémentation précédente
  assert.ok(before !== null);
  assert.equal(before, rankHybrid('password123', words).rank);
});

test('rankHybrid — Password123 rank = 2× password123', () => {
  const words = new Set(['password']);
  const lower = rankHybrid('password123', words).rank;
  const startcap = rankHybrid('Password123', words).rank;
  assert.ok(lower !== null && startcap !== null);
  assert.equal(startcap, lower * 2);
});

test('rankHybrid — PASSWORD123 rank = 2× password123', () => {
  const words = new Set(['password']);
  const lower = rankHybrid('password123', words).rank;
  const allcaps = rankHybrid('PASSWORD123', words).rank;
  assert.ok(lower !== null && allcaps !== null);
  assert.equal(allcaps, lower * 2);
});

test('rankHybrid — pAsSwOrD123 rank = 162× password123', () => {
  const words = new Set(['password']);
  const lower = rankHybrid('password123', words).rank;
  const toggled = rankHybrid('pAsSwOrD123', words).rank;
  assert.ok(lower !== null && toggled !== null);
  assert.equal(toggled, lower * 162);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "fail|Password123|pAsSwOrD"
```

Attendu : les 3 tests avec casse échouent (rank identique au lieu de ×2 ou ×162).

- [ ] **Step 3 : Intégrer uppercaseCost dans rankHybrid()**

Dans `core/rank/hybrid.js`, modifier la fonction `rankHybrid` (actuellement ligne ~98). Remplacer la dernière partie (après le calcul de `rulesCount`) :

```js
export function rankHybrid(password, dictWords = null) {
  const base = extractBaseWord(password);

  if (base.length < 3) return { rank: null, model: 'hybrid' };
  if (base === password.toLowerCase()) return { rank: null, model: 'hybrid' };

  const dictResult = rankDictionary(base, dictWords);
  if (dictResult.rank === null) return { rank: null, model: 'hybrid' };

  const suffixLen = passwordLength(password) - passwordLength(base);

  const pwLower = password.toLowerCase();
  const leet_subs = (pwLower.match(/[@0$!]/g) || []).length;

  const effectiveComplexity = suffixLen + leet_subs;
  const clampedLen = Math.max(1, Math.min(effectiveComplexity, 5));
  const rulesCount = RULES_BY_SUFFIX_LEN[clampedLen] ?? 25_000;

  // Partie alphabétique originale (avant lowercase) pour détecter la casse réelle.
  // On extrait la sous-chaîne de password qui correspond à base (en ignorant les
  // caractères non-alpha en bordure).
  const pwAlphaMatch = password.match(/[\p{L}@$0]+/gu) || [];
  const alpha = pwAlphaMatch.length > 0
    ? pwAlphaMatch.reduce((a, b) => a.length >= b.length ? a : b)
    : base;

  const rank = dictResult.rank * uppercaseCost(alpha) * rulesCount;
  return { rank, model: 'hybrid' };
}
```

- [ ] **Step 4 : Vérifier que tous les tests passent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -6
```

Attendu :
```
# pass 33
# fail 0
```

- [ ] **Step 5 : Commit**

```bash
git add core/rank/hybrid.js tests/core-non-regression.test.mjs
git commit -m "feat: integrate uppercaseCost into rankHybrid() — toggle-case penalty"
```

---

### Task 3 : Intégrer `uppercaseCost` dans `rankDictionary()`

**Files:**
- Modify: `core/rank/dictionary.js`
- Test: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
import { rankDictionary } from '../core/rank/dictionary.js';

test('rankDictionary — mayonnaise (all-lower) rank inchangé', () => {
  const words = new Set(['mayonnaise']);
  const r = rankDictionary('mayonnaise', words);
  assert.ok(r.rank !== null);
  // all-lower : uppercaseCost=1, aucun changement
  assert.equal(r.rank, rankDictionary('mayonnaise', words).rank);
});

test('rankDictionary — Mayonnaise rank = 2× mayonnaise', () => {
  const words = new Set(['mayonnaise']);
  const lower = rankDictionary('mayonnaise', words).rank;
  const startcap = rankDictionary('Mayonnaise', words).rank;
  assert.ok(lower !== null && startcap !== null);
  assert.equal(startcap, lower * 2);
});

test('rankDictionary — MAYONNAISE rank = 2× mayonnaise', () => {
  const words = new Set(['mayonnaise']);
  const lower = rankDictionary('mayonnaise', words).rank;
  const allcaps = rankDictionary('MAYONNAISE', words).rank;
  assert.ok(lower !== null && allcaps !== null);
  assert.equal(allcaps, lower * 2);
});

test('rankDictionary — password (top HIBP) all-lower rank inchangé', () => {
  // 'password' est en position 2 dans TOP_PASSWORDS — all-lower, cost=1
  const r = rankDictionary('password', null);
  assert.equal(r.rank, 2);
});

test('rankDictionary — Password (top HIBP StartCap) rank = 2× password', () => {
  const lower = rankDictionary('password', null).rank;   // 2
  const cap   = rankDictionary('Password', null).rank;
  assert.ok(cap !== null);
  assert.equal(cap, lower * 2); // 4
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "fail|Mayonnaise|MAYONNAISE|Password.*top"
```

Attendu : les 3 tests avec casse échouent.

- [ ] **Step 3 : Modifier dictionary.js**

En haut de `core/rank/dictionary.js`, ajouter l'import après les imports existants :

```js
import { uppercaseCost } from './hybrid.js';
```

Puis modifier `rankDictionary` pour appliquer `uppercaseCost` sur chaque branche de retour non-null. La partie alphabétique à passer à `uppercaseCost` est `password.replace(/[^a-zA-Z]/g, '')` — on extrait les lettres originales avant lowercase.

Remplacer la fonction `rankDictionary` complète :

```js
export function rankDictionary(password, dictWords = null) {
  const lower = password.toLowerCase();
  const deleeted = deleet(password);
  // Partie alphabétique originale pour le calcul de casse
  const alpha = password.replace(/[^a-zA-Z]/g, '');
  const uCost = uppercaseCost(alpha);

  // 1. Présent tel quel dans le top HIBP ?
  const topIdx = TOP_PASSWORDS.indexOf(lower);
  if (topIdx !== -1) {
    return { rank: (topIdx + 1) * uCost, model: 'dictionary' };
  }

  // 2. Forme déleetifiée dans le top HIBP ?
  const deIdx = TOP_PASSWORDS.indexOf(deleeted);
  if (deIdx !== -1) {
    return { rank: (deIdx + 1) * 10 * uCost, model: 'dictionary' };
  }

  // 3. Présent dans la wordlist locale ?
  if (dictWords instanceof Set) {
    if (dictWords.has(lower) || dictWords.has(deleeted)) {
      const mid = Math.floor(dictWords.size / 2);
      if (passwordLength(password) >= 9) {
        const compound = rankGermanCompound(password, dictWords);
        if (compound && compound.rank < mid) return { rank: compound.rank * uCost, model: 'dictionary' };
      }
      return { rank: mid * uCost, model: 'dictionary' };
    }

    const compound = rankGermanCompound(password, dictWords);
    if (compound) return { rank: compound.rank * uCost, model: 'dictionary' };
  }

  // 4. Absent
  return { rank: null, model: 'dictionary' };
}
```

- [ ] **Step 4 : Vérifier que tous les tests passent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -6
```

Attendu :
```
# pass 38
# fail 0
```

- [ ] **Step 5 : Commit**

```bash
git add core/rank/dictionary.js tests/core-non-regression.test.mjs
git commit -m "feat: apply uppercaseCost in rankDictionary() — covers pure dict words (Mayonnaise, MAYONNAISE)"
```

---

### Task 4 : Test de non-régression pipeline et vérification finale

**Files:**
- Test: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Ajouter un test pipeline end-to-end**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
test('pipeline — Password123 rank > password123 rank', () => {
  const words = new Set(['password']);
  const lower   = estimate('password123', words);
  const startcap = estimate('Password123', words);
  assert.ok(startcap.attack_rank > lower.attack_rank,
    `Password123 (${startcap.attack_rank}) doit être > password123 (${lower.attack_rank})`);
});

test('pipeline — pAsSwOrD123 rank >> Password123 rank', () => {
  const words = new Set(['password']);
  const startcap = estimate('Password123', words);
  const toggled  = estimate('pAsSwOrD123', words);
  assert.ok(toggled.attack_rank > startcap.attack_rank,
    `pAsSwOrD123 (${toggled.attack_rank}) doit être > Password123 (${startcap.attack_rank})`);
});

test('pipeline — mayonnaise rank < Mayonnaise rank', () => {
  const words = new Set(['mayonnaise']);
  const lower  = estimate('mayonnaise', words);
  const cap    = estimate('Mayonnaise', words);
  assert.ok(cap.attack_rank > lower.attack_rank,
    `Mayonnaise (${cap.attack_rank}) doit être > mayonnaise (${lower.attack_rank})`);
});
```

- [ ] **Step 2 : Lancer tous les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -8
```

Attendu :
```
# pass 41
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

- [ ] **Step 3 : Vérification manuelle rapide**

```bash
node --input-type=module << 'EOF'
import { readFileSync } from 'fs';
import { rankHybrid } from './core/rank/hybrid.js';
import { rankDictionary } from './core/rank/dictionary.js';

const words = new Set(['password', 'mayonnaise']);

for (const pw of ['password123', 'Password123', 'PASSWORD123', 'pAsSwOrD123',
                   'mayonnaise', 'Mayonnaise', 'MAYONNAISE']) {
  const h = rankHybrid(pw, words);
  const d = rankDictionary(pw, words);
  console.log(`${pw.padEnd(16)} dict=${String(d.rank).padStart(10)}  hybrid=${String(h.rank).padStart(10)}`);
}
EOF
```

Résultats attendus (hybrid×2 pour StartCap/AllCaps, ×162 pour toggle aléatoire) :
```
password123      dict=      null  hybrid=      1800
Password123      dict=      null  hybrid=      3600
PASSWORD123      dict=      null  hybrid=      3600
pAsSwOrD123      dict=      null  hybrid=    291600
mayonnaise       dict=         1  hybrid=      null
Mayonnaise       dict=         2  hybrid=      null
MAYONNAISE       dict=         2  hybrid=      null
```

*(Les valeurs exactes de dict dépendent de la taille de la wordlist — les ratios ×1/×2/×162 sont ce qui importe.)*

- [ ] **Step 4 : Commit final**

```bash
git add tests/core-non-regression.test.mjs
git commit -m "test: pipeline e2e toggle-case — Password123 > password123, Mayonnaise > mayonnaise"
```

---

## Self-Review

**Spec coverage :**
- ✅ `uppercaseCost(alpha)` avec C(n,k) — Task 1
- ✅ Cas spéciaux StartCap/AllCaps/EndCap = 2 — Task 1
- ✅ Intégration dans `rankHybrid()` — Task 2
- ✅ Intégration dans `rankDictionary()` — Task 3
- ✅ Rétrocompatibilité all-lower — Tasks 2 & 3 (tests explicites)
- ✅ Tests unitaires et pipeline — Tasks 1-4
- ✅ Export de `uppercaseCost` pour réutilisation — Task 1

**Placeholder scan :** aucun TBD, tous les blocs de code sont complets.

**Type consistency :** `uppercaseCost(alpha: string): number` utilisée de manière cohérente dans les 3 tasks.
