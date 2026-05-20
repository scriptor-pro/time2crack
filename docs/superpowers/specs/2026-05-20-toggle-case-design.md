# Spec — Toggle-case dans rankHybrid()

*Date : 2026-05-20*

---

## Contexte

Le modèle hybride actuel (`core/rank/hybrid.js`) extrait un mot de base alphabétique, cherche son rang dictionnaire, puis multiplie par un nombre de règles calibré sur la longueur du suffixe et les substitutions leet. Il lowercase tout avant de chercher dans le dict — la casse de la partie alphabétique est ignorée comme facteur de coût.

Résultat : `PASSWORD123` et `password123` reçoivent le même rang hybride, alors qu'un attaquant hashcat doit parcourir des règles de casse supplémentaires pour atteindre `PASSWORD`.

---

## Décision architecturale

Le toggle-case est une **couche multiplicative dans `rankHybrid()`**, pas un module concurrent dans `index.js`.

Justification scientifique : Wheeler (2016, zxcvbn) et Ma et al. (2014) modélisent les variantes de casse comme un facteur multiplicatif appliqué au rang du token dictionnaire. Le toggle est une mutation d'un mot connu, orthogonale au suffixe et au leet — pas une stratégie d'attaque indépendante.

---

## Formule

```
rank = rank_dict(base) × uppercase_cost × rules(suffix_len + leet_subs)
```

Les trois facteurs sont indépendants :
- `rank_dict(base)` — rang du mot de base dans le dictionnaire
- `uppercase_cost` — coût des variantes de casse (nouveau)
- `rules(suffix_len + leet_subs)` — coût des mutations existantes (inchangé)

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

| Mot de passe | base | U | L | uppercase_cost |
|---|---|---|---|---|
| `password123` | `password` | 0 | 8 | 1 |
| `Password123` | `password` | 1 | 7 | 2 (StartCap) |
| `PASSWORD123` | `password` | 8 | 0 | 2 (all-caps) |
| `passworD123` | `password` | 1 | 7 | 2 (EndCap) |
| `pAsSwOrD123` | `password` | 4 | 4 | ∑C(8,1..4) = 8+28+56+70 = 162 |
| `P@ssw0rd!` | `password` (via deleet) | 1 | 7 | 2 (StartCap) |

---

## Extraction de `alpha`

`alpha` doit être extrait **après** déleetification et **hors** suffixe/préfixe non-alphabétique. La fonction `extractBaseWord()` existante retourne déjà le mot de base en lowercase — on a besoin de la **partie correspondante dans le mot de passe original** (avant lowercase) pour compter les majuscules réelles.

Approche : après avoir trouvé `base` (en lowercase), localiser la sous-chaîne correspondante dans `password` original, en tenant compte des substitutions leet.

Implémentation concrète : chercher la position de `base` dans `password.toLowerCase()` (ou dans sa version déleetifiée), puis extraire les caractères originaux à ces positions.

---

## Périmètre d'activation

`uppercase_cost` est calculé uniquement si :
1. `rankDictionary(base)` a retourné un rang non-null (sinon hybrid retourne déjà `null`)
2. La partie alphabétique contient au moins une majuscule (sinon `uppercase_cost = 1`, comportement identique à l'actuel)

Condition 2 garantit la **rétrocompatibilité** : les mots de passe all-lowercase produisent exactement le même rang qu'avant.

---

## Tests à couvrir

| Cas | Attendu |
|---|---|
| `password123` | rank inchangé vs actuel |
| `Password123` | rank × 2 vs actuel |
| `PASSWORD123` | rank × 2 vs actuel |
| `passworD123` | rank × 2 vs actuel |
| `pAsSwOrD123` | rank × 162 vs actuel |
| `P@ssw0rd!` | rank × 2 vs actuel (StartCap après deleet) |
| `p@SSW0RD!` | rank × 2 vs actuel (all-caps après deleet) |
| Mot absent du dict | hybrid retourne null (inchangé) |
| all-lower sans suffixe | hybrid retourne null (déjà géré par dict pur, inchangé) |

---

## Fichiers à modifier

- `core/rank/hybrid.js` — ajout de `uppercaseCost()` + intégration dans `rankHybrid()`

Aucun autre fichier modifié. `index.js` ne change pas.

---

## Sources

- Wheeler, D.L. (2016). *zxcvbn: Low-Budget Password Strength Estimation.* USENIX Security.
- Ma, J. et al. (2014). *A Study of Probabilistic Password Models.* IEEE S&P.
- Hashcat Project (2024). *Toggle Attack with Rules.* [hashcat.net/wiki](https://hashcat.net/wiki/doku.php?id=toggle_attack_with_rules)
