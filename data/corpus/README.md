# Corpus de calibration

Ce répertoire contient des corpus utilisés hors runtime pour la calibration et l'analyse.

## `common-zxcvbn.txt`

Corpus fusionné et dédoublonné à partir de :

- `COMMON` dans [`app.js`](../../app.js)
- [`zxcvbn.txt`](../../../zxcvbn.txt)

Règles appliquées :

- `trim()` sur chaque ligne
- suppression des lignes vides
- conservation de la première occurrence
- aucune normalisation de casse

## `common-zxcvbn-pcfg.json`

Stats PCFG dérivées de `common-zxcvbn.txt` et chargées par [`app.js`](../../app.js) en complément de `data/pcfg-calibration.json`.

Le moteur fusionne ce profil avec la calibration principale au démarrage, puis conserve la meilleure estimation par structure observée.

