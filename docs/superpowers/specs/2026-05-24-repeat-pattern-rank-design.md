# Spec — Détection et rang des patterns répétés

*Date : 2026-05-24*

---

## Objectif

Modéliser les mots de passe à base de répétitions comme un espace analytique fermé, plutôt que de les laisser tomber en brute force. Exemples ciblés : `aaaa`, `abababab`, `12341234`, `1234`, `abcd`, `zyxw`.

Source : Wheeler (2016) zxcvbn — les répétitions sont un pattern analytique distinct, pas du brute force.

---

## Patterns détectés

### 1. Répétition pure
Un seul caractère répété N fois.
- Exemples : `aaaa`, `111111`, `ZZZZ`
- Condition : tout le segment répété ≥ 3 chars

### 2. Cycle répété
Un motif de longueur k ≥ 2 répété N fois (N ≥ 2).
- Exemples : `abababab`, `12341234`, `xyzxyz`
- Condition : segment répété ≥ 3 chars

### 3. Séquence croissante/décroissante
Caractères consécutifs dans l'alphabet ou les chiffres.
- Exemples : `1234`, `abcd`, `zyxw`, `9876`
- Condition : longueur ≥ 3

### Patterns mixtes (composition)
Si la répétition occupe un segment ≥ 3 chars en tête ou en queue, le reste est traité par `charset^len_reste`.
- Exemple : `aaa123` → `rank_repeat("aaa") × charset^3`
- Si répétition < 3 chars → `repeatResult = null`, traité en brute/mask

---

## Formule de rang (Option A — Wheeler 2016)

```
rank = charset^len_motif × 2^len_total
```

- `charset` = taille de l'alphabet du motif (via `charsetSize`)
- `len_motif` = longueur du motif de base (`"a"` → 1, `"ab"` → 2)
- `len_total` = longueur totale du segment répété
- `2^len_total` = variantes de casse (cohérent avec `keyboard.js`)

**Composition pour pattern mixte :**
```
rank = (charset^len_motif × 2^len_repeat) × charset^len_reste
```

---

## Structure de données

`analyzePatterns()` expose un nouveau champ `repeatResult` :

```js
repeatResult: {
  type: 'pure' | 'cycle' | 'sequence',
  motif: string,        // "a", "ab", "123"
  len_motif: number,
  len_total: number,    // longueur du segment répété
  reste: string | null, // null si tout le pwd est repeat
} | null
```

`null` si :
- Aucun pattern détecté
- Répétition < 3 chars
- `kbPat = true` (déjà capturé par keyboard — pas de double-compte)

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `core/rank/repeat.js` | Nouveau module — `rankRepeat(password, repeatResult)` |
| `core/patterns.js` | Ajout de `detectRepeat()` → `repeatResult` dans le retour |
| `core/rank/index.js` | Import + appel `rankRepeat`, ajout aux candidats |
| `tests/core-non-regression.test.mjs` | Tests unitaires + pipeline |

---

## Interface du module

```js
// core/rank/repeat.js
export function rankRepeat(password, repeatResult) {
  // retourne { rank: number, model: 'repeat' }
  // ou       { rank: null,   model: 'repeat' } si repeatResult null
}
```

---

## Cas limites

| Cas | Comportement |
|---|---|
| Répétition < 3 chars (`aa123`) | `repeatResult = null` → brute/mask |
| Tout en majuscules (`AAAA`) | `uppercaseCost` appliqué sur le motif |
| Séquence inversée (`zyxw`) | Même formule, pas de traitement spécial |
| `kbPat = true` | `repeatResult = null` — pas de double-compte |
| `rank > bruteRank` | Cappé dans `index.js` (invariant existant) |

---

## Tests

### Unitaires `rankRepeat`

| Password | repeatResult | Attendu |
|---|---|---|
| `"aaaa"` | `{ type:'pure', motif:'a', len_motif:1, len_total:4, reste:null }` | rank < brute, model='repeat' |
| `"abababab"` | `{ type:'cycle', motif:'ab', len_motif:2, len_total:8, reste:null }` | rank < brute |
| `"1234"` | `{ type:'sequence', motif:'1234', len_motif:4, len_total:4, reste:null }` | rank < brute |
| `"zyxw"` | `{ type:'sequence', motif:'zyxw', len_motif:4, len_total:4, reste:null }` | rank < brute |
| `"aaa123"` | `{ type:'pure', motif:'a', len_motif:1, len_total:3, reste:'123' }` | rank < brute |
| `"aa123"` | `null` | rank = null |
| `kbPat=true` | `null` | rank = null |

### Pipeline `estimateRank`

| Password | Attendu |
|---|---|
| `"aaaaaaa"` | `best_attack === 'repeat'` |
| `"12341234"` | `best_attack === 'repeat'` |
| `"abcd"` | `best_attack === 'repeat'` ou `'mask'` |
