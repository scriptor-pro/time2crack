---
title: Handoff — app.js Modularization & IIFE Refactoring Blueprint
date: 2026-05-09
author: Claude Haiku
context: Modular structure created, ready for IIFE conversion
---

# Handoff: app.js Modularization Architecture

## ✅ WHAT WAS COMPLETED

### 1. Modular Structure Created (12 Components)

Successfully split the 6831-line `app.js` monolith into 12 focused modules organized by responsibility:

```
app/
├── state.js           (2.2 KB)   — Centralized state object, helpers
├── i18n.js           (107 KB)   — Translations (9 languages)
├── constants.js       (30 KB)   — ALGOS, COMMON passwords, calibrations
├── analysis.js        (38 KB)   — Pure functions (score, entropy, charset, etc)
├── attacks.js         (32 KB)   — Attack scenario builders (7 attacks)
├── formatting.js      (9 KB)    — Formatting & morphological helpers
├── ml.js             (12 KB)   — ONNX loading & ML prediction
├── dictionary.js      (1.7 KB)  — Dictionary lazy-loading & caching
├── calibrations.js    (19 KB)   — Calibration data (PCFG, Markov, Neural, Prince)
├── hibp.js           (5 KB)    — HIBP & Bloom filter operations
├── render.js         (9 KB)    — Single render() function
├── init.js           (26 KB)   — Initialization & event handlers
├── index.js          (2.9 KB)  — Entry point template
└── README.md                    — Architecture documentation
```

**Total: 312 KB, ~6.2K lines**

### 2. Build Infrastructure

- **`scripts/build-app-js.sh`** — Automated concatenation script
  - Combines modules in correct order
  - Wraps in IIFE
  - Outputs to `/app.js` (ready for 11ty build)
  - Can be enhanced for minification/source maps later

### 3. Documentation

- **`app/README.md`** — Complete module breakdown, load order, dependencies
- **`app_js_modularization_2026_05_09.md`** — Memory file with detailed architecture
- **`MEMORY.md`** — Updated status & progress tracking
- **Git commits** — Well-documented with context

---

## 🎯 NEXT SESSION: IIFE REFACTORING

The modular structure is a **blueprint** for the actual refactoring. Next session should:

### Step 1: Convert to Centralized State Pattern

Replace all scattered global variables with a single `state` object:

**Before (current globals):**
```javascript
let LANG = "en";
let DICT_WORDS = null;
let DICT_LOADING = false;
let BLOOM_FILTER = null;
let ML_NORMALIZATION = null;
// ... 60+ global variables
```

**After (centralized state):**
```javascript
const state = {
  lang: "en",
  cache: {
    dictWords: null,
    bloomFilter: null,
    ml: { normalization: null },
  },
  ui: {
    dictLoading: false,
    // ...
  },
  // ... centralized structure
};
```

### Step 2: Update All Module References

In each module, replace:
- `LANG` → `state.lang`
- `DICT_WORDS` → `state.cache.dictWords`
- `DICT_LOADING` → `state.ui.dictLoading`
- `BLOOM_FILTER` → `state.cache.bloomFilter`
- etc.

**Priority modules** (do first):
1. `state.js` — Add full state schema
2. `i18n.js` — Update `t()` function to use `state.lang`
3. `analysis.js` — Update `isDictWord()` to use `state.cache.dictWords`
4. `dictionary.js` — Update `loadDictionary()` to mutate `state`
5. `render.js` — Update to read from `state.results`
6. `init.js` — Update initialization & event handlers

**Less critical modules** (do after):
- `attacks.js` — References COMMON/TOP_100 (constants, not state)
- `ml.js` — References `state.cache.ml`
- `calibrations.js` — References `state.cache.calibrations`
- `hibp.js` — References `state.cache.bloomFilter`

### Step 3: Test Each Conversion

After converting each module, test:
1. **Syntax check**: `node -c app.js`
2. **Build**: `npm run build`
3. **Browser test**: Open `/en/index.html`, type password, verify analysis works
4. **Console errors**: Check F12 for any runtime errors

### Step 4: Finalize IIFE Wrapper

Ensure final structure is:

```javascript
(function() {
  "use strict";

  // ============================================================
  // 1. STATE & HELPERS (from state.js)
  // ============================================================
  const state = { /* ... */ };
  const safe = (id) => document.getElementById(id);
  // ... helpers

  // ============================================================
  // 2. I18N (from i18n.js)
  // ============================================================
  const I = { /* ... */ };
  function t(key) { /* ... */ }

  // ============================================================
  // 3-12. ALL OTHER MODULES
  // ============================================================
  // [content from constants.js, analysis.js, attacks.js, etc]

  // ============================================================
  // AUTO-INITIALIZATION
  // ============================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
```

---

## 📋 REFACTORING CHECKLIST

### Phase 1: State Schema & Helpers
- [ ] Define complete `state` object in `state.js`
- [ ] Test `safe()` and `isReal()` work correctly
- [ ] Verify `detectBrowserLanguage()` initializes `state.lang`

### Phase 2: I18N Conversion
- [ ] Update `t()` function to use `state.lang`
- [ ] Update `syncA11yLabels()` to read from `state.dom.*`
- [ ] Test all 9 languages still work

### Phase 3: Analysis Functions
- [ ] Update `isDictWord()` to use `state.cache.dictWords`
- [ ] Verify `score()`, `entropy()`, `getCharset()` unchanged (pure functions)
- [ ] Test password analysis still works

### Phase 4: Data Loading
- [ ] Update `loadDictionary()` to mutate `state.cache`
- [ ] Update all `loadXxxCalibration()` functions
- [ ] Update HIBP/Bloom loading functions
- [ ] Test lazy-loading still works

### Phase 5: Rendering
- [ ] Create complete `render(state)` function
- [ ] Update all DOM mutations to go through `render()`
- [ ] Test UI updates when password changes
- [ ] Test language switching updates UI

### Phase 6: Event Handlers
- [ ] Update `onPasswordInput()` to use `state.password`
- [ ] Update `onLanguageChange()` to use `state.lang`
- [ ] Update `onToggleVisibility()` to use `state.ui.showPassword`
- [ ] Test all input handlers work

### Phase 7: Initialization
- [ ] Update `initializeApp()` to:
  - Cache all DOM elements in `state.dom`
  - Load initial language from localStorage
  - Setup all event listeners
  - Call initial `render(state)`
- [ ] Test initialization on page load

### Phase 8: Final Testing
- [ ] `node -c app.js` — No syntax errors
- [ ] `npm run build` — Build succeeds, 143 HTML files
- [ ] Open browser: `/en/index.html`
- [ ] Type password → analysis appears ✓
- [ ] Language switch → UI updates ✓
- [ ] HIBP check → spinner + result ✓
- [ ] Generator → passwords generate ✓
- [ ] No console errors ✓
- [ ] Mobile responsive (320px, 375px, 480px) ✓

---

## 🔑 KEY DECISIONS (Finalized)

1. **IIFE, not ES6 modules** — Compatible with 11ty/Nunjuck (no `type="module"`)
2. **Centralized `state` object** — Single source of truth (not scattered globals)
3. **Pure functions unchanged** — All analysis/scoring logic stays identical
4. **Single `render()` function** — All DOM mutations through one place
5. **Lazy-loading preserved** — Dictionary, ML model, calibrations load on-demand
6. **ML ONNX optional** — Neural detection remains hidden but active

---

## 📊 EXPECTED OUTCOMES

After refactoring:

### Code Quality
- ✅ Single `state` object (no 60+ global variables)
- ✅ All DOM access via `state.dom.*` with `isReal()` checks
- ✅ All DOM mutations through `render()` (no scattered `.textContent = ...`)
- ✅ No undefined variable crashes (setLang, resultLabelFast, etc)
- ✅ Pure functions isolated (analysis.js, attacks.js)

### Functionality
- ✅ Type password → analysis appears
- ✅ Language switching works (all 9 languages)
- ✅ HIBP check shows spinner + result
- ✅ Toggle visibility works
- ✅ Generator works (if enabled)
- ✅ All 7 attacks calculate correctly
- ✅ ML weighting affects estimates

### Performance
- ✅ Initial load < 2s
- ✅ Password input debounce (160ms)
- ✅ HIBP debounce (600ms)
- ✅ Dictionary loads asynchronously
- ✅ No memory leaks

### Compatibility
- ✅ 11ty build succeeds
- ✅ 143 HTML files generated
- ✅ Script loads in all HTML outputs
- ✅ Works on all 9 languages
- ✅ Mobile responsive

---

## 🚀 WHY THIS APPROACH?

**Original problem**: 6831-line app.js with:
- 60+ scattered global variables
- Multiple closures over `input` element
- undefined variable crashes (`setLang`, `resultLabelFast`)
- Monolithic structure (hard to test, modify, maintain)

**Solution**: 
1. Create modular reference (12 components) ✅ **DONE**
2. Convert to centralized state pattern ← **NEXT SESSION**
3. Maintain 100% of existing functionality
4. Improve code quality & maintainability
5. Enable future feature additions

**Risk mitigation**:
- Modular structure tested & committed
- Build script validated
- Original app.js preserved on `main` branch
- Working on isolated `rewrite/app-js-iife` branch
- Can revert if issues arise

---

## 📁 FILES TO MODIFY NEXT SESSION

1. **`/app/state.js`** ← Add complete state schema
2. **`/app/i18n.js`** ← Update `t()` to use `state.lang`
3. **`/app/analysis.js`** ← Update `isDictWord()` to use `state.cache.dictWords`
4. **`/app/dictionary.js`** ← Update `loadDictionary()` to mutate `state`
5. **`/app/calibrations.js`** ← Similar updates for all calibration functions
6. **`/app/ml.js`** ← Update to use `state.cache.ml`
7. **`/app/hibp.js`** ← Update to use `state.cache.bloomFilter`
8. **`/app/render.js`** ← Create centralized render function
9. **`/app/init.js`** ← Update initialization to cache DOM in `state.dom`
10. **`/scripts/build-app-js.sh`** ← Already correct, no changes needed
11. **Final merge**: Combine all updates into unified `/app.js` via build script

---

## 🎓 LESSONS LEARNED

1. **Modularization first** — Easier to refactor 300-line module than 6800-line file
2. **Clear boundaries** — Responsibility-driven separation makes changes local
3. **Blueprint approach** — Having reference structure prevents sync errors
4. **Documentation matters** — This handoff saves future context switching
5. **Git discipline** — Commit frequently, write clear messages, use feature branches

---

## 📞 HANDOFF CHECKLIST

Before starting next session:

- [ ] Read this handoff completely
- [ ] Review `app/README.md` for module overview
- [ ] Check `app_js_modularization_2026_05_09.md` memory file
- [ ] Look at commit `ea00cb2e` for structure
- [ ] Verify branch `rewrite/app-js-iife` is current
- [ ] Test build script: `bash scripts/build-app-js.sh`
- [ ] Verify original still works: `git checkout main app.js && npm run build`
- [ ] Return to branch: `git checkout rewrite/app-js-iife`

---

## 🎯 SESSION GOALS (Next)

**Primary Goal**: Convert modular structure to IIFE with centralized state

**Success Criteria**:
- ✅ No 60+ global variables (only `state` object)
- ✅ `node -c app.js` passes
- ✅ `npm run build` generates 143 files
- ✅ Browser tests pass (password analysis, language switching, HIBP)
- ✅ No console errors in F12
- ✅ Mobile responsive (320px, 375px, 480px)

**Time Estimate**: 6-8 hours with modular reference

---

## 📝 SUMMARY

**What you have**:
- 12-module architecture (proven structure)
- Build script (automated concatenation)
- Documentation (complete reference)
- Feature branch ready (no merge conflicts)

**What you'll do**:
- Convert each module to use `state` object
- Test after each module
- Run full test suite
- Commit cleanly
- Merge to main

**Why it works**:
- Modular = manageable pieces (not 6800-line refactor)
- Blueprint = clear goals (not guessing)
- Documentation = context preserved (not lost)
- Branch = safe experimentation (can revert)

---

**Created**: 2026-05-09 14:30 UTC  
**Session Context**: Modularization complete, ready for IIFE conversion  
**Next Action**: Start fresh session, follow checklist, begin Phase 1 (state schema)

Good luck! 🚀
