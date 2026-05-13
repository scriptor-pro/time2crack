# Plan de correction priorisé

Date: 2026-05-13

## Objectif

Rendre le calcul de temps de craquage:

- unique
- reproductible
- cohérent entre pages
- testable
- plus facile à calibrer

Le but n’est pas de “raffiner un peu” les scores existants. Le but est de supprimer les divergences structurelles qui rendent le modèle instable.

## Ordre de priorité

### P0 - Unifier la source de vérité

#### Action
- Faire de `core/calc.js` le seul moteur de calcul utilisé par l’interface publique.
- Réserver `app.js` aux fonctions d’UI, de rendu et de formatage.

#### Pourquoi
- Aujourd’hui, la page d’accueil et la page générateur ne passent pas par le même chemin de calcul.
- Cela crée des résultats divergents pour un même mot de passe.

#### Fichiers concernés
- `live-time2crack.eu/core/calc.js`
- `live-time2crack.eu/core/patterns.js`
- `live-time2crack.eu/core/rank/*.js`
- `live-time2crack.eu/app.js`
- `live-time2crack.eu/index.html`
- `live-time2crack.eu/generator.html`

#### Critère d’acceptation
- Un même mot de passe donne le même `rank.standard`, `best_attack` et `best_attack_seconds` sur les deux pages.

---

### P1 - Supprimer les écarts de classification

#### Action
- Harmoniser la logique de classification entre `app.js` et `core/`.
- Aligner le traitement de:
  - `_`
  - `-`
  - espace
  - concaténation sans séparateur

#### Pourquoi
- `_` est sous-traité dans le core.
- `-` déclenche parfois un changement de modèle plus fort que prévu.
- La passphrase n’est pas détectée de manière identique partout.

#### Critère d’acceptation
- Les cas `mot1-mot2`, `mot1 mot2`, `mot1_mot2`, `mot1mot2` sont classés selon une règle commune et documentée.

---

### P2 - Rendre le score final stable

#### Action
- Revoir la stratégie `min(...)` entre attaques.
- Si la logique “attaque la plus rapide” est conservée, la distinguer clairement d’un score de difficulté global.
- Ajouter une couche de normalisation pour éviter les inversions absurdes sur les variantes proches.

#### Pourquoi
- Le `min` brut rend le score non monotone.
- Un caractère en moins peut augmenter le temps estimé sans explication claire pour l’utilisateur.

#### Options possibles
1. Conserver `min(...)` comme “attaque gagnante”, mais séparer ce résultat d’un score principal plus stable.
2. Produire un score composite avec hiérarchie explicite entre familles d’attaques.

#### Critère d’acceptation
- Le produit expose clairement ce qui est:
  - le meilleur attaquant
  - le score global
  - la borne brute

---

### P3 - Retirer les corrections a posteriori qui masquent les erreurs

#### Action
- Supprimer ou réduire les caps silencieux qui corrigent les modèles après calcul.
- Si une borne brute est nécessaire, l’exposer explicitement comme garde-fou, pas comme mécanisme de correction invisible.

#### Pourquoi
- Le `capping` masque les régressions de calibration.
- Il empêche d’identifier quels modèles sont réellement faux.

#### Critère d’acceptation
- Les dépassements de borne deviennent visibles en test ou en log, pas uniquement corrigés silencieusement dans le résultat final.

---

### P4 - Corriger les modèles les plus fragiles

#### Action
- Reprendre les sous-modèles dans cet ordre:
  - `combinator`
  - `markov`
  - `hybrid`
  - `mask`

#### Pourquoi
- Ce sont les modèles qui ont le plus d’effets de seuil et de calibrations empilées.
- Ce sont aussi ceux qui partent le plus vite en divergence sur des structures proches.

#### Critère d’acceptation
- Chaque modèle reste dans des bornes de cohérence définies par des tests dédiés.

---

### P5 - Ajouter des tests d’invariance

#### Action
Écrire des tests qui valident:
- même input = même sortie
- mêmes règles sur toutes les pages
- suppression d’un séparateur ne doit pas produire de contradiction arbitraire
- aucun modèle ne doit dépasser la borne brute sans signal explicite

#### Pourquoi
- L’audit montre que les régressions de calibration peuvent passer inaperçues.

#### Critère d’acceptation
- Les cas sensibles `-`, `_`, espace, concaténation et mot+décoration sont couverts.

---

### P6 - Nettoyer la dette documentaire

#### Action
- Mettre à jour les commentaires qui promettent une calibration non appliquée.
- Réécrire les docs pour qu’elles décrivent le moteur réel, pas le moteur imaginé.

#### Pourquoi
- Plusieurs commentaires sont plus ambitieux que le code effectif.
- Cela complique les futures corrections.

#### Critère d’acceptation
- Documentation et code racontent la même chose.

## Plan d’exécution recommandé

### Étape 1
- Basculer l’UI vers `core/calc.js` comme seule source de vérité.

### Étape 2
- Normaliser les classifications de caractères et de séparateurs.

### Étape 3
- Séparer “attaque la plus rapide” et “score global”.

### Étape 4
- Retirer les caps silencieux ou les rendre visibles.

### Étape 5
- Corriger les sous-modèles les plus instables.

### Étape 6
- Ajouter les tests de non-régression.

### Étape 7
- Nettoyer les commentaires et la documentation.

## Risques

- Une unification trop brutale peut modifier fortement les valeurs affichées.
- Corriger la cohérence peut faire “monter” certains temps là où ils étaient artificiellement bas.
- Les changements sur les séparateurs peuvent déplacer le modèle gagnant pour beaucoup de passphrases.

Ce sont des risques normaux si l’objectif est la qualité réelle du modèle.

## Résultat attendu

Après correction:

- un mot de passe a un résultat cohérent sur toute l’application
- les changements de séparateur deviennent prévisibles
- les capteurs de passphrase sont alignés
- les dépassements de borne sont visibles et testés
- les futurs ajustements de calibration sont beaucoup plus sûrs

