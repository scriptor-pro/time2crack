# 🛣️ Roadmap: Déduplication des Informations

**Objectif**: Éliminer les redondances tout en maintenant une UX claire et accessible

---

## PHASE 1: Corrections Rapides (0 impact UX)

### 1.1 Supprimer bannière HIBP deprecated (5 min)

**Actuel**:
```html
<!-- Hidden via CSS: display: none -->
<div id="hibp-banner" class="hibp-banner" role="alert" hidden>
  <div class="hibp-icon" aria-hidden="true">⚠</div>
  <div class="hibp-content">
    <strong class="hibp-title">This password has been leaked!</strong>
    <p class="hibp-text">This password appears <strong id="hibp-count">—</strong> times...</p>
    ...
  </div>
</div>
<div id="hibp-safe" class="hibp-safe" role="status" hidden>...</div>
<div id="hibp-error" class="hibp-error" role="alert" hidden>...</div>
<div id="hibp-loading" class="hibp-loading" role="status" hidden>...</div>
```

**Action**: Supprimer complètement (85+ lignes HTML)
- Le badge `hibp-status-badge` affiche déjà: "Leaked / Not leaked / Check failed / Loading"
- JS ne référence plus ces éléments (voir `app.js:425` commentaire "deprecated")

**Code à changer**:
```html
<!-- AVANT: index.html:422-503 -->
<div class="details-summary">
  <div id="vuln-tags" class="vuln-tags" aria-live="polite"></div>
  <!-- [130 lignes bannière deprecated] -->
</div>

<!-- APRÈS: index.html:422-425 -->
<div class="details-summary">
  <div id="vuln-tags" class="vuln-tags" aria-live="polite"></div>
  <!-- HIBP status now in quality-pattern-bar badge -->
</div>
```

**Impact**:
- ✅ HTML réduit de 130 lignes
- ✅ Aucun changement visuel (bannière était caché)
- ✅ Clarté du code augmentée

---

### 1.2 Supprimer detail-status (caché) (3 min)

**Actuel**:
```html
<div class="detail-item" role="listitem" hidden>
  <div class="detail-status" id="detail-status">—</div>
  <div class="detail-label">Status</div>
</div>
```

**Raison caché**: `hidden` attribut → jamais affiché
**Utilisé par**: `app.js:3844-3866` met à jour un élément caché

**Action**: Supprimer complètement

**Code à changer**:
```javascript
// AVANT: app.js:3843-3866
detailStatus.className = "detail-status";
if (sc < 20) {
  detailStatus.classList.add("status-short");
  detailStatus.textContent = t("statusShort");
  detailStatus.setAttribute("aria-label", t("statusShort") + ": " + sc + "%");
} else if (sc < 60) {
  detailStatus.classList.add("status-good");
  detailStatus.textContent = t("statusGood");
  ...
} else {
  detailStatus.classList.add("status-excellent");
  detailStatus.textContent = t("statusExcellent");
  ...
}

// APRÈS: Supprimer entièrement
// Cette info est déjà dans:
// - strength-label (scoreText)
// - quality-badge (scoreLabel)
// - aria-valuetext (accessibility)
```

**Impact**:
- ✅ 24 lignes JS supprimées
- ✅ Aucun impact visuel (déjà caché)
- ✅ Code plus clair

---

### 1.3 Unifier scoreLabel et scoreText (refactor léger)

**Actuel**:
```javascript
// Deux fonctions retournent quasi la même chose
function scoreText(s) {
  return s < 20 ? t("veryWeak") : s < 35 ? t("_weak") : ... : t("exceptional");
}

function scoreLabel(s) {
  return s < 20 ? "🔴 Very Weak" : s < 35 ? "🟠 Weak" : ... : "🔵 Exceptional";
}

// Utilisées séparément dans:
strength-label.textContent = scoreText(sc);           // Texte seul
quality-badge.textContent = scoreLabel(sc);           // Texte + emoji
aria-valuetext = scoreText(sc);                       // Accessibility
```

**Problème**: Duplication logique (seuils identiques [20, 35, 60, 80, 95])

**Action**: Créer une fonction unique + option pour emoji

```javascript
// APRÈS
function formatScore(s, withEmoji = false) {
  const levels = [
    { threshold: 20, text: "veryWeak", emoji: "🔴" },
    { threshold: 35, text: "_weak", emoji: "🟠" },
    { threshold: 60, text: "moderate", emoji: "🟡" },
    { threshold: 80, text: "_strong", emoji: "✅" },
    { threshold: 95, text: "veryStrong", emoji: "✅✅" },
    { threshold: 100, text: "exceptional", emoji: "⭐" },
  ];

  const level = levels.find(l => s < l.threshold) || levels[levels.length - 1];
  const label = t(level.text);
  return withEmoji ? `${level.emoji} ${label}` : label;
}

// Utilisation
strength-label.textContent = formatScore(sc);
quality-badge.textContent = formatScore(sc, true);  // Avec emoji
aria-valuetext = formatScore(sc);
```

**Impact**:
- ✅ DRY principle appliqué
- ✅ -30 lignes JS
- ✅ Maintenance simplifiée (1 source de vérité)

---

## PHASE 2: Refactor UX (Impact minimal, testé)

### 2.1 Simplifier affichage de la Force (Barre → Badge → Card)

**Problème actuel**: 5 affichages de la MÊME donnée (score 0-100)

**Current state**:
```
Strength Bar (6 segments):        ✔ (visual, keep)
Strength Label + Icon:            ✔ (keep)
Quality Badge (3 cards):          ✔ (keep, résumé)
aria-valuetext:                   ✔ (keep, a11y)
detail-status (hidden):           ✗ (supprimer via 1.2)
```

**Situation finale**:
- ✅ Barre segmentée (visual feedback)
- ✅ Label textuel + icône
- ✅ Badge résumé dans "quality-pattern-bar"
- ✅ ARIA pour lecteurs d'écran

**Code pattern après nettoyage**:
```javascript
// Single source of truth pour le score
const sc = score(pw);
const col = scoreColor(sc);
const label = formatScore(sc);
const labelWithEmoji = formatScore(sc, true);

// Appliquer uniformément
strengthBar.style.background = col;
strengthLabel.textContent = label;
strengthIcon.textContent = scoreIcon(sc);
qualityBadge.textContent = labelWithEmoji;
barWrapper.setAttribute("aria-valuetext", label);
```

---

### 2.2 Pattern Badge: Afficher TOUS les problèmes, pas juste le premier

**Problème actuel**:
```javascript
updatePatternBadge(vulns) {
  const critical = vulns.find(v => v.l === "critical");  // SEULEMENT le premier
  const warn = vulns.find(v => v.l === "warn");
  // Affiche: "Common password" uniquement
  // Mais les tags affichent AUSSI: "Keyboard pattern", "Good length", etc.
}
```

**Conséquence**: Confusion utilisateur
- Badge: "Common password"
- Tags: "Common password", "Keyboard pattern", "Good length"

**Solution**: Convertir badge en icône + laisser tags gérer le contenu

**New approach**:
```html
<!-- AVANT: Badge texte  -->
<span class="qp-badge" id="pattern-badge">
  This password structure is: Common password
</span>

<!-- APRÈS: Icône visuelle uniquement -->
<div class="pattern-indicator" id="pattern-indicator">
  <span class="pattern-icon critical">⚠</span> <!-- Critical problem exists -->
  <!-- Détails via tags ci-dessous -->
</div>
```

**Code**:
```javascript
function updatePatternIndicator(vulns) {
  const critical = vulns.find(v => v.l === "critical");
  const warn = vulns.find(v => v.l === "warn");

  if (!patternIndicator) return;

  if (critical) {
    patternIndicator.innerHTML = '<span class="pattern-icon critical">⚠</span>';
  } else if (warn) {
    patternIndicator.innerHTML = '<span class="pattern-icon warn">⚡</span>';
  } else {
    patternIndicator.innerHTML = '<span class="pattern-icon ok">✓</span>';
  }
}
```

**Impact**:
- ✅ Pas de redondance (badge + tags cohérents)
- ✅ Icône visuelle rapide
- ✅ Tags affichent la liste complète

---

### 2.3 Fusionner Entropy + Combinaisons

**Actuel**:
```html
<div class="detail-item">
  <div class="detail-value" id="detail-entropy">42</div>
  <div class="detail-label">Entropy bits</div>
</div>
<div class="detail-item">
  <div class="detail-value" id="detail-combos">2^42</div>
  <div class="detail-label">Combinations</div>
</div>
```

**Problème**: Le deuxième est calculable à partir du premier

**Solution**: Afficher un seul, avec tooltip

```html
<!-- APRÈS -->
<div class="detail-item">
  <div class="detail-value">
    42 bits
    <button type="button" class="info-tooltip-trigger" aria-label="Combinations tooltip">
      <svg class="lucide lucide-info"><!-- --></svg>
    </button>
  </div>
  <div class="detail-label">Entropy</div>
  <div class="tooltip" role="tooltip" hidden>
    = 2^42 possible combinations (4.3 trillion)
  </div>
</div>
```

**Code**:
```javascript
// Supprimer ligne de detail-combos
// detailCombos.textContent = ...  // DELETE

// Garder seulement
detailEntropy.textContent = Math.round(ent) + " bits";

// Tooltip pour la formule
const combos = Math.pow(2, ent);
entropyTooltip.textContent = `= 2^${Math.round(ent)} combinations (${fmtBig(combos)})`;
```

**Impact**:
- ✅ -1 ligne "detail-item"
- ✅ Info complète via tooltip
- ✅ Interface moins chargée

---

## PHASE 3: Code Refactoring (Longue terme)

### 3.1 Dédupliquer Experienced vs Professional rendering

**Actuel**: Code copy/paste pour les 2 profils

```javascript
// EXPERIENCED
resultLabelFast.textContent = fastest.atk + " — " + fastest.hash;
crackDurationFast.textContent = fastDur.text;
crackDateFast.textContent = fastDt || t("beyondDate");

// PROFESSIONAL (même logique)
resultLabelPro.textContent = fastest.atk + " — " + fastest.hash;
crackDurationPro.textContent = proDur.text;
crackDatePro.textContent = proDt || t("beyondDate");
```

**Refactor**:
```javascript
function renderAttackerProfile(profileName, duration, date, sentence) {
  const label = document.getElementById(`result-label-${profileName}`);
  const durationEl = document.getElementById(`crack-duration-${profileName}`);
  const dateEl = document.getElementById(`crack-date-${profileName}`);
  const sentenceEl = document.getElementById(`result-sentence-${profileName}`);

  label.textContent = fastest.atk + " — " + fastest.hash;
  durationEl.textContent = duration.text;
  dateEl.textContent = date || t("beyondDate");
  sentenceEl.innerHTML = sentence;
}

// Utilisation
const fastDur = fmtDuration(fastest.sec);
const fastDt = fmtDate(fastest.sec);
const fastSentence = buildSentence(fastest, fastDur);

renderAttackerProfile("fast", fastDur, fastDt, fastSentence);

const proSec = fastest ? fastest.sec / 8 : Infinity;
const proDur = fmtDuration(proSec);
const proDt = fmtDate(proSec);
const proSentence = buildSentence(fastest, proDur);

renderAttackerProfile("pro", proDur, proDt, proSentence);
```

**Impact**:
- ✅ -50 lignes JS (copy/paste éliminé)
- ✅ 1 source de vérité
- ✅ Maintenance simplifiée

---

### 3.2 Extraire Character Analysis + Vuln Detection dans une fonction

**Actuel**: 2 détections parallèles de patterns

```javascript
// getVulns: texte tags
// analyzeCharacters: visual heatmap
// Les 2 analysent hasKBPattern(), hasDate(), hasCommonStruct(), etc.
```

**Refactor**: Source unique, 2 rendus différents

```javascript
function analyzePasswordPatterns(pw) {
  return {
    common: isCommon(pw),
    keyboard: hasKBPattern(pw),
    sequence: hasSequence(pw),
    repeat: hasRepeat(pw),
    date: hasDate(pw),
    struct: hasCommonStruct(pw),
    dictWord: isDictWord(pw),
    // + ML prediction
  };
}

// Rendu 1: Tags de vulnérabilité
function getVulns(pw) {
  const patterns = analyzePasswordPatterns(pw);
  const v = [];
  if (patterns.common) v.push({ t: t("vCommon"), l: "critical" });
  if (patterns.keyboard) v.push({ t: t("vKeyboard"), l: "critical" });
  // ... etc
  return v;
}

// Rendu 2: Character-by-character visual
function analyzeCharacters(pw) {
  const patterns = analyzePasswordPatterns(pw);
  const chars = [];
  for (let i = 0; i < pw.length; i++) {
    const char = pw[i];
    // Utiliser patterns.keyboard, patterns.date, etc. pour classification
  }
  return chars;
}
```

**Impact**:
- ✅ DRY: Une seule source de vérité
- ✅ Patterns calculés une seule fois (perf)
- ✅ Cohérence garantie entre visuels et tags

---

## PHASE 4: Documentation + Testing

### 4.1 Créer test suite

```javascript
// test-redundancy.mjs
const testPasswords = {
  weakCommon: "password",
  weakKeyboard: "qwerty",
  weakShort: "abc",
  moderateStructure: "Password123",
  strongPassphrase: "correct horse battery staple",
  strongRandom: "k7#mP$2xYqL9&vB4",
};

for (const [name, pw] of Object.entries(testPasswords)) {
  const vulns = getVulns(pw);
  const chars = analyzeCharacters(pw);
  const pattern = analyzePasswordPatterns(pw);

  // Assert: vulns tags cohérents avec pattern détection
  assert(vulns.some(v => v.t.includes("Keyboard")) === pattern.keyboard);
  assert(vulns.some(v => v.t.includes("Date")) === pattern.date);
  // ... etc

  // Assert: character analysis cohérent avec vulns
  // ...
}
```

---

## TIMELINE RECOMMANDÉ

| Phase | Durée | Priorité | Risk |
|-------|-------|----------|------|
| **1.1**: Supprimer HIBP banner | 5 min | 🔴 HAUTE | ✅ Zéro |
| **1.2**: Supprimer detail-status | 3 min | 🔴 HAUTE | ✅ Zéro |
| **1.3**: Unifier scoreLabel/scoreText | 20 min | 🟠 MOYENNE | ✅ Zéro |
| **2.1**: Simplifier Force (barre) | 15 min | 🟢 BASSE | ✅ Zéro |
| **2.2**: Pattern badge refactor | 30 min | 🟠 MOYENNE | ⚠️ Visuel |
| **2.3**: Fusionner Entropy/Combos | 15 min | 🟢 BASSE | ⚠️ Minor |
| **3.1**: Dédupliquer Attacker cards | 30 min | 🟢 BASSE | ✅ Zéro |
| **3.2**: Unifier pattern detection | 45 min | 🟠 MOYENNE | ⚠️ Logic |
| **4.1**: Test suite | 30 min | 🔴 HAUTE | ✅ Zéro |

**Total**: ~3 heures pour éliminer 95% des redondances

---

## ✅ VALIDATION CHECKLIST

Après chaque changement:
- [ ] Pas de console errors/warnings
- [ ] Responsive design: 320px, 375px, 480px, desktop
- [ ] Accessible: Tab navigation, screen reader
- [ ] Performance: render < 16ms
- [ ] HIBP k-anonymity: only 5-char prefix sent
- [ ] Test passwords: weak, moderate, strong, passphrase
- [ ] All 9 languages: i18n strings présentes
- [ ] Localization: dates/numbers/text en FR/EN
- [ ] Mobile: tap targets 44×44px minimum
- [ ] Keyboard-only users: all functionality accessible

