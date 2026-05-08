# Attack Time Display Redesign — Implementation Plan

> **Pour les travailleurs agentiques:** SKILL REQUISE: Utilisez superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour implémenter ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`) pour le suivi.

**Objectif:** Redessiner le composant `.best-attack-card` pour faire du temps d'attaque estimé la vedette visuelle avec une barre d'en-tête bleu et un badge "✓ Estimé" intégré.

**Architecture:** Changements décentralisés sur 3 couches — HTML (structure), CSS (style), JS (logique d'icône). Chaque couche est indépendante mais coordonnée. Les 8 pages de langue doivent être mises à jour de manière synchronisée.

**Stack technique:** HTML5, CSS3 (minified + variables), Vanilla JS (ES6), 8 fichiers de langue

---

## Structure de fichiers

**Fichiers modifiés:**
- `v2/public/en/index.html` — structure HTML English
- `v2/public/fr/index.html` — structure HTML Français
- `v2/public/es/index.html` — structure HTML Español
- `v2/public/pt/index.html` — structure HTML Português
- `v2/public/de/index.html` — structure HTML Deutsch
- `v2/public/it/index.html` — structure HTML Italiano
- `v2/public/pl/index.html` — structure HTML Polski
- `v2/public/nl/index.html` — structure HTML Nederlands
- `v2/public/tr/index.html` — structure HTML Türkçe
- `v2/public/style.min.css` — styles minifiés
- `v2/public/app.min.js` — logique JavaScript minifiée (ou source si accessible)

---

## Task 1: Mettre à jour la structure HTML (EN)

**Fichiers:**
- Modify: `v2/public/en/index.html:203-206`

- [ ] **Étape 1: Lire la structure HTML actuelle**

Ouvre `v2/public/en/index.html` et localise les lignes 203-206 :
```html
<div class="best-attack-card">
  <p class="best-attack-label">⚡ Attaque la plus rapide</p>
  <p class="best-attack-result"><span id="best-attack-name"></span><strong id="best-attack-time"></strong></p>
</div>
```

- [ ] **Étape 2: Remplacer par la nouvelle structure**

```html
<div class="best-attack-card">
  <div class="best-attack-card-header">
    <span class="best-attack-card-badge-icon">✓</span>
    <span class="best-attack-card-badge-text">Estimé</span>
  </div>
  <div class="best-attack-card-content">
    <div class="best-attack-card-icon" id="best-attack-icon">🔐</div>
    <div class="best-attack-card-label">Test your password strength</div>
    <div class="best-attack-card-time" id="best-attack-time">15 days</div>
    <div class="best-attack-card-attack">
      <span id="best-attack-name">Brute Force</span>
      <span class="best-attack-card-divider">•</span>
      <span id="best-attack-gpus">12 GPU</span>
    </div>
  </div>
</div>
```

**Note:** Le label "Test your password strength" doit être en anglais pour la page EN.

- [ ] **Étape 3: Vérifier la modification**

Vérifie que :
- L'ID `best-attack-time` est bien sur le div `.best-attack-card-time` (pas sur `<strong>`)
- L'ID `best-attack-name` est bien sur le premier `<span>` du `.best-attack-card-attack`
- L'ID `best-attack-icon` est nouveau et présent
- Les `best-attack-gpus` ne sont pas présentes dans l'ancienne version — elles sont souvent générées par JS

---

## Task 2: Mettre à jour la structure HTML (FR, ES, PT, DE, IT, PL, NL, TR)

**Fichiers:**
- Modify: `v2/public/fr/index.html:203-206`
- Modify: `v2/public/es/index.html:203-206`
- Modify: `v2/public/pt/index.html:203-206`
- Modify: `v2/public/de/index.html:203-206`
- Modify: `v2/public/it/index.html:203-206`
- Modify: `v2/public/pl/index.html:203-206`
- Modify: `v2/public/nl/index.html:203-206`
- Modify: `v2/public/tr/index.html:203-206`

**Pour chaque fichier de langue:**

- [ ] **Étape 1: Remplacer la structure (FR)**

```html
<div class="best-attack-card">
  <div class="best-attack-card-header">
    <span class="best-attack-card-badge-icon">✓</span>
    <span class="best-attack-card-badge-text">Estimé</span>
  </div>
  <div class="best-attack-card-content">
    <div class="best-attack-card-icon" id="best-attack-icon">🔐</div>
    <div class="best-attack-card-label">Temps estimé</div>
    <div class="best-attack-card-time" id="best-attack-time">15 jours</div>
    <div class="best-attack-card-attack">
      <span id="best-attack-name">Brute Force</span>
      <span class="best-attack-card-divider">•</span>
      <span id="best-attack-gpus">12 GPU</span>
    </div>
  </div>
</div>
```

**La même structure pour tous les fichiers de langue, mais le label `.best-attack-card-label` change :**
- **EN:** "Test your password strength"
- **FR:** "Temps estimé"
- **ES:** "Tiempo estimado"
- **PT:** "Tempo estimado"
- **DE:** "Geschätzter Zeitaufwand"
- **IT:** "Tempo stimato"
- **PL:** "Szacunkowy czas"
- **NL:** "Geschatte tijd"
- **TR:** "Tahmini süre"

- [ ] **Étape 2: Remplacer FR**

Édite `v2/public/fr/index.html` lignes 203-206 avec la structure ci-dessus (label: "Temps estimé")

- [ ] **Étape 3: Remplacer ES**

Édite `v2/public/es/index.html` lignes 203-206 (label: "Tiempo estimado")

- [ ] **Étape 4: Remplacer PT**

Édite `v2/public/pt/index.html` lignes 203-206 (label: "Tempo estimado")

- [ ] **Étape 5: Remplacer DE**

Édite `v2/public/de/index.html` lignes 203-206 (label: "Geschätzter Zeitaufwand")

- [ ] **Étape 6: Remplacer IT**

Édite `v2/public/it/index.html` lignes 203-206 (label: "Tempo stimato")

- [ ] **Étape 7: Remplacer PL**

Édite `v2/public/pl/index.html` lignes 203-206 (label: "Szacunkowy czas")

- [ ] **Étape 8: Remplacer NL**

Édite `v2/public/nl/index.html` lignes 203-206 (label: "Geschatte tijd")

- [ ] **Étape 9: Remplacer TR**

Édite `v2/public/tr/index.html` lignes 203-206 (label: "Tahmini süre")

- [ ] **Étape 10: Commit HTML**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2
git add public/*/index.html
git commit -m "feat(redesign): update best-attack-card HTML structure with badge header"
```

---

## Task 3: Remplacer les styles CSS

**Fichiers:**
- Modify: `v2/public/style.min.css` — remplacer les règles `.best-attack-card*`

**Note:** Le fichier est minifié. Deux approches :
1. **Minifier manuellement** le CSS dans la commit (risqué, peut casser)
2. **Trouver la source** ou utiliser un déminifieur

Cherche d'abord s'il existe une source SCSS ou CSS non-minifiée.

- [ ] **Étape 1: Chercher la source CSS**

```bash
find /home/Baudouin/Documents/Projets/CrackDate/v2 -name "*.scss" -o -name "*.css" | grep -v node_modules | grep -v ".venv"
```

Résultat attendu :
```
/home/Baudouin/Documents/Projets/CrackDate/v2/public/critical.css
/home/Baudouin/Documents/Projets/CrackDate/v2/public/style.min.css
/home/Baudouin/Documents/Projets/CrackDate/v2/public/critical.min.css
```

- [ ] **Étape 2: Vérifier s'il existe un script de build**

```bash
ls -la /home/Baudouin/Documents/Projets/CrackDate/v2/scripts/
```

Cherche un fichier comme `build-css.sh`, `minify.sh`, ou un `Makefile`.

- [ ] **Étape 3: Si aucune source trouvée — minifier en ligne**

Le CSS à ajouter/remplacer est minifié. Utilise un minifieur en ligne (ex: cssminifier.com) ou Node.js :

```bash
node -e "const fs = require('fs'); const input = \`
.best-attack-card{width:100%;max-width:320px;margin:auto 0 var(--space-5);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);border:none}.best-attack-card-header{background:var(--color-blue);color:white;padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:center;gap:var(--space-2)}.best-attack-card-badge-icon{font-size:0.85rem;font-weight:700}.best-attack-card-badge-text{font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em}.best-attack-card-content{background:var(--color-surface);padding:var(--space-5);border:2px solid var(--color-border);border-top:none;text-align:center}.best-attack-card-icon{font-size:2.2rem;margin-bottom:var(--space-3)}.best-attack-card-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);font-weight:600;margin-bottom:var(--space-3)}.best-attack-card-time{font-size:3rem;font-weight:700;font-family:\"IBM Plex Mono\",monospace;color:var(--color-text);line-height:1;letter-spacing:-0.02em;margin-bottom:var(--space-4)}.best-attack-card-attack{font-size:0.9rem;color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;gap:var(--space-2)}.best-attack-card-attack::before{content:'⚡';margin-right:2px}@media (max-width:768px){.best-attack-card{width:calc(100% - 2 * var(--space-4));margin:auto var(--space-4) var(--space-5)}.best-attack-card-icon{font-size:1.8rem}.best-attack-card-time{font-size:2.2rem}}\`; console.log(input);"
```

Le CSS minifié est :
```css
.best-attack-card{width:100%;max-width:320px;margin:auto 0 var(--space-5);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);border:none}.best-attack-card-header{background:var(--color-blue);color:white;padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:center;gap:var(--space-2)}.best-attack-card-badge-icon{font-size:0.85rem;font-weight:700}.best-attack-card-badge-text{font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em}.best-attack-card-content{background:var(--color-surface);padding:var(--space-5);border:2px solid var(--color-border);border-top:none;text-align:center}.best-attack-card-icon{font-size:2.2rem;margin-bottom:var(--space-3)}.best-attack-card-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);font-weight:600;margin-bottom:var(--space-3)}.best-attack-card-time{font-size:3rem;font-weight:700;font-family:"IBM Plex Mono",monospace;color:var(--color-text);line-height:1;letter-spacing:-0.02em;margin-bottom:var(--space-4)}.best-attack-card-attack{font-size:0.9rem;color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;gap:var(--space-2)}.best-attack-card-attack::before{content:'⚡';margin-right:2px}@media (max-width:768px){.best-attack-card{width:calc(100% - 2 * var(--space-4));margin:auto var(--space-4) var(--space-5)}.best-attack-card-icon{font-size:1.8rem}.best-attack-card-time{font-size:2.2rem}}
```

- [ ] **Étape 4: Localiser les anciennes règles dans style.min.css**

Ouvre `v2/public/style.min.css` et cherche (Ctrl+F) :
```
.best-attack-card{background:#f1f5f9
```

Les anciennes règles commencent par `.best-attack-card{background:#f1f5f9;border:2px solid #2563eb...`

- [ ] **Étape 5: Supprimer les anciennes règles**

Supprime tout de `.best-attack-card` jusqu'à `.best-attack-row` (exclus).

Les règles à supprimer contiennent :
- `.best-attack-card`
- `.best-attack-label`
- `.best-attack-result`
- `.best-attack-row` (garde celle-ci, ne la supprime pas)

- [ ] **Étape 6: Insérer les nouvelles règles**

Juste avant `.best-attack-row`, insère le CSS minifié du step 3.

- [ ] **Étape 7: Valider le CSS**

Ouvre une page dans le navigateur et vérifie que le CSS est bien appliqué (pas de syntax error dans console).

- [ ] **Étape 8: Commit CSS**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2
git add public/style.min.css
git commit -m "feat(redesign): update best-attack-card CSS with header badge"
```

---

## Task 4: Mettre à jour la logique JavaScript (sélection d'icône)

**Fichiers:**
- Modify: `v2/public/app.min.js` — ajouter logique `setAttackIcon()`

Le fichier est minifié. Cherche le code existant qui remplit `best-attack-time`.

- [ ] **Étape 1: Localiser le code de remplissage**

```bash
grep -n "best-attack-time\|best-attack-name" /home/Baudouin/Documents/Projets/CrackDate/v2/public/app.min.js
```

Cela te montrera où le contenu est injecté.

- [ ] **Étape 2: Trouver le fichier source JS**

Cherche s'il existe une source non-minifiée :

```bash
find /home/Baudouin/Documents/Projets/CrackDate/v2 -name "app.js" -o -name "main.js" | grep -v node_modules
```

- [ ] **Étape 3: Si source trouvée, éditer la source**

Si `v2/public/app.js` existe (source), édite-le :

Cherche la fonction qui remplit `.best-attack-card`, puis **ajoute** cette logique :

```javascript
// Set the best attack icon based on time
function setAttackIcon(timeInSeconds) {
  const icon = document.getElementById('best-attack-icon');
  if (!icon) return;
  
  if (timeInSeconds < 3600) {
    icon.textContent = '🔓'; // weak
  } else if (timeInSeconds < 2592000) { // 30 days
    icon.textContent = '🔒'; // moderate
  } else {
    icon.textContent = '🔐'; // strong
  }
}
```

Puis, **appelle** cette fonction après avoir rempli `best-attack-time` :

```javascript
// Après : document.getElementById('best-attack-time').textContent = timeString;
setAttackIcon(timeInSeconds); // timeInSeconds doit être fourni ici
```

- [ ] **Étape 4: Si pas de source, éditer directement app.min.js**

Si seul `app.min.js` existe (minifié), tu dois :
1. Chercher le code minifié qui remplit `best-attack-time`
2. Ajouter la logique d'icône minifiée à côté

Le code minifié équivalent est :
```javascript
function setAttackIcon(e){const t=document.getElementById("best-attack-icon");t&&(e<3600?t.textContent="🔓":e<2592e3?t.textContent="🔒":t.textContent="🔐")}
```

- [ ] **Étape 5: Tester dans le navigateur**

Ouvre une page de résultats (rentre un mot de passe, attends le calcul).

Vérifie que :
- ✓ L'icône change (🔓 / 🔒 / 🔐) selon le temps
- ✓ Le temps s'affiche en grand dans `.best-attack-card-time`
- ✓ L'attaque s'affiche sous le temps
- ✓ Pas de console error

- [ ] **Étape 6: Commit JS**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2
git add public/app.min.js  # ou public/app.js si source
git commit -m "feat(redesign): add icon selection logic for attack time"
```

---

## Task 5: Tester la responsive sur mobile

**Pas de fichiers à modifier — tests manuels uniquement**

- [ ] **Étape 1: Ouvrir la page sur un téléphone/émulateur**

Ouvre `http://127.0.0.1:5000/en/index.html` (ou ton port local) sur :
- Chrome DevTools (F12 → Responsive Mode)
- Ou un vrai téléphone sur le réseau local

- [ ] **Étape 2: Tester à 320px (téléphone small)**

- Redimensionne à 320px de large
- Rentre un mot de passe
- Attends le calcul
- Vérifie :
  - ✓ Badge "✓ Estimé" reste visible (pas de dépassement)
  - ✓ Temps s'affiche en 2.2rem (pas 3rem)
  - ✓ Carte a du padding (ne touche pas les bords)
  - ✓ Pas de horizontal scroll

- [ ] **Étape 3: Tester à 375px (téléphone normal)**

- Redimensionne à 375px
- Même vérifications qu'à 320px

- [ ] **Étape 4: Tester à 480px (téléphone large)**

- Redimensionne à 480px
- Même vérifications

- [ ] **Étape 5: Tester à 768px+ (desktop)**

- Redimensionne à 768px+
- Vérifie :
  - ✓ Carte a max-width: 320px
  - ✓ Temps s'affiche en 3rem
  - ✓ Carte est centrée (pas collée à gauche)

- [ ] **Étape 6: Tester avec trois états de mot de passe**

1. **Mot de passe très faible** (ex: "123") — icône 🔓
2. **Mot de passe modéré** (ex: "Password123") — icône 🔒
3. **Mot de passe fort** (ex: "MySecur3P@ssw0rd!LongOne") — icône 🔐

Pour chaque état, vérifie que l'icône change correctement.

- [ ] **Étape 7: Tester sur 2-3 langues**

Bascule la langue (EN, FR, ES) et vérifie :
- ✓ Le label change ("Temps estimé" en FR, "Tiempo estimado" en ES)
- ✓ Badge reste "✓ Estimé" (même pour EN)
- ✓ Layout reste intact

- [ ] **Étape 8: Vérifier la console**

F12 → Console, vérifie qu'il n'y a pas d'erreur JavaScript :
- Pas de "Uncaught" error
- Pas de "TypeError"

---

## Task 6: Commit final et vérification

**Fichiers:**
- All: vérifier que tout est en place

- [ ] **Étape 1: Vérifier le statut git**

```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2
git status
```

Résultat attendu :
```
On branch main
nothing to commit, working tree clean
```

(Tous les commits des tasks précédentes doivent déjà être faits)

- [ ] **Étape 2: Vérifier le log**

```bash
git log --oneline -5
```

Tu devrais voir :
```
feat(redesign): add icon selection logic for attack time
feat(redesign): update best-attack-card CSS with header badge
feat(redesign): update best-attack-card HTML structure with badge header
...
```

- [ ] **Étape 3: Vérifier les fichiers modifiés**

```bash
git diff HEAD~3 HEAD --stat
```

Résultat attendu :
```
 public/en/index.html    | X insertions(+), Y deletions(-)
 public/fr/index.html    | X insertions(+), Y deletions(-)
 ... (7 autres fichiers de langue)
 public/style.min.css    | X insertions(+), Y deletions(-)
 public/app.min.js       | X insertions(+), Y deletions(-)
 10 files changed, ...
```

- [ ] **Étape 4: Tester la build (si applicable)**

Si un build script existe :

```bash
npm run build  # ou yarn build, make build, etc.
```

Vérifie qu'il n'y a pas d'erreur.

- [ ] **Étape 5: Tester une dernière fois dans le navigateur**

Recharge la page (Ctrl+Shift+R hard refresh).

- Rentre un mot de passe
- Attends le calcul
- Vérifie :
  - ✓ Badge bleu "✓ Estimé" en haut
  - ✓ Temps énorme au centre
  - ✓ Icône correcte (🔓 / 🔒 / 🔐)
  - ✓ Pas de console error

✅ **Redesign complete!**

---

## Checklist de vérification finale

- [ ] Tous les 8 fichiers de langue (EN, FR, ES, PT, DE, IT, PL, NL, TR) sont mis à jour
- [ ] CSS remplacé et minifié correctement
- [ ] JS logique d'icône ajoutée et testée
- [ ] Responsive test passée (320px, 375px, 480px, 768px+)
- [ ] Aucune erreur console
- [ ] Tous les commits faits
- [ ] Tests manuels réussis
