# Wire core/rank into app.js — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le moteur de calcul interne de `app.js` par `calcCrackTime()` de `core/calc.js`, afin que les améliorations scientifiques (#1–6 : GPU RTX 5090, keyboard walks, dates, toggle-case, patterns répétés) soient visibles en production.

**Architecture:** `app.js` est déjà chargé comme `type="module"` — il peut importer directement `calcCrackTime` depuis `./core/calc.js` sans bundler ni nouveau fichier. La fonction `getScenarios()` est réécrite pour déléguer à `calcCrackTime()` ; une nouvelle fonction `buildRowsFromCalcResult()` convertit la sortie structurée en lignes de tableau. Le score de la barre de force est dérivé de `rank.standard` (Bonneau 2012) au lieu de l'entropie de Shannon. Les fonctions de calibration `applyHighFidelityCalibration()` et `annotateScenarioApplicability()` sont conservées et appliquées après `buildRowsFromCalcResult()`.

**Tech Stack:** Vanilla JS ES6 modules, `core/calc.js` (déjà présent dans `v2/public/core/`), Node.js pour les tests (`node --test`).

---

## Cartographie des fichiers

| Fichier | Action | Responsabilité |
|---|---|---|
| `v2/public/app.js` | Modifier | Ajouter import, réécrire `getScenarios()`, ajouter `buildRowsFromCalcResult()`, ajouter `rankToScore()`, supprimer code mort |
| `v2/public/core/calc.js` | Lire seulement | Source de `calcCrackTime()` — ne pas modifier |
| `v2/tests/core-non-regression.test.mjs` | Modifier | Ajouter tests de non-régression branchement |

---

## Task 1 : Ajouter l'import de `calcCrackTime` dans `app.js`

**Files:**
- Modify: `v2/public/app.js:1`

`app.js` commence actuellement par `(function () {` sans aucun import. Puisqu'il est chargé avec `type="module"`, on peut ajouter un import ES6 statique avant l'IIFE.

- [ ] **Step 1 : Vérifier que le test de base passe avant de toucher quoi que ce soit**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate
node --test tests/core-non-regression.test.mjs
```
Expected: `tests 58 / pass 58 / fail 0`

- [ ] **Step 2 : Ajouter l'import en tête de `v2/public/app.js`**

Insérer cette ligne **avant** la ligne 1 (`(function () {`) :

```js
import { calcCrackTime } from './core/calc.js';
```

Le fichier doit commencer par :
```js
import { calcCrackTime } from './core/calc.js';

(function () {
  "use strict";
  // ...
```

- [ ] **Step 3 : Vérifier que l'import ne casse pas le chargement de la page**

Lancer un serveur local depuis la racine du projet :
```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2/public
python3 -m http.server 8080
```
Ouvrir `http://localhost:8080` dans un navigateur, ouvrir la console DevTools.
Expected: aucune erreur `Cannot find module` ni `SyntaxError`.

- [ ] **Step 4 : Commit**

```bash
git add v2/public/app.js
git commit -m "feat: import calcCrackTime from core/calc.js into app.js"
```

---

## Task 2 : Ajouter `buildRowsFromCalcResult()` dans `app.js`

**Files:**
- Modify: `v2/public/app.js` (insérer après la définition de `ALGOS`, ~ligne 3690)

`buildRowsFromCalcResult()` prend le résultat de `calcCrackTime()` et le tableau `ALGOS` existant, et produit le même format de lignes qu'attendu par le reste de l'UI : `{ atk, hash, rate, sec, note, cat, applicable, confidence }`.

`calcCrackTime()` retourne :
```js
{
  context,        // { kbPat, dt, rep, dictWord, hybridVuln, looksPassphrase, ... }
  rank,           // { standard, attack_rank, optimistic, worst_case, best_attack, details }
  times,          // { md5, sha1, sha256, ntlm, bcrypt, argon2 } — scénario standard
  times_optimistic,
  times_worst_case,
  best_attack,    // string : 'keyboard' | 'date' | 'repeat' | 'dictionary' | 'brute' | ...
  best_attack_seconds,
}
```

`ALGOS` (déjà défini dans `app.js` ligne 3679) :
```js
[
  { key: "md5",     name: "MD5",             rate: ... },
  { key: "sha1",    name: "SHA-1",           rate: ... },
  { key: "sha256",  name: "SHA-256",         rate: ... },
  { key: "ntlm",    name: "NTLM",            rate: ... },
  { key: "mysql",   name: "MySQL5",          rate: ... },
  { key: "bcrypt",  name: "bcrypt (cost 10)",rate: ... },
  { key: "bcrypt12",name: "bcrypt (cost 12)",rate: ... },
  { key: "scrypt",  name: "scrypt",          rate: ... },
  { key: "pbkdf2",  name: "PBKDF2-SHA256",   rate: ... },
  { key: "argon2",  name: "Argon2id",        rate: ... },
]
```

Note : `core/time.js` n'expose que 6 algos (`md5`, `sha1`, `sha256`, `ntlm`, `bcrypt`, `argon2`). Les algos supplémentaires de `ALGOS` (`mysql`, `bcrypt12`, `scrypt`, `pbkdf2`) n'ont pas de correspondance dans `times` — leurs lignes auront `sec: null`.

La correspondance clé `ALGOS.key` → clé `times` :
```
md5      → times.md5
sha1     → times.sha1
sha256   → times.sha256
ntlm     → times.ntlm
bcrypt   → times.bcrypt
argon2   → times.argon2
mysql    → null  (pas dans core/time.js)
bcrypt12 → null
scrypt   → null
pbkdf2   → null
```

La table de correspondance attaque `best_attack` → `cat` (utilisé par `annotateScenarioApplicability`) :
```
brute      → 'brute'
dictionary → 'dict'
hybrid     → 'hybrid'
pcfg       → 'pcfg'
markov     → 'markov'
mask       → 'mask'
combinator → 'combi'
keyboard   → 'mask'   (keyboard walk est un sous-type de mask)
date       → 'mask'
repeat     → 'mask'
```

- [ ] **Step 1 : Insérer `buildRowsFromCalcResult()` dans `app.js`**

Insérer cette fonction juste après la fermeture du bloc `const ALGOS = [...]` (~ligne 3690) :

```js
  // Convertit la sortie de calcCrackTime() en lignes de tableau pour l'UI.
  // Format de sortie : [{ atk, hash, rate, sec, note, cat }, ...]
  function buildRowsFromCalcResult(calcResult) {
    const { context, rank, times } = calcResult;

    // Correspondance clé ALGOS → clé times (core/time.js expose 6 algos)
    const ALGO_TIME_KEY = {
      md5: 'md5', sha1: 'sha1', sha256: 'sha256',
      ntlm: 'ntlm', bcrypt: 'bcrypt', argon2: 'argon2',
    };

    // Correspondance best_attack → cat (pour annotateScenarioApplicability)
    const ATTACK_CAT = {
      brute: 'brute', dictionary: 'dict', hybrid: 'hybrid',
      pcfg: 'pcfg', markov: 'markov', mask: 'mask',
      combinator: 'combi', keyboard: 'mask', date: 'mask', repeat: 'mask',
    };

    // Note contextuelle par attaque
    function noteForAttack(attackName, ctx) {
      switch (attackName) {
        case 'brute':      return ctx.weak ? t('nWeakPassword') : t('nAllCombos');
        case 'dictionary': return ctx.weak ? t('nWeakPassword') : ctx.dictWord ? t('nDictHit') : t('nAbsentLeaks');
        case 'hybrid':     return ctx.hybridVuln ? t('nHybridVuln') : t('nAbsentLeaks');
        case 'pcfg':       return t('nStatPrio');
        case 'markov':     return ctx.kbPat ? t('nKeyboardUltra') : t('nStatPrio');
        case 'mask':       return ctx.dt ? t('nDateDetected') : ctx.kbPat ? t('nKeyboard') : t('nAllCombos');
        case 'combinator': return ctx.looksPassphrase ? t('nPassphrase') : t('nAbsentLeaks');
        case 'keyboard':   return t('nKeyboard');
        case 'date':       return t('nDateDetected');
        case 'repeat':     return t('nRepeat') || t('nAllCombos');
        default:           return '';
      }
    }

    // Libellé i18n par attaque
    function labelForAttack(attackName) {
      switch (attackName) {
        case 'brute':      return t('aBrute');
        case 'dictionary': return t('aDict');
        case 'hybrid':     return t('aHybrid');
        case 'pcfg':       return t('aPCFG');
        case 'markov':     return t('aMarkov');
        case 'mask':       return t('aMask');
        case 'combinator': return t('aCombi');
        case 'keyboard':   return t('aMask');
        case 'date':       return t('aMask');
        case 'repeat':     return t('aMask');
        default:           return attackName;
      }
    }

    const rows = [];

    // Une ligne par attaque × algo
    const attacks = Object.keys(rank.details);
    for (const attackName of attacks) {
      const attackRank = rank.details[attackName]?.rank ?? null;
      if (attackRank === null) continue; // attaque non applicable

      const cat = ATTACK_CAT[attackName] || 'brute';
      const atk = labelForAttack(attackName);
      const note = noteForAttack(attackName, context);

      for (const algo of ALGOS) {
        const timeKey = ALGO_TIME_KEY[algo.key];
        let sec;
        if (timeKey) {
          // Recalculer depuis le rang de cette attaque spécifique (pas le rang standard)
          sec = attackRank / (algo.rate);
        } else {
          sec = null; // algo non supporté par core/time.js
        }
        rows.push({ atk, hash: algo.name, rate: algo.rate, sec, note, cat });
      }
    }

    // Ajouter brute force depuis worst_case si non déjà présent
    const hasBrute = rows.some(r => r.cat === 'brute');
    if (!hasBrute) {
      for (const algo of ALGOS) {
        const sec = rank.worst_case / algo.rate;
        rows.push({ atk: t('aBrute'), hash: algo.name, rate: algo.rate, sec, note: t('nAllCombos'), cat: 'brute' });
      }
    }

    return rows;
  }
```

- [ ] **Step 2 : Vérifier que la fonction est syntaxiquement valide**

```bash
node --input-type=module <<'EOF'
import '/home/Baudouin/Documents/Projets/CrackDate/v2/public/app.js';
EOF
```
Expected: pas d'erreur de syntaxe (des erreurs DOM sont normales en dehors du navigateur).

- [ ] **Step 3 : Commit**

```bash
git add v2/public/app.js
git commit -m "feat: add buildRowsFromCalcResult() — converts calcCrackTime output to UI rows"
```

---

## Task 3 : Ajouter `rankToScore()` dans `app.js`

**Files:**
- Modify: `v2/public/app.js` (insérer près de `score()`, ~ligne 5192)

`score()` actuel utilise l'entropie de Shannon (biaisée). `rankToScore()` convertit `rank.standard` (rang de Bonneau 2012) en score 0–100 sur une échelle logarithmique.

Calibration de l'échelle (basée sur Wheeler 2016 et Hive Systems 2025) :
- rank < 1 000 → score 0–10 (crack instantané)
- rank = 1e6 → score ~25 (faible)
- rank = 1e9 → score ~40 (moyen)
- rank = 1e12 → score ~60 (bon)
- rank = 1e15 → score ~80 (excellent)
- rank ≥ 1e18 → score ~95+ (exceptionnel)

- [ ] **Step 1 : Insérer `rankToScore()` juste avant `scoreColor()` (~ligne 5217)**

```js
  function rankToScore(rank) {
    if (!rank || rank <= 0) return 0;
    const log = Math.log10(rank);
    // log10(rank) → score : 0→0, 3→10, 6→25, 9→40, 12→60, 15→80, 18→95, 21→100
    const breakpoints = [
      [0,  0],
      [3,  10],
      [6,  25],
      [9,  40],
      [12, 60],
      [15, 80],
      [18, 95],
      [21, 100],
    ];
    for (let i = 1; i < breakpoints.length; i++) {
      const [x0, y0] = breakpoints[i - 1];
      const [x1, y1] = breakpoints[i];
      if (log <= x1) {
        return Math.round(y0 + ((log - x0) / (x1 - x0)) * (y1 - y0));
      }
    }
    return 100;
  }
```

- [ ] **Step 2 : Commit**

```bash
git add v2/public/app.js
git commit -m "feat: add rankToScore() — maps Bonneau guess-rank to 0-100 score"
```

---

## Task 4 : Réécrire `getScenarios()` pour appeler `calcCrackTime()`

**Files:**
- Modify: `v2/public/app.js:4974` (fonction `getScenarios`)

C'est le branchement central. `getScenarios()` actuelle (~ligne 4974) calcule tout en interne. La nouvelle version délègue à `calcCrackTime()` puis à `buildRowsFromCalcResult()`, puis applique les calibrations existantes.

Le résultat de `calcCrackTime()` doit être stocké dans une variable accessible par `render()` pour que `rankToScore()` puisse lire `rank.standard`.

- [ ] **Step 1 : Ajouter la variable de module `_lastCalcResult`**

Juste après la déclaration de `let HIGH_FIDELITY = false;` (~ligne 2978), ajouter :

```js
  let _lastCalcResult = null; // résultat du dernier appel à calcCrackTime()
```

- [ ] **Step 2 : Réécrire `getScenarios()`**

Remplacer la fonction `getScenarios(pw, mlProb = null)` (~ligne 4974–5080) par :

```js
  function getScenarios(pw, mlProb = null) {
    // Calcul via core/calc.js (Bonneau 2012 + Wheeler 2016)
    _lastCalcResult = calcCrackTime(pw, {
      dictWords:  DICT_WORDS,
      isHibpHit:  false,   // HIBP est asynchrone, géré séparément
      hibpRank:   null,
      lang:       LANG,
      profile:    'experienced',
    });

    const rows = buildRowsFromCalcResult(_lastCalcResult);
    const context = _lastCalcResult.context;

    // Conserver les signaux de contexte pour compatibilité avec annotateScenarioApplicability
    const weak    = isWeakPassword(pw);
    const common  = isCommon(pw);
    const top20   = [
      "123456","password","12345678","qwerty","abc123","1234567","letmein","trustno1","dragon","baseball",
      "iloveyou","master","sunshine","ashley","bailey","shadow","123123","654321","superman","qazwsx",
    ];
    const looksPassphrase = context.looksPassphrase;
    const princeChainScore = princeChainabilityScore(pw, {
      looksPassphrase,
      dictWord:    context.dictWord,
      len:         pw.length,
      cs:          context.cs,
      dt:          context.dt,
      seq:         context.seq,
      hasSeparator: /[\s_-]/u.test(pw),
    });
    const targetedPattern = /^[A-Z][a-z]+(?:[-_. ]?[A-Z][a-z]+)?\d{0,4}[!@#$%^&*]?$/u.test(pw)
                         || /(?:1[6-9]|20)\d{2}/.test(pw);

    const calibrationContext = {
      len:            pw.length,
      common,
      dictWord:       context.dictWord,
      hybridVuln:     context.hybridVuln,
      kbPat:          context.kbPat,
      seq:            context.seq,
      rep:            context.rep,
      dt:             context.dt,
      looksPassphrase,
      princeChainScore,
      targetedPattern,
      hasUnicode:     /[^\x00-\x7F]/.test(pw),
      hasLeet:        context.dictWord && pw.toLowerCase() !== pw,
      weak,
    };

    applyHighFidelityCalibration(rows, calibrationContext);
    annotateScenarioApplicability(rows, {
      weak,
      common,
      dictWord:       context.dictWord,
      top20:          top20.includes(pw.toLowerCase()),
      hybridVuln:     context.hybridVuln,
      ruleVuln:       context.hybridVuln || context.kbPat || context.seq || context.dt,
      looksPassphrase,
      princeChainScore,
      looksHuman:     context.hybridVuln || context.kbPat || context.seq || context.dt || context.rep,
      kbPat:          context.kbPat,
      seq:            context.seq,
      rep:            context.rep,
      dt:             context.dt,
      targetedPattern,
      morphStrong:    context.dictWord && /[^\x00-\x7F]/.test(pw),
    });

    return rows;
  }
```

- [ ] **Step 3 : Mettre à jour `render()` pour utiliser `rankToScore()` au lieu de `score()`**

Dans la fonction `render()`, autour de la ligne 5657–5659, remplacer :

```js
    const { size: cs, types } = getCharset(pw);
    const ent = entropy(pw);
    const sc = score(pw);
```

par :

```js
    const { size: cs, types } = getCharset(pw);
    const ent = entropy(pw);   // conservé pour l'affichage "X bits" uniquement
    const sc = _lastCalcResult ? rankToScore(_lastCalcResult.rank.standard) : score(pw);
```

Note : `entropy()` et `score()` restent définies pour l'instant (suppression dans Task 5). Le fallback `score(pw)` est une sécurité si `_lastCalcResult` est null au premier rendu.

- [ ] **Step 4 : Vérifier le fonctionnement dans le navigateur**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2/public
python3 -m http.server 8080
```

Tester ces mots de passe et vérifier que les résultats sont cohérents (les temps changent par rapport à avant) :
- `aaaa` → doit afficher un temps très court (repeat pattern détecté)
- `azerty` → doit afficher un temps court (keyboard walk)
- `password123` → temps court (dictionary + hybrid)
- `correct-horse-battery-staple` → temps long (passphrase)
- `X9#mK2@pL5!` → temps long (aléatoire)

Vérifier dans la console DevTools : aucune erreur JS.

- [ ] **Step 5 : Commit**

```bash
git add v2/public/app.js
git commit -m "feat: wire getScenarios() onto calcCrackTime() — Bonneau 2012 guess-rank in production"
```

---

## Task 5 : Tests de non-régression sur les valeurs de référence

**Files:**
- Modify: `tests/core-non-regression.test.mjs`

Ajouter des tests qui vérifient que `calcCrackTime()` produit des valeurs sensées pour les cas de référence. Ces tests valident le pipeline complet (analyzePatterns → estimateRank → rankToAllSeconds).

- [ ] **Step 1 : Ajouter les tests de référence**

À la fin de `tests/core-non-regression.test.mjs`, avant le dernier `});`, ajouter :

```js
// Tests de non-régression calcCrackTime (pipeline complet)
import { calcCrackTime } from '../v2/public/core/calc.js';

test('calcCrackTime: aaaa — repeat détecté, rank très faible', () => {
  const r = calcCrackTime('aaaa');
  assert.ok(r.rank.standard < 1e6, `rank.standard trop élevé: ${r.rank.standard}`);
  assert.strictEqual(r.best_attack, 'repeat', `best_attack attendu 'repeat', obtenu '${r.best_attack}'`);
});

test('calcCrackTime: azerty — keyboard détecté, rank faible', () => {
  const r = calcCrackTime('azerty');
  assert.ok(r.rank.standard < 1e8, `rank.standard trop élevé: ${r.rank.standard}`);
});

test('calcCrackTime: password123 — rank inférieur à aléatoire de même longueur', () => {
  const rPw  = calcCrackTime('password123');
  const rRnd = calcCrackTime('X9#mK2@pL5!');
  assert.ok(rPw.rank.standard < rRnd.rank.standard,
    `password123 (${rPw.rank.standard.toExponential(1)}) devrait être < X9#mK2@pL5! (${rRnd.rank.standard.toExponential(1)})`);
});

test('calcCrackTime: correct-horse-battery-staple — rank élevé (passphrase)', () => {
  const r = calcCrackTime('correct-horse-battery-staple');
  assert.ok(r.rank.standard > 1e15, `rank.standard trop faible: ${r.rank.standard}`);
});

test('calcCrackTime: times contient md5 et argon2', () => {
  const r = calcCrackTime('hello');
  assert.ok(typeof r.times.md5    === 'number', 'times.md5 absent');
  assert.ok(typeof r.times.argon2 === 'number', 'times.argon2 absent');
  assert.ok(r.times.md5 < r.times.argon2, 'MD5 doit être plus rapide qu\'Argon2');
});

test('calcCrackTime: 19/05/1990 — date détectée, rank réduit', () => {
  const rDate = calcCrackTime('19/05/1990');
  const rRnd  = calcCrackTime('xK9@mP2#');
  assert.ok(rDate.rank.standard < rRnd.rank.standard,
    `date (${rDate.rank.standard.toExponential(1)}) devrait être < aléatoire (${rRnd.rank.standard.toExponential(1)})`);
});
```

- [ ] **Step 2 : Lancer les tests**

```bash
node --test tests/core-non-regression.test.mjs
```
Expected: `tests 64 / pass 64 / fail 0` (58 existants + 6 nouveaux).

- [ ] **Step 3 : Commit**

```bash
git add tests/core-non-regression.test.mjs
git commit -m "test: add calcCrackTime pipeline non-regression tests (6 cases)"
```

---

## Task 6 : Supprimer le code mort dans `app.js`

**Files:**
- Modify: `v2/public/app.js`

Une fois le branchement validé, supprimer les fonctions de calcul internes devenues inutiles.

Fonctions à supprimer (chercher par `function` + nom) :
- `addBruteForceAttacks()` (~ligne 4483)
- `addDictionaryAttacks()` (~ligne 4496)
- `addHybridAttacks()` (~ligne 4524)
- `addMaskAttacks()` (~ligne 4554)
- `addMarkovAttacks()` (~ligne 4599)
- `addPCFGAttacks()` (chercher `function addPCFGAttacks`)
- `addCombinatorAttacks()` (chercher `function addCombinatorAttacks`)
- `entropy()` (~ligne 4454) — sauf si encore utilisée pour l'affichage "X bits"
- `bruteTime()` (~ligne 4467)
- `budgetTime()` (~ligne 4474)
- `softCapGuesses()` (~ligne 3349)
- `detectDateAndReduce()` (~ligne 4313)
- Les constantes de scoring internes : `SCORE_ENTROPY`, `SCORE_RANGES`, `SCORE_COMMON_PENALTY`, `SCORE_KEYBOARD_PENALTY`, `SCORE_DATE_PENALTY` (~ligne 3309)
- Les constantes d'attaque internes : `MASK_GENERAL_REDUCTION`, `MASK_RANK_STRUCTURED`, `MASK_RANK_DEFAULT`, `WEAK_GUESS_RANK`, `MARKOV_SOFTCAP_KNEE`, `MARKOV_MAX_GUESSES`, `PCFG_SOFTCAP_KNEE`, `PCFG_MAX_GUESSES`, `RAINBOW_*`, `HYBRID_KEYSPACE_*` (~lignes 3316–3340)

**Note :** `entropy()` doit être conservée si elle est encore appelée pour afficher "X bits" dans `strengthBits`. Vérifier avant de supprimer :

```bash
grep -n "entropy(" v2/public/app.js
```

Si la seule occurrence restante est l'affichage `const ent = entropy(pw)` dans `render()`, conserver `entropy()`. Sinon supprimer.

- [ ] **Step 1 : Supprimer les fonctions `addXxxAttacks()` une par une**

Chercher chaque fonction, identifier sa portée complète (accolade ouvrante → accolade fermante correspondante), puis supprimer le bloc entier.

```bash
grep -n "function add.*Attacks\|function addBrute\|function addDict\|function addHybrid\|function addMask\|function addMarkov\|function addPCFG\|function addCombinator" v2/public/app.js
```

- [ ] **Step 2 : Supprimer les constantes et helpers devenus inutiles**

```bash
grep -n "SCORE_ENTROPY\|SCORE_RANGES\|SCORE_COMMON_PENALTY\|SCORE_KEYBOARD_PENALTY\|SCORE_DATE_PENALTY\|MASK_GENERAL_REDUCTION\|MASK_RANK_\|WEAK_GUESS_RANK\|MARKOV_SOFTCAP\|MARKOV_MAX\|PCFG_SOFTCAP\|PCFG_MAX\|RAINBOW_\|HYBRID_KEYSPACE" v2/public/app.js
```

Supprimer chaque ligne ou bloc de constantes inutilisées.

- [ ] **Step 3 : Vérifier qu'il ne reste aucune référence cassée**

```bash
node --input-type=module --experimental-vm-modules <<'EOF'
// Syntaxe check simple
const fs = await import('fs');
const src = fs.readFileSync('/home/Baudouin/Documents/Projets/CrackDate/v2/public/app.js', 'utf8');
console.log('Taille:', src.length, 'caractères');
EOF
```

Puis dans le navigateur : ouvrir `http://localhost:8080`, vérifier console DevTools → zéro erreur.

- [ ] **Step 4 : Lancer tous les tests**

```bash
node --test tests/core-non-regression.test.mjs
```
Expected: `tests 64 / pass 64 / fail 0`

- [ ] **Step 5 : Commit**

```bash
git add v2/public/app.js
git commit -m "refactor: remove dead attack calculation code from app.js — now delegated to core/calc.js"
```

---

## Checklist de self-review du plan

**Couverture spec :**
- ✅ Import de `calcCrackTime` → Task 1
- ✅ `buildRowsFromCalcResult()` → Task 2
- ✅ `rankToScore()` → Task 3
- ✅ Branchement de `getScenarios()` → Task 4
- ✅ Tests de non-régression → Task 5
- ✅ Suppression du code mort → Task 6
- ✅ Les calibrations `applyHighFidelityCalibration` et `annotateScenarioApplicability` sont conservées (Task 4, Step 2)
- ✅ HIBP reste asynchrone et indépendant (non touché)
- ✅ `entropy()` conservée conditionnellement pour l'affichage "X bits" (Task 6, Note)

**Cohérence des types :**
- `calcCrackTime()` → `{ context, rank, times, ... }` — utilisé tel quel dans Tasks 2, 3, 4
- `rank.details[attackName].rank` → `number | null` — vérifié dans `buildRowsFromCalcResult()` Task 2
- `context.kbPat`, `context.dt`, `context.rep`, `context.dictWord`, `context.hybridVuln`, `context.looksPassphrase`, `context.seq` — tous exposés par `analyzePatterns()` dans `core/patterns.js` (vérifié)
- `_lastCalcResult` — initialisé à `null`, assigné dans `getScenarios()` avant d'être lu dans `render()` — safe grâce au fallback `score(pw)`
