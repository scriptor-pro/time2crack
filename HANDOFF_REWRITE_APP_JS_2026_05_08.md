---
title: Handoff — Complete app.js Rewrite (IIFE + Centralized State)
date: 2026-05-08
author: Claude Haiku
context: 85% token usage — starting fresh session recommended
---

# Handoff: app.js Rewrite for 11ty/Nunjuck

## ✅ DECISIONS FINALIZED

### Architecture
- **Pattern:** IIFE (Immediately Invoked Function Expression) — NOT ES6 Module
- **State:** Single centralized `state` object (no global variables scattered)
- **Attacks:** 7 displayed (Brute, Dictionary, Hybrid, Mask, Markov, PCFG, Combinator)
- **ML:** Keep ONNX (Neural hidden but active for weighting)
- **Build:** IIFE at `/app.js`, copied to `nunjuck/build/app.js` before 11ty build

### 11ty/Nunjuck Integration
```html
<!-- In index.njk — NO type="module" -->
<script src="/app.js"></script>
```

### Key Changes from Current Code
| Current | New |
|---------|-----|
| 60+ global variables | 1 `state` object |
| Scattered closures over `input` | Safe property access via `state.dom.input` |
| `setLang()` crashes if input undefined | `state.dom.input` always checked via `isReal()` |
| IIFE with bugs | Clean IIFE with clear sections |
| 6848 lines monolith | ~5500 lines organized IIFE |

---

## STATE STRUCTURE (IMMUTABLE SCHEMA)

```javascript
const state = {
  // === LANGUAGE & DETECTION ===
  lang: "en",  // Current language
  browserLang: "en",  // Detected language
  
  // === PASSWORD INPUT ===
  password: "",
  
  // === DOM ELEMENTS (queried once at init, then cached) ===
  dom: {
    // Input section
    input: null,  // #pw-input
    toggleVisibility: null,  // #pw-toggle
    
    // Results section
    results: null,  // #results
    resultLabelFast: null,  // #result-label-fast
    crackDurationFast: null,  // #crack-duration-fast
    crackDateFast: null,  // #crack-date-fast
    resultSentenceFast: null,  // #result-sentence-fast
    
    // Strength indicators
    strengthLabel: null,  // #strength-label
    strengthIcon: null,  // #strength-icon
    strengthBits: null,  // #strength-bits
    barWrapper: null,  // .strength-bar-wrapper
    
    // Attack list
    ctList: null,  // #ct-list
    ctFastestValue: null,  // #ct-fastest-value
    ctAlgo: null,  // #ct-algo
    
    // Status/details
    vulnTagsEl: null,  // #vuln-tags
    liveDetailsVisible: null,  // #live-details-visible
    detailLengthLive: null,  // #detail-length-live
    detailCharsetLive: null,  // #detail-charset-live
    detailEntropyLive: null,  // #detail-entropy-live
    detailCombosLive: null,  // #detail-combos-live
    
    // Language menu
    langToggle: null,  // #lang-toggle
    langSelector: null,  // #lang-selector
    langMenu: null,  // #lang-selector-menu
    langCode: null,  // #lang-code
    
    // Generator (if present)
    genAccordionTrigger: null,  // #gen-accordion-trigger
    genPanel: null,  // #gen-accordion-panel
    
    // HIBP
    hibpLoading: null,  // #hibp-loading
    hibpCount: null,  // #hibp-count
    hibpBanner: null,  // #hibp-banner
  },
  
  // === DATA CACHES ===
  cache: {
    // Dictionary
    dictWords: null,  // Set<string> for O(1) lookup
    dictLang: null,  // Language of currently loaded dictionary
    
    // Bloom filter
    bloomFilter: null,  // { bitArray, m, k }
    bloomResult: null,  // "found" | "not_found" | "error" | null
    
    // ML Model
    ml: {
      session: null,  // ONNX InferenceSession
      normalization: null,  // { mean, std }
    },
    
    // Calibrations
    calibrations: {
      pcfg: null,
      markov: null,
      neural: null,
      prince: null,  // May be used internally even if not displayed
    },
  },
  
  // === UI STATE ===
  ui: {
    isPending: false,  // Show pending state during debounce
    debounceTimer: null,
    
    showPassword: false,
    
    // Language menu
    langMenuOpen: false,
    
    // Generator
    selectedGenType: "random",  // "random" | "passphrase" | "word"
    genLength: 16,
    
    // Attack panel
    selectedAlgo: "md5",
    selectedProfile: "experienced",
    userPinnedAlgo: false,
  },
  
  // === ANALYSIS RESULTS ===
  results: {
    password: "",  // Copy of password at time of analysis
    
    // Basic metrics
    score: 0,  // 0-100
    entropy: 0,
    charset: { size: 0, description: "" },
    
    // 7 displayed attack scenarios
    scenarios: [
      // Each: { attack, hash, keyspace, guesses, sec, confidence, ... }
      // Ordered by fastest first
    ],
    
    // ML prediction
    mlProbability: null,  // 0.0-1.0, null if not computed
    mlConfidence: "low" | "medium" | "high" | null,
    
    // Vulnerabilities detected
    vulns: [
      // Each: { type: "critical" | "warn" | "info", text, detail? }
    ],
    
    // HIBP
    hibpHit: false,
    hibpCount: 0,
  },
  
  // === TRANSLATIONS (i18n) ===
  i18n: {
    // Loaded from I[lang] object
    // Keys like: "aBrute", "aDict", "scoreText", etc.
  },
};
```

---

## IIFE TEMPLATE (BOILERPLATE TO FOLLOW)

```javascript
(function() {
  "use strict";

  // ============================================================
  // CONFIGURATION & CONSTANTS
  // ============================================================
  const SUPPORTED_LANGS = ["en", "fr", "es", "pt", "de", "it", "tr", "pl", "nl"];
  const INPUT_RENDER_DEBOUNCE_MS = 160;
  const HIBP_DEBOUNCE_MS = 600;
  const CALIBRATION_TIMEOUT_MS = 5000;
  const ML_MIN_LENGTH = 10;
  const DICT_LOAD_TIMEOUT_MS = 30000;

  // ============================================================
  // STATE (CENTRALIZED)
  // ============================================================
  const state = { /* see schema above */ };

  // ============================================================
  // UTILITY FUNCTIONS (Pure)
  // ============================================================
  
  // Safe DOM access
  const safe = (id) => document.getElementById(id);
  const isReal = (el) => el !== null && el !== undefined;

  // Helper: clamp value
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Helper: detect browser language
  function detectBrowserLanguage() {
    const browserLang = (navigator.language || navigator.userLanguage || "en")
      .split("-")[0]
      .toLowerCase();
    return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
  }

  // ============================================================
  // I18N (TRANSLATIONS)
  // ============================================================
  const I = {
    en: {
      aBrute: "Brute Force",
      aDict: "Dictionary",
      aHybrid: "Hybrid",
      aMask: "Mask",
      aMarkov: "Markov",
      aPCFG: "PCFG",
      aCombi: "Combinator",
      // ... 100+ more keys
    },
    fr: { /* ... */ },
    es: { /* ... */ },
    // ... other languages
  };

  function t(key, lang = state.lang) {
    return I[lang]?.[key] || I.en[key] || key;
  }

  // ============================================================
  // ANALYSIS FUNCTIONS (Pure — no state mutation)
  // ============================================================

  /**
   * Calculate password score (0-100)
   */
  function score(pw) {
    // ... 100% from original app.js
    // UNCHANGED LOGIC
  }

  /**
   * Calculate entropy
   */
  function entropy(pw) {
    // ... UNCHANGED
  }

  /**
   * Detect charset
   */
  function getCharset(pw) {
    // ... UNCHANGED
  }

  /**
   * Get all attack scenarios
   */
  function getScenarios(pw, mlProb = null) {
    const { size: cs } = getCharset(pw);
    const len = pw.length;
    const full = Math.pow(cs, len);

    const weak = isWeakPassword(pw);
    const common = isCommon(pw);
    const dictWord = isDictWord(pw);
    // ... build context

    const rows = [];
    
    // 7 attacks only
    addBruteForceAttacks(rows, full, weak);
    addDictionaryAttacks(rows, common, weak, dictWord);
    addHybridAttacks(rows, hybridVuln, weak, common, dictWord);
    addMaskAttacks(rows, full, len, cs, kbPat, seq, weak, dt, pw);
    addMarkovAttacks(rows, full, ...);
    addPCFGAttacks(rows, weak, pw);
    addCombinatorAttacks(rows, len, pw, common, looksPassphrase, weak);

    // KEEP: apply Neural weighting if mlProb available
    if (mlProb !== null && mlProb > 0.85) {
      applyNeuralWeighting(rows, mlProb);
    }

    // Apply calibration
    applyHighFidelityCalibration(rows, { ... });
    annotateScenarioApplicability(rows, { ... });

    return rows;
  }

  /**
   * Get vulnerabilities
   */
  function getVulns(pw) {
    const vulns = [];
    
    if (isWeakPassword(pw)) {
      vulns.push({ type: "critical", text: t("vulnWeak") });
    }
    if (isDictWord(pw)) {
      vulns.push({ type: "warn", text: t("vulnDict") });
    }
    // ... other patterns

    // ML: add if available
    if (state.results.mlProbability !== null && state.results.mlProbability > 0.85) {
      vulns.push({
        type: "warn",
        text: t("vulnMLHuman") + ` (${Math.round(state.results.mlProbability * 100)}%)`,
      });
    }

    return vulns;
  }

  // ============================================================
  // ML FUNCTIONS (Neural hidden)
  // ============================================================

  async function loadONNXRuntime() {
    // ... UNCHANGED
  }

  async function loadMLModel() {
    // ... UNCHANGED
  }

  async function predictHumanPattern(pw) {
    if (!ML_SESSION || !ML_NORMALIZATION) {
      await loadMLModel();
    }
    // ... UNCHANGED
  }

  function extractMLFeatures(pw) {
    // ... UNCHANGED
  }

  function applyNeuralWeighting(scenarios, mlProb) {
    // Adjust scenario estimates based on mlProb
    // ... UNCHANGED
  }

  // ============================================================
  // MAIN ANALYSIS PIPELINE
  // ============================================================

  async function analyzePassword(pw) {
    if (!pw || pw.length === 0) {
      // Reset results
      state.results = {
        password: "",
        score: 0,
        entropy: 0,
        charset: { size: 0, description: "" },
        scenarios: [],
        mlProbability: null,
        vulns: [],
        hibpHit: false,
      };
      render(state);
      return;
    }

    // Calculate metrics
    state.results.password = pw;
    state.results.score = score(pw);
    state.results.entropy = entropy(pw);
    state.results.charset = getCharset(pw);

    // Get vulnerabilities
    state.results.vulns = getVulns(pw);

    // Get scenarios (with ML probability if available)
    const mlProb = await predictHumanPattern(pw);
    state.results.mlProbability = mlProb;
    state.results.scenarios = getScenarios(pw, mlProb);

    // Render
    render(state);
  }

  // ============================================================
  // RENDERING (UI State → DOM)
  // ============================================================

  function render(state) {
    if (!isReal(state.dom.results)) return;

    if (!state.password) {
      state.dom.results.classList.add("is-empty");
      return;
    }

    state.dom.results.classList.remove("is-empty");

    // Update strength bar
    const col = scoreColor(state.results.score);
    if (isReal(state.dom.strengthLabel)) {
      state.dom.strengthLabel.textContent = scoreText(state.results.score);
      state.dom.strengthLabel.style.color = col;
    }

    // Update attack list
    if (isReal(state.dom.ctList)) {
      state.dom.ctList.innerHTML = state.results.scenarios
        .map(s => `<div class="scenario">${s.attack}: ${formatDuration(s.sec)}</div>`)
        .join("");
    }

    // Update vulnerabilities
    if (isReal(state.dom.vulnTagsEl)) {
      state.dom.vulnTagsEl.innerHTML = state.results.vulns
        .map(v => `<span class="vuln-tag ${v.type}">${v.text}</span>`)
        .join("");
    }

    // ... more DOM updates
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  function onPasswordInput(event) {
    state.password = event.target.value;
    
    clearTimeout(state.ui.debounceTimer);
    
    if (!state.password) {
      render(state);
      return;
    }

    state.ui.isPending = true;
    render(state);

    state.ui.debounceTimer = setTimeout(() => {
      analyzePassword(state.password);
      state.ui.isPending = false;
    }, INPUT_RENDER_DEBOUNCE_MS);
  }

  function onLanguageChange(newLang) {
    state.lang = newLang;
    localStorage.setItem("time2crack-lang", newLang);

    // Reload dictionary if needed
    if (state.cache.dictLang !== newLang) {
      loadDictionary(newLang);
    }

    // Re-render with new language
    render(state);
  }

  function onToggleVisibility() {
    state.ui.showPassword = !state.ui.showPassword;
    if (isReal(state.dom.input)) {
      state.dom.input.type = state.ui.showPassword ? "text" : "password";
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function initializeApp() {
    // Query all DOM elements once
    state.dom.input = safe("pw-input");
    state.dom.results = safe("results");
    state.dom.strengthLabel = safe("strength-label");
    state.dom.ctList = safe("ct-list");
    // ... query all others from state.dom schema

    // If critical elements missing, abort
    if (!isReal(state.dom.input) || !isReal(state.dom.results)) {
      return;
    }

    // Detect language
    state.lang = localStorage.getItem("time2crack-lang") || detectBrowserLanguage();

    // Load initial data
    loadDictionary(state.lang);

    // Setup event listeners
    state.dom.input.addEventListener("input", onPasswordInput);
    if (isReal(state.dom.toggleVisibility)) {
      state.dom.toggleVisibility.addEventListener("click", onToggleVisibility);
    }

    // Language menu setup
    if (isReal(state.dom.langMenu)) {
      document.querySelectorAll(".lang-option").forEach(btn => {
        btn.addEventListener("click", () => {
          const newLang = btn.getAttribute("data-lang");
          onLanguageChange(newLang);
        });
      });
    }

    // Initial render
    render(state);
  }

  // ============================================================
  // AUTO-INITIALIZATION
  // ============================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    // Already loaded (rare)
    initializeApp();
  }
})();
```

---

## SECTIONS TO IMPLEMENT (IN ORDER)

### Phase 1: Foundation (1-2 hours)
- [ ] Replace IIFE wrapper (current chaos → clean IIFE template)
- [ ] Implement state schema
- [ ] Move all constants to top (SUPPORTED_LANGS, timeouts, etc.)
- [ ] Implement `safe()` and `isReal()` helpers
- [ ] Implement i18n function `t()`

### Phase 2: Pure Functions (2-3 hours)
- [ ] Copy `score()` function (100% unchanged)
- [ ] Copy `entropy()` function (100% unchanged)
- [ ] Copy `getCharset()` (100% unchanged)
- [ ] Copy all 7 `add*Attacks()` functions (UNCHANGED)
- [ ] Copy calibration functions (UNCHANGED)
- [ ] Copy annotation functions (UNCHANGED)
- [ ] Copy all helper functions (UNCHANGED)

### Phase 3: ML (1 hour)
- [ ] Copy ONNX loading code (UNCHANGED)
- [ ] Copy `extractMLFeatures()` (UNCHANGED)
- [ ] Copy `predictHumanPattern()` (UNCHANGED)
- [ ] Copy `applyNeuralWeighting()` (UNCHANGED)
- [ ] Keep Neural calibration data (UNCHANGED)

### Phase 4: Main Pipeline (1 hour)
- [ ] Implement `analyzePassword()` — orchestrates analysis
- [ ] Implement `getVulns()` — vulnerability detection
- [ ] Implement `getScenarios()` — calls attack functions

### Phase 5: Rendering (1-2 hours)
- [ ] Implement `render()` function — single source of truth for UI
- [ ] Replace all scattered `resultLabelFast.textContent = ...` with `render(state)` calls
- [ ] Ensure all DOM mutations go through `render()`

### Phase 6: Event Handlers (1 hour)
- [ ] `onPasswordInput()` with debounce
- [ ] `onLanguageChange()` with dictionary reload
- [ ] `onToggleVisibility()`
- [ ] Language menu handlers

### Phase 7: Initialization (30 min)
- [ ] `initializeApp()` — query all DOM, setup listeners, load data
- [ ] Auto-init at DOMContentLoaded or immediate

### Phase 8: Testing & Fixes (1-2 hours)
- [ ] Test in browser (F12 console)
- [ ] Verify no crashes on input
- [ ] Verify language switching works
- [ ] Verify HIBP loading
- [ ] Verify generator (if enabled)

**Total Estimated Time:** 8-12 hours

---

## BUILD INTEGRATION

### 1. Update npm scripts in `/nunjuck/package.json`

```json
{
  "scripts": {
    "build": "npm run build:copy-app && npm run build:nunjuck",
    "build:copy-app": "cp ../app.js ./build/app.js",
    "build:nunjuck": "npx @11ty/eleventy",
    "watch": "npx @11ty/eleventy --watch"
  }
}
```

### 2. Update template (`/nunjuck/src/index.njk`)

```html
<!-- CHANGE THIS -->
<script src="/app.js" type="module"></script>

<!-- TO THIS -->
<script src="/app.js"></script>
```

### 3. Verify output

After build, `/nunjuck/build/app.js` should exist and be loaded by browser.

---

## VALIDATION CHECKLIST

### Code Quality
- [ ] No global variables except inside IIFE
- [ ] State is single source of truth
- [ ] All DOM access via `state.dom.*` with `isReal()` checks
- [ ] Pure functions (score, entropy, etc.) unchanged
- [ ] ML code unchanged
- [ ] No console errors in F12

### Functionality
- [ ] Type password → analysis appears
- [ ] Change language → all 9 languages work
- [ ] HIBP check → spinner shows, result displays
- [ ] Toggle visibility → password shows/hides
- [ ] Generator works (if present)
- [ ] All 7 attacks calculate correctly
- [ ] ML weighting affects estimates (if enabled)

### Performance
- [ ] Initial load < 2s
- [ ] Password input debounce works (160ms)
- [ ] HIBP debounce works (600ms)
- [ ] Dictionary loads asynchronously
- [ ] No memory leaks (check DevTools)

### 11ty Integration
- [ ] `npm run build` succeeds
- [ ] 143 HTML files generated
- [ ] `/build/app.js` present and correct size
- [ ] Script loads in HTML output

---

## COMMON BUGS TO AVOID

1. **setLang() accessing undefined `input`**
   - FIX: Always use `state.dom.input` with `isReal()` check
   - Pattern: `if (isReal(state.dom.input)) { state.dom.input.type = ...; }`

2. **resultLabelFast.textContent crashes**
   - FIX: All DOM writes through `render()` function
   - `render()` checks `isReal()` before touching DOM

3. **Multiple render() calls cause flicker**
   - FIX: Batch updates in `analyzePassword()`, then call `render()` once
   - NOT: Call `render()` after each property update

4. **ML code not isolated**
   - FIX: Keep all ML in separate functions (loadONNXRuntime, predictHumanPattern, etc.)
   - They don't mutate state, just return values

5. **Singleton NoOp proxy mutations**
   - FIX: Removed completely, use `null` and `isReal()` checks
   - Much cleaner than Proxy pattern

---

## FILES TO MODIFY

1. **`/home/Baudouin/Documents/Projets/CrackDate/app.js`** (MAIN)
   - Complete rewrite using IIFE template above
   - ~5500 lines final

2. **`/home/Baudouin/Documents/Projets/CrackDate/nunjuck/src/index.njk`**
   - Remove `type="module"` from `<script src="/app.js"></script>`

3. **`/home/Baudouin/Documents/Projets/CrackDate/nunjuck/package.json`**
   - Add npm script for copying app.js before build

4. **`/home/Baudouin/Documents/Projets/CrackDate/nunjuck/.eleventy.js`** (optional)
   - May need to add passthrough copy rule for app.js

---

## GIT WORKFLOW

```bash
# In new session with full context:

# 1. Create feature branch
git checkout -b rewrite/app-js-iife

# 2. Rewrite app.js using IIFE template above
# ... implement phases 1-7

# 3. Update config
# ... modify nunjuck/package.json, index.njk

# 4. Build and test
npm run build
# Test in browser: http://localhost:8000/en/index.html

# 5. Commit
git add app.js nunjuck/package.json nunjuck/src/index.njk
git commit -m "refactor: rewrite app.js as clean IIFE with centralized state

- Replace 60+ global variables with single state object
- Remove mutable singleton NoOp pattern
- Centralize DOM queries in initializeApp()
- All DOM mutations through render() function
- Keep all pure analysis functions unchanged
- Keep ONNX ML code unchanged (hidden but active)
- 7 displayed attacks only (Brute, Dict, Hybrid, Mask, Markov, PCFG, Combi)
- No more undefined variable crashes (setLang, resultLabelFast, etc.)
- 100% compatible with 11ty/Nunjuck

Tested:
- npm run build: 143 files generated ✓
- Password input: analysis appears ✓
- Language switching: all 9 langs work ✓
- No console errors ✓

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# 6. Create PR
git push origin rewrite/app-js-iife
gh pr create --title "Refactor: rewrite app.js with IIFE + centralized state" ...
```

---

## MEMORY UPDATES NEEDED

Create/update in `/home/Baudouin/.claude/projects/-home-Baudouin-Documents-Projets-CrackDate/memory/`:

1. **app_js_rewrite_plan_2026_05_08.md**
   - Reference this handoff
   - Progress tracking for next session

2. **Update MEMORY.md index**
   - Link to rewrite handoff
   - Status: "Ready for implementation session"

---

## NEXT SESSION CHECKLIST

When starting fresh session:

1. ✅ Load this handoff document
2. ✅ Read state schema carefully
3. ✅ Follow IIFE template structure
4. ✅ Implement phases 1-8 in order
5. ✅ Use validation checklist
6. ✅ Test each phase before moving to next
7. ✅ Commit after phase 5 (rendering works)
8. ✅ Commit after phase 8 (complete + tested)

---

## SUMMARY

**What:** Complete rewrite of app.js monolith
**How:** IIFE with centralized state (not ES6 modules)
**Why:** Fix crashes (undefined variables), simplify architecture, prepare for 11ty deployment
**Result:** Clean 5500-line IIFE compatible with 11ty/Nunjuck
**Time:** 8-12 hours with full context
**Status:** Ready to implement — handoff complete ✓

---

**Created:** 2026-05-08 13:45 UTC
**Session Context:** 85% usage at creation
**Next Action:** Start fresh session, load this handoff, begin Phase 1
