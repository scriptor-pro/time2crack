# Repeat Pattern Rank — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un modèle `repeat` qui détecte les répétitions pures, cycles et séquences dans un mot de passe et produit un rang analytique fermé bien inférieur au brute force.

**Architecture:** Nouveau module `core/rank/repeat.js` alimenté par `detectRepeat()` dans `core/patterns.js`. `analyzePatterns()` expose `repeatResult` dans son objet de retour. `estimateRank()` dans `core/rank/index.js` appelle `rankRepeat()` et intègre son rang dans tous les candidats (`attack_rank`, `standard`, `best_attack`).

**Tech Stack:** ESM vanilla JS, Node.js test runner (`node:test`), `charsetSize` / `passwordLength` depuis `core/charset.js`.

---

## Fichiers

| Fichier | Action |
|---|---|
| `core/rank/repeat.js` | Créer — `rankRepeat(password, repeatResult)` |
| `core/patterns.js` | Modifier — ajouter `detectRepeat()` + `repeatResult` dans le retour |
| `core/rank/index.js` | Modifier — import + appel `rankRepeat`, ajout aux candidats |
| `tests/core-non-regression.test.mjs` | Modifier — tests unitaires + pipeline |

---

## Task 1 : `core/rank/repeat.js` — module de rang

**Files:**
- Create: `core/rank/repeat.js`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
import { rankRepeat } from '../core/rank/repeat.js';
import { rankBrute }  from '../core/rank/brute.js';

test('rankRepeat — répétition pure aaaa < brute', () => {
  const rr = { type: 'pure', motif: 'a', len_motif: 1, len_total: 4, reste: null };
  const result = rankRepeat('aaaa', rr);
  const brute  = rankBrute('aaaa');
  assert.equal(result.model, 'repeat');
  assert.ok(result.rank !== null);
  assert.ok(result.rank < brute.rank, `repeat ${result.rank} devrait être < brute ${brute.rank}`);
});

test('rankRepeat — cycle abababab < brute', () => {
  const rr = { type: 'cycle', motif: 'ab', len_motif: 2, len_total: 8, reste: null };
  const result = rankRepeat('abababab', rr);
  const brute  = rankBrute('abababab');
  assert.ok(result.rank < brute.rank);
});

test('rankRepeat — sequence 1234 < brute', () => {
  const rr = { type: 'sequence', motif: '1234', len_motif: 4, len_total: 4, reste: null };
  const result = rankRepeat('1234', rr);
  const brute  = rankBrute('1234');
  assert.ok(result.rank < brute.rank);
});

test('rankRepeat — sequence inversée zyxw < brute', () => {
  const rr = { type: 'sequence', motif: 'zyxw', len_motif: 4, len_total: 4, reste: null };
  const result = rankRepeat('zyxw', rr);
  const brute  = rankBrute('zyxw');
  assert.ok(result.rank < brute.rank);
});

test('rankRepeat — mixte aaa123 < brute', () => {
  const rr = { type: 'pure', motif: 'a', len_motif: 1, len_total: 3, reste: '123' };
  const result = rankRepeat('aaa123', rr);
  const brute  = rankBrute('aaa123');
  assert.ok(result.rank < brute.rank);
});

test('rankRepeat — repeatResult null → rank null', () => {
  const result = rankRepeat('aa123', null);
  assert.equal(result.rank, null);
  assert.equal(result.model, 'repeat');
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -A2 "rankRepeat"
```

Résultat attendu : erreur `Cannot find module '../core/rank/repeat.js'`

- [ ] **Step 3 : Créer `core/rank/repeat.js`**

```js
// core/rank/repeat.js
// Rang repeat : espace analytique fermé pour répétitions, cycles et séquences.
//
// Formule (Wheeler 2016) :
//   rank = charset^len_motif × 2^len_total
//
// Pour pattern mixte (reste non null) :
//   rank = charset^len_motif × 2^len_repeat × charset^len_reste

'use strict';

import { charsetSize, passwordLength } from '../charset.js';

/**
 * @param {string} password
 * @param {{ type: string, motif: string, len_motif: number, len_total: number, reste: string|null } | null} repeatResult
 * @returns {{ rank: number, model: 'repeat' } | { rank: null, model: 'repeat' }}
 */
export function rankRepeat(password, repeatResult) {
  if (!repeatResult) return { rank: null, model: 'repeat' };

  const { motif, len_motif, len_total, reste } = repeatResult;

  const csMotif     = charsetSize(motif);
  const caseVariants = Math.pow(2, Math.min(len_total, 20));
  const repeatRank  = Math.pow(csMotif, len_motif) * caseVariants;

  let rank;
  if (reste === null) {
    rank = Math.round(repeatRank);
  } else {
    const csReste = charsetSize(reste);
    const lenReste = passwordLength(reste);
    rank = Math.round(repeatRank * Math.pow(csReste, lenReste));
  }

  return { rank, model: 'repeat' };
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier le passage**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "rankRepeat|fail|pass" | head -20
```

Résultat attendu : 6 tests `rankRepeat` passent.

- [ ] **Step 5 : Commit**

```bash
git add core/rank/repeat.js tests/core-non-regression.test.mjs
git commit -m "feat: add rankRepeat() — pure/cycle/sequence patterns (Wheeler 2016)"
```

---

## Task 2 : `core/patterns.js` — `detectRepeat()`

**Files:**
- Modify: `core/patterns.js`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
import { analyzePatterns } from '../core/patterns.js';

test('analyzePatterns — aaaa produit repeatResult pure', () => {
  const ctx = analyzePatterns('aaaa');
  assert.ok(ctx.repeatResult !== null, 'repeatResult devrait être non-null pour aaaa');
  assert.equal(ctx.repeatResult.type, 'pure');
  assert.equal(ctx.repeatResult.motif, 'a');
  assert.equal(ctx.repeatResult.len_motif, 1);
  assert.equal(ctx.repeatResult.len_total, 4);
  assert.equal(ctx.repeatResult.reste, null);
});

test('analyzePatterns — abababab produit repeatResult cycle', () => {
  const ctx = analyzePatterns('abababab');
  assert.ok(ctx.repeatResult !== null);
  assert.equal(ctx.repeatResult.type, 'cycle');
  assert.equal(ctx.repeatResult.motif, 'ab');
  assert.equal(ctx.repeatResult.len_motif, 2);
  assert.equal(ctx.repeatResult.len_total, 8);
  assert.equal(ctx.repeatResult.reste, null);
});

test('analyzePatterns — 1234 produit repeatResult sequence', () => {
  const ctx = analyzePatterns('1234');
  assert.ok(ctx.repeatResult !== null);
  assert.equal(ctx.repeatResult.type, 'sequence');
});

test('analyzePatterns — zyxw produit repeatResult sequence', () => {
  const ctx = analyzePatterns('zyxw');
  assert.ok(ctx.repeatResult !== null);
  assert.equal(ctx.repeatResult.type, 'sequence');
});

test('analyzePatterns — aaa123 produit repeatResult mixte', () => {
  const ctx = analyzePatterns('aaa123');
  assert.ok(ctx.repeatResult !== null);
  assert.equal(ctx.repeatResult.type, 'pure');
  assert.equal(ctx.repeatResult.motif, 'a');
  assert.equal(ctx.repeatResult.len_total, 3);
  assert.equal(ctx.repeatResult.reste, '123');
});

test('analyzePatterns — aa123 produit repeatResult null (< 3 chars)', () => {
  const ctx = analyzePatterns('aa123');
  assert.equal(ctx.repeatResult, null);
});

test('analyzePatterns — kbPat=true bloque repeatResult', () => {
  // 'qwerty' est un keyboard walk → repeatResult doit être null
  const ctx = analyzePatterns('qwerty');
  assert.equal(ctx.kbPat, true);
  assert.equal(ctx.repeatResult, null);
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier l'échec**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "analyzePatterns.*repeat|repeatResult|fail" | head -20
```

Résultat attendu : erreurs `ctx.repeatResult is not a property` ou undefined.

- [ ] **Step 3 : Ajouter `detectRepeat()` dans `core/patterns.js`**

Ajouter après la fonction `reverseStr` (ligne ~199), avant `deleet` :

```js
/**
 * Détecte un pattern répété dans un mot de passe.
 * Couvre : répétition pure (aaaa), cycle (abababab), séquence (1234, abcd, zyxw).
 * Seuil minimum : segment répété ≥ 3 caractères.
 * Composition : si répétition en tête OU en queue ≥ 3 chars, retourne le reste.
 *
 * @param {string} pw
 * @param {boolean} kbPat - Si true, retourne null (keyboard a priorité)
 * @returns {{ type: string, motif: string, len_motif: number, len_total: number, reste: string|null } | null}
 */
function detectRepeat(pw, kbPat) {
  if (kbPat) return null;

  const lower = pw.toLowerCase();

  // 1. Répétition pure : un seul char répété N fois en tête
  const pureMatch = lower.match(/^((.)\2{2,})/);
  if (pureMatch) {
    const segment = pureMatch[1];
    const reste   = pw.slice(segment.length) || null;
    return { type: 'pure', motif: segment[0], len_motif: 1, len_total: segment.length, reste };
  }

  // 2. Cycle : motif de longueur k ≥ 2 répété ≥ 2 fois en tête
  for (let k = 2; k <= Math.floor(lower.length / 2); k++) {
    const motif = lower.slice(0, k);
    const regex = new RegExp(`^((?:${motif.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}){2,})`);
    const m = lower.match(regex);
    if (m && m[1].length >= 3) {
      const segment = m[1];
      const reste   = pw.slice(segment.length) || null;
      return { type: 'cycle', motif, len_motif: k, len_total: segment.length, reste };
    }
  }

  // 3. Séquence croissante ou décroissante (chiffres ou lettres), longueur ≥ 3
  const seqMatch = detectSequenceSegment(lower);
  if (seqMatch && seqMatch.len >= 3) {
    const reste = pw.slice(seqMatch.len) || null;
    return { type: 'sequence', motif: lower.slice(0, seqMatch.len), len_motif: seqMatch.len, len_total: seqMatch.len, reste };
  }

  return null;
}

/**
 * Détecte une séquence consécutive (croissante ou décroissante) en tête de chaîne.
 * @param {string} s - chaîne en minuscules
 * @returns {{ len: number } | null}
 */
function detectSequenceSegment(s) {
  if (s.length < 3) return null;

  const codes = [...s].map(c => c.codePointAt(0));
  // Détecter le pas (step) entre les 2 premiers chars : +1 ou -1 seulement
  const step = codes[1] - codes[0];
  if (step !== 1 && step !== -1) return null;

  let len = 2;
  while (len < codes.length && codes[len] - codes[len - 1] === step) {
    len++;
  }

  return len >= 3 ? { len } : null;
}
```

- [ ] **Step 4 : Appeler `detectRepeat()` dans `analyzePatterns()` et ajouter `repeatResult` au retour**

Dans `analyzePatterns()`, après la ligne `const kbPat = ...` (ligne ~100), ajouter :

```js
  // --- Pattern répété ---
  const repeatResult = detectRepeat(pw, kbPat);
```

Puis dans le `return` final (ligne ~181), ajouter `repeatResult` :

```js
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
    repeatResult,
  };
```

Aussi mettre à jour le typedef JSDoc `@typedef {Object} PasswordContext` (ligne ~78) :

```js
 * @property {{ type: string, motif: string, len_motif: number, len_total: number, reste: string|null } | null} repeatResult - Pattern répété détecté
```

- [ ] **Step 5 : Lancer les tests**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "pass|fail|error" | tail -20
```

Résultat attendu : tous les tests passent.

- [ ] **Step 6 : Commit**

```bash
git add core/patterns.js tests/core-non-regression.test.mjs
git commit -m "feat: detectRepeat() in analyzePatterns() — pure/cycle/sequence, mixte ≥3 chars"
```

---

## Task 3 : `core/rank/index.js` — intégration pipeline

**Files:**
- Modify: `core/rank/index.js`

- [ ] **Step 1 : Écrire les tests pipeline qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
function estimateWithRepeat(password, words = null) {
  const context = analyzePatterns(password, words);
  return estimateRank(password, {
    dictWords:       words,
    looksPassphrase: context.looksPassphrase,
    hybridVuln:      context.hybridVuln,
    lang:            'en',
    kbPat:           context.kbPat,
    dt:              context.dt,
    dateResult:      context.datePattern,
    repeatResult:    context.repeatResult,
  });
}

test('pipeline repeat — aaaaaaa best_attack est repeat', () => {
  const rank = estimateWithRepeat('aaaaaaa');
  assert.equal(rank.best_attack, 'repeat', `best_attack=${rank.best_attack}, repeat=${rank.details.repeat?.rank}`);
});

test('pipeline repeat — 12341234 best_attack est repeat', () => {
  const rank = estimateWithRepeat('12341234');
  assert.equal(rank.best_attack, 'repeat');
});

test('pipeline repeat — details.repeat existe et rank non null pour aaaa', () => {
  const rank = estimateWithRepeat('aaaa');
  assert.ok(rank.details.repeat !== undefined, 'details.repeat manquant');
  assert.ok(rank.details.repeat.rank !== null, 'repeat rank null pour aaaa');
});

test('pipeline repeat — password normal : details.repeat.rank est null', () => {
  const rank = estimateWithRepeat('correcthorse', new Set(['correct', 'horse']));
  assert.equal(rank.details.repeat.rank, null);
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier l'échec**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "pipeline repeat|fail" | head -10
```

Résultat attendu : erreur `rank.details.repeat is undefined`.

- [ ] **Step 3 : Modifier `core/rank/index.js`**

Ajouter l'import en tête du fichier (après les imports existants) :

```js
import { rankRepeat }    from './repeat.js';
```

Dans la signature de `estimateRank`, ajouter `repeatResult = null` aux options destructurées :

```js
  const { dictWords = null, isHibpHit = false, hibpRank = null, looksPassphrase = false, hybridVuln = true, lang = 'en', kbPat = false, dt = false, dateResult = null, repeatResult = null } = options;
```

Dans le bloc `const raw = { ... }`, ajouter :

```js
    repeat:     rankRepeat(password, repeatResult),
```

Dans le bloc `const results = { ... }` (les valeurs cappées), ajouter :

```js
    repeat:     { ...raw.repeat, rank: cappedRank(raw.repeat.rank, 'repeat') },
```

Après `const dateRank = results.date.rank;`, ajouter :

```js
  const repeatRank = results.repeat.rank;
```

Dans `attackCandidates`, ajouter `repeatRank` :

```js
  const attackCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank,
    keyboardRank, dateRank, repeatRank, bruteRank,
  ].filter(r => r !== null);
```

Dans `stableCandidates`, ajouter `repeatRank` :

```js
  const stableCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank,
    keyboardRank, dateRank, repeatRank,
  ].filter(r => r !== null && r > 0);
```

Dans `modelRanks`, ajouter :

```js
    repeat:     repeatRank,
```

Dans le `return` final, ajouter `repeat` dans `details` :

```js
    details: {
      ...results,
    },
```

*(Note : `results` contient déjà tous les modèles y compris `repeat` — le spread suffit si le return utilise déjà `details: results`. Sinon lister explicitement `repeat: results.repeat` dans le bloc details.)*

- [ ] **Step 4 : Lancer tous les tests**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | tail -30
```

Résultat attendu : tous les tests passent, aucun `fail`.

- [ ] **Step 5 : Commit**

```bash
git add core/rank/index.js tests/core-non-regression.test.mjs
git commit -m "feat: wire rankRepeat into estimateRank pipeline — repeat joins attack candidates"
```

---

## Task 4 : Test e2e — vérification manuelle des cas clés

**Files:**
- No file change — validation uniquement

- [ ] **Step 1 : Lancer un test rapide en Node REPL**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --input-type=module <<'EOF'
import { analyzePatterns } from './core/patterns.js';
import { estimateRank }    from './core/rank/index.js';

const cases = ['aaaa', 'aaaaaaa', 'abababab', '12341234', '1234', 'zyxw', 'aaa123', 'aa123', 'Password123'];
for (const pw of cases) {
  const ctx  = analyzePatterns(pw);
  const rank = estimateRank(pw, { repeatResult: ctx.repeatResult, kbPat: ctx.kbPat, dt: ctx.dt, dateResult: ctx.datePattern });
  console.log(`${pw.padEnd(15)} repeat=${String(rank.details.repeat?.rank).padEnd(12)} best=${rank.best_attack}`);
}
EOF
```

Résultat attendu (ordre de grandeur) :

```
aaaa            repeat=16          best=repeat
aaaaaaa         repeat=512         best=repeat
abababab        repeat=2752        best=repeat
12341234        repeat=1280        best=repeat
1234            repeat=160         best=repeat
zyxw            repeat=6656        best=repeat
aaa123          repeat=16000       best=repeat
aa123           repeat=null        best=mask (ou brute)
Password123     repeat=null        best=dictionary (ou hybrid)
```

- [ ] **Step 2 : Lancer la suite complète de tests**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate && node --test tests/core-non-regression.test.mjs 2>&1 | grep -E "^#|fail|pass" | tail -5
```

Résultat attendu : `# tests N`, `# pass N`, `# fail 0`.

- [ ] **Step 3 : Commit final si tout est vert**

```bash
git add -p  # vérifier qu'il n'y a rien de non voulu
git commit -m "test: pipeline e2e repeat — aaaa, abababab, 12341234, zyxw, aaa123"
```
