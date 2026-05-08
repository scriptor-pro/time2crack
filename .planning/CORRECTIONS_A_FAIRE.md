# Plan d'Action — Corrections Audit (2026-03-20)

## Vue d'ensemble
6 problèmes identifiés | Effort total: ~45 min | Sévérité: 3 CRITIQUES, 3 IMPORTANTS

---

## 🔴 CRITIQUES (A faire immédiatement)

### C1. Crash sur mots de passe avec dates
**Fichier**: `app.js`
**Lignes**: 2847 (appel) + 2713-2727 (définition)
**Problème**: `null.match()` → TypeError

```javascript
// LIGNE 2847 - BUGUÉ
function addMaskAttacks(rows, full, len, cs, struct, kbPat, seq, weak, dt) {
  const dateInfo = dt ? detectDateAndReduce(null, len, cs) : { hasDate: false, reduction: 1.0 };
  // ...
}

// LIGNE 2727 - Plante ici
function detectDateAndReduce(pw, len, cs) {
  // ...
  const yearMatch = pw.match(/(?:19|20)\d{2}/); // pw est null → TypeError
```

**Test reproduction**:
```javascript
// Dans la console navigateur:
analyzePassword("Password2024!");
// → TypeError: Cannot read properties of null (reading 'match')
```

**Fix - Option 1** (recommandée): Ajouter `pw` comme paramètre à `addMaskAttacks`
```javascript
// Ligne 2846 - modifier la signature
function addMaskAttacks(rows, full, len, cs, struct, kbPat, seq, weak, dt, pw) {
  const dateInfo = dt ? detectDateAndReduce(pw, len, cs) : { hasDate: false, reduction: 1.0 };
  // ...
}

// Ligne ~3135 - mettre à jour l'appel (trouver avec grep)
// addMaskAttacks(rows, full, len, cs, struct, kbPat, seq, weak, hasDate(pw));
// → addMaskAttacks(rows, full, len, cs, struct, kbPat, seq, weak, hasDate(pw), pw);
```

**Commande de recherche**:
```bash
grep -n "addMaskAttacks(" app.js
```

**Temps estimé**: 10 min

---

### C2. Variable CSS `--radius-md` non définie
**Fichier**: `styles.css`
**Ligne**: 766 (usage), 65-66 (où ajouter)

**Problème**: `.character-analysis-wrapper` utilise `var(--radius-md)` qui n'existe pas

```css
/* LIGNES 65-66 - Ajouter ici */
:root {
  --radius: 12px;
  --radius-sm: 8px;
  --radius-md: 10px;  /* ← AJOUTER CETTE LIGNE */
}

/* LIGNE 766 - Utilise la variable */
.character-analysis-wrapper {
  border-radius: var(--radius-md); /* Maintenant résolu */
}
```

**Temps estimé**: 1 min

---

### C3. CSP `'unsafe-eval'` compromet la sécurité XSS
**Fichier**: `index.html`
**Ligne**: 7 (meta CSP)
**Problème**: `'unsafe-eval'` ajouté pour TensorFlow.js

```html
<!-- LIGNE 7 - Examine la CSP -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval' ...">
```

**Contexte**: Le modèle ML fonctionne réellement (les fichiers existent), mais TensorFlow.js requiert `'unsafe-eval'` pour compiler les kernels WebGL.

**Options**:
1. **Accepter le trade-off** (recommandé pour MVP) — documenter explicitement dans CLAUDE.md
2. **Supprimer TensorFlow.js** — commente les lignes 1449-1478 dans app.js
3. **Mode CPU-only** — TensorFlow v4 supporte mode CPU sans eval (moins performant)

**Documentation à ajouter si Option 1**:
```markdown
## CSP & TensorFlow.js Trade-off

L'application inclut TensorFlow.js pour la détection de patterns humains.
TensorFlow.js requiert 'unsafe-eval' pour compiler les kernels WebGL.

This introduces a slight CSP relaxation:
- Original: script-src 'self' 'sha256-...'
- Current: script-src 'self' 'unsafe-eval' 'sha256-...'

Cela signifie qu'une vulnérabilité DOM injection future pourrait exécuter eval().
En pratique, le risque reste très bas car:
- Pas d'injection possible via l'input password (validé)
- i18n strings viennent du code source (contrôlé)
- HTML hardcodé (pas de contenu externe)

Pour une application zero-trust, envisager Option 2/3.
```

**Temps estimé**: 5 min (documentation) ou 30 min (refactor TensorFlow)

---

### C4. `.codeberg-link` trop petit sur mobile (36px < 44px)
**Fichier**: `styles.css`
**Lignes**: 1871-1876 (mobile), 172-186 (desktop)
**Problème**: Cible tactile viole WCAG 2.5.5

```css
/* LIGNES 172-186 - Desktop (OK) */
.codeberg-link {
  position: absolute;
  top: 1.2rem;
  left: 1.5rem;
  width: 44px;       /* ✓ OK */
  height: 44px;      /* ✓ OK */
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-sm);
}

/* LIGNES 1871-1876 - Mobile (BUGUÉ) */
@media (max-width: 600px) {
  .codeberg-link {
    top: 1rem;
    left: 1rem;
    width: 36px;     /* ✗ < 44px */
    height: 36px;    /* ✗ < 44px */
  }
}
```

**Fix**:
```css
@media (max-width: 600px) {
  .codeberg-link {
    top: 1rem;
    left: 1rem;
    width: 44px;     /* ✓ Conforme WCAG */
    height: 44px;    /* ✓ Conforme WCAG */
  }
}
```

**Temps estimé**: 1 min

---

## 🟡 IMPORTANTS (A faire à court terme)

### I1. Shuffle du générateur biaisé (Fisher-Yates)
**Fichier**: `app.js`
**Lignes**: 3891-3895
**Problème**: `.sort()` avec comparateur aléatoire ≠ shuffle uniforme

```javascript
// ACTUEL - BIAISÉ
const shuffled = password.split('').sort(() => {
    const arr = new Uint8Array(1);
    crypto.getRandomValues(arr);
    return arr[0] - 128;
}).join('');

// RECOMMANDÉ - Fisher-Yates
function fisherYates(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const buf = new Uint8Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const shuffled = fisherYates(password.split('')).join('');
```

**Pourquoi c'est important**: La distribution non-uniforme affecte les statistiques d'entropie du générateur, surtout pour les mots de passe courts.

**Temps estimé**: 15 min

---

### I2. Modèle ML absent — corriger la détection
**Contexte**: Le modèle EXISTE en réalité (`data/model-v2/model.json` + `normalization.json`)
**Problème**: La fonction `loadModel()` échoue silencieusement

**Test pour confirmer que ça marche**:
```javascript
// Console navigateur, entrer "Password123"
// Regarder si "Human-like pattern" apparaît dans les résultats
// Si absent → le modèle ne charge pas correctement
```

**Si le modèle fonctionne**: Pas d'action nécessaire (problème résolu)

**Si le modèle échoue**: Vérifier les erreurs CORS/404
```javascript
// Ligne 1462 dans app.js
const modelUrl = "data/model-v2/model.json";
// Vérifier que le chemin est relatif correct
// Tester dans DevTools Network tab
```

**Temps estimé**: 5 min (debug) ou 10 min (fix CORS)

---

### I3. Localisation des dates (fmtDate ne traite que FR/EN)
**Fichier**: `app.js`
**Ligne**: 3215
**Problème**: PL/DE/TR/IT/NL/ES/PT voient les dates en format "en-US"

```javascript
// ACTUEL - traite seulement FR et EN
d.toLocaleDateString(LANG === "fr" ? "fr-FR" : "en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

// RECOMMANDÉ - map explicite
const localeMap = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  tr: "tr-TR",
  it: "it-IT",
  pl: "pl-PL",
  nl: "nl-NL"
};

d.toLocaleDateString(localeMap[LANG] || "en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});
```

**Temps estimé**: 5 min

---

### I4. Variable morte `CHARSET_UNICODE_ESTIMATE`
**Fichier**: `app.js`
**Ligne**: 2068
**Action**: Supprimer la ligne

```javascript
// LIGNE 2068 - À SUPPRIMER
const CHARSET_UNICODE_ESTIMATE = 100; // Rough estimate for non-ASCII
```

Vérifier qu'aucune fonction n'utilise cette constante:
```bash
grep -n "CHARSET_UNICODE_ESTIMATE" app.js
```

Si grep ne retourne rien, c'est mort → supprimer.

**Temps estimé**: 1 min

---

### I5. Inconsistance bcrypt cost — clarifier la cible
**Contextes**: CLAUDE.md vs app.js
**Action**: Choisir cost 5 OU cost 10, puis harmoniser

```javascript
// CLAUDE.md ligne ~130
{ key: "bcrypt", name: "bcrypt (coût 5)", rate: 184000 * 12 }

// app.js ligne 2119
{ key: "bcrypt", name: "bcrypt (cost 10)", rate: 1840 * 12 }
```

**Décision requise**:
- Cost 5 = plus rapide (ancien), 2.2 MH/s
- Cost 10 = plus lent (moderne, par défaut), 22 kH/s

Recommandation: Garder **cost 10** (standard moderne, 2025) et mettre à jour CLAUDE.md.

```markdown
# Dans CLAUDE.md, section "Hash rates in code"

## Appel recommandé
De: `{ key: "bcrypt", name: "bcrypt (coût 5)", rate: 184000 * 12 }`
À: `{ key: "bcrypt", name: "bcrypt (cost 10)", rate: 1840 * 12 }`

Justification: bcrypt cost 10 est le défaut moderne. Cost 5 est obsolète.
Sources: Hive Systems 2025, bcrypt documentation officielle.
```

**Temps estimé**: 5 min

---

## 📋 Checklist de Correction

```
CRITIQUES
[ ] C1 - Fix crash `null.match()` sur dates
      - [ ] Ajouter `pw` à la signature `addMaskAttacks`
      - [ ] Trouver et mettre à jour l'appel (ligne ~3135)
      - [ ] Tester: analyzePassword("Password2024!")

[ ] C2 - Ajouter `--radius-md: 10px;` dans :root
      - [ ] Ligne 65 styles.css
      - [ ] Tester: `.character-analysis-wrapper` a coins arrondis

[ ] C3 - Documenter CSP/TensorFlow trade-off (ou refactor)
      - [ ] Si documentation: mettre à jour CLAUDE.md
      - [ ] Si refactor: supprimer TF.js + commenter ML code

[ ] C4 - Changer `.codeberg-link` width/height 36px → 44px
      - [ ] Lignes 1874-1875 styles.css
      - [ ] Tester: bouton reste cliquable sur mobile

IMPORTANTS
[ ] I1 - Implémenter Fisher-Yates shuffle
      - [ ] Remplacer lines 3891-3895 app.js
      - [ ] Tester: pwd shuffle ne montre pas patterns

[ ] I2 - Vérifier/déboguer chargement du modèle ML
      - [ ] Console: vérifier "Human-like pattern" apparaît
      - [ ] Network tab: vérifier data/model-v2/ charges sans erreur

[ ] I3 - Ajouter map locale pour toutes les 9 langues
      - [ ] Ligne 3215 app.js
      - [ ] Tester chaque langue: date en bon format

[ ] I4 - Supprimer CHARSET_UNICODE_ESTIMATE
      - [ ] Ligne 2068 app.js
      - [ ] Vérifier grep retourne 0 résultats

[ ] I5 - Harmoniser bcrypt cost (5 vs 10)
      - [ ] app.js ligne 2119: confirmer "cost 10"
      - [ ] CLAUDE.md: mettre à jour section Hash rates
```

---

## Ordre de Priorité Recommandé

1. **C1 & C2** (5 min) — Bugs visibles et faciles
2. **C4** (1 min) — WCAG compliance
3. **C3** (5-30 min) — Décision d'architecture
4. **I1, I3, I4, I5** (20 min) — Améliorations code/doc
5. **I2** (debug au besoin)

**Temps total**: 40-60 min pour tout, ou 20 min pour C1+C2+C4+I5 (MVP)

---

## Commandes de Test Rapide

```bash
# Vérifier C1 (crash sur date)
npm install --save-dev vitest # ou jest
cat > test.mjs << 'EOF'
import('./app.js').then(() => {
  const result = analyzePassword("Password2024!");
  console.log("✓ Pas de crash sur date");
});
EOF
node test.mjs

# Vérifier C2 (variable CSS)
grep --regex "--radius-md" styles.css

# Vérifier C4 (width 44px)
grep -A2 "600px" styles.css | grep -A2 "codeberg-link"

# Vérifier I4 (variable morte)
grep "CHARSET_UNICODE_ESTIMATE" app.js
```

---

## Notes d'Intégration

- Tous les fixes sont **backward-compatible** (aucun changement API)
- Aucune dépendance externe ajoutée
- Les tests manuels suffisent (voir CLAUDE.md section Testing Checklist)
- Les commits devraient être atomiques (1 fix par commit)

