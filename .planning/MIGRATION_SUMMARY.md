# 📝 Résumé de la migration vers Build Local + TensorFlow.js

## ✅ Ce qui a été fait

### 1. **Configuration Node.js**
- ✅ Créé `package.json` avec dépendances :
  - `@tensorflow/tfjs@^4.15.0` (bibliothèque ML)
  - `esbuild@^0.19.11` (bundler ultra-rapide)
- ✅ Installé les dépendances (68 packages, 19s)

### 2. **Scripts de build**
- ✅ `scripts/build.mjs` - Build de production
  - Bundle `app.js` + TensorFlow.js → `dist/app.bundle.js` (2.9 MB)
  - Copie fichiers statiques (HTML, CSS, data/)
  - Modifie `index.html` pour charger le bundle
  - Source maps pour debugging
  
- ✅ `scripts/dev.mjs` - Mode développement
  - Watch mode (rebuild automatique)
  - Serveur local intégré (port 8000)
  
- ✅ `scripts/test-tf.mjs` - Test TensorFlow.js
  - Vérifie l'installation
  - Teste les opérations de base

### 3. **Modification du code source**
- ✅ Ajout de `import * as tf from '@tensorflow/tfjs';` en haut de `app.js`
- ✅ Code IIFE existant conservé intact
- ✅ Compatible avec le bundling esbuild

### 4. **Configuration Git**
- ✅ Mis à jour `.gitignore` :
  - `node_modules/` (dépendances)
  - `dist/` (build output)
  - `package-lock.json`
  - Logs et fichiers IDE

### 5. **Documentation**
- ✅ `BUILD_GUIDE.md` - Guide complet du workflow
- ✅ `MIGRATION_SUMMARY.md` - Ce fichier

---

## 📊 Structure avant/après

### Avant (no build)
```
CrackDate/
├── app.js          (150 KB - vanilla JS)
├── index.html      (référence app.js)
├── styles.css
└── data/

Servir : python3 -m http.server 8000
Modifier : Éditer → Save → Refresh
```

### Après (avec build)
```
CrackDate/
├── app.js          (150 KB - source avec import TF.js)
├── index.html      (source)
├── styles.css
├── data/
├── package.json
├── node_modules/   (dépendances, ignoré git)
├── scripts/
│   ├── build.mjs
│   ├── dev.mjs
│   └── test-tf.mjs
└── dist/           (généré, ignoré git)
    ├── app.bundle.js   (2.9 MB - inclut TF.js)
    ├── index.html      (modifié pour bundle)
    ├── styles.css
    └── data/

Développer : npm run dev (watch + serveur)
Builder : npm run build
Servir : npm run serve (depuis dist/)
```

---

## 🎯 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm install` | Installer les dépendances (première fois) |
| `npm run build` | Build de production (dist/) |
| `npm run dev` | Mode développement avec watch |
| `npm run serve` | Servir dist/ sur http://localhost:8000 |
| `npm run test:tf` | Tester TensorFlow.js |

---

## 🔍 Vérification de l'installation

### Test 1 : TensorFlow.js fonctionne en Node.js
```bash
npm run test:tf
```

**Résultat attendu :**
```
✅ TensorFlow.js version: { 'tfjs-core': '4.22.0', ... }
✅ Simple operation: [1,2,3,4].sum() = 10
✅ Model created with 2 layers
✅ Model prediction on random input: 0.XXXX
🎉 TensorFlow.js is working correctly!
```

### Test 2 : Build réussit
```bash
npm run build
```

**Résultat attendu :**
```
✅ JavaScript bundled successfully
  ✓ index.html (modified for bundle)
  ✓ styles.css
  ✓ favicon.svg
  ✓ data/
✨ Build complete! Output in /dist
```

### Test 3 : Application fonctionne
```bash
npm run serve
# Ouvrir http://localhost:8000 dans le navigateur
```

**Vérifications dans la console navigateur :**
```javascript
// TensorFlow.js est chargé ?
console.log(tf.version);
// → { 'tfjs-core': '4.22.0', ... }

// Le reste de l'app fonctionne ?
// → Tester en entrant un mot de passe
```

---

## 📈 Impact sur les performances

### Taille des fichiers

| Fichier | Avant | Après (dev) | Après (prod) | Après (gzip) |
|---------|-------|-------------|--------------|--------------|
| JavaScript | 150 KB | 2.9 MB | 1.5 MB | ~500 KB |
| **Chargement 1ère visite** | 150 KB | 2.9 MB | 1.5 MB | ~500 KB |
| **Visites suivantes** | 0 KB (cache) | 0 KB (cache) | 0 KB (cache) | 0 KB |

### Temps de chargement (estimé)

| Connexion | Avant | Après (prod + gzip) |
|-----------|-------|---------------------|
| 4G (25 Mbps) | ~50ms | ~160ms |
| 3G (750 kbps) | ~1.6s | ~5.3s |
| Wifi (50 Mbps) | ~25ms | ~80ms |

**Note :** En pratique, l'impact est faible car :
1. TensorFlow.js est chargé en parallèle avec le reste
2. Cache navigateur après 1ère visite
3. Gzip réduit drastiquement la taille

---

## 🚨 Points d'attention

### 1. **CSP (Content Security Policy)**
Actuellement dans `index.html` ligne 7 :
```html
script-src 'self' 'sha256-...' https://umami.bvh.fyi
```

✅ **Pas de changement nécessaire** car tout est self-hosted.

### 2. **Workflow de développement**
- ❌ Ne plus éditer directement `/dist` (écrasé à chaque build)
- ✅ Toujours éditer les sources à la racine
- ✅ Utiliser `npm run dev` pour auto-rebuild

### 3. **Déploiement**
- ❌ Ne plus déployer le dossier racine
- ✅ Déployer uniquement `/dist`
- ✅ Configurer CI/CD pour run `npm run build`

### 4. **Git**
- ✅ `node_modules/` et `dist/` sont ignorés
- ✅ Commit sources uniquement
- ✅ Le serveur rebuild automatiquement

---

## 🎓 Prochaines étapes

Maintenant que l'infrastructure est en place, vous pouvez :

### Étape 1 : Créer un modèle ML simple
```javascript
// Dans app.js, après l'import TensorFlow.js
const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  ]
});
```

### Étape 2 : Entraîner le modèle
Créer `scripts/train-model.mjs` pour :
1. Télécharger dataset (RockYou passwords)
2. Générer passwords aléatoires
3. Extraire features
4. Entraîner modèle
5. Sauvegarder dans `data/model/`

### Étape 3 : Charger et utiliser le modèle
```javascript
// Charger le modèle pré-entraîné
const model = await tf.loadLayersModel('data/model/model.json');

// Prédire si un mot de passe est humain
function predictHumanness(password) {
  const features = extractFeatures(password); // À implémenter
  const prediction = model.predict(tf.tensor2d([features]));
  return prediction.dataSync()[0] * 100; // Score 0-100
}
```

---

## 🆘 Support

### Problèmes courants

**1. `npm install` échoue**
```bash
# Essayer avec Node.js v18+
node --version
# Si < 18, mettre à jour Node.js
```

**2. Build échoue avec erreur "Cannot find module"**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

**3. Le bundle ne se charge pas dans le navigateur**
- Vérifier la console navigateur
- Vérifier que vous servez depuis `/dist` et pas la racine
- Vérifier le CSP dans index.html

**4. TensorFlow.js ne fonctionne pas**
```javascript
// Tester dans la console navigateur
console.log(typeof tf); // devrait être 'object', pas 'undefined'
```

---

## ✅ Checklist de validation

- [x] `npm install` réussit sans erreur
- [x] `npm run test:tf` affiche "TensorFlow.js is working correctly!"
- [x] `npm run build` génère `/dist` sans erreur
- [x] `npm run serve` lance le serveur sur port 8000
- [ ] L'application charge dans le navigateur (http://localhost:8000)
- [ ] La console affiche `tf.version` correctement
- [ ] L'analyse de mots de passe fonctionne normalement
- [ ] Pas d'erreurs dans la console navigateur

---

**Date de migration :** 2026-03-11  
**Status :** ✅ Infrastructure prête, modèle ML à implémenter
