# App Modular Structure

This directory contains modular components of `app.js`, organized by responsibility.

## Modules

| Module | Size | Purpose |
|--------|------|---------|
| **state.js** | 2.2 KB | Centralized state object & helpers (`safe()`, `isReal()`, etc) |
| **i18n.js** | 107 KB | Translations (I18N) for 9 languages (EN, FR, ES, PT, DE, IT, TR, PL, NL) |
| **constants.js** | 32 KB | Algorithm configs (ALGOS), password lists (COMMON, TOP_100), and calibration defaults |
| **analysis.js** | 40 KB | Pure functions: `score()`, `entropy()`, `getCharset()`, `isDictWord()`, helpers |
| **attacks.js** | 32 KB | Attack scenario functions: `addBruteForceAttacks()`, `addDictionary()`, `addHybrid()`, `addMask()`, `addMarkov()`, `addPCFG()`, `addCombinator()` |
| **ml.js** | 12 KB | Machine learning: ONNX runtime loading, feature extraction, prediction |
| **dictionary.js** | 4 KB | Dictionary lazy-loading & caching (per-language wordlists) |
| **calibrations.js** | 20 KB | Calibration data loading (PCFG, Markov, Neural, Prince) |
| **hibp.js** | 8 KB | Have I Been Pwned (HIBP) & Bloom filter checking |
| **render.js** | 12 KB | Single `render()` function — source of truth for UI updates |
| **init.js** | 28 KB | Initialization, DOM element caching, event listeners |

**Total: ~312 KB uncompressed, ~6.8k lines**

## Build Process

```bash
./scripts/build-app-js.sh
```

This script:
1. Starts an IIFE wrapper
2. Concatenates all modules in order
3. Closes the IIFE
4. Outputs to `/app.js` (ready for 11ty build)

## Load Order (Important!)

Modules must be combined in this order:

1. **state.js** — State object & helpers (required by all others)
2. **i18n.js** — Translations
3. **constants.js** — Constants (referenced by analysis & attacks)
4. **analysis.js** — Pure analysis functions
5. **attacks.js** — Attack functions (depend on constants)
6. **ml.js** — ML functions
7. **dictionary.js** — Dictionary loading
8. **calibrations.js** — Calibration loading
9. **hibp.js** — HIBP functions
10. **render.js** — Render function
11. **init.js** — Initialization & event setup

## Variable References

All modules reference `state` object and helper functions:
- `state` — centralized state object
- `safe()` — safe DOM element getter
- `isReal()` — null/undefined check
- `t()` — translation function
- `I` — translation object

## Development Notes

- **Pure functions** (analysis.js, attacks.js): No side effects, no state mutation
- **Side effects** (render.js, init.js): Interact with DOM/state
- **Data loading** (dictionary.js, calibrations.js, ml.js): Async operations with caching
- **Constants** (constants.js): Immutable configuration data

## Next Steps

- Add JSDoc comments to each module for IDE support
- Create unit tests for each module
- Add source maps for debugging
- Consider ES6 module syntax if moving away from IIFE pattern
