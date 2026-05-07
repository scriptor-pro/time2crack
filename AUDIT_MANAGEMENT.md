# Audit de Gestion du Projet Time2Crack v2

**Date:** 7 mai 2026  
**Projet:** Time2Crack - Estimateur de temps de craquage de mots de passe  
**Taille totale:** 2,6 GB

---

## 1. ÉTAT ACTUEL DU PROJET

### 1.1 Structure de Contenu
- **Pages HTML racine:** 6 pages (about, faq, generator, hibp, index, privacy)
- **Pages HTML totales:** 315 pages
- **Langues supportées:** 9 (de, en, es, fr, it, nl, pl, pt, tr)
- **Pages de méthodes:** 152 fichiers (8 méthodes × 9 langues + racine)
- **Sous-domaine time2crack.eu:** 86 fichiers HTML complètement déployés

### 1.2 Données & Calibration
- **Fichiers JSON:** 20 fichiers (configuration, traductions, données)
- **Fichiers Markov:** 10 fichiers (1 par langue + test)
- **Fichiers PCFG:** 9 fichiers (1 par langue + défaut)
- **Wordlists:** 18 fichiers (données linguistiques compressées)

### 1.3 Ressources Front-End
- **JavaScript:** 5 fichiers (app.min.js, config.js, detect-language.js, includes.js, method-lang.js)
- **CSS:** 3 fichiers (critical.css, critical.min.css, style.min.css)
- **Images/Icons:** 11 fichiers (PNG, SVG, ICO pour favicons et logos)

### 1.4 Infrastructure
- ✅ .htaccess (cache Apache configuré)
- ✅ sitemap.xml (151 URLs référencées)
- ✅ CNAME (domaine custom)
- ❌ robots.txt (MANQUANT - problème SEO)

---

## 2. PROBLÈMES IDENTIFIÉS

### 2.1 Critiques 🔴

1. **Sitemap désynchronisé**
   - Contient 151 URLs alors que le site réel contient 86 fichiers
   - Référence des pages `/de/`, `/en/`, etc. qui n'existent pas
   - Manque les 8 pages `/methode/*.html` à la racine
   - **Impact:** Google indexe des URLs fictives

2. **robots.txt manquant**
   - Aucune directive SEO pour crawler les robots
   - **Impact:** Mauvais indexation par Google, Bing, etc.

3. **Pas d'outil d'automatisation**
   - Aucun build system (Webpack, Vite, Gulp)
   - Aucun script automatisé pour générer sitemaps, duplicata de fichiers
   - **Impact:** Maintenance manuelle, propice aux erreurs

### 2.2 Importants 🟡

1. **Duplication massive de contenu**
   - 86 fichiers HTML en time2crack.eu (copies de public/[langue])
   - Aucun DRY (Don't Repeat Yourself)
   - **Impact:** Maintenance 10× plus difficile

2. **Pas de versioning des assets**
   - style.min.css, app.min.js ne contiennent pas de hash (v1.2.3)
   - Cache busting non garanti
   - **Impact:** Les changements CSS/JS peuvent ne pas être appliqués chez les utilisateurs

3. **Configuration fragmentée**
   - Pas de CLAUDE.md (instructions de développement)
   - .htaccess monolithique sans commentaires détaillés
   - config.js minimal
   - **Impact:** Onboarding difficile pour nouveaux contributeurs

4. **Liens internes corrigés mais fragiles**
   - Vient de corriger time2crack.com → time2crack.eu
   - Chemins relatifs en dur (href="methode/bruteforce.html")
   - **Impact:** Risque de rupture lors de restructuration

### 2.3 Mineurs 🟢

1. **Pas de tests automatisés**
   - Pas de vérification des liens
   - Pas de validation HTML
   - Pas de tests de calcul (précision des estimations)

2. **Pas de monitoring**
   - Pas d'alertes sur les erreurs 404
   - Pas de suivi des performances
   - Pas d'analytics avancée (seul Umami basique)

3. **Pas de CI/CD**
   - Aucun pipeline GitHub Actions
   - Validation manuelle avant push
   - Aucun déploiement automatisé

---

## 3. INSTRUMENTS RECOMMANDÉS

### 3.1 Automatisation & Build 🏗️

#### Priority 1: Build System + Task Runner
**Problème:** Génération manuelle de sitemaps, duplication de fichiers

**Solution:** Vite + npm scripts
```json
{
  "scripts": {
    "build": "vite build",
    "generate-sitemap": "node scripts/generate-sitemap.js",
    "generate-robots": "node scripts/generate-robots.js",
    "sync-time2crack-eu": "node scripts/sync-time2crack-eu.js",
    "lint-links": "node scripts/validate-links.js",
    "test": "jest"
  }
}
```

**Bénéfices:**
- Sitemap généré automatiquement depuis la structure réelle
- time2crack.eu synchronisé en 1 commande
- Vérification des liens avant push
- Versioning automatique des assets (app-v1.0.js)

#### Priority 2: Template Engine (EJS ou Nunjucks)
**Problème:** 315 pages HTML avec contenu dupliqué

**Structure proposée:**
```
templates/
├── layouts/
│   ├── base.ejs
│   ├── methode.ejs
├── components/
│   ├── header.ejs
│   ├── nav.ejs
│   ├── footer.ejs
├── pages/
│   ├── index.ejs
│   ├── about.ejs
│   ├── methode-page.ejs
data/
├── nav.json (translations)
├── methods.json
├── languages.json
```

**Build output:** 315 fichiers HTML statiques (SEO-friendly)

**Bénéfices:**
- DRY: 1 seule source de vérité pour chaque page
- Maintenance centralisée
- Changement du header = 1 modification, 315 pages mises à jour
- Traductions gérées via JSON

### 3.2 Gestion de Contenu 📋

#### Priority 1: Script de Validation Interne
```bash
npm run validate
```
Vérifie:
- ✅ Liens internes valides
- ✅ Fichiers HTML bien formés
- ✅ Toutes les ressources CSS/JS référencées existent
- ✅ Tous les fichiers de données JSON valides
- ✅ Sitemap conforme aux fichiers réels

#### Priority 2: Documentation (CLAUDE.md)
Créer un guide pour les contributeurs:
- Structure du projet
- Commandes de build
- Processus de déploiement
- Conventions de nommage
- Comment ajouter une langue

### 3.3 SEO & Monitoring 🔍

#### Priority 1: robots.txt
```
User-agent: *
Allow: /
Allow: /time2crack.eu/

Disallow: /data/
Disallow: /core/

Sitemap: https://time2crack.eu/sitemap.xml
Sitemap: https://time2crack.com/sitemap.xml
```

#### Priority 2: Monitoring (Sentry ou Datadog)
- Erreurs JavaScript côté client
- Erreurs d'API (HIBP)
- Performances (Core Web Vitals)
- Taux de calcul correct/incorrect

#### Priority 3: Google Search Console
- Indexation réelle vs attendue
- Erreurs crawl 404
- Performance par page
- Requêtes de recherche

### 3.4 Déploiement & Versioning 🚀

#### Priority 1: GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Build & Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - validate-links
      - generate-sitemap
      - run-tests
      - build-html
      - deploy-to-hosting
```

#### Priority 2: Versioning des Assets
Ajouter hash automatique:
- `style.min.css` → `style.min.abc123.css`
- `app.min.js` → `app.min.def456.js`
- HTML renvoyé avec hash correct

#### Priority 3: Rollback automatique
En cas de déploiement cassé, revenir à la version précédente en 1 click

### 3.5 Tests & Qualité 🧪

#### Priority 1: Tests Unitaires
- Tests de calcul (cracking time précision)
- Tests de conversion (entropy, keyspace)
- Tests de détection de charset

#### Priority 2: Tests d'Intégration
- Flux complet: password → calcul → affichage résultat
- Génération de password
- Appel HIBP (mock)

#### Priority 3: Tests E2E (Playwright/Cypress)
- Vérification visuelle des pages
- Tests de navigation
- Tests de formulaires

#### Priority 4: Lighthouse CI
- Performance score > 90
- Accessibility score > 90
- Best practices > 90
- SEO score > 90

---

## 4. PLAN D'IMPLÉMENTATION

### Phase 1: Foundation (Week 1-2)
- [ ] Créer package.json avec scripts npm
- [ ] Installer Vite + dépendances
- [ ] Créer CLAUDE.md
- [ ] Script de validation des liens
- [ ] Générateur de robots.txt

### Phase 2: Templating (Week 3-4)
- [ ] Convertir pages en templates EJS
- [ ] Créer fichiers JSON pour traductions
- [ ] Tester build avec Vite
- [ ] Vérifier SEO (Core Web Vitals)

### Phase 3: Automation (Week 5-6)
- [ ] Générateur automatique de sitemap
- [ ] Script sync time2crack.eu
- [ ] GitHub Actions CI/CD
- [ ] Monitoring (Sentry)

### Phase 4: Testing (Week 7-8)
- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration
- [ ] Lighthouse CI
- [ ] Documentation complète

---

## 5. BÉNÉFICES ESTIMÉS

| Instrument | Temps de Maintenance | Risque d'Erreur | Scalabilité |
|---|---|---|---|
| **Actuel (Manuel)** | 8h/mois | 40% | Faible |
| **Avec automatisation** | 1h/mois | 5% | Très Haute |

### ROI:
- **Gain temps:** 7h/mois × 12 = 84h/année
- **Réduction erreurs:** 35% → 95% de fiabilité
- **Nouveau contenu:** Ajouter une langue = 10min au lieu de 4h

---

## 6. STACK TECHNOLOGIQUE RECOMMANDÉ

```
Frontend:
├── Vite (build tool)
├── EJS (templating)
├── Playwright (E2E tests)
└── Jest (unit tests)

DevOps:
├── GitHub Actions (CI/CD)
├── Sentry (error tracking)
└── Lighthouse CI (monitoring)

SEO/Monitoring:
├── robots.txt + sitemap.xml
├── Google Search Console
├── Umami Analytics (existant)
└── Datadog (optional monitoring)

Documentation:
├── CLAUDE.md (dev guide)
├── README.md (updated)
├── Contribution Guide
└── Architecture Diagram
```

---

## 7. CONCLUSION

**Le projet est fonctionnel mais fragile et difficile à maintenir à l'échelle.**

### Niveau d'urgence:
1. 🔴 **CRITIQUE:** robots.txt + Sitemap synchronisé (SEO)
2. 🟡 **IMPORTANT:** Build system + Templating (maintenance)
3. 🟢 **OPTIONNEL:** Tests + Monitoring (qualité)

### Recommandation:
**Implémenter Phase 1 + Phase 2 (4 semaines) pour transformer ce projet en infrastructure scalable et maintenable.**

---

*Audit réalisé par Claude Code - 7 mai 2026*
