# 🛠️ Build Guide - Time2Crack avec TensorFlow.js

## Architecture du projet

```
CrackDate/
├── app.js                 # Source principale (avec import TensorFlow.js)
├── index.html             # HTML source (référence app.js)
├── styles.css             # Styles
├── data/                  # Données (wordlists, traductions)
├── scripts/
│   ├── build.mjs          # Script de build (production)
│   └── dev.mjs            # Script de développement (watch mode)
├── package.json           # Dépendances Node.js
├── node_modules/          # Dépendances installées (ignoré par git)
└── dist/                  # Dossier de sortie (ignoré par git)
    ├── app.bundle.js      # Bundle avec TensorFlow.js
    ├── index.html         # HTML modifié (référence app.bundle.js)
    ├── styles.css
    └── data/
```

---

## 🚀 Installation initiale

```bash
# Installer les dépendances
npm install
```

Cela installe :
- `@tensorflow/tfjs` (~500 KB) - Bibliothèque ML
- `esbuild` - Bundler ultra-rapide

---

## 💻 Workflow de développement

### Option 1 : Mode watch (recommandé)

```bash
npm run dev
```

**Ce que ça fait :**
1. Build automatique de `app.js` → `dist/app.bundle.js`
2. Watch des changements (rebuild automatique)
3. Lance un serveur local sur http://localhost:8000
4. Ctrl+C pour arrêter

**Workflow :**
1. Éditez `app.js`, `styles.css`, ou `index.html`
2. Sauvegardez
3. Le build se déclenche automatiquement
4. Rafraîchissez le navigateur

### Option 2 : Build manuel

```bash
# Build
npm run build

# Servir manuellement
cd dist
python3 -m http.server 8000
```

---

## 📦 Build de production

```bash
# Build minifié
NODE_ENV=production npm run build
```

Cela génère :
- `dist/app.bundle.js` minifié (~1.5 MB au lieu de 2.9 MB)
- Optimisations de performance activées

---

## 🔧 Utilisation de TensorFlow.js dans le code

Dans `app.js`, TensorFlow.js est disponible via l'import :

```javascript
import * as tf from '@tensorflow/tfjs';

// Exemple d'utilisation
const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  ]
});
```

---

## 🚢 Déploiement

### GitHub Pages / Netlify / Vercel

```bash
# 1. Build production
NODE_ENV=production npm run build

# 2. Déployer le dossier /dist
```

**Important :** Déployez uniquement le contenu de `/dist`, pas le dossier racine.

### Configuration Netlify/Vercel

Créer `netlify.toml` ou `vercel.json` :

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## 📊 Tailles de fichiers

| Fichier | Développement | Production (minifié) |
|---------|--------------|---------------------|
| `app.bundle.js` | ~2.9 MB | ~1.5 MB |
| `app.bundle.js.map` | ~5.1 MB | Non généré |
| **Total téléchargé (1ère visite)** | ~3.0 MB | ~1.6 MB |

**Note :** Avec gzip (activé par défaut sur la plupart des serveurs) :
- Développement : ~800 KB
- Production : ~500 KB

---

## 🐛 Debugging

### Source Maps

Les source maps sont générés automatiquement :
- Dans Chrome DevTools, vous verrez `app.js` (original) au lieu de `app.bundle.js`
- Vous pouvez mettre des breakpoints directement dans le code source

### Vérifier que TensorFlow.js est chargé

Ouvrez la console du navigateur :

```javascript
console.log(tf.version);
// Devrait afficher : { 'tfjs-core': '4.15.0', ... }
```

---

## 🔄 Revenir à l'ancienne version (sans build)

Si vous voulez temporairement revenir au mode "no build" :

```bash
# Servir directement les fichiers sources (sans TensorFlow.js)
python3 -m http.server 8000
```

**Note :** Cela fonctionnera SAUF pour les fonctionnalités utilisant TensorFlow.js (qui seront désactivées).

---

## ❓ FAQ

### Q : Puis-je modifier directement les fichiers dans `/dist` ?

❌ Non, ils sont écrasés à chaque build. Modifiez toujours les sources à la racine.

### Q : Pourquoi le bundle est si gros (2.9 MB) ?

TensorFlow.js fait ~500 KB, le reste est votre code + les polyfills navigateur. En production minifiée + gzip, c'est ~500 KB total.

### Q : Dois-je commit `/dist` dans git ?

❌ Non, c'est ignoré par `.gitignore`. Le serveur de déploiement rebuild automatiquement.

### Q : Comment mettre à jour TensorFlow.js ?

```bash
npm update @tensorflow/tfjs
npm run build
```

---

## 🎯 Prochaines étapes

Maintenant que le build est configuré, vous pouvez :

1. **Entraîner un modèle ML** pour détecter les patterns humains
2. **Charger le modèle** dans `app.js`
3. **Utiliser l'inférence** pour scorer les mots de passe

Voulez-vous que je vous guide pour créer le modèle ML ?
