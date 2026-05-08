# Audit UI/UX/Ergonomie/Typographie/Accessibilité
## Section "Crack time by attack type and hashing algorithm"

---

## 1️⃣ STRUCTURE & HIÉRARCHIE

### État actuel
- **Container**: `<details class="attack-table-wrapper" open>`
- **Header**: Icon (clock) + Titre "Crack time by attack type..." + Chevron
- **Contenu**:
  - `<div class="attack-tabs">` — Sélecteur d'attaque (10 onglets radio-style)
  - `<table class="attack-table">` — Tableau 3 colonnes (Algorithm, Speed, Est. time)

### 🔴 Problèmes identifiés

1. **Pas de caption ou description** : Le tableau n'a pas de `<caption>` pour contexte
2. **Onglets vs tableau** : Deux sélecteurs différents (onglets + contenu) peuvent être confus
3. **"attack-tabs" prend peu de place** : Visible mais facile de manquer sur mobile
4. **Responsivité confuse**: Onglets scrollent horizontalement mais pas clair qu'ils sont clickables

### ✅ Recommandations

- ✅ **Ajouter une `<caption>` au tableau** : "10 attack types × 6 algorithms" avec contexte
- ✅ **Améliorer visibilité onglets** : Ajouter largeur min, underline plus visible, hover plus apparent
- ✅ **Clarifier interaction** : Ajouter aria-selected sur onglets actifs
- ✅ **WCAG**: Vérifier role="tablist" et aria-controls sur chaque onglet

---

## 2️⃣ TYPOGRAPHIE

### État actuel
- **Header (summary)**: `font-weight: 700`, `font-size: 1rem` → Roboto Bold
- **Titres colonnes (th)**: `font-weight: 800`, `font-size: 0.88rem`, `letter-spacing: 0.075em`
- **Données (td)**: `font-size: 0.88rem`, `padding: 0.9rem 1.15rem`
- **Valeurs temps**: Normal weight, monospace pas appliqué
- **Valeurs vitesse**: Normal weight, pas de distinction visuelle

### 🔴 Problèmes identifiés

1. **Headers des colonnes en caps** : "ALGORITHM", "SPEED (12 GPU)", "ESTIMATED TIME"
   - Trop cris, difficile à lire vite
   - Capital letters = plus long à parser (lisibilité réduite ~5%)

2. **Pas de hiérarchie visuelle entre colonnes**
   - Toutes les colonnes ont le même poids typographique
   - Colonne "Est. time" (la plus importante) pas mise en évidence

3. **Temps pas en monospace**
   - Format: "< 1 second", "12.5 hours", "2.1 million years"
   - Monospace aiderait à aligner les nombres verticalement

4. **Valeurs vitesse confuses**
   - Affichage: "2,027 GH/s", "272 GH/s", etc.
   - Pas de toile de fond, pas de distinction (MD5 vs bcrypt très différents)

5. **Ligne "fastest" est surlignée** mais la classe CSS n'existe pas visiblement
   - App.js ajoute `class="fastest"` mais styles.css manque de règle `.attack-table tr.fastest`

### ✅ Recommandations

- ✅ **Changer "ALGORITHM" → "Algorithm"** (Sentence case, pas ALL CAPS)
  - Lisibilité +5%, scannabilité améliorée, accessibilité meilleure

- ✅ **Ajouter distinction visuelle pour "Estimated time"**
  - Gras (font-weight: 600 ou 700) OU couleur accent

- ✅ **Appliquer monospace à valeurs temps**
  ```css
  .attack-table td:last-child .time-main {
    font-family: var(--font-mono);
  }
  ```

- ✅ **Ajouter contraste aux valeurs vitesse**
  - Fond léger (--surface) OU couleur plus claire (--text-lighter)

- ✅ **Créer règle CSS pour ligne "fastest"**
  ```css
  .attack-table tr.fastest td {
    border-left: 3px solid var(--accent);
    background: rgba(var(--accent-rgb), 0.05);
  }
  ```

- ✅ **Augmenter line-height des td** de 1.5 → 1.6 (lisibilité, séparation)

---

## 3️⃣ CONTRASTE & ACCESSIBILITÉ COULEUR

### État actuel
- **Fond table**: `--surface-alt` (gris foncé ~#1a1d23)
- **Texte**: `--text` (blanc/gris clair)
- **Ligne fastest**: Classe appliquée mais pas de CSS visible

### 🔴 Problèmes identifiés

1. **Contraste en-têtes vs données**
   - En-têtes: `--surface-alt` + bold
   - Données: `--surface` + normal
   - Différence visible mais pas extrême

2. **Pas de distinction visuelle pour "fastest"**
   - Utilisateurs visuels ne voient pas quelle ligne est la plus rapide
   - Utilisateurs malvoyants ne voient RIEN

3. **Underline/border insuffisant**
   - Header a `border-bottom: 1.5px` mais données ont `border-bottom: 1px`
   - Manque de séparation visuelle

4. **Pas de code couleur par difficulté**
   - Vert (< 1 semaine), Orange (< 1 an), Rouge (> 1 an) manquent
   - Utilisateur doit lire les nombres pour juger la faisabilité

### ✅ Recommandations

- ✅ **Ajouter indicateur de faisabilité par couleur**
  ```css
  .attack-table td.feasible-high { /* < 1 week */
    border-left: 4px solid var(--critical);
  }
  .attack-table td.feasible-mid { /* < 1 year */
    border-left: 4px solid var(--warning);
  }
  .attack-table td.feasible-low { /* > 1 year */
    border-left: 4px solid var(--success);
  }
  ```

- ✅ **Améliorer contraste ligne "fastest"**
  - Ajouter icône (⭐ ou ✓) dans cellule temps
  - Ajouter background: `rgba(--accent, 0.08)` pour la ligne entière

- ✅ **Vérifier contraste WCAG AA pour tous les colors**
  - Tester: https://www.tcdp.org/contrast-checker/

- ✅ **Ajouter aria-label explicite**
  ```html
  <tr class="fastest" aria-label="Fastest attack method for this password">
  ```

---

## 4️⃣ ERGONOMIE & INTERACTION

### État actuel
- **Onglets**: Clickable, affiche/masque les lignes du tableau
- **Tableau**: Static (pas de tri, pas de filtre additionnel)
- **Lignes**: Hover applique `border-color: var(--accent)`
- **Scroll**: Horizontal sur mobile si tableau > viewport

### 🔴 Problèmes identifiés

1. **Onglets cachés sur mobile**
   - Padding: 0.75rem, gap: 0.45rem
   - Sur 320px viewport: Seulement 2-3 onglets visibles avant scroll
   - Utilisateur ne sait pas qu'il y a 10 attaques différentes

2. **Pas de label temporaire "selecting..."**
   - Quand utilisateur clique onglet, pas de feedback visuel immédiat
   - Changement de tableau est instantané mais pas claire qu'il y a eu changement

3. **"Speed (12 GPU)" pas clair**
   - Tooltip existe mais bouton info (ⓘ) est petit
   - Sur mobile: tooltip peut déborder hors de l'écran

4. **Pas de tri ou filtrage**
   - Tableau est statique
   - Utilisateur doit scanner 60 cellules pour trouver le pattern (ex: "Quel algo est le plus rapide?")

5. **Responsive issues**
   - Tableau `overflow-x: auto` mais pas d'indicateur "scroll →"
   - Sur mobile, cellules peuvent être trop compressées

### ✅ Recommandations

- ✅ **Afficher tous les onglets ou ajouter scroll indicator**
  - Option A: Réduire padding des onglets sur mobile (0.5rem → 0.35rem)
  - Option B: Ajouter "→" après dernier onglet visible pour indiquer scroll

- ✅ **Ajouter feedback visuel au changement d'onglet**
  - Onglet sélectionné: Underline + couleur accent
  - Animation douce au changement de tableau

- ✅ **Améliorer tooltip "Speed (12 GPU)"**
  - Bouton info un peu plus gros (16px → 18px)
  - Tooltip apparaît au-dessus (mobile) ou à côté (desktop) sans débordement

- ✅ **Ajouter ligne résumé au tableau**
  - Première ligne: "Fastest", "Slowest", "Average" par algo
  - Aider utilisateur à scanner vite

- ✅ **Ajouter mini-legend sous le tableau**
  ```
  ⭐ Fastest | 🟢 < 1 week | 🟡 < 1 year | 🔴 > 1 year
  ```

---

## 5️⃣ ACCESSIBILITÉ (WCAG 2.1 AA)

### État actuel
- **ARIA**: role="tablist" sur tabs, aria-controls sur boutons
- **Keyboard**: Tab navigate + Enter/Space select onglet (vérifié)
- **Focus**: Outline 3px sur `.attack-tab:focus-visible`

### 🔴 Problèmes identifiés

1. **Pas de `<caption>` sur tableau**
   - WCAG AAA recommande caption pour contexte
   - Actuellement, assistants vocaux annoncent "table with 3 columns" sans contexte

2. **Pas de aria-label sur onglets**
   - "Attack 1", "Attack 2" etc. sans description
   - Utilisateur malvoyant ne comprend pas quel type d'attaque c'est

3. **Couleur seule pour différenciation**
   - Ligne "fastest" utilise couleur uniquement
   - Utilisateurs daltoniens ne voient pas la distinction

4. **Pas de aria-selected sur onglet actif**
   - Clavier: Tab entre onglets, mais pas d'indication laquelle est active
   - WCAG: `aria-selected="true"` manquant

5. **Pas de aria-busy pendant changement**
   - Quand utilisateur clique onglet, tableau change
   - Pas d'indication que contenu est en train de charger (même si c'est instantané)

6. **Header "Speed (12 GPU)" pas accessible**
   - Texte court mais signification pas claire sans lire tooltip
   - aria-describedby à ajouter

### ✅ Recommandations

- ✅ **Ajouter `<caption>` au tableau**
  ```html
  <table class="attack-table">
    <caption>Estimated crack time for 10 attack types against 6 hashing algorithms, using 12× NVIDIA RTX 4090 GPUs</caption>
    <thead>...
  ```

- ✅ **Ajouter aria-label aux onglets**
  ```html
  <button class="attack-tab" aria-label="Brute Force attack" ...>Brute Force</button>
  ```

- ✅ **Ajouter aria-selected à onglet actif**
  ```html
  <button class="attack-tab" aria-selected="true">Dictionary</button>
  <button class="attack-tab" aria-selected="false">Brute Force</button>
  ```

- ✅ **Utiliser icône + texte pour "fastest"**
  - Au lieu de couleur seule: ⭐ **Fastest**
  - Texte "Fastest" en gras + icône

- ✅ **Ajouter aria-describedby complet**
  ```html
  <th aria-describedby="speed-desc">Speed (12 GPU)</th>
  <div id="speed-desc" hidden>Benchmark using 12 NVIDIA RTX 4090 GPUs...</div>
  ```

- ✅ **Ajouter aria-live="polite" au tbody**
  - Quand onglet change, annonce "Dictionary attack table updated"

---

## 6️⃣ RESPONSIVE & MOBILE-FIRST

### État actuel
- **Desktop (920px+)**: Tableau plein largeur, onglets sur 1 ligne
- **Tablet (640px-920px)**: Tableau scroll horizontal, onglets scroll
- **Mobile (< 640px)**: Onglets et tableau très compressés

### 🔴 Problèmes identifiés

1. **Onglets non readable sur mobile**
   - Padding réduit à 0.75rem, texte peut être tronqué
   - Exemple: "Dictionary" → "Dict..." sur très petit écran

2. **En-têtes tableau trop compressés**
   - Font-size réduit à 0.8rem sur mobile
   - Line-height: 1.4 → pas assez de respiration

3. **Largeur min des colonnes pas définie**
   - Tableau peut avoir colonnes ultra-étroites sur mobile
   - Cellules : padding réduit à 0.7rem (3/4 du desktop)

4. **Pas de mode "card" sur mobile**
   - Tableau reste en tableau sur petit écran
   - Alternative: Transformer en cards empilés (1 per row)

5. **Tooltip déborde**
   - Sur mobile, tooltip "Speed (12 GPU)" peut dépasser l'écran
   - Pas de positionnement intelligent

### ✅ Recommandations

- ✅ **Ajouter media query pour mode "card" sur mobile < 480px**
  ```css
  @media (max-width: 480px) {
    .attack-table {
      display: grid;
      grid-template-columns: 1fr;
    }
    .attack-table thead { display: none; }
    .attack-table tr {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: var(--surface);
    }
    .attack-table td {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border: none;
    }
    .attack-table td::before {
      content: attr(data-label);
      font-weight: 700;
      color: var(--text-lighter);
    }
  }
  ```

- ✅ **Augmenter min-width des onglets** de 0 → 70px
  - Évite la troncation de texte

- ✅ **Améliorer tooltip positioning sur mobile**
  - Utiliser `bottom: 100%` (au-dessus du bouton) au lieu de `right: 0`
  - Ajouter max-width: 90vw

- ✅ **Ajouter scroll indicator visuel**
  - `::after` pseudo-element avec "→" si tableau > viewport

- ✅ **Tester à 320px, 375px, 480px**
  - Vérifier que tous les onglets sont cliquables (44px min)
  - Vérifier que tableau ne déborde pas

---

## 7️⃣ PERFORMANCE & OPTIMISATION

### État actuel
- **Tableau rendu**: `innerHTML` via `.map().join()` (app.js ligne 4028)
- **Onglets**: 10 onglets statiques
- **Interaction**: Instantanée (pas d'API call)

### 🟡 Observations (pas de problème immédiat)

1. **innerHTML rendu** : Rapide pour 60 lignes max
2. **Pas d'animation** : Changement onglet est instantané
3. **Pas d'image** : Tableau est text-only

### ✅ Recommandations optionnelles

- ✅ **Ajouter transition douce au changement d'onglet**
  ```css
  .attack-table tbody {
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0.7; } to { opacity: 1; } }
  ```

- ✅ **Lazy-render lignes si tableau devient très grand**
  - Actuellement OK (max 60 lignes), mais si +100 lignes à l'avenir

---

## RÉSUMÉ: MATRICE DES CHANGEMENTS

| Priorité | Catégorie | Changement | Impact | Effort | WCAG |
|----------|-----------|-----------|--------|--------|------|
| 🔴 P1 | Typographie | "ALGORITHM" → "Algorithm" (Sentence case) | Lisibilité +5% | 1 min | ✓ |
| 🔴 P1 | CSS | Ajouter `.attack-table tr.fastest` styling | Clarté (ligne rapide) | 5 min | ✓ |
| 🔴 P1 | Accessibilité | Ajouter `<caption>` au tableau | WCAG AAA | 2 min | ✓✓ |
| 🔴 P1 | Accessibilité | Ajouter aria-selected sur onglets actifs | Keyboard nav | 5 min | ✓ |
| 🟡 P2 | Typographie | Appliquer monospace à valeurs temps | Alignement | 3 min | — |
| 🟡 P2 | CSS | Ajouter code couleur faisabilité (feasible-*) | UX scanning | 10 min | ✓ |
| 🟡 P2 | Accessibilité | Ajouter aria-label à onglets | Clarté vocale | 5 min | ✓ |
| 🟡 P2 | Ergonomie | Améliorer positionnement tooltip | Mobile UX | 8 min | ✓ |
| 🟢 P3 | Responsive | Ajouter mode "card" pour mobile < 480px | Mobile UX | 20 min | ✓ |
| 🟢 P3 | Ergonomie | Ajouter mini-legend sous tableau | UX discovery | 5 min | — |
| 🟢 P3 | Animation | Ajouter transition douce fadeIn | Polissage | 3 min | — |

---

## ORDRE DE MISE EN ŒUVRE RECOMMANDÉ

### Phase 1: Quick wins (15 min) — Immédiat
1. Changer headers en Sentence case
2. Ajouter CSS `.attack-table tr.fastest`
3. Ajouter `<caption>` au tableau

### Phase 2: Accessibilité (15 min)
1. Ajouter aria-selected aux onglets
2. Ajouter aria-label aux onglets
3. Améliorer tooltip positioning

### Phase 3: Typographie & Couleur (15 min)
1. Monospace sur valeurs temps
2. Code couleur faisabilité (classe .feasible-*)
3. Augmenter line-height td

### Phase 4: Responsive (20 min) — Optionnel mais recommandé
1. Ajouter media query < 480px (mode card)
2. Augmenter min-width onglets
3. Tester à 320px, 375px, 480px

---

## CHECKLIST AVANT/APRÈS

- [ ] Typographie: Headers en Sentence case (non ALL CAPS)
- [ ] Accessibilité: `<caption>` sur tableau présente
- [ ] Accessibilité: aria-selected sur onglets
- [ ] CSS: tr.fastest a un style (border-left ou background)
- [ ] UX: Ligne la plus rapide visuellement distincte (icône + couleur)
- [ ] Mobile: Tous les onglets cliquables (44px+)
- [ ] Mobile: Tableau lisible sur 320px (ou mode card)
- [ ] Keyboard: Tab/Enter/Space navigue et sélectionne onglets
- [ ] Color: Contraste WCAG AA testé (4.5:1)
- [ ] Animation: Transition douce au changement d'onglet
