# Minification & Compression à faire au déploiement

## 📋 Checklist

- [ ] **app.js** → minifier avec esbuild, rester sur le module ES6
  ```bash
  # Depuis le répertoire nunjuck/build
  esbuild app.js --minify --outfile=app.min.js --format=esm
  ```

- [ ] **critical.css** → déjà minifié en critical.min.css (voir esbuild ci-dessus)
  ```bash
  esbuild critical.css --minify --outfile=critical.min.css
  ```

- [ ] **style.min.css** → vérifier qu'il est à jour et minifié

- [ ] **Gzipper tous les fichiers statiques** importants pour compression HTTP :
  ```bash
  # HTML pages
  gzip -9 build/index.html
  gzip -9 build/en/index.html
  gzip -9 build/fr/index.html
  # ... autres langues
  
  # CSS/JS
  gzip -9 build/app.min.js
  gzip -9 build/critical.min.css
  gzip -9 build/style.min.css
  
  # Wordlists
  gzip -9 data/wordlists/*.txt
  # (déjà .gz?)
  ```

- [ ] **Configurer le serveur** pour servir les fichiers .gz quand Accept-Encoding: gzip

- [ ] **S'assurer que les imports ES6** dans app.min.js restent corrects
  ```javascript
  // Vérifier que les imports fonctionnent :
  import{...}from"./core/calc.js"
  ```

## Notes

- **app.js source** : `./build/app.js` (282 KB non-minifié)
- **app.min.js** : sera généré via esbuild (target: 32-40 KB compressé)
- **critical.css source** : `./critical.css` (3.5 KB)
- **critical.min.css** : `./critical.min.css` (2.7 KB)

## Objectif

Réduire la taille des assets au déploiement pour optimiser les temps de chargement et la bande passante.
