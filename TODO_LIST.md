# Time2Crack — Todo List

## 📋 SEO Title Optimization (EN COURS)

### ✅ Complétées (30/150 pages)
- [x] **Optimiser 15 titres SEO en Anglais (EN)**
  - Action: Éditer les 15 fichiers HTML EN (index, about, faq, hibp, privacy, sources, how-it-works + 7 attack methods)
  - Ajouter keywords pertinents, maintenir 50-60 caractères
  - Commit avec prefix `[SEO-EN]`
  - Status: ✅ Complété

- [x] **Optimiser 15 titres SEO en Français (FR)**
  - Action: Éditer les 15 fichiers HTML FR (même structure que EN)
  - Ajouter mots-clés français, adapter conjugaison/accents
  - Commit avec prefix `[SEO-FR]`
  - Status: ✅ Complété

### À faire (120/150 pages — 7 langues)
- [ ] **Optimiser 15 titres SEO en Español (ES)**
  - Action: Éditer les 15 fichiers HTML ES (index, about, faq, hibp, privacy, sources, how-time2crack-works + 7 attack methods)
  - Utiliser Google Translate + vérifier contexte/accent espagnol
  - Maintenir structure: [Keyword] — Time2Crack (50-60 chars)
  - Commit avec prefix `[SEO-ES]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Português (PT)**
  - Action: Éditer les 15 fichiers HTML PT avec même structure que ES
  - Utiliser PT-BR (brésilien, plus courant que PT-PT)
  - Adapter mots-clés pour public lusophone
  - Commit avec prefix `[SEO-PT]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Deutsch (DE)**
  - Action: Éditer les 15 fichiers HTML DE
  - Utiliser composés allemands (ex: "Passwort-Sicherheit" au lieu de "Password Security")
  - Vérifier capitalisation allemande (noms toujours majuscules)
  - Commit avec prefix `[SEO-DE]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Italiano (IT)**
  - Action: Éditer les 15 fichiers HTML IT
  - Adapter mots-clés pour marché italien
  - Vérifier accents (à, è, é, ì, ò, ù)
  - Commit avec prefix `[SEO-IT]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Nederlands (NL)**
  - Action: Éditer les 15 fichiers HTML NL
  - Utiliser néerlandais précis (pas de calques français/anglais)
  - Ajouter contexte régional (Pays-Bas/Belgique)
  - Commit avec prefix `[SEO-NL]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Polski (PL)**
  - Action: Éditer les 15 fichiers HTML PL
  - Utiliser déclinaisons polonaises correctes
  - Adapter keywords pour audience polonaise
  - Commit avec prefix `[SEO-PL]`
  - **Durée estimée:** 20-25 mins

- [ ] **Optimiser 15 titres SEO en Türkçe (TR)**
  - Action: Éditer les 15 fichiers HTML TR (dernière langue)
  - Utiliser suffixes turcs appropriés
  - Adapter keywords pour audience turque
  - Commit avec prefix `[SEO-TR]`
  - **Durée estimée:** 20-25 mins

**Durée totale estimée:** 2.5-3 heures pour les 7 langues  
**Résultat final:** 150/150 pages avec titres SEO optimisés

---

## 🎨 Frontend UX Implementation (APRÈS SEO)

- [ ] **Valider les 4 design questions**
  - Lire `HANDOFF_AUDIT_FRONTEND_2026_05_06.md`
  - HIBP display strategy (Alert strip vs. Badge vs. Combo?)
  - Results table hierarchy (Color intensity? Best attack highlight?)
  - Password analysis organization (Critical issues? Checklist? Details?)
  - Best attack display style (Gradient? Border? Animation?)

- [ ] **Créer branche feature** `v2-ux-improvements`
  - Base from `main` (commit `cf240a7`)
  - Isoler UX work du reste

- [ ] **Implémenter par priorité**
  - [ ] **P0 (4h):** HIBP display + Results table styling
    - Update HTML structure for results table
    - Add color-coding CSS for attack intensity
    - Highlight best attack row
    
  - [ ] **P1 (5.5h):** Password analysis + Best attack display
    - Reorganize password analysis section
    - Add critical issues emphasis
    - Implement best attack visual design
    - Gradient text / top border styling
    
  - [ ] **P2 (optionnel):** Micro-interactions & animations
    - Smooth transitions on state changes
    - Entrance animations for results
    - Hover states for interactive elements

- [ ] **Tests avant PR**
  - [ ] Test responsive (320px, 375px, 480px, desktop)
  - [ ] HIBP positive case (known breached password)
  - [ ] HIBP negative case (unknown safe password)
  - [ ] Edge cases (very long password, special chars, etc.)
  - [ ] All language variants display correctly

- [ ] **Git workflow**
  - Commit with `feat(ux):` prefix
  - Reference design docs in commit message
  - Create PR with before/after screenshots
  - Link to `HANDOFF_AUDIT_FRONTEND_2026_05_06.md` in PR description

---

## 📊 Infrastructure & Monitoring (OPTIONNEL)

- [ ] **YunoHost Deployment** (when ready)
  - Review `QUICK_START_DEPLOY.md` (5-command TL;DR)
  - Review `DEPLOYMENT_GUIDE.md` (complete 6-phase guide)
  - SSH into server → rsync deploy → DNS config → SSL setup
  - Domain: manderley.noho.st (or update if changed)

- [ ] **Monitoring Setup**
  - Umami already injected in all HTML pages
  - Verify tracking works post-deploy
  - Setup Umami dashboard alerts (if desired)

- [ ] **German Wordlist Cleanup** (optional, performance boost)
  - Review `wordlist_improvement_strategy.md`
  - Remove duplicates / non-common words from `data/wordlists/de.txt.gz`
  - Re-test Markov + PCFG German accuracy

---

## ⚙️ Avant le Déploiement (JUSTE AVANT)

**Une fois satisfait de la version nunjuck :**

- [ ] **Minifier tous les assets JavaScript & CSS**
  - `app.js` (282 KB) → `app.min.js` via esbuild
    ```bash
    esbuild ./build/app.js --minify --outfile=./build/app.min.js --format=esm
    ```
  - `critical.css` → `critical.min.css` (déjà fait avec esbuild)
  - Vérifier les imports ES6 fonctionnent après minification

- [ ] **Gzipper les assets statiques**
  - Tous fichiers HTML (150 pages)
  - CSS: `app.min.js`, `critical.min.css`, `style.min.css`
  - Wordlists: `data/wordlists/*.txt.gz`
  - Commande exemple:
    ```bash
    gzip -9 build/**/*.html
    gzip -9 build/app.min.js
    gzip -9 build/critical.min.css
    ```

- [ ] **Configurer le serveur**
  - Ajouter headers HTTP pour servir `.gz` quand `Accept-Encoding: gzip`
  - Vérifier YunoHost / Codeberg config pour compression

- [ ] **Vérifier voir `DEPLOYMENT_MINIFY_TODO.md`** pour checklist complète

---

## 📝 Commit Message Format

Pour cohérence, utiliser ces prefixes:
- `[SEO-EN]` / `[SEO-FR]` etc. — SEO title optimization
- `feat(ux):` — UX improvements
- `perf:` — Performance optimizations
- `fix:` — Bug fixes
- `docs:` — Documentation

---

**Mise à jour:** 2026-05-08  
**Responsable:** Claude Code  
**Status actuel:** 
- ✅ EN & FR SEO complete (30/150 pages)
- 📋 7 languages pending (120 pages)
- 🎨 UX prototypes ready for validation
- ⚙️ Minification planned for pre-deployment
