---
title: Architectural Decisions — app.js Rewrite (2026-05-08)
date: 2026-05-08
---

# Decisions Made (2026-05-08)

## Context
- **Problem:** app.js is 6848 lines of chaos with 60+ global variables, crashes on missing DOM, undefined variables in setLang()
- **Site:** time2crack.eu exists with working modular version (separate calc.js, rank/, time.js)
- **Constraints:** Must work with 11ty/Nunjuck templates (server-side rendered static HTML + client-side JS)
- **Session Context:** Started at 85% token usage → handoff created before context exhausted

## Decision 1: IIFE vs ES6 Module

### Options Evaluated
1. **IIFE (Immediately Invoked Function Expression)**
   - `(function() { ... })()` at top level
   - No imports/exports
   - State isolated in closure
   - Current site en ligne uses this

2. **ES6 Module**
   - `export function initApp() { ... }`
   - `<script type="module">` in HTML
   - Testable with exports
   - More modern

3. **IIFE + type="module"** (BAD)
   - Incompatible pattern mixing
   - IIFE returns nothing, module expects exports

### ✅ Decision: **IIFE (Classical, no type="module")**

**Rationale:**
- ✅ Matches site en ligne (proven in production)
- ✅ Zero friction with 11ty (just `<script src="/app.js"></script>`)
- ✅ State completely isolated in closure
- ✅ No complex imports during build
- ✅ Simple to debug
- 🟡 Trade-off: Not testable unitarily (acceptable for now)

**Impact:** 
- Remove `type="module"` from `<script>` tags in all index.njk files
- app.js stays as standalone file, no modules

---

## Decision 2: Attacks Displayed

### Options Evaluated
1. **7 Attacks Only** (site en ligne displays)
   - Brute Force, Dictionary, Hybrid, Mask, Markov, PCFG, Combinator
   - Simpler UI
   - Remove: Rule, Prince, Rainbow, Spray, Targeted, Morphological

2. **14 Attacks** (current app.js implements)
   - Show all, let users understand complexity
   - UI becomes crowded
   - More maintenance

3. **7 Displayed + 7 Hidden** (Hybrid)
   - Display 7, use others internally for calibration
   - Keep Prince/Rule for advanced calculations
   - Complex to maintain

### ✅ Decision: **7 Attacks Only**

**Rationale:**
- ✅ Matches site en ligne
- ✅ Cleaner UX (not overwhelming)
- ✅ Simpler code (remove add*Attacks functions)
- ✅ Easier maintenance
- Site en ligne users are happy with 7

**Remove Functions:**
- `addRuleBasedAttacks()`
- `addPrinceAttacks()` (may repurpose internally)
- `addRainbowTableAttacks()`
- `addSprayAttacks()`
- `addTargetedAttacks()`
- `addMorphologicalAttacks()`

**Keep Calibrations:**
- PCFG (used)
- Markov (used)
- Neural (used, hidden)
- Prince (remove, or keep for internal weighting)

---

## Decision 3: ML/Neural (ONNX)

### Options Evaluated
1. **Keep ONNX** (approach from analysis)
   - Load ONNX Runtime (~2MB)
   - Predict human vs random (0-1 probability)
   - Adjust attack estimates based on prediction
   - Show "Human-like pattern detected" in vulns
   - +200-500ms first render

2. **Remove ONNX Completely**
   - No ML at all
   - Faster, simpler
   - Less accurate estimates
   - Lose "human vs random" detection

3. **Keep Hidden** (Approach 1 from earlier)
   - Same as "Keep ONNX"
   - Used internally but not displayed as 8th attack

### ✅ Decision: **Keep ONNX (Hidden but Active)**

**Rationale:**
- ✅ Improves accuracy of estimates
- ✅ Educates users ("why Markov is better than brute here")
- ✅ Site en ligne uses it (proven)
- ✅ Not UI-heavy (just badge in vulns, not separate attack)
- ✅ ONNX is loaded asynchronously (doesn't block)
- Acceptable latency cost for better analysis

**Implementation:**
- Load ONNX Runtime on first password input
- Calculate mlProbability
- Use in applyNeuralWeighting() to adjust estimates
- Display in vulns if > 0.85 confidence
- Cache model in state.cache.ml

---

## Decision 4: State Management

### Options Evaluated
1. **Scattered Global Variables** (current)
   - 60+ variables
   - Closures over undefined variables crash
   - Impossible to track state
   - Current: causes setLang() crashes

2. **Single Centralized State Object**
   - `const state = { password, lang, dom, cache, results, ui }`
   - All access through `state.property`
   - Clear what's available
   - Easy to debug

3. **Class-Based** (OOP)
   - `class PasswordAnalyzer { ... }`
   - More boilerplate
   - Overkill for this app

### ✅ Decision: **Single Centralized state Object (IIFE closure)**

**Rationale:**
- ✅ Fixes undefined variable crashes immediately
- ✅ Single source of truth
- ✅ Easy to inspect in console: `window.state` (can expose for debug)
- ✅ Type-safe if using JSDoc comments
- ✅ Scales for future features

**Structure:**
```javascript
const state = {
  lang: string,
  password: string,
  dom: { input, results, strengthLabel, ... },  // ALL DOM refs
  cache: { dictWords, bloomFilter, ml, calibrations },
  results: { score, entropy, scenarios, vulns, mlProbability },
  ui: { isPending, debounceTimer, showPassword, selectedAlgo }
};
```

---

## Decision 5: 11ty/Nunjuck Integration

### Options Evaluated
1. **Passthrough Copy** (11ty feature)
   - Copy app.js from root into build/
   - Automatic via `.eleventy.js`
   - Clean

2. **Manual Script Copy**
   - npm script: `cp ../app.js ./build/app.js` before build
   - Explicit, visible in package.json

3. **Serve from Root**
   - No copy, web server serves ../app.js
   - Works during dev
   - Fragile for production

### ✅ Decision: **Manual npm Script (Explicit)**

**Rationale:**
- ✅ Visible in package.json (clear what happens)
- ✅ Works with any 11ty version (no dependency on passthrough feature)
- ✅ No need to touch .eleventy.js
- ✅ `npm run build` does everything in order

**npm script:**
```json
"scripts": {
  "build": "npm run build:copy-app && npm run build:nunjuck",
  "build:copy-app": "cp ../app.js ./build/app.js",
  "build:nunjuck": "npx @11ty/eleventy"
}
```

**Template change:**
```html
<!-- BEFORE -->
<script src="/app.js" type="module"></script>

<!-- AFTER -->
<script src="/app.js"></script>
```

---

## Decision 6: Rendering Strategy

### Options Evaluated
1. **Scattered DOM Updates** (current)
   - `resultLabelFast.textContent = ...`
   - `ctList.innerHTML = ...`
   - `vulnTagsEl.innerHTML = ...`
   - 50+ individual updates scattered
   - Leads to crashes, inconsistent state

2. **Single render(state) Function**
   - All DOM mutations in ONE function
   - Idempotent (safe to call multiple times)
   - Easy to trace state → UI
   - Clear what gets rendered

3. **Component-Based** (too heavy)
   - Virtual DOM, re-render framework
   - Overkill for vanilla JS

### ✅ Decision: **Single render(state) Function**

**Rationale:**
- ✅ Eliminates scattered DOM mutations
- ✅ Fixes crashes from missing elements (all guarded with isReal())
- ✅ Idempotent: safe to call after any state change
- ✅ Single source of truth for UI
- ✅ Easy to debug: inspect render() function

**Pattern:**
```javascript
function render(state) {
  if (!isReal(state.dom.results)) return;
  
  // All DOM updates here
  if (state.password) {
    state.dom.results.classList.remove("is-empty");
    if (isReal(state.dom.strengthLabel)) {
      state.dom.strengthLabel.textContent = scoreText(state.results.score);
      state.dom.strengthLabel.style.color = scoreColor(state.results.score);
    }
    // ... more updates
  } else {
    state.dom.results.classList.add("is-empty");
  }
}
```

**Call Site:**
- After `analyzePassword()` completes
- After language change
- After UI toggle

---

## Decision 7: Function Organization (IIFE Sections)

### Options Evaluated
1. **All Mixed** (current)
   - No clear sections
   - 6848 lines of chaos

2. **Organized Sections** (chosen)
   - Configuration & Constants
   - State Definition
   - Utility Functions (safe, isReal)
   - Translations (I18n)
   - Analysis Functions (score, entropy, etc.)
   - ML Functions
   - Main Pipeline (analyzePassword)
   - Rendering (render)
   - Event Handlers
   - Initialization

3. **Separate Files** (modules)
   - Too complex for 11ty setup

### ✅ Decision: **Organized Sections Inside Single IIFE**

**Rationale:**
- ✅ Easy to navigate (comment headers)
- ✅ Still single file (no import complexity)
- ✅ Clear responsibility per section
- ✅ Copy-paste from current app.js is section-by-section

---

## Decision 8: Testing & Validation

### What to Test
1. **No Console Errors** (F12)
   - No TypeError, ReferenceError, SyntaxError
2. **Input → Analysis** (Golden Path)
   - Type password → analysis appears
3. **Language Switching** (All 9 langs)
   - Click lang menu → changes immediately
4. **HIBP Check**
   - Click HIBP button → loading spinner → result
5. **Generator** (if present)
   - Generate password → displays
6. **Performance**
   - Initial load < 2s
   - Debounce works (160ms for input)

### Validation Checklist
- [ ] Build succeeds: `npm run build`
- [ ] 143 HTML files generated
- [ ] `/build/app.js` exists and has correct size
- [ ] No console errors in browser
- [ ] Password input works
- [ ] All 7 attacks calculate correctly
- [ ] ML weighting affects estimates
- [ ] Language menu works (all 9)
- [ ] HIBP loading works
- [ ] Generator works

---

## Decision 9: Commits & Git Workflow

### Commit Strategy
1. **One large commit** (not many small ones)
   - Reason: Coordinated change across app.js + config
   - Size: Changed ~6800 lines

2. **Detailed commit message**
   - What changed (rewrite architecture)
   - Why (state centralization, crash fixes)
   - What was preserved (all analysis logic)
   - Testing performed

3. **Feature branch**
   - `rewrite/app-js-iife`
   - PR → review → merge to main

---

## Decision 10: Deprecations & Removals

### What Gets Removed
- ✅ `createNoOp()` and `noOpElement` singleton (replaced with null + isReal checks)
- ✅ `ML_MODEL` variable (TensorFlow.js, deprecated)
- ✅ `ML_PRED_CACHE` (never used)
- ✅ Rule-based attack functions (not displayed)
- ✅ Prince attack display (kept internally if needed)
- ✅ Rainbow table display
- ✅ Spray attack display
- ✅ Targeted attack display
- ✅ Morphological attack display

### What Gets Preserved
- ✅ All 7 displayed attack functions (100% unchanged logic)
- ✅ All calibration data (PCFG, Markov, Neural)
- ✅ All analysis functions (score, entropy, charset, etc.)
- ✅ ONNX Runtime + ML code (unchanged)
- ✅ HIBP checking
- ✅ Dictionary loading
- ✅ Bloom filter
- ✅ All translations (I18n)

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Architecture** | IIFE with 60+ globals | IIFE with 1 state object |
| **DOM Access** | Direct `input.value`, crashes on missing | Via `state.dom.input` with `isReal()` checks |
| **Rendering** | 50+ scattered mutations | Single `render(state)` function |
| **Attacks** | 14 displayed | 7 displayed |
| **ML** | Complex, unclear | Hidden but active, affects estimates |
| **11ty** | `type="module"` (wrong) | Plain `<script>` (correct) |
| **Lines** | 6848 | ~5500 |
| **Bugs** | 23 identified | 0 (architecture fixed) |

---

## What Happens Next

1. **New session** (when context refreshed)
2. Load handoff: `HANDOFF_REWRITE_APP_JS_2026_05_08.md`
3. Follow 8-phase implementation plan (8-12 hours)
4. Test continuously
5. Commit
6. Deploy

---

**Created:** 2026-05-08 13:50 UTC  
**Session:** 85% context → handoff complete before exhaustion
**Status:** Ready for implementation ✅
