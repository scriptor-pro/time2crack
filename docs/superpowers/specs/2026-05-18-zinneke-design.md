# Zinneke — Design Spec
**Date:** 2026-05-18  
**Statut:** Validé  
**Plateforme:** WebExtension MV3 (Firefox + Chrome, codebase unique)

---

## Objectif

Addon Firefox/Chrome qui force l'affichage en français sur les sites `.be` bilingues (FR/NL) ou trilingues (FR/NL/EN), pour les francophones bruxellois dont le navigateur reçoit par défaut la version NL.

---

## Comportement par défaut

- **Actif sur tous les domaines `.be`** dès l'installation, sans configuration requise
- **Blacklist** pour les exceptions : domaines exclus du forçage FR (gérés au cas par cas)
- Pas de liste blanche à construire — le coverage est immédiat

---

## Nom

**Zinneke** — référence au chien bâtard bruxellois, symbole du multilinguisme et de la mixité bruxelloise.

---

## Architecture

4 modules communicant via `chrome.runtime.sendMessage` :

### 1. Background Service Worker (`background.js`)
- Injecte le header HTTP `Accept-Language: fr-BE,fr;q=0.9,en;q=0.5` sur toutes les requêtes vers `*.be` via l'API `declarativeNetRequest` (MV3)
- Vérifie la blacklist avant d'appliquer la règle
- Écoute les messages du URL Redirector pour déclencher la proposition de blacklist après 3 échecs consécutifs sur un domaine

### 2. URL Redirector (`content.js`)
- S'exécute sur chaque page `.be` non blacklistée
- Détecte les patterns NL dans l'URL : `/nl/`, `/NL/`, `?lang=nl`, `?taal=nl`, `?language=nl`, `lang=nl` dans le path
- Remplace par l'équivalent FR : `/fr/`, `?lang=fr`, etc.
- Vérifie la cible via `fetch()` HEAD request avant de rediriger
  - **200** → redirige
  - **404** → reste sur la page originale (pas de redirection)
- Flag `sessionStorage["zinneke-redirected"]` pour éviter les boucles de redirection
- Après 3 échecs consécutifs sur un domaine → envoie message au background

### 3. Popup UI (`popup/`)
- Affiche le **statut du site courant** :
  - ✓ FR via header Accept-Language
  - ✓ FR via redirection URL
  - ✗ Blacklisté
  - — Hors scope (domaine non `.be`)
- **Toggle rapide** pour blacklister/déblacklister le domaine courant
- **Liste des domaines blacklistés** avec suppression individuelle
- **Switch global ON/OFF** pour désactiver Zinneke entièrement

### 4. Storage Module (`storage.js`)
- Wrapper partagé autour de `chrome.storage.sync`
- Fallback silencieux sur `chrome.storage.local` en mode navigation privée (Firefox)
- Clés : `blacklist` (array de domaines), `enabled` (bool global)

---

## Flux de données

```
Navigation vers site .be
│
├─ Background vérifie blacklist
│   ├─ Blacklisté → aucune action
│   └─ OK → injecte Accept-Language: fr-BE
│
└─ content.js s'exécute
    ├─ Pattern NL dans l'URL ?
    │   ├─ OUI → fetch HEAD sur URL-FR
    │   │   ├─ 200 → redirige vers URL-FR
    │   │   └─ 404 → reste sur URL-NL
    │   └─ NON → rien
    │
    └─ 3 échecs consécutifs sur le domaine ?
        └─ OUI → notification "Blacklister ce site ?"
            ├─ OUI → ajoute à blacklist
            └─ NON → ignore

Clic icône popup
└─ Query tab courant → lit storage → affiche statut
   └─ Toggle blacklist → écrit storage → background met à jour règles
```

---

## Gestion d'erreurs & cas limites

| Cas | Comportement |
|-----|-------------|
| `fetch HEAD` bloqué par CORS/CSP | Tente la redirection directement ; si échec, incrémente compteur |
| Boucle de redirection | Flag `sessionStorage["zinneke-redirected"]` empêche une 2ème redirection |
| Site géo-IP (ignore Accept-Language) | Compteur d'échecs → proposition de blacklist après 3 fois |
| Mode privé Firefox | Fallback `chrome.storage.local` silencieux |
| Firefox < 128 | `declarativeNetRequest` non supporté → affiche message d'incompatibilité |

---

## Compatibilité Firefox / Chrome

- MV3 supporté sur les deux navigateurs
- `declarativeNetRequest` disponible : Firefox 128+ (2024), Chrome 88+
- Seule divergence : Firefox nécessite `browser_specific_settings.gecko.id` dans `manifest.json`
- Un seul manifest avec section `browser_specific_settings` conditionnelle

---

## Structure des fichiers

```
zinneke/
├── manifest.json
├── background.js
├── content.js
├── storage.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── tests/
    ├── unit/
    │   ├── patterns.test.js
    │   ├── storage.test.js
    │   └── failures.test.js
    └── integration/
        └── redirect.test.js
```

**Dépendances runtime :** zéro (vanilla JS)  
**Dépendances dev :** Vitest (tests unitaires), Playwright + web-ext (tests d'intégration)

---

## Stratégie de tests

### Tests unitaires (Vitest)
- Pattern matching : 15+ URLs NL → transformation FR attendue
- Storage module : lecture/écriture blacklist, fallback mode privé
- Logique compteur d'échecs : 3 échecs → `true` retourné

### Tests d'intégration (Playwright + web-ext)
- Chargement de l'addon en mode dev sur Firefox et Chrome
- Navigation vers `.be` NL → vérifier redirection FR
- Navigation vers domaine blacklisté → vérifier absence de redirection
- Toggle blacklist depuis popup → vérifier effet immédiat

### Tests manuels (checklist pré-publication)
Sites cibles : `nationale-loterij.be`, `brussels.be`, `belgium.be`, `vdab.be`, `nbb.be`  
Cas spéciaux : mode privé Firefox et Chrome, sync blacklist entre deux profils

---

## Publication

- **Firefox Add-ons (AMO)** — review Mozilla, distribution officielle
- **Chrome Web Store** — review Google, distribution officielle
- **Codeberg** — open source, installation manuelle possible (`.xpi` / `.crx`)
