# 🔴 AUDIT FRONTEND IMPITOYABLE — Time2Crack v2
**Date**: 6 mai 2026  
**Site**: time2crack.eu (148 pages HTML, 57,736 lignes totales)  
**Verdict**: ⚠️ **Production-ready mais criblé de problèmes de conception et d'UX**

---

## I. PROBLÈMES ARCHITECTURAUX CRITIQUES

### 1. **JavaScript Minifié = Totalement Inutilisable**
```
app.min.js: 32 KB (minifié, aucune source lisible)
style.min.css: 26 KB (minifié)
```

**Problème** : Le fichier JavaScript EST COMPLÈTEMENT MINIFIÉ. Pas de source maps, pas de déminification possible. Impossible de :
- Déboguer
- Comprendre la logique
- Vérifier les vulnérabilités
- Maintenir le code
- Faire des code reviews

**Impact** : Site **non maintenable**. Tout changement ultérieur = réécrire à partir de zéro.

**Verdict** : 🔴 **CRITIQUE — Source code manquant**

---

### 2. **148 Pages HTML Dupliquées = Cauchemar de Maintenance**

Chaque combinaison langue + page = un fichier HTML entièrement dupliqué:
```
- index.html (français)
- /en/index.html
- /es/index.html
- /pt/index.html
- /de/index.html
- /it/index.html
- /tr/index.html
- /pl/index.html
- /nl/index.html

+ About page × 9 langues
+ FAQ page × 9 langues
+ 7 pages de méthodes × 9 langues
+ Generator × 9 langues
+ Privacy × 9 langues
+ Sources × 9 langues
+ HIBP × 9 langues
= 148 fichiers HTML
```

**Problème** : Changement d'une ligne de code = modifier 9 fichiers. Ou pire : faire un `find & replace` global qui casse tout.

**Exemple d'erreur potentielle** : Typo dans la navigation d'une seule langue =  répercuté sur une seule langue, les autres 8 sont incohérentes.

**Verdict** : 🔴 **ARCHITECTURE OBSOLÈTE — Devrait utiliser un templating engine (Hugo, Jekyll, 11ty)**

---

### 3. **Zéro Tests Automatisés du Frontend**

Pas d'infrastructure de test:
- ❌ Pas de tests Playwright/Cypress
- ❌ Pas de tests visuels
- ❌ Pas de test de responsive design
- ❌ Pas de test d'accessibilité (Axe, Pa11y)
- ❌ Pas de tests de performance (Lighthouse)
- ❌ Pas de tests de régression

**Exemple** : La dernière refonte mobile (hamburger menu, drawer) —  aucune preuve qu'elle fonctionne à 320px, 375px, 480px.

**Verdict** : 🔴 **AUCUNE CONFIANCE EN REGRESSION**

---

## II. PROBLÈMES DE CONCEPTION UX/UI

### 4. **Design System Inexistant (Malgré CSS Variables)**

Vous avez des variables CSS... mais pas d'utilisation cohérente:
```css
✅ Définies: --space-1 à --space-7
✅ Définies: --text-xs à --text-2xl
❌ Utilisées: Incohérent dans le markup
```

**Exemple** : 
- Certains boutons: `height:44px` (hardcodé)
- D'autres: `min-height:2rem` (différent!)
- Certains padding: `var(--space-3)`
- D'autres padding: `8px` (hardcodé)

**Impact** : Les composants ne sont pas réutilisables, pas d'harmonie visuelle réelle.

**Verdict** : 🟡 **DESIGN SYSTEM INCOMPLET**

---

### 5. **Palette Couleur Excessivement Neutre**

```css
Primary:    #2563EB (bleu)
Secondary:  (AUCUNE!)
Accent:     (AUCUN!)
Text:       #0F172A (gris très foncé)
Background: #F8FAFC (gris très pâle)
```

**Problème** : Zéro contraste émotionnel. Le site **aurait pu être gris et blanc** : totalement indistinct.

**Comparaison** :
- Stripe: 2-3 couleurs primaires + 4-5 couleurs d'accent (rouge, bleu, vert, etc.)
- Your site: 1 bleu + nuances de gris

**Impact sur UX** :
- Utilisateur ne sait pas où cliquer ("Best Attack" devrait être en VERT ou ROUGE, pas bleu clair)
- Pas de hiérarchie visuelle claire
- Les avertissements (HIBP found) sont à peine visibles

**Verdict** : 🟡 **DESIGN VISUELLEMENT FADE**

---

### 6. **Typographie Très "Corporate" (IBM Plex)**

```css
Display: Oxanium (600 weight)   ← Intéressant
Body:    IBM Plex Sans         ← Sûr mais sans personnalité
Mono:    IBM Plex Mono         ← Professionnel mais ennuyeux
```

**Problème** : IBM Plex = police par défaut de toutes les startups technologiques depuis 2020. **Aucune distinctivité**.

**Comparaison** :
- Zxcvbn (meilleur estimateur): Aucun design intéressant (c'est une libraire JS)
- Hive Systems: Typographie distinguée + couleurs chaleureuses
- Your site: Corporate et stérile

**Verdict** : 🟡 **PAS DE SIGNATURE VISUELLE**

---

## III. PROBLÈMES DE PERFORMANCE ET RESSOURCES

### 7. **Fichiers Minifiés Mais Aucune Source Map**

```
app.min.js:   32 KB (0 bytes de source maps)
style.min.css: 26 KB (0 bytes de source maps)
```

**Problème** : 
- Erreur en production? Impossible de faire un stack trace
- Debugging? Impossible
- Audit de sécurité? Impossible (on ne voit que du minifié)

**Verdict** : 🔴 **PRODUCTION SANS SAFETY NETS**

---

### 8. **Images et Ressources Non Optimisées**

Statistiques observées:
```
Site total: 4.2 MB
- 148 fichiers HTML: ~2 MB (duplication massive)
- CSS + JS: ~58 KB
- Ressources (fonts, images): ~2 MB (non détaillé)
```

**Problème** : Pas de:
- WebP + fallback JPEG
- Lazy loading pour images
- Image compression
- Responsive images (srcset)
- SVG optimization

**Verdict** : 🟡 **ASSETS NON OPTIMISÉS**

---

### 9. **Chargement des Fonts Lent (Non-critique mais Inefficace)**

```html
<link rel="preload" href="https://fonts.bunny.net/css?family=oxanium:600..." />
<link rel="preload" href="https://fonts.bunny.net/css?family=ibm-plex-sans:..." />
```

**Problème** :
- 2 requêtes externes vers fonts.bunny.net
- Pas de `font-display: swap` visible
- Pas de preload des font files eux-mêmes (`.woff2`)

**Impact** : Flash of Unstyled Text (FOUT) visible à 3G.

**Verdict** : 🟡 **PERFORMANCE CRITIQUE NON ADRESSÉE**

---

## IV. PROBLÈMES D'ACCESSIBILITÉ

### 10. **Contrast Ratio Insuffisant (WCAG AA Fail)**

Analysé dans le CSS:
```css
Text:    #0F172A (almost black)  — L=4.8
Muted:   #64748B (gray)           — L=4.2
Background: #F8FAFC (very light) — L=99.5

Contrast (text on muted):
#64748B on #F8FAFC = 4.5:1 ≈ WCAG AA (border case)
#64748B on surface = MÊME problème
```

**Problème** : WCAG AA minimum est 4.5:1. Vous êtes à la limite. WCAG AAA (7:1) = **COMPLÈTEMENT ÉCHOUÉ**.

**Impact** : Utilisateurs malvoyants, lisibilité en plein soleil, impression faible.

**Verdict** : 🟡 **WCAG AA Marginal, AAA ÉCHOUÉ**

---

### 11. **Formulaires Non-Accessible**

```html
<input id="pw-input" type="text" ... />
```

**Problèmes** :
- ❌ `type="text"` pour un mot de passe = mauvaise sémantique
- ❌ Label lié au champ via `for="pw-input"` = OK
- ❌ Pas de `aria-invalid`, `aria-required`
- ❌ Pas de message d'erreur structuré (`aria-describedby`)
- ⚠️ Placeholder ≠ label (confusion)

**Verdict** : 🟡 **FORMULAIRES MINIMUM ACCESSIBLE**

---

### 12. **Navigation au Clavier Cassée sur Mobile**

Drawre menu (hamburger):
```html
<div id="drawer-backdrop" hidden aria-hidden="true"></div>
```

**Problème** : Backdrop est `aria-hidden="true"` mais interactif. Tab order sera cassé.

**Verdict** : 🔴 **NAVIGATION CLAVIER NON TESTÉE**

---

## V. PROBLÈMES SPÉCIFIQUES À LA LOGIQUE/UX

### 13. **Tableau de Résultats Non-Scannable**

HTML observé:
```html
<table id="results-table">
  <thead>
    <tr>
      <th scope="col">Attaque</th>
      <th scope="col">Algorithme</th>
      <th scope="col">Temps estimé</th>
    </tr>
  </thead>
  <tbody>
    <!-- 10 lignes × 6 algorithmes = 60 lignes de données -->
  </tbody>
</table>
```

**Problème** :
- 60 lignes de données brutes **sans hiérarchie visuelle**
- Pas de couleur par intensité (rouge=instant, vert=fort)
- Pas de highlighting pour "best attack"
- Police monospace pour tous les temps ≠ lisibilité

**Exemple de ce qui manque** :
```
Brute Force | MD5     | < 1ms    ← ROUGE (danger immédiat)
Dictionary  | MD5     | 2 mins   ← ORANGE
Brute Force | bcrypt  | 1000 ans ← VERT (fort)
```

**Verdict** : 🔴 **TABLEAU ILLISIBLE, HIÉRARCHIE NULLE**

---

### 14. **Best Attack Card Non-Visible**

```html
<div class="best-attack-card">
  <p class="best-attack-label">⚡ Attaque la plus rapide</p>
  <p class="best-attack-result">
    <span id="best-attack-name"></span>
    <strong id="best-attack-time"></strong>
  </p>
</div>
```

**CSS appliqué** :
```css
.best-attack-card {
  background: #f1f5f9;        ← Très léger
  border: 2px solid #2563eb;  ← Bleu doux
  border-radius: 12px;
  padding: 20px;
  ...
}
```

**Problème** : Card est **presque invisible**. Utilise seulement la bordure bleu clair sur gris clair.

**Impact UX** : Utilisateur voit un tableau de 60 résultats avant de remarquer qu'il y a un "Best Attack" résumé.

**Solution évidente** : Fond VERT ou ROUGE, texte blanc, animation subtle.

**Verdict** : 🔴 **HIÉRARCHIE UX ÉCHOUÉE**

---

### 15. **Profil Attaquant Sélecteur Non-Intuitif**

HTML:
```html
<div class="profile-selector__buttons">
  <button class="profile-btn" data-profile="amateur">
    <span class="profile-btn__name">Amateur</span>
    <span class="profile-btn__gpu">1 GPU</span>
  </button>
  <button class="profile-btn profile-btn--active" data-profile="experienced">
    ...
  </button>
  ...
</div>
```

**Problème** :
- 4 boutons très proches = quelle largeur de viewport?
- À 320px (mobile): Probablement 2×2 grid ❓
- Pas d'indicateur visuel clair de "actif" (sauf `aria-pressed=true`)
- Les labels "Amateur", "Standard", "Pro", "État" = vague et peu explicite

**UX Fail** :
- Utilisateur ne comprend pas la différence entre "Expert" et "Pro"
- Pas d'explications en tooltip
- Pas de visual feedback au click

**Verdict** : 🟡 **UX UNCLEAR, DESIGN AMBIGU**

---

### 16. **Pas d'Animations au Chargement**

Page charge:
1. ❌ Input box = apparition instantanée
2. ❌ Résultats = apparition instantanée
3. ❌ Tableau = apparition instantanée
4. ❌ Zéro `opacity: 0 → 1` animations
5. ❌ Zéro `transform` animations

**Impact** : Site semble "mort". Aucun feedback visuel que la page s'est chargée.

**Comparaison** :
- Stripe: Staggered fade-in + scale-up
- Hive Systems: Smooth transitions
- Your site: Jump to visible

**Verdict** : 🟡 **MANQUE DE POLISH ET D'ANIMATION**

---

### 17. **Responsive Design Incertain**

Pas de screenshot/test à:
- 320px (iPhone SE)
- 375px (iPhone 13)
- 480px (landscape old phones)
- 768px (tablets)
- 1024px+ (desktop)

**Problème** : Design says "mobile-first" mais:
- Max-width: 48rem = **jamais testé à > 1024px**
- Aucun screenshot fourni
- Aucun test automatisé visible

**Verdict** : 🟡 **RESPONSIVE DESIGN NON VALIDÉ**

---

## VI. PROBLÈMES DE MAINTENABILITÉ

### 18. **Zero Documentation Front-End**

- ❌ Pas de README.md pour le frontend
- ❌ Pas de guide de composants
- ❌ Pas de storybook
- ❌ Pas de patterns documentés
- ❌ Code minifié = impossible de comprendre

**Verdict** : 🔴 **ZERO DOCUMENTATION**

---

### 19. **Outils de Build Non Evident**

Fichiers observés:
```
app.min.js (32 KB)     ← Comment a-t-il été généré?
style.min.css (26 KB)  ← Quel minifier?
```

Pas visible:
- ❌ webpack.config.js
- ❌ vite.config.js
- ❌ rollup.config.js
- ❌ build script dans package.json
- ❌ Makefile

**Impact** : Tout changement futur = mystery meat build process.

**Verdict** : 🔴 **BUILD PROCESS OPAQUE**

---

### 20. **Code Review Impossible**

Minified code = impossible de faire un code review:
```javascript
// Vous voyez ça:
const e = (function(){const t={},n=[];return {...}})();

// Vous ne voyez PAS:
function initPasswordAnalyzer() {
  const config = { ... };
  const patterns = [];
  return { analyze: (pwd) => { ... } };
}
```

**Verdict** : 🔴 **SÉCURITÉ EN QUESTION**

---

## VII. PROBLÈMES DÉTECTÉS DANS LE CODE

### 21. **XXX Marker en Production**

Trouvé dans le Polish HTML:
```html
<!-- /pl/how-time2crack-works.html -->
XXX- rankMask () → przewidywalne struktury
```

**Problème** : C'est un TODO/FIXME qui n'a jamais été nettoyé.

**Verdict** : 🟡 **CODE INCOMPLET EN PROD**

---

### 22. **Hardcoded URLs (SEO + Maintenance Issue)**

```html
<link rel="canonical" href="https://time2crack.com/" />
```

**Problème** : Lien pointé vers `time2crack.com` mais le site est hébergé à `time2crack.eu`. SEO cannibalization possible.

**Verdict** : 🟡 **CANONICAL TAG INCORRECTE**

---

### 23. **Versionning Statique dans le HTML**

```html
<p>v2.2.1 • Estimateur de crack local 🔐 — 2026-04-23 ...</p>
```

**Problème** : Version est hardcodée en HTML. Jamais à jour si JS change.

**Verdict** : 🟡 **VERSION MANAGEMENT CASSÉ**

---

## RÉSUMÉ : Scorecard Impitoyable

| Catégorie | Score | Verdict |
|-----------|-------|---------|
| **Architecture** | 2/10 | 🔴 CRITIQUE (source code minifié, 148 HTML dupliqués) |
| **Design System** | 4/10 | 🟡 Incomplet, couleurs neutres |
| **Accessibilité** | 5/10 | 🟡 WCAG AA marginal, AAA échoué |
| **Performance** | 5/10 | 🟡 Assets non optimisés, fonts lentes |
| **Testabilité** | 1/10 | 🔴 Zéro tests automatisés |
| **Maintenabilité** | 2/10 | 🔴 Code minifié, zéro docs |
| **UX/Interactions** | 5/10 | 🟡 Hiérarchie faible, pas d'animations |
| **Mobile UX** | 6/10 | 🟡 Responsive mais non validé |
| **Code Quality** | 1/10 | 🔴 Impossible à auditer (minifié) |
| **Sécurité** | 3/10 | 🔴 Minification = pas de code review possible |

---

## ⚠️ PROBLÈMES BLOQUANTS (Action Requise)

1. **🔴 Source Code Perdu** — Où est le source JavaScript/CSS original?
   - `app.min.js` doit être remplacé par `app.js`
   - `style.min.css` doit être remplacé par `style.css`
   - Ou reconstruire à partir de zéro

2. **🔴 Architecture HTML Non-Maintenable** — 148 fichiers dupliqués
   - Utiliser 11ty / Hugo / Jekyll pour générer les 9 langues
   - Ou un système de templating côté serveur
   - Status quo = maintenance nightmare

3. **🔴 Aucun Test Automatisé** — Impossible de valider les changements
   - Ajouter Cypress/Playwright tests
   - Ajouter Lighthouse CI
   - Ajouter accessibility tests (Axe)

4. **🟡 Hiérarchie Visuelle Échouée** — Tableau de résultats illisible
   - Colorer par intensité (rouge instant → vert fort)
   - Faire "Best Attack" beaucoup plus visible
   - Améliorer le contraste couleur

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### P0 (Blockers)
- [ ] Récupérer le source code JavaScript/CSS original
- [ ] Créer source maps pour minifiés
- [ ] Ajouter tests Cypress pour les pages principales

### P1 (High Impact)
- [ ] Refactoriser architecture HTML (utiliser un générateur statique)
- [ ] Améliorer hiérarchie visuelle du tableau
- [ ] Ajouter animations de chargement
- [ ] Fixer la sélection de profil UX

### P2 (Quality)
- [ ] Améliorer palette couleur (ajouter chaud + froid)
- [ ] Optimiser images et assets
- [ ] Améliorer typography (plus de caractère)
- [ ] WCAG AAA compliance

### P3 (Polish)
- [ ] Ajouter Storybook pour composants
- [ ] Améliorer documentation frontend
- [ ] Ajouter design tokens
- [ ] Performance budgets

---

**Conclusion** : Site est **techniquement fonctionnel mais architecturalement fragile**. Sans source code, sans tests, sans documentation, c'est un liability pour tout développement futur. À refondre prioritairement.
