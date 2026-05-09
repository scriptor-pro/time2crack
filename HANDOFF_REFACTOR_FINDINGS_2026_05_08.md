---
title: Handoff — app.js Refactorisation Strategy Decision
date: 2026-05-08 (after session rollback)
context: Previous refactorisation progressive hit architectural limits
---

# Handoff: What We Learned & What to Do Next

## Session Summary (2026-05-08)

**Attempted**: Refactorisation progressive (centraliser 40+ global variables)
**Result**: Rolled back. Code original intact.

### Why it failed
- Code has **implicit architecture** with tight coupling
- Variables scattered globally but used in 150+ interdependent functions
- Scope collisions when trying to localize (ex: `input` redefined in closures)
- Order-of-execution issues (DOMContentLoaded initialization vs global code)

**Key insight**: Can't safely refactor progressively without understanding ALL dependencies first.

## Three Options for Next Attempt

### ✓ **OPTION A: Complete Rewrite (IIFE + Central State)**
- **File**: `HANDOFF_REWRITE_APP_JS_2026_05_08.md` (full plan)
- **Duration**: 8-12 hours
- **Approach**: Start fresh IIFE with `state` object
- **Risk**: High (all-or-nothing)
- **Benefit**: Clean architecture, zero tech debt
- **When**: New session with 4+ hours context

### ✓ **OPTION B: Refactor by Domain**
- **Duration**: 3-4 days (15-20 hours)
- **Approach**: 
  1. Pick one domain (ex: "ML prediction" or "HIBP check")
  2. Extract to pure function
  3. Move to `state`
  4. Test in isolation
  5. Repeat next domain
- **Risk**: Low (incremental, tested each step)
- **Benefit**: Works towards clean architecture gradually
- **When**: Multiple 2-3 hour sessions

### ✓ **OPTION C: Wrapper Pattern (Zero Risk)**
- **Duration**: 2-3 hours
- **Approach**:
  1. Keep app.js 100% intact
  2. Create `state` object as cache/proxy
  3. Sync selectively (no touching internals)
  4. Safe migration path for future
- **Risk**: None (no code changes)
- **Benefit**: Zero regression, can migrate later
- **When**: If shipping soon is priority

## What to Keep From This Session

✅ **Template changes** (KEEP THESE):
- Removed `type="module"` from 9 pages + 1 main template
- Makes script compatible with IIFE (already in place)
- No risk, all benefits

```diff
- <script src="/app.js" type="module"></script>
+ <script src="/app.js"></script>
```

These changes are already in templates and in build/ — they're good.

## Artifacts Created

- `app.js.backup` — Full backup of original (6854 lines)
- `REFACTOR_FINDINGS_2026_05_08.md` — Detailed technical report
- Memory file: `app_js_refactor_strategy_2026_05_08.md`

## Next Session Checklist

### Before Starting
- [ ] Decide: Option A, B, or C?
- [ ] Allocate time accordingly
- [ ] Read this handoff + chosen approach document

### If Option A (Rewrite)
- [ ] Load `HANDOFF_REWRITE_APP_JS_2026_05_08.md`
- [ ] Start fresh session with full context
- [ ] Follow 8 phases systematically
- [ ] Test each phase before moving to next

### If Option B (Domain)
- [ ] Map domains first (ML, HIBP, Analysis, UI, etc.)
- [ ] Pick smallest domain first
- [ ] Extract + test + verify
- [ ] Commit after each domain

### If Option C (Wrapper)
- [ ] Create `state` as read-only cache
- [ ] Add sync points selectively
- [ ] No changes to app.js logic
- [ ] Plan Option A for later

---

**Created**: 2026-05-08 after rollback
**Previous attempt**: Refactorisation progressive (failed, code restored)
**Status**: Ready for next decision + action
