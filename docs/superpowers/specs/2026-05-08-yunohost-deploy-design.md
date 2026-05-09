# Design : Déploiement Time2Crack sur YunoHost (11ty)

**Date :** 2026-05-08  
**Statut :** Approuvé  

---

## Contexte

Le projet Time2Crack est un site statique généré par Eleventy (11ty) avec Nunjuck. L'objectif est de le déployer sur un VPS YunoHost existant (`manderley.noho.st`) sous le domaine `time2crack.eu`, en faisant tourner Eleventy directement sur le serveur.

---

## Architecture

```
Local                          VPS (YunoHost)
─────────────────────          ──────────────────────────────────
nunjuck/src/          rsync→   /home/yunohost.app/eleventy/src/
  ├── index.njk                  ├── index.njk
  ├── _layouts/                  ├── _layouts/
  ├── _includes/                 ├── _includes/
  ├── pages/                     ├── pages/
  └── _data/                     └── _data/

app.js               rsync→   /home/yunohost.app/eleventy/src/app.js

                                         ↓ (--watch détecte les changements)
                               /home/yunohost.app/eleventy/public/
                                         ↓
                               nginx → time2crack.eu (SSL Let's Encrypt auto)
```

**Points clés :**
- L'app Eleventy YunoHost (officielle, catalogue) tourne en continu via systemd (`eleventy --watch`)
- Tout changement rsyncé dans `src/` déclenche un rebuild automatique
- nginx sert `public/` sous `time2crack.eu` avec SSL géré par YunoHost
- `app.js` est copié dans `src/` et passthrough-copié vers `public/` par Eleventy

---

## Changement de convention : build/ → public/

L'app YunoHost Eleventy génère dans `public/` par convention. Le projet local utilise actuellement `build/`. Ce changement est nécessaire pour aligner local et VPS.

**Modification dans `nunjuck/.eleventy.js` :**
```javascript
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/app.js");
  return {
    dir: {
      input: "src",
      output: "public"  // était "build"
    }
  };
};
```

Mettre à jour toute référence à `build/` dans `package.json` et les scripts locaux.

---

## Script de déploiement

Fichier : `deploy.sh` (à la racine du projet)

```bash
#!/bin/bash
# deploy.sh — Déploie Time2Crack sur YunoHost

VPS_USER="Baudouin"
VPS_HOST="manderley.noho.st"
VPS_SRC="/home/yunohost.app/eleventy/src"

# 1. Build local (vérifie qu'il n'y a pas d'erreur avant de pousser)
cd nunjuck && npm run build && cd ..

# 2. Sync les sources Nunjuck
rsync -avz --delete \
  nunjuck/src/ \
  ${VPS_USER}@${VPS_HOST}:${VPS_SRC}/

# 3. Sync app.js (passthrough copy, vit à la racine)
rsync -avz \
  app.js \
  ${VPS_USER}@${VPS_HOST}:${VPS_SRC}/

echo "✓ Déployé — Eleventy rebuild automatique en cours"
```

**Prérequis :** clé SSH configurée pour le VPS (connexion sans mot de passe).

---

## Assets volumineux

Les wordlists (~32 MB) sont servies depuis **CDN Bunny** — elles ne sont pas rsyncées.

**`model.onnx`** (~600 KB, modèle ONNX pour la prédiction ML) : ⚠️ **décision en attente** — soit rsyncé avec les sources (simple), soit servi depuis CDN Bunny (cohérent avec la stratégie wordlists). À trancher avant le premier déploiement.

**Exclusions rsync :**
```
nunjuck/src/wordlists/
node_modules/
.git/
```

---

## Configuration YunoHost

**Installation de l'app Eleventy :**
1. Panneau admin YunoHost → Applications → Installer → "Eleventy"
2. Paramètres :
   - Domaine : `time2crack.eu`
   - Chemin : `/`
   - Accès public : ✅ oui

**YunoHost gère automatiquement :**
- Service systemd `eleventy --watch`
- nginx pointant vers `public/`
- Certificat Let's Encrypt pour `time2crack.eu`

---

## DNS

Chez le registrar de `time2crack.eu` :
```
A    time2crack.eu    →    <IP du VPS>
A    www              →    <IP du VPS>
```

---

## Ordre des opérations

1. Modifier `output: "public"` dans `.eleventy.js` + mettre à jour les références à `build/`
2. Installer l'app Eleventy sur YunoHost (`time2crack.eu`, accès public)
3. Configurer les DNS chez le registrar
4. Configurer la clé SSH pour `Baudouin@manderley.noho.st`
5. Trancher la question `model.onnx` (rsync ou CDN)
6. Lancer `./deploy.sh` (premier déploiement)
7. Vérifier `time2crack.eu` en navigateur
