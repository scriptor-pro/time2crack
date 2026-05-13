# Audit du modèle de calcul de temps de craquage

Date: 2026-05-13

## Résumé exécutif

Le moteur de calcul de temps de craquage de Time2Crack n’est pas un modèle unique. Il existe au moins deux implémentations actives:

- le moteur modulaire dans `core/`
- le moteur monolithique dans `app.js` / `app.min.js`

Cette double source de vérité produit des résultats divergents pour un même mot de passe. Le problème n’est pas cosmétique: il touche la stabilité du score, la reproductibilité, et la crédibilité de l’outil.

En plus de cette divergence, plusieurs sous-modèles sont mal calibrés ou masqués par des garde-fous a posteriori:

- le résultat final est obtenu par `min(...)` entre attaques hétérogènes, ce qui rend le score non monotone
- plusieurs modèles dépassent la borne brute force, puis sont “cappés” après coup
- la prise en compte des séparateurs et des passphrases n’est pas cohérente entre les couches
- `_` est traité différemment selon le moteur

Conclusion: le modèle est exploitable comme estimateur heuristique, mais pas comme système de mesure fiable tant que ces divergences ne sont pas supprimées.

## Constats critiques

### 1. Deux moteurs différents calculent le même résultat

La page d’accueil charge `app.min.js`, alors que la page générateur utilise `core/calc.js` directement.

- [index.html](live-time2crack.eu/index.html#L182-L183)
- [generator.html](live-time2crack.eu/generator.html#L619-L621)

Conséquence:

- un mot de passe peut recevoir deux temps différents selon la page consultée
- la validation produit devient difficile
- les corrections de calibration doivent être dupliquées ou risquent d’être appliquées à un seul moteur

### 2. Le score final n’est pas monotone

Le moteur core prend le minimum entre plusieurs attaques:

- [core/rank/index.js](live-time2crack.eu/core/rank/index.js#L114-L124)

Ce choix implique qu’un changement mineur dans la structure d’un mot de passe peut basculer l’attaque gagnante vers un autre modèle, parfois plus faible, parfois plus fort. Cela explique les effets “paradoxaux” du type:

- ajouter un séparateur rend plus facile
- retirer un séparateur peut augmenter le temps estimé

Ce n’est pas un bug isolé. C’est une conséquence structurelle du design.

### 3. Les sous-modèles dépassent régulièrement la borne brute force

Le core compense en “cappant” tous les rangs à la borne brute:

- [core/rank/index.js](live-time2crack.eu/core/rank/index.js#L84-L105)

Le problème:

- les résultats bruts ne sont plus visibles
- les erreurs de calibration sont masquées
- l’API expose des données déjà mutées

En audit, c’est mauvais signe. Un modèle qui doit être corrigé à la sortie indique qu’il n’est pas stable à l’intérieur.

### 4. `_` n’est pas traité de façon cohérente

Dans `core/charset.js`, le caractère `_` ne contribue pas au symbole:

- [core/charset.js](live-time2crack.eu/core/charset.js#L25-L31)

J’ai vérifié localement:

- `abc_def` -> charset `26`
- `abc-def` -> charset `58`

Cela signifie que `_` est absorbé comme caractère “de mot” côté core, alors qu’il agit comme séparateur visible dans le moteur public.

Effet:

- sous-estimation de l’espace de recherche pour certains motifs
- divergence entre moteurs
- incohérence sur un séparateur courant dans les passphrases et pseudo-identifiants

### 5. La calibration combinator annonce plus qu’elle n’applique

Dans `core/rank/combinator.js`, `sepRank` est calculé mais n’entre pas dans la formule finale.

- [core/rank/combinator.js](live-time2crack.eu/core/rank/combinator.js#L47-L51)
- [core/rank/combinator.js](live-time2crack.eu/core/rank/combinator.js#L217-L227)

Conséquence:

- l’intention de pondérer les séparateurs existe
- l’implémentation finale ne l’exploite pas réellement

La documentation interne et le code ne racontent pas exactement la même histoire.

### 6. Les modèles de passphrase sont hétérogènes entre core et app

Dans le core:

- détection passphrase via tiret / espace / concaténation dictionnaire
- [core/patterns.js](live-time2crack.eu/core/patterns.js#L270-L288)

Dans `app.js`:

- détection plus conservative
- séparateurs traités différemment
- heuristiques additionnelles
- [app.js](live-time2crack.eu/app.js#L5401-L5428)
- [app.js](live-time2crack.eu/app.js#L5559-L5560)

Le même mot de passe peut donc être classé différemment selon le moteur, surtout pour les variantes `mot1-mot2`, `mot1 mot2`, `mot1mot2`.

## Analyse par sous-modèle

### Brute force

Le modèle est simple et conceptuellement sain:

- [core/rank/brute.js](live-time2crack.eu/core/rank/brute.js)

Mais il sert de bornage de sécurité à des modèles plus fragiles. Quand le reste du système est instable, brute force devient un filet de sécurité, pas un point d’ancrage fort.

### Charset

Le core applique une approche par catégories:

- lowercase
- uppercase
- digits
- symbols

Cette approche est défendable en soi:

- [core/charset.js](live-time2crack.eu/core/charset.js#L13-L31)

Mais elle n’est pas alignée avec la logique plus riche du moteur public, qui distingue davantage les cas concrets.

### Markov

Le modèle Markov du core est épuré:

- [core/rank/markov.js](live-time2crack.eu/core/rank/markov.js#L1-L120)

Points faibles:

- seuil fixe de rejet hors distribution
- probabilité locale seulement
- pas de contrôle fin des biais structurels au niveau global

Le moteur public a, lui, une calibration plus riche et plus complexe, ce qui accentue la divergence entre les deux implémentations.

### Hybrid

Le modèle hybride core est lisible, mais il repose sur une extraction de base et une table de règles très simplifiée:

- [core/rank/hybrid.js](live-time2crack.eu/core/rank/hybrid.js#L1-L133)

Le risque principal est la surinterprétation:

- un mot de passe peut être pris pour une mutation alors qu’il est juste structurellement proche d’un mot connu

### Combinator

Le combinator core est le sous-modèle le plus problématique:

- commentaires très ambitieux
- calibrations multiples
- seuils empiriques évoqués
- mais exécution finale simplifiée et parfois incohérente

La formule finale est un produit de rangs et de facteurs de structure:

- [core/rank/combinator.js](live-time2crack.eu/core/rank/combinator.js#L134-L227)

Risque:

- surévaluation de certaines passphrases
- sous-évaluation d’autres
- instabilité autour des séparateurs

### Mask

Le modèle mask du core est mieux structuré que plusieurs autres, mais il repose sur une table calibrée par langue et sur des extrapolations qui peuvent rapidement devenir fragiles:

- [core/rank/mask.js](live-time2crack.eu/core/rank/mask.js#L1-L220)

Le moteur public a encore une logique différente autour des structures et de la réduction du keyspace.

## Symptômes observés

Lors de tests locaux sur des passphrases composées de mots connus, j’ai observé:

- des warnings `RANK CAP` répétés
- des écarts de rang entre modèles
- des inversions de classement selon la présence ou l’absence de `-`
- des différences de score entre variantes pourtant très proches

Ces symptômes confirment que le problème est systémique, pas local.

## Causes racines

### Cause racine 1
Absence de source de vérité unique pour le calcul.

### Cause racine 2
Conflation entre:

- estimation probabiliste
- heuristique UX
- sécurité de borne brute

### Cause racine 3
Calibration a posteriori au lieu d’une calibration interne cohérente.

### Cause racine 4
Signal structurel trop fort pour des séparateurs simples comme `-`, sans normalisation stable entre moteurs.

## Recommandations

### Priorité 1
Faire du moteur `core/` la seule source de vérité pour les scores de crack time.

### Priorité 2
Aligner `app.js` sur `core/calc.js` au lieu d’avoir deux implémentations concurrentes.

### Priorité 3
Supprimer les divergences de classification entre:

- `_`
- `-`
- espace
- concaténation sans séparateur

### Priorité 4
Remplacer le `min(...)` brut entre attaques par un modèle hiérarchisé plus stable, ou au moins documenter qu’il s’agit d’une enveloppe d’attaques et non d’un score monotone.

### Priorité 5
Rendre explicites les cappers brute force:

- soit en les supprimant
- soit en les exposant dans le résultat
- soit en les remplaçant par des garde-fous de calibration plus propres

### Priorité 6
Ajouter des tests d’invariance:

- un caractère retiré ne doit pas produire un score contradictoire sans raison structurelle explicite
- un même input doit produire le même résultat sur les deux pages
- les modèles ne doivent pas dépasser la borne brute sans alerte testée

## Conclusion

Le système actuel n’est pas un “mauvais estimateur” isolé. C’est un ensemble de modèles partiellement cohérents, partiellement redondants, et partiellement masqués.

Pour une démo, il fonctionne.
Pour un outil crédible d’estimation, il faut:

- unifier
- simplifier
- tester
- et retirer les corrections a posteriori qui cachent les écarts de calibration

