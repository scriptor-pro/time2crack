# Design — Modèles de rang `keyboard` et `date`

*Date : 2026-05-19*  
*Statut : validé — prêt pour implémentation*

---

## Contexte

Le moteur `core/` détecte déjà les keyboard walks (`kbPat`) et les dates (`dt`) dans
`core/patterns.js`, mais ces flags ne sont pas transmis aux modèles de rang. Les modèles
`rank/mask.js`, `rank/brute.js`, etc. ignorent donc ces vulnérabilités structurelles,
ce qui conduit à surestimer le rang de mots de passe comme `Qwerty123` ou `14071990`.

**Objectif :** créer deux nouveaux modèles `rank/keyboard.js` et `rank/date.js` en suivant
l'architecture existante, et les brancher dans le pipeline `calc.js → index.js`.

**Sources académiques :**
- Wheeler (2016) — zxcvbn, adjacency graphs pour keyboard walks
- Bonneau (2012) — espace analytique fermé pour les dates

---

## Architecture

La séparation des responsabilités existante est préservée :

```
patterns.js   →  détection (kbPat, dt, datePattern)  [étendu]
rank/*.js      →  rang par modèle d'attaque           [2 nouveaux fichiers]
rank/index.js  →  orchestration + min()               [modifié]
calc.js        →  pipeline complet                    [modifié]
```

Chaque modèle retourne `{ rank: number, model: string }` ou `{ rank: null, model: string }`
si non applicable — contrat identique aux 7 modèles existants.

---

## 1. Extension de `core/patterns.js`

### 1.1 Noms de mois multilingues

Ajouter une constante `MONTH_NAMES` couvrant les 9 langues servies par Time2Crack
(FR, EN, ES, PT, DE, IT, NL, PL, TR), noms complets et abréviations, en minuscules.

**144 tokens uniques** générés via `Intl.DateTimeFormat` :

```js
const MONTH_NAMES = [
  // FR
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
  'janv','févr','avr','juil','août','sept','déc',
  // EN
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
  'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov',
  // ES
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
  'ene','abr','ago','dic',
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
```

### 1.2 Extension de `detectDate()`

La fonction retourne désormais un objet `{ format, space }` au lieu d'une simple string,
afin de transmettre l'espace calculé à `rank/date.js` sans recalcul.

**Formats reconnus :**

| Format | Regex / Condition | Espace |
|--------|-------------------|--------|
| `YYYY` | `/(?:19\|20)\d{2}/` | 57 (années 1970–2026) |
| `DDMM` | chiffres sans séparateur, DD 01-31, MM 01-12 | 365 |
| `DD/MM` | avec séparateur `/`, `-`, `.` | 365 |
| `MM/DD` | avec séparateur, premier token 01-12 ambiguïté | 365 |
| `DDMonthName` | chiffre(s) 1-31 + nom de mois | 730 |
| `MonthNameDD` | nom de mois + chiffre(s) 1-31 | 730 |
| `MonthNameYYYY` | nom de mois + année 4 chiffres | 1 368 (12 × 57 × 2 casse) |
| `DDMonthNameYYYY` | chiffre(s) + nom de mois + année | 41 610 (365 × 57 × 2) |
| `MonthNameDDYYYY` | nom de mois + chiffre(s) + année (format US long) | 41 610 |

**Gestion de l'ambiguïté DD/MM vs MM/DD :**
- Si le premier token est 13-31 → forcément `DD/MM`, espace = 365
- Si les deux tokens sont dans 01-12 → les deux formats plausibles, espace = 365
  (un attaquant teste les deux mais les dates uniques ne doublent pas)
- `rankDate` prend toujours le plus petit espace détecté si plusieurs formats correspondent

**Signature mise à jour :**
```js
// Avant
function detectDate(pw) → string|null

// Après
function detectDate(pw) → { format: string, space: number } | null
```

Le flag `dt` dans le contexte reste un booléen (`dateResult !== null`).
Le champ `datePattern` devient `dateResult` (l'objet complet) dans le contexte retourné.

---

## 2. `core/rank/keyboard.js`

**Source :** Wheeler (2016), zxcvbn adjacency graphs.

**Logique :** une keyboard walk a un espace très réduit car les séquences sont contraintes
par la topologie du clavier. L'espace = nombre de walks plausibles × variantes de casse.

```
rank_keyboard = (NB_WALKS × 2^len_walk) / 2
```

- `NB_WALKS` = 460 (sous-séquences de longueur ≥ 3 sur les séquences QWERTY, AZERTY, numpad — directes + inversées)
- `2^len_walk` : variantes majuscule/minuscule par position
- `/2` : convention rang = mi-parcours (identique aux autres modèles)

**Cas limites :**
- Si `kbPat = false` → `{ rank: null, model: 'keyboard' }`
- Capé à `rankBrute` via le mécanisme existant dans `index.js`

**Signature :**
```js
export function rankKeyboard(password, kbPat) →
  { rank: number, model: 'keyboard' } | { rank: null, model: 'keyboard' }
```

---

## 3. `core/rank/date.js`

**Source :** Bonneau (2012), espace analytique fermé.

**Logique :** les dates sont un espace de recherche calculable exactement.
Le modèle reçoit l'espace précalculé dans `dateResult.space` depuis `patterns.js`.

```
rank_date = dateResult.space / 2
```

Si le mot de passe contient du texte non-date (préfixe/suffixe), l'espace est multiplié
par cs^len_reste (espace brute des caractères restants) :

```
rank_date = (dateResult.space × cs^len_reste) / 2
```

Capé à `rankBrute` via le mécanisme existant dans `index.js`.

**Cas limites :**
- Si `dt = false` → `{ rank: null, model: 'date' }`
- Si `len_reste = 0` → pas de multiplication (mot de passe = date pure)

**Signature :**
```js
export function rankDate(password, dt, dateResult) →
  { rank: number, model: 'date' } | { rank: null, model: 'date' }
```

---

## 4. Modifications `core/rank/index.js`

**Ajouts :**

```js
import { rankKeyboard } from './keyboard.js';
import { rankDate }     from './date.js';
```

**Signature `estimateRank` étendue :**
```js
estimateRank(password, {
  dictWords, isHibpHit, hibpRank,
  looksPassphrase, hybridVuln,
  kbPat,        // nouveau
  dt,           // nouveau
  dateResult,   // nouveau
  lang,
})
```

**Intégration dans le calcul :**
- `rankKeyboard` et `rankDate` ajoutés à `attackCandidates`, `stableCandidates`, `modelRanks`
- Ajoutés au retour `details`
- `best_attack` peut désormais valoir `'keyboard'` ou `'date'`

---

## 5. Modifications `core/calc.js`

`calcCrackTime` transmet les nouveaux flags à `estimateRank` :

```js
const rank = estimateRank(password, {
  dictWords, isHibpHit, hibpRank,
  looksPassphrase: context.looksPassphrase,
  hybridVuln:      context.hybridVuln,
  kbPat:           context.kbPat,       // nouveau
  dt:              context.dt,           // nouveau
  dateResult:      context.datePattern,  // nouveau (renommé dans context)
  lang,
});
```

---

## 6. Tests

Bloc à ajouter dans `tests/core-non-regression.test.mjs` :

| Mot de passe | Assertion |
|---|---|
| `qwerty` | `rankKeyboard` retourne rank < 50 000 |
| `Qwerty123` | rank keyboard < rank mask |
| `azerty!` | `kbPat = true`, rank keyboard < rank brute |
| `aBcDeFgH` | `rankKeyboard` retourne `null` |
| `14071990` | `dt = true`, `rankDate` retourne rank ≈ 182 |
| `born1987` | rank date < rank brute |
| `14Mai` | `dt = true`, format `DDMonthName`, espace = 730 |
| `July4` | `dt = true`, format `MonthNameDD` US, espace = 730 |
| `avril2003` | format `MonthNameYYYY`, espace = 1 368 |
| `14juillet1989` | format `DDMonthNameYYYY`, espace = 41 610 |
| `password` | `dt = false`, `rankDate` retourne `null` |
| `14132000` | `dt = false` (13 invalide comme mois) |

---

## 7. Ce qui ne change pas

- `rank/mask.js` : inchangé (keyboard et date ne sont plus sa responsabilité)
- `rank/brute.js` : inchangé
- Le mécanisme de cap `cappedRank()` dans `index.js` : s'applique automatiquement aux nouveaux modèles
- La moyenne géométrique `standard` : intègre les nouveaux rangs naturellement
- L'API publique de `calcCrackTime` : aucun changement de signature externe

---

## Estimation d'effort

| Tâche | Durée estimée |
|---|---|
| Extension `patterns.js` (noms de mois + formats) | 1h |
| `rank/keyboard.js` | 30 min |
| `rank/date.js` | 45 min |
| Modifications `index.js` | 30 min |
| Modifications `calc.js` | 15 min |
| Tests | 45 min |
| **Total** | **~4h** |
