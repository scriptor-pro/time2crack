# Spec — Toggle-case : couche multiplicative dans rankDictionary() et rankHybrid()

*Date : 2026-05-20*

---

## Contexte

Le modèle hybride actuel (`core/rank/hybrid.js`) et le modèle dictionnaire (`core/rank/dictionary.js`) lowercasent le mot de passe avant de chercher dans le dict — la casse est ignorée comme facteur de coût.

Résultat : `password123`, `Password123` et `PASSWORD123` reçoivent le même rang. De même, `mayonnaise` et `Mayonnaise` (mots dict purs sans suffixe) reçoivent le même rang dictionnaire, alors qu'un attaquant hashcat doit parcourir des règles de casse supplémentaires pour atteindre `Mayonnaise`.

---

## Décision architecturale

Le toggle-case est une **couche multiplicative appliquée à deux endroits** :

1. **`rankDictionary()`** — pour les mots dict purs sans suffixe (`Mayonnaise`, `MAYONNAISE`)
2. **`rankHybrid()`** — pour les mots dict mutés avec suffixe ou leet (`Password123`, `pAsSwOrD!`)

Pas de module concurrent dans `index.js`. Justification scientifique : Wheeler (2016, zxcvbn) applique `uppercase_variations` au niveau du token dictionnaire lui-même, que ce soit un mot pur ou muté. Le toggle est une propriété du mot, orthogonale au suffixe et au leet.

Pas de double-comptage : `rankHybrid()` retourne `null` quand `base === password.toLowerCase()` (mot pur sans mutation) — donc dict et hybrid ne s'appliquent jamais simultanément sur le même mot.

---

## Formules

**Mot dict pur** (`mayonnaise` → `Mayonnaise`) :
```
rank = rank_dict(password) × uppercase_cost
```

**Mot dict muté** (`password` → `Password123`) :
```
rank = rank_dict(base) × uppercase_cost × rules(suffix_len + leet_subs)
```

Les facteurs sont indépendants :
- `rank_dict` — rang du mot dans le dictionnaire
- `uppercase_cost` — coût des variantes de casse (nouveau)
- `rules(...)` — coût des mutations suffixe/leet (inchangé, hybrid uniquement)

---

## Calcul de `uppercase_cost`

### Entrées

- `alpha` : partie alphabétique du mot de passe, **après** extraction du mot de base et **après** déleetification (pour ne pas compter `@→a` ou `0→o` comme des majuscules)
- `U` : nombre de majuscules dans `alpha`
- `L` : nombre de minuscules dans `alpha`

### Cas spéciaux (court-circuit, O(1))

| Condition | `uppercase_cost` | Rationale |
|---|---|---|
| `U == 0` | 1 | all-lower : déjà couvert par dict, pas de surcoût |
| `L == 0` | 2 | all-caps : l'attaquant teste en 2 essais (lower + upper) |
| Seul `alpha[0]` est majuscule | 2 | StartCap classique, testé en priorité |
| Seul `alpha[-1]` est majuscule | 2 | EndCap, règle hashcat courante |

### Cas général (toggle aléatoire)

```
uppercase_cost = ∑ C(U+L, i)  pour i ∈ [1 .. min(U, L)]
```

Formule identique à `uppercase_variations` dans zxcvbn (Wheeler 2016).

`C(n, k)` calculé itérativement pour éviter les overflows :

```js
function nCk(n, k) {
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}
```

### Exemples

| Mot de passe | contexte | U | L | uppercase_cost |
|---|---|---|---|---|
| `mayonnaise` | dict pur | 0 | 10 | 1 |
| `Mayonnaise` | dict pur | 1 | 9 | 2 (StartCap) |
| `MAYONNAISE` | dict pur | 10 | 0 | 2 (all-caps) |
| `mAYONNAISE` | dict pur | 9 | 1 | 2 (EndCap inversé → all-caps-sauf-1) |
| `password123` | hybrid | 0 | 8 | 1 |
| `Password123` | hybrid | 1 | 7 | 2 (StartCap) |
| `PASSWORD123` | hybrid | 8 | 0 | 2 (all-caps) |
| `passworD123` | hybrid | 1 | 7 | 2 (EndCap) |
| `pAsSwOrD123` | hybrid | 4 | 4 | ∑C(8,1..4) = 8+28+56+70 = 162 |
| `P@ssw0rd!` | hybrid | 1 | 7 | 2 (StartCap après deleet) |

---

## Extraction de `alpha`

`alpha` doit être extrait **après** déleetification et **hors** suffixe/préfixe non-alphabétique. La fonction `extractBaseWord()` existante retourne déjà le mot de base en lowercase — on a besoin de la **partie correspondante dans le mot de passe original** (avant lowercase) pour compter les majuscules réelles.

Approche : après avoir trouvé `base` (en lowercase), localiser la sous-chaîne correspondante dans `password` original, en tenant compte des substitutions leet.

Implémentation concrète : chercher la position de `base` dans `password.toLowerCase()` (ou dans sa version déleetifiée), puis extraire les caractères originaux à ces positions.

---

## Périmètre d'activation

`uppercase_cost` est calculé et multiplié si :
1. Le mot (ou son base word) est trouvé dans le dict (sinon les deux modèles retournent déjà `null`)
2. La partie alphabétique contient au moins une majuscule (sinon `uppercase_cost = 1`, aucun changement)

Condition 2 garantit la **rétrocompatibilité** : les mots de passe all-lowercase produisent exactement le même rang qu'avant.

---

## Tests à couvrir

**rankDictionary() — mots purs :**

| Cas | Attendu |
|---|---|
| `mayonnaise` | rank inchangé vs actuel |
| `Mayonnaise` | rank dict × 2 |
| `MAYONNAISE` | rank dict × 2 |
| `mAyOnNaIsE` | rank dict × ∑C(10,1..5) |
| Mot absent du dict | null (inchangé) |

**rankHybrid() — mots mutés :**

| Cas | Attendu |
|---|---|
| `password123` | rank inchangé vs actuel |
| `Password123` | rank hybrid × 2 |
| `PASSWORD123` | rank hybrid × 2 |
| `passworD123` | rank hybrid × 2 |
| `pAsSwOrD123` | rank hybrid × 162 |
| `P@ssw0rd!` | rank hybrid × 2 (StartCap après deleet) |
| `p@SSW0RD!` | rank hybrid × 2 (all-caps après deleet) |
| Mot absent du dict | null (inchangé) |

---

## Fichiers à modifier

- `core/rank/hybrid.js` — ajout de `uppercaseCost()` + intégration dans `rankHybrid()`
- `core/rank/dictionary.js` — import de `uppercaseCost()` + application sur le rang retourné

`uppercaseCost()` est définie dans `hybrid.js` et exportée pour être réutilisée par `dictionary.js`. `index.js` ne change pas.

---

## Sources

- Wheeler, D.L. (2016). *zxcvbn: Low-Budget Password Strength Estimation.* USENIX Security.
- Ma, J. et al. (2014). *A Study of Probabilistic Password Models.* IEEE S&P.
- Hashcat Project (2024). *Toggle Attack with Rules.* [hashcat.net/wiki](https://hashcat.net/wiki/doku.php?id=toggle_attack_with_rules)
