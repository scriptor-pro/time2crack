# Handoff: Phase 2 - DOMContentLoaded + Null Guard Fixes (2026-05-09)

## Status: 🟡 IN PROGRESS - Null reference guards nearly complete

**Last Session:** Fixed DOMContentLoaded wrapper + removed 7 unused attack types
**This Session:** Applying null guards to optional UI elements
**Current Issue:** resetBtn, toggleBtn and other optional elements need null checks

---

## What Was Done This Session

### ✅ Completed
1. **Fixed DOMContentLoaded wrapper** (Commits: `f099f6c`, `1d641ff`, `2c247663`)
   - Wrapped password analyzer in `document.addEventListener("DOMContentLoaded", () => {`
   - Added early `if (!input) return;` to prevent crashes on non-password pages
   - This prevents initialization on about/faq/privacy pages

2. **Aligned to 7 supported attacks** (Commits: `0dcf208`, `c4091de1`)
   - Removed from ATTACK_TAB_CONFIG: rule, prince, rainbow, spray, targeted, neural, morph
   - Kept 7 attacks: brute, dict, hybrid, mask, markov, pcfg, combi
   - Removed unused attack functions (7 add*Attacks + 6 helper functions)
   - Size reduction: -382 lines (-5.7%), -12 KB (-4.3%)
   - **Final sizes:** 6,368 lines | 264 KB

3. **Started null guards** (In progress)
   - Added `if (toggleBtn)` guard before `toggleBtn.addEventListener`
   - Applied `if (resetBtn)` guards via sed to all resetBtn usage (3 locations)
   - **Still need:** Wrap `resetBtn.addEventListener` in if block with closing brace

### 🟡 Current Blocker
**Problem:** resetBtn is null on pages without password analyzer
- Error at line 6125: `resetBtn.addEventListener("click", ...)` crashes
- Error at line 5356: `resetBtn.classList.add()` in setPendingState()

**Current State:**
- Source file: `/home/Baudouin/Documents/Projets/CrackDate/v2/public/app.js`
  - Lines 5353, 5592, 5650: classList guards applied ✅
  - Line 6125: addEventListener wrapper added but missing closing brace ❌
- Build file: `/home/Baudouin/Documents/Projets/CrackDate/nunjuck/build/app.js`
  - Not yet regenerated - syntax error in source

---

## What Needs to be Done (Next Session)

### 1. Fix resetBtn addEventListener (5 min)
Current state (line 6125 in source):
```javascript
  if (resetBtn) resetBtn.addEventListener("click", () => {
    input.value = "";
    input.type = "password";
    ...
    input.focus();
  });
  }  // <-- This closing brace is wrong/unmatched
```

**Should be:**
```javascript
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      input.value = "";
      input.type = "password";
      ...
      input.focus();
    });
  }
```

**Action:** Either manually fix the brace matching or use:
```bash
cd /home/Baudouin/Documents/Projets/CrackDate/v2/public
# Check current state
sed -n '6125,6145p' app.js

# Fix structure if needed - wrap addEventListener inside the if block
```

### 2. Verify and Build (2 min)
```bash
cd /home/Baudouin/Documents/Projets/CrackDate/nunjuck
node -c ../v2/public/app.js  # Verify syntax
cp ../v2/public/app.js ./build/app.js
npm run build
node -c ./build/app.js
```

### 3. Commit Changes (1 min)
```bash
cd ../v2/public
git add app.js
git commit -m "fix: add null guards for optional UI elements (resetBtn, toggleBtn)

Prevent null reference errors when elements don't exist on non-password pages.
Guard classList modifications and addEventListener calls.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

cd ../../nunjuck
git add ./build/app.js
git commit -m "build: regenerate after resetBtn null guards"
```

### 4. Browser Test (2 min)
- Kill and restart server: `pkill -f "python3 -m http.server"; sleep 2; cd ./build && python3 -m http.server 8000 &`
- Open http://localhost:8000 (should load without errors)
- Enter password like "Password2024!" 
- Verify 7 attacks display correctly
- Test HIBP check button
- No console errors ✅

---

## Critical Files

| File | Status | Notes |
|------|--------|-------|
| `/home/Baudouin/Documents/Projets/CrackDate/v2/public/app.js` | 🟡 IN EDIT | Source - has partial null guards, needs brace fix |
| `/home/Baudouin/Documents/Projets/CrackDate/nunjuck/build/app.js` | 🔴 STALE | Not updated yet due to syntax error in source |
| `/home/Baudouin/Documents/Projets/CrackDate/nunjuck/src/index.njk` | ✅ OK | Template correct, serves pw-input |

---

## Browser Errors (Before Fixes)

```
Uncaught TypeError: can't access property "addEventListener", resetBtn is null
    http://localhost:8000/app.js:6125

Uncaught TypeError: can't access property "classList", resetBtn is null
    setPendingState http://localhost:8000/app.js:5356
```

**Root Cause:** Index page has `pw-input` but NOT `reset-btn` (that's only on generator)
- So `resetBtn = $("reset-btn")` returns null
- Code tries to use resetBtn without checking

**Solution:** Guard all resetBtn/toggleBtn usages with `if (element)`

---

## Git History This Session

```
rewrite/app-js-iife
├─ f099f6c: fix: defer initialization + align to 7 attacks
├─ 00815da9: build: regenerate app.js
├─ 0dcf208: refactor: remove unused attack implementations  
├─ c4091de1: build: remove unused attacks
├─ 1d641ff: fix: early return if page lacks password input
├─ 2c247663: build: early input check
├─ efc7c11: fix: guard toggleBtn addEventListener
└─ ac2497a9: build: regenerate
```

main branch (v2/public):
```
├─ f099f6c: defer + 7 attacks
├─ 0dcf208: remove unused attacks
├─ 1d641ff: early return
└─ efc7c11: guard toggleBtn (IN PROGRESS)
```

---

## Known Issues to Watch

1. **resetBtn guard incomplete** - addEventListener wrapper needs proper brace structure
2. **Other optional elements** - Similar guards may be needed for: attackerFrame, hibpStatusBadge, etc. (but test first - may not crash)
3. **toggleBtn inside resetBtn block** - Line 6128 accesses `toggleBtn.querySelector("span")` - toggleBtn was already guarded above, should be safe

---

## Testing Checklist for Next Session

After applying all fixes:
- [ ] Source syntax valid: `node -c ../v2/public/app.js`
- [ ] Build syntax valid: `node -c ./build/app.js`
- [ ] Server runs: `cd ./build && python3 -m http.server 8000`
- [ ] Page loads at http://localhost:8000 (Ctrl+F5 to clear cache)
- [ ] No console errors on page load ✅
- [ ] Enter "password" → no errors ✅
- [ ] Enter "Password2024!" → 7 attacks display ✅
- [ ] HIBP button works
- [ ] Reset button works
- [ ] Test /en/generator.html also works

---

## Key Insights

**Why early return + null guards work:**
- Page loads → DOMContentLoaded fires
- If `input` (pw-input) doesn't exist, return immediately (non-password page like /about)
- If `input` exists, continue initialization
- For optional elements (resetBtn, toggleBtn), guard each usage with `if (element)` before calling methods

**Why this happened:**
- Index page structure:
  - HAS: #pw-input, #results, #hibp-check-btn
  - DOES NOT HAVE: #reset-btn, #toggle-visibility, #attacker-frame
- These elements only exist on /generator.html or specific pages
- app.js runs on ALL pages but assumes all elements exist

---

## Session Notes

- Context: Started at 70% (had capacity), ended at 90% (critical)
- Size reduction achieved: 12 KB saved by removing 7 unused attacks
- Code quality: Fixed initialization order + added guards progressively
- Test environment: localhost:8000 (build directory)

**Next person:** The fixes are nearly done - just need to fix the brace structure on resetBtn.addEventListener and rebuild. Should be <10 minutes of work!

---

**Session End:** 2026-05-09 (time not recorded)
**Handoff Status:** Ready for next session
**Estimated Time to Complete:** 10-15 minutes
