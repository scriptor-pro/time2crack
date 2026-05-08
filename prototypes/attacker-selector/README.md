# 🎯 Prototypes Fonctionnels - Sélecteur d'Attaquant

3 prototypes interactifs pour tester différentes approches UX du sélecteur de profil d'attaquant (Expérimenté, Professionnel, État-nation).

## 🚀 Tester les prototypes

Ouvrez directement dans votre navigateur :

```bash
# Depuis le dossier CrackDate
cd prototypes/attacker-selector

# Ouvrir avec votre navigateur préféré
open prototype-1-functional.html  # macOS
xdg-open prototype-1-functional.html  # Linux
start prototype-1-functional.html  # Windows
```

Ou servez-les localement :

```bash
# Option 1: Python
python3 -m http.server 8000
# Puis ouvrir: http://localhost:8000/prototype-1-functional.html

# Option 2: npx
npx http-server
```

---

## 📋 Prototypes disponibles

### 1️⃣ Prototype 1 : Segmented Control (Compact)
**Fichier** : `prototype-1-functional.html`

**Design** : Compact, mobile-first, 3 segments horizontaux
- ✅ Ultra-compact (1 ligne)
- ✅ Changement instantané au clic
- ✅ Tooltip informatif
- ✅ Barre de force du mot de passe
- ✅ Stats détaillées (longueur, charset, entropie, combos)

**UX** : Simple et direct, idéal pour mobile

---

### 2️⃣ Prototype 2 : Pills (Modern & Visual)
**Fichier** : `prototype-2-functional.html`

**Design** : Pills visuelles avec badges, fond gradient violet
- ✅ Très visuel (grandes pills)
- ✅ Badges de vitesse affichés
- ✅ Animations fluides
- ✅ Effet glassmorphism
- ✅ Stats dans panel séparé

**UX** : Moderne et engageant, bon pour desktop et tablette

---

### 3️⃣ Prototype 3 : Tabs (Détaillé & Éducatif)
**Fichier** : `prototype-3-functional.html`

**Design** : Tabs avec contenu détaillé par profil
- ✅ Très éducatif (specs + description)
- ✅ Contexte riche pour chaque profil
- ✅ Résultat intégré dans l'onglet
- ✅ Layout vertical, bon pour scroll
- ✅ Stats intégrées au tab

**UX** : Détaillé, idéal pour utilisateurs qui veulent comprendre

---

## 🧪 Fonctionnalités communes

Tous les prototypes incluent :

✅ **Calcul en temps réel** du temps d'attaque
✅ **Sélection de profil** (Expérimenté, Pro, Nation-state)
✅ **Toggle visibilité** du mot de passe
✅ **Sauvegarde du choix** (localStorage)
✅ **Statistiques détaillées** :
   - Longueur du mot de passe
   - Taille du charset
   - Entropie (bits)
   - Nombre de combinaisons

✅ **Calcul basé sur hash rates officiels RTX 4090** :
   - MD5: 2.027 TH/s
   - SHA-1: 610.3 GH/s
   - SHA-256: 272.2 GH/s
   - NTLM: 3.462 TH/s
   - bcrypt: 2.2 MH/s
   - Argon2id: 800 H/s

---

## 📊 Comparaison des designs

| Critère | Prototype 1 | Prototype 2 | Prototype 3 |
|---------|-------------|-------------|-------------|
| **Compacité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Visuel** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Éducatif** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mobile** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Desktop** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Rapidité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎨 Thèmes visuels

- **Prototype 1** : Dark gradient (bleu/violet foncé), accent orange
- **Prototype 2** : Gradient vibrant (violet/mauve), glassmorphism
- **Prototype 3** : Dark pro (gris/noir), accent rouge

---

## 🧩 Mots de passe de test

Testez avec ces exemples :

```
password          → Faible (< 1 sec)
Password123       → Moyen (~10 min)
P@ssw0rd!2024    → Fort (~2 heures)
Correct-Horse-Battery-Staple  → Très fort (siècles)
aB3$xY9#mK2!qW5@  → Extrême (> univers)
```

---

## 🔧 Modifications faciles

Chaque prototype est **autonome** (HTML + CSS + JS dans un seul fichier).

Pour adapter :
1. Ouvrir le fichier .html dans un éditeur
2. Modifier les couleurs dans la section `<style>`
3. Ajuster les hash rates dans `HASH_RATES` (JavaScript)
4. Recharger le navigateur

---

## 💡 Recommandations

**Pour Time2Crack**, je recommande :

🥇 **Prototype 1** (Segmented Control) si priorité = **mobile-first + simplicité**
🥈 **Prototype 2** (Pills) si priorité = **engagement visuel + modernité**
🥉 **Prototype 3** (Tabs) si priorité = **éducation + contexte détaillé**

---

## 📝 Notes techniques

- Pas de dépendances externes
- Pas de build requis
- Fonctionne offline
- Compatible tous navigateurs modernes
- Responsive mobile/tablet/desktop
- Calculs côté client uniquement

---

**Créé le** : 2026-03-15
**Version** : 1.0.0
**Auteur** : Time2Crack Team
