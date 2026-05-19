# Keyboard & Date Rank Models — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher les flags `kbPat` et `dt` détectés dans `core/patterns.js` vers deux nouveaux modèles de rang `rank/keyboard.js` et `rank/date.js`, et synchroniser l'affichage UI dans `app.js`.

**Architecture:** Deux nouveaux fichiers `core/rank/keyboard.js` et `core/rank/date.js` suivent le contrat existant (`{ rank, model }`). `core/patterns.js` est étendu pour détecter les noms de mois (9 langues) et retourner `{ format, space }`. `core/rank/index.js` et `core/calc.js` sont modifiés pour brancher les nouveaux modèles. `app.js` est synchronisé pour que les badges UI reflètent les nouveaux formats.

**Tech Stack:** JavaScript ES modules (Node.js), `node:test` pour les tests, pas de dépendances externes.

---

## Fichiers touchés

| Fichier | Action | Rôle |
|---|---|---|
| `core/patterns.js` | Modifier | Ajouter `MONTH_NAMES`, étendre `detectDate()` → `{ format, space }` |
| `core/rank/keyboard.js` | Créer | Modèle de rang keyboard walk |
| `core/rank/date.js` | Créer | Modèle de rang date analytique |
| `core/rank/index.js` | Modifier | Importer + brancher les 2 nouveaux modèles |
| `core/calc.js` | Modifier | Transmettre `kbPat`, `dt`, `dateResult` à `estimateRank()` |
| `app.js` | Modifier | Étendre `hasDate()`, aligner `KB_PATTERNS` |
| `tests/core-non-regression.test.mjs` | Modifier | Ajouter tests keyboard et date |

---

## Task 1 : Étendre `detectDate()` dans `core/patterns.js`

**Files:**
- Modify: `core/patterns.js`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `tests/core-non-regression.test.mjs` :

```js
import { analyzePatterns } from '../core/patterns.js';

test('detectDate — DDMM sans séparateur', () => {
  const ctx = analyzePatterns('14071990');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMM');
  assert.equal(ctx.datePattern.space, 365);
});

test('detectDate — DDMonthName français', () => {
  const ctx = analyzePatterns('14Mai');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMonthName');
  assert.equal(ctx.datePattern.space, 730);
});

test('detectDate — MonthNameDD anglais (format US)', () => {
  const ctx = analyzePatterns('July4');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'MonthNameDD');
  assert.equal(ctx.datePattern.space, 730);
});

test('detectDate — MonthNameYYYY', () => {
  const ctx = analyzePatterns('avril2003');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'MonthNameYYYY');
  assert.equal(ctx.datePattern.space, 1368);
});

test('detectDate — DDMonthNameYYYY', () => {
  const ctx = analyzePatterns('14juillet1989');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMonthNameYYYY');
  assert.equal(ctx.datePattern.space, 41610);
});

test('detectDate — pas de faux positif', () => {
  const ctx1 = analyzePatterns('password');
  assert.equal(ctx1.dt, false);
  const ctx2 = analyzePatterns('14132000');
  assert.equal(ctx2.dt, false);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 6 nouveaux tests FAIL (datePattern.format non défini).

- [ ] **Step 3 : Ajouter `MONTH_NAMES` dans `core/patterns.js`**

Après la ligne `const NUM_SEQUENCES = ...` (~ligne 25), ajouter :

```js
const MONTH_NAMES = [
  // FR — noms complets
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
  // FR — abréviations
  'janv','févr','avr','juil','sept','déc',
  // EN — noms complets
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
  // EN — abréviations
  'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov',
  // ES
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
  'ene','ago','dic',
  // PT
  'janeiro','fevereiro','março','junho','julho','setembro','novembro','dezembro',
  'fev','set','out','dez',
  // DE
  'januar','februar','märz','juni','juli','oktober',
  'mär','okt',
  // IT
  'gennaio','febbraio','aprile','maggio','giugno','luglio',
  'settembre','ottobre','novembre','dicembre',
  'gen','mag','giu','lug','ott',
  // NL
  'januari','februari','maart','augustus',
  'mrt','mei',
  // PL
  'styczeń','luty','marzec','kwiecień','czerwiec','lipiec',
  'sierpień','wrzesień','październik','listopad','grudzień',
  'sty','lut','kwi','cze','lip','sie','wrz','paź','lis','gru',
  // TR
  'ocak','şubat','nisan','mayıs','haziran','temmuz','ağustos','eylül','ekim','kasım','aralık',
  'oca','şub','nis','haz','tem','ağu','eyl','eki','kas','ara',
];

// Regex pré-compilée depuis MONTH_NAMES pour détection rapide
const MONTH_NAMES_PATTERN = new RegExp(
  '(' + MONTH_NAMES.slice().sort((a, b) => b.length - a.length).map(m =>
    m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|') + ')',
  'i'
);
```

- [ ] **Step 4 : Remplacer `detectDate()` dans `core/patterns.js`**

Remplacer la fonction `detectDate` existante (ligne ~170 jusqu'à `return null;`) par :

```js
function detectDate(pw) {
  const lower = pw.toLowerCase();

  // Formats avec nom de mois — testés en premier (plus spécifiques)
  const monthMatch = MONTH_NAMES_PATTERN.exec(lower);
  if (monthMatch) {
    const mIdx = monthMatch.index;
    const mLen = monthMatch[0].length;
    const before = lower.slice(0, mIdx);
    const after  = lower.slice(mIdx + mLen);

    const dayBefore = before.match(/(\d{1,2})$/);
    const dayAfter  = after.match(/^(\d{1,2})/);
    const yearAfter  = after.match(/(?:19|20)(\d{2})$/);
    const yearBefore = before.match(/^(?:19|20)(\d{2})/);

    const hasDay  = dayBefore || dayAfter;
    const hasYear = yearAfter || yearBefore;

    if (hasDay && hasYear) return { format: 'DDMonthNameYYYY', space: 41610 };
    if (hasDay)            return { format: dayBefore ? 'DDMonthName' : 'MonthNameDD', space: 730 };
    if (hasYear)           return { format: 'MonthNameYYYY', space: 1368 };
    // Nom de mois seul — espace = 12 mois × 2 variantes casse
    return { format: 'MonthName', space: 24 };
  }

  // YYYY (ex: 2024, 1987)
  if (/(?:19|20)\d{2}/.test(pw)) return { format: 'YYYY', space: 57 };

  // DD/MM ou MM/DD avec séparateur explicite
  if (/(?<!\d)(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])(?!\d)/.test(pw))
    return { format: 'DD/MM', space: 365 };

  // DDMM sans séparateur — exige isolation des 4 chiffres
  if (/(?<!\d)(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?!\d)/.test(pw))
    return { format: 'DDMM', space: 365 };

  return null;
}
```

- [ ] **Step 5 : Mettre à jour la référence `datePattern` dans le contexte**

Dans `analyzePatterns()`, les lignes :
```js
const dateResult = detectDate(pw);
const dt          = dateResult !== null;
const datePattern = dateResult;
```
deviennent (le nom `datePattern` dans le contexte retourné reste identique pour compatibilité) :
```js
const dateResult  = detectDate(pw);
const dt          = dateResult !== null;
const datePattern = dateResult; // objet { format, space } ou null
```
Aucun changement de code — le renommage est dans la JSDoc uniquement. Vérifier que le `return` inclut bien `datePattern`.

- [ ] **Step 6 : Lancer les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 13 tests PASS, 0 FAIL.

- [ ] **Step 7 : Commit**

```bash
git add core/patterns.js tests/core-non-regression.test.mjs
git commit -m "feat: extend detectDate() with month names (9 langs) and DDMM format"
```

---

## Task 2 : Créer `core/rank/keyboard.js`

**Files:**
- Create: `core/rank/keyboard.js`
- Modify: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `tests/core-non-regression.test.mjs` :

```js
import { rankKeyboard } from '../core/rank/keyboard.js';

test('rankKeyboard — qwerty retourne rang < 50 000', () => {
  const result = rankKeyboard('qwerty', true);
  assert.equal(result.model, 'keyboard');
  assert.ok(result.rank !== null);
  assert.ok(result.rank < 50_000, `rank trop élevé: ${result.rank}`);
});

test('rankKeyboard — kbPat=false retourne null', () => {
  const result = rankKeyboard('aBcDeFgH', false);
  assert.equal(result.model, 'keyboard');
  assert.equal(result.rank, null);
});

test('rankKeyboard — rang < rang brute force', () => {
  const { rankBrute } = await import('../core/rank/brute.js');
  const kb    = rankKeyboard('azerty!', true);
  const brute = rankBrute('azerty!');
  assert.ok(kb.rank < brute.rank, `keyboard ${kb.rank} devrait être < brute ${brute.rank}`);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 3 nouveaux FAIL (module introuvable).

- [ ] **Step 3 : Créer `core/rank/keyboard.js`**

```js
// core/rank/keyboard.js
// Rang keyboard walk : espace réduit par la topologie du clavier.
//
// Source : Wheeler (2016) zxcvbn — adjacency graphs QWERTY/AZERTY.
// rank = (NB_WALKS × 2^len_walk) / 2
//
// NB_WALKS = 460 : sous-séquences de longueur ≥ 3 extraites des séquences
// principales QWERTY, AZERTY, numpad (directes + inversées).

'use strict';

import { passwordLength } from '../charset.js';

const NB_WALKS = 460;

/**
 * Estime le rang keyboard-walk d'un mot de passe.
 *
 * @param {string} password
 * @param {boolean} kbPat - Flag depuis analyzePatterns()
 * @returns {{ rank: number, model: 'keyboard' } | { rank: null, model: 'keyboard' }}
 */
export function rankKeyboard(password, kbPat) {
  if (!kbPat) return { rank: null, model: 'keyboard' };

  const len = passwordLength(password);
  // Variantes de casse : 2^len (chaque position peut être maj ou min)
  // Capé à 2^20 pour éviter des nombres astronomiques sur les walks très longs
  const caseVariants = Math.pow(2, Math.min(len, 20));
  const rank = Math.round((NB_WALKS * caseVariants) / 2);
  return { rank, model: 'keyboard' };
}
```

- [ ] **Step 4 : Lancer les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 16 tests PASS, 0 FAIL.

- [ ] **Step 5 : Commit**

```bash
git add core/rank/keyboard.js tests/core-non-regression.test.mjs
git commit -m "feat: add rank/keyboard.js — keyboard walk rank model (Wheeler 2016)"
```

---

## Task 3 : Créer `core/rank/date.js`

**Files:**
- Create: `core/rank/date.js`
- Modify: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `tests/core-non-regression.test.mjs` :

```js
import { rankDate } from '../core/rank/date.js';

test('rankDate — date pure 14071990 retourne rang ≈ 182', () => {
  const dateResult = { format: 'DDMM', space: 365 };
  const result = rankDate('14071990', true, dateResult);
  assert.equal(result.model, 'date');
  assert.ok(result.rank !== null);
  // espace 365 / 2 = 182, mais pw contient 14071990 → len_reste = 4 (YYYY)
  // rank = (365 × cs^4) / 2 — vérifier que rank < brute
  const { rankBrute } = await import('../core/rank/brute.js');
  const brute = rankBrute('14071990');
  assert.ok(result.rank < brute.rank, `date ${result.rank} devrait être < brute ${brute.rank}`);
});

test('rankDate — dt=false retourne null', () => {
  const result = rankDate('password', false, null);
  assert.equal(result.model, 'date');
  assert.equal(result.rank, null);
});

test('rankDate — 14Mai rang < brute', () => {
  const dateResult = { format: 'DDMonthName', space: 730 };
  const { rankBrute } = await import('../core/rank/brute.js');
  const result = rankDate('14Mai', true, dateResult);
  const brute  = rankBrute('14Mai');
  assert.ok(result.rank < brute.rank);
});

test('rankDate — born1987 rang < brute', () => {
  // analyzePatterns détecte YYYY dans born1987
  const ctx = analyzePatterns('born1987');
  assert.equal(ctx.dt, true);
  const result = rankDate('born1987', ctx.dt, ctx.datePattern);
  const { rankBrute } = await import('../core/rank/brute.js');
  const brute = rankBrute('born1987');
  assert.ok(result.rank < brute.rank);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 4 nouveaux FAIL (module introuvable).

- [ ] **Step 3 : Créer `core/rank/date.js`**

```js
// core/rank/date.js
// Rang date : espace analytique fermé.
//
// Source : Bonneau (2012) — les dates forment un espace calculable exactement,
// bien inférieur au brute force sur les chiffres bruts.
//
// rank = (dateResult.space × cs^len_reste) / 2
// Si len_reste = 0 (mot de passe = date pure) : rank = dateResult.space / 2

'use strict';

import { charsetSize, passwordLength } from '../charset.js';

/**
 * Estime le rang date d'un mot de passe.
 *
 * @param {string} password
 * @param {boolean} dt - Flag depuis analyzePatterns()
 * @param {{ format: string, space: number } | null} dateResult - Depuis analyzePatterns()
 * @returns {{ rank: number, model: 'date' } | { rank: null, model: 'date' }}
 */
export function rankDate(password, dt, dateResult) {
  if (!dt || !dateResult) return { rank: null, model: 'date' };

  const totalLen   = passwordLength(password);
  const cs         = charsetSize(password);
  const dateSpace  = dateResult.space;

  // Estimer la longueur occupée par la date selon le format
  const dateLen = estimateDateLen(dateResult.format, password);
  const restLen = Math.max(0, totalLen - dateLen);

  const rank = restLen > 0
    ? Math.round((dateSpace * Math.pow(cs, restLen)) / 2)
    : Math.round(dateSpace / 2);

  return { rank, model: 'date' };
}

/**
 * Estime le nombre de caractères occupés par la date dans le mot de passe.
 * Approximation conservative : on utilise la longueur minimale connue par format.
 */
function estimateDateLen(format, password) {
  switch (format) {
    case 'YYYY':            return 4;
    case 'DDMM':            return 4;
    case 'DD/MM':           return 5;  // ex: 14/07
    case 'DDMonthName':     return estimateMonthPatternLen(password, 'before');
    case 'MonthNameDD':     return estimateMonthPatternLen(password, 'after');
    case 'MonthNameYYYY':   return estimateMonthPatternLen(password, 'year');
    case 'DDMonthNameYYYY': return estimateMonthPatternLen(password, 'full');
    case 'MonthName':       return estimateMonthPatternLen(password, 'name');
    default:                return 4;
  }
}

function estimateMonthPatternLen(password, mode) {
  // Longueur minimale selon mode :
  // 'before'  → DD + nom mois (min: 1 + 3 = 4)
  // 'after'   → nom mois + DD (min: 3 + 1 = 4)
  // 'year'    → nom mois + YYYY (min: 3 + 4 = 7)
  // 'full'    → DD + nom mois + YYYY (min: 1 + 3 + 4 = 8)
  // 'name'    → nom mois seul (min: 3)
  const minLens = { before: 4, after: 4, year: 7, full: 8, name: 3 };
  return minLens[mode] ?? 4;
}
```

- [ ] **Step 4 : Lancer les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 20 tests PASS, 0 FAIL.

- [ ] **Step 5 : Commit**

```bash
git add core/rank/date.js tests/core-non-regression.test.mjs
git commit -m "feat: add rank/date.js — date analytical rank model (Bonneau 2012)"
```

---

## Task 4 : Brancher les modèles dans `core/rank/index.js` et `core/calc.js`

**Files:**
- Modify: `core/rank/index.js`
- Modify: `core/calc.js`
- Modify: `tests/core-non-regression.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `tests/core-non-regression.test.mjs` :

```js
function estimateFull(password, words = null) {
  const context = analyzePatterns(password, words);
  return estimateRank(password, {
    dictWords:      words,
    looksPassphrase: context.looksPassphrase,
    hybridVuln:     context.hybridVuln,
    kbPat:          context.kbPat,
    dt:             context.dt,
    dateResult:     context.datePattern,
    lang: 'en',
  });
}

test('pipeline — qwerty a un rang keyboard dans details', () => {
  const rank = estimateFull('qwerty');
  assert.ok(rank.details.keyboard !== undefined, 'details.keyboard manquant');
  assert.ok(rank.details.keyboard.rank !== null, 'rank keyboard null pour qwerty');
});

test('pipeline — 14071990 a un rang date dans details', () => {
  const rank = estimateFull('14071990');
  assert.ok(rank.details.date !== undefined, 'details.date manquant');
  assert.ok(rank.details.date.rank !== null, 'rank date null pour 14071990');
});

test('pipeline — Qwerty123 best_attack est keyboard ou mask', () => {
  const rank = estimateFull('Qwerty123');
  assert.ok(
    rank.best_attack === 'keyboard' || rank.best_attack === 'mask',
    `best_attack inattendu: ${rank.best_attack}`
  );
});

test('pipeline — born1987 rang date < rang brute', () => {
  const rank = estimateFull('born1987');
  assert.ok(rank.details.date.rank < rank.worst_case,
    `date ${rank.details.date.rank} devrait être < brute ${rank.worst_case}`);
});
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 4 nouveaux FAIL (`details.keyboard` non défini).

- [ ] **Step 3 : Modifier `core/rank/index.js`**

En haut du fichier, ajouter les imports après les imports existants :

```js
import { rankKeyboard } from './keyboard.js';
import { rankDate }     from './date.js';
```

Dans la signature de `estimateRank`, ajouter les nouveaux paramètres dans la déstructuration :

```js
export function estimateRank(password, options = {}) {
  const {
    dictWords = null, isHibpHit = false, hibpRank = null,
    looksPassphrase = false, hybridVuln = true, lang = 'en',
    kbPat      = false,  // nouveau
    dt         = false,  // nouveau
    dateResult = null,   // nouveau
  } = options;
```

Dans le bloc `raw` (après `raw.combinator`), ajouter :

```js
    keyboard:   rankKeyboard(password, kbPat),
    date:       rankDate(password, dt, dateResult),
```

Dans `attackCandidates`, ajouter `raw.keyboard.rank` et `raw.date.rank` :

```js
  const keyboardRank = results.keyboard.rank;
  const dateRank     = results.date.rank;

  const attackCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank,
    keyboardRank, dateRank, bruteRank,       // ajouté
  ].filter(r => r !== null);
```

Dans `stableCandidates` :

```js
  const stableCandidates = [
    dictRank, hybridRank, pcfgRank, markovRank, maskRank, combinatorRank,
    keyboardRank, dateRank,                  // ajouté
  ].filter(r => r !== null && r > 0);
```

Dans `modelRanks` :

```js
  const modelRanks = {
    dictionary: dictRank, hybrid: hybridRank, pcfg: pcfgRank,
    markov: markovRank, mask: maskRank, combinator: combinatorRank,
    keyboard: keyboardRank,                  // ajouté
    date:     dateRank,                      // ajouté
    brute:    bruteRank,
  };
```

Dans `results` (après `combinator`) :

```js
    keyboard: { ...raw.keyboard, rank: cappedRank(raw.keyboard.rank, 'keyboard') },
    date:     { ...raw.date,     rank: cappedRank(raw.date.rank, 'date') },
```

Dans les lignes de déclaration de variables de rang individuelles, ajouter :

```js
  const keyboardRank   = results.keyboard.rank;
  const dateRank       = results.date.rank;
```

Le `return` final utilise `details: results` — `keyboard` et `date` y apparaîtront automatiquement une fois ajoutés dans `results`. Aucune modification du `return` nécessaire.

- [ ] **Step 4 : Modifier `core/calc.js`**

Dans `calcCrackTime`, remplacer l'appel à `estimateRank` pour ajouter les nouveaux flags :

```js
  const rank = estimateRank(password, {
    dictWords,
    isHibpHit,
    hibpRank,
    looksPassphrase: context.looksPassphrase,
    hybridVuln:      context.hybridVuln,
    kbPat:           context.kbPat,       // nouveau
    dt:              context.dt,           // nouveau
    dateResult:      context.datePattern,  // nouveau
    lang,
  });
```

- [ ] **Step 5 : Lancer les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 24 tests PASS, 0 FAIL.

- [ ] **Step 6 : Commit**

```bash
git add core/rank/index.js core/calc.js tests/core-non-regression.test.mjs
git commit -m "feat: wire keyboard and date rank models into estimateRank pipeline"
```

---

## Task 5 : Synchroniser `app.js` — `hasDate()` et `KB_PATTERNS`

**Files:**
- Modify: `app.js`

- [ ] **Step 1 : Aligner `KB_PATTERNS` avec `core/patterns.js`**

Dans `app.js`, localiser `const KB_PATTERNS = [` (~ligne 4546).

Comparer avec `KEYBOARD_SEQUENCES` dans `core/patterns.js` (~ligne 15) :

```js
// core/patterns.js KEYBOARD_SEQUENCES (source de vérité) :
// 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
// 'azertyuiop', 'qsdfghjklm', 'wxcvbn',
// 'qwerty', 'azerty', 'qwert', 'azert',
// 'asdf', 'zxcv', 'poiuy', 'lkjhg',
// '1qaz', '2wsx', '3edc', 'qazwsx',
```

Remplacer le contenu de `KB_PATTERNS` dans `app.js` pour qu'il contienne exactement
les mêmes séquences que `KEYBOARD_SEQUENCES`, plus les inverses déjà présentes dans `app.js`
qui sont pertinentes (`ytrewq`, `fdsa`, etc.) :

```js
  const KB_PATTERNS = [
    // Lignes QWERTY/AZERTY (source de vérité: core/patterns.js KEYBOARD_SEQUENCES)
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'azertyuiop', 'qsdfghjklm', 'wxcvbn',
    'qwerty', 'azerty', 'qwert', 'azert',
    'asdf', 'zxcv', 'poiuy', 'lkjhg',
    '1qaz', '2wsx', '3edc', 'qazwsx',
    // Inverses (Veras 2012 — 0.18% du corpus RockYou)
    'ytrewq', 'trewq', 'rewq',
    'fdsa', 'lkjh', 'kjhg',
    'mnbvc', 'nbvc',
    'oiuy',
    // Diagonales numpad
    'zaq1zaq1', '1qaz2wsx', '4rfv',
    // Séquences numériques décroissantes
    '9876', '8765', '7654', '0987',
    // QWERTZ (allemand)
    'qwertz',
  ];
```

- [ ] **Step 2 : Ajouter `APP_MONTH_NAMES` et étendre `hasDate()` dans `app.js`**

Localiser `function hasDate(pw)` (~ligne 4666). Juste avant cette fonction, ajouter la constante :

```js
  const APP_MONTH_NAMES = [
    'janvier','février','mars','avril','mai','juin',
    'juillet','août','septembre','octobre','novembre','décembre',
    'janv','févr','avr','juil','sept','déc',
    'january','february','march','april','may','june',
    'july','august','september','october','november','december',
    'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov',
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
    'ene','ago','dic',
    'janeiro','fevereiro','março','junho','julho','setembro','novembro','dezembro',
    'fev','set','out','dez',
    'januar','februar','märz','juni','juli','oktober',
    'mär','okt',
    'gennaio','febbraio','aprile','maggio','giugno','luglio',
    'settembre','ottobre','novembre','dicembre',
    'gen','mag','giu','lug','ott',
    'januari','februari','maart','augustus',
    'mrt','mei',
    'styczeń','luty','marzec','kwiecień','czerwiec','lipiec',
    'sierpień','wrzesień','październik','listopad','grudzień',
    'sty','lut','kwi','cze','lip','sie','wrz','paź','lis','gru',
    'ocak','şubat','nisan','mayıs','haziran','temmuz','ağustos','eylül','ekim','kasım','aralık',
    'oca','şub','nis','haz','tem','ağu','eyl','eki','kas','ara',
  ];
  const APP_MONTH_REGEX = new RegExp(
    APP_MONTH_NAMES.slice().sort((a, b) => b.length - a.length)
      .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'i'
  );
```

Remplacer `hasDate()` :

```js
  function hasDate(pw) {
    if (APP_MONTH_REGEX.test(pw)) return true;
    if (/(?:19|20)\d{2}/.test(pw)) return true;
    if (/(?<!\d)(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?!\d)/.test(pw)) return true;
    if (/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(pw)) return true;
    if (/(?<!\d)(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])(?!\d)/.test(pw)) return true;
    return false;
  }
```

- [ ] **Step 3 : Vérifier manuellement dans le navigateur**

Lancer le serveur local :
```bash
cd /home/Baudouin/Documents/Projets/CrackDate && python3 -m http.server 8080
```

Tester dans le navigateur (`http://localhost:8080`) :
- `14071990` → badge orange "date détectée" attendu
- `14Mai` → badge orange attendu
- `juillet2003` → badge orange attendu
- `July4` → badge orange attendu
- `password` → pas de badge date
- `qwerty` → badge rouge "keyboard walk" attendu
- `azerty` → badge rouge attendu

- [ ] **Step 4 : Lancer les tests de non-régression**

```bash
node --test tests/core-non-regression.test.mjs 2>&1 | tail -15
```

Attendu : 24 tests PASS, 0 FAIL.

- [ ] **Step 5 : Commit**

```bash
git add app.js
git commit -m "fix: sync app.js hasDate() and KB_PATTERNS with core/patterns.js"
```

---

## Vérification finale

- [ ] **Lancer tous les tests**

```bash
node --test tests/core-non-regression.test.mjs 2>&1
```

Attendu : 24 tests PASS, 0 FAIL.

- [ ] **Vérifier les cas clés en console navigateur**

Ouvrir DevTools → Console, taper :
```js
window.__TIME2CRACK_DEBUG = true
```
Saisir `qwerty` → vérifier que `best_attack` vaut `keyboard` dans les logs.
Saisir `14juillet1989` → vérifier que `details.date.rank` est présent et < `worst_case`.

- [ ] **Commit final si tout est vert**

```bash
git add -A
git commit -m "chore: final verification keyboard/date rank models"
```
