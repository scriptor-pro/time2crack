# Time2Crack Testing Checklist

## Phase 4: Browser & Device Testing + Performance Optimization

**Start Date:** March 8, 2026  
**Objective:** Validate Time2Crack across all major browsers and devices, profile performance, and fix any issues.

---

## 1. Browser Testing Checklist

### Desktop Browsers to Test

- [ ] **Chrome** (v120+) - Latest stable
- [ ] **Firefox** (v122+) - Latest stable
- [ ] **Safari** (v17+) - Latest stable
- [ ] **Edge** (v120+) - Latest stable

### What to Test in Each Browser

#### 1.1 Page Load & Rendering

- [ ] Page loads without console errors
- [ ] All fonts render correctly (Outfit, DM Mono)
- [ ] No layout shifts or visual glitches
- [ ] Logo and SVG icons display properly
- [ ] Language switcher buttons visible and functional

#### 1.2 Input Section

- [ ] Password input field is visible and focused
- [ ] Placeholder text displays correctly
- [ ] Show/Hide button toggles password visibility
- [ ] Reset button clears input and analysis
- [ ] Hint text appears below with info icon
- [ ] All buttons have proper hover/active states

#### 1.3 Live Analysis

- [ ] Typing a password shows live updates
- [ ] Strength bar fills with color gradient
- [ ] Details grid appears with 5 columns:
  - Characters count
  - Charset size
  - Entropy bits
  - Combinations
  - Status
- [ ] All values update in real-time as you type

#### 1.4 HIBP Integration (Check for each case)

- [ ] **Common password** (e.g., "password123"):
  - Red banner appears: "This password has been leaked!"
  - Count shows breach occurrences
  - Privacy explanation visible
- [ ] **Safe password** (e.g., "X9$mK2@pL7#qR4"):
  - Green teal banner appears: "This password does not appear..."
  - **NEW:** Banner uses teal color (#00C9A7)
- [ ] **Network error** (disconnect internet):
  - Gray warning banner appears
  - Message indicates network issue

#### 1.5 Attack Table

- [ ] Click "Crack time by attack type..." header
- [ ] Table expands smoothly with animation
- [ ] Chevron icon rotates 180° when expanded
- [ ] Table contains all 10 attack types
- [ ] Each row shows 6 hashing algorithms
- [ ] Estimated time displays for each combination
- [ ] Slowest attack row is hidden by default
- [ ] Click again to collapse table
- [ ] Chevron rotates back 180°

#### 1.6 Language Switching

- [ ] Click EN/FR/ES/PT/DE/TR/IT/PL/NL buttons
- [ ] All UI text updates immediately
- [ ] Placeholder text changes
- [ ] Hint text translates correctly
- [ ] HTML elements with `data-i18n-html` render properly
- [ ] No visual jank during language switch

#### 1.7 Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus indicators visible (3px accent outline)
- [ ] Can submit with Enter key
- [ ] Space/Enter activates buttons
- [ ] Skip-to-content link works

#### 1.8 Accessibility Features

- [ ] Screen reader (NVDA/JAWS) announces:
  - Page title correctly
  - Form labels and inputs
  - Buttons with proper labels
  - Status messages
  - Icon descriptions (or aria-hidden for decorative)
- [ ] Color contrast meets WCAG AAA (4.5:1 minimum)
- [ ] Icons have aria-hidden="true" where appropriate

---

## 2. Device Testing Checklist

### Screen Sizes to Test

- [ ] **Desktop**: 1920×1080 (Full HD)
- [ ] **Tablet**: 768×1024 (iPad)
- [ ] **Mobile Portrait**: 375×812 (iPhone 12)
- [ ] **Mobile Landscape**: 812×375

### What to Test on Each Device

#### 2.1 Layout & Responsiveness

- [ ] **Desktop (1920×1080)**:
  - Content centered with max-width
  - Input row: password input + show/hide + reset all visible
  - Hint text below
  - Table spans appropriately
- [ ] **Tablet (768×1024)**:
  - Same layout as desktop
  - Buttons don't overlap
  - Touch targets ≥ 48px
- [ ] **Mobile Portrait (375×812)**:
  - Password input full width
  - Show/Hide and Reset buttons stack vertically
  - Each button readable and tappable
  - Table columns scroll horizontally if needed
  - Header buttons (language switcher) visible
- [ ] **Mobile Landscape (812×375)**:
  - Layout adapts properly
  - Text remains readable
  - Buttons accessible

#### 2.2 Touch Interactions

- [ ] Tap password input - keyboard appears
- [ ] Tap Show/Hide button - works smoothly
- [ ] Tap Reset button - works smoothly
- [ ] Tap language buttons - no accidental triggers
- [ ] Long-press copy password (browser native) works

#### 2.3 Performance on Mobile

- [ ] Page loads within 2 seconds
- [ ] Typing feels responsive (no lag)
- [ ] Scrolling smooth
- [ ] No dropped frames
- [ ] Battery drain reasonable (monitor for 1 minute typing)

---

## 3. Performance Profiling Checklist

### Metrics to Measure

#### 3.1 Load Performance

- [ ] **First Contentful Paint (FCP)**: < 1s
- [ ] **Largest Contentful Paint (LCP)**: < 2.5s
- [ ] **Time to Interactive (TTI)**: < 3s
- [ ] **Cumulative Layout Shift (CLS)**: < 0.1

**How to measure:**

1. Open DevTools (F12 / Cmd+Option+I)
2. Go to Performance or Lighthouse tab
3. Click "Measure page load"
4. Record metrics

#### 3.2 Runtime Performance

- [ ] **Password input lag**: Type 50+ characters smoothly
- [ ] **Language switching lag**: Switch languages 5× rapidly, should be instant
- [ ] **Table expansion**: Opens/closes smoothly (no jank)
- [ ] **HIBP API call**: Completes in < 500ms

**How to measure:**

1. Open DevTools → Performance tab
2. Click record
3. Type password (50 chars)
4. Click Reset
5. Click table to expand/collapse
6. Stop recording
7. Review FPS graph (should stay ≥ 60fps)

#### 3.3 Memory Usage

- [ ] Initial memory load: < 5MB
- [ ] After typing 100 passwords: no memory leak
- [ ] After 20 language switches: no memory leak

**How to measure:**

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions (type, switch language, etc.)
4. Take another snapshot
5. Compare sizes

#### 3.4 Network Analysis

- [ ] All resources load from `'self'` (local)
- [ ] HIBP API calls use k-anonymity (5-char prefix only)
- [ ] Only ONE HIBP call per unique password hash
- [ ] Total network traffic: < 1KB per password check

**How to measure:**

1. Open DevTools → Network tab
2. Type password
3. Watch for HIBP request to `api.pwnedpasswords.com/range/...`
4. Verify only 5 hex chars sent in URL

---

## 4. Known Issues & Fixes Needed

### Issues Found

#### Critical

- [ ] Issue: [Description]
  - **Browser(s) affected**:
  - **Severity**: High
  - **Fix**:
  - **Status**: [ ] Not started [ ] In progress [ ] Fixed

#### High

- [ ] Issue: [Description]
  - **Browser(s) affected**:
  - **Severity**: High
  - **Fix**:
  - **Status**: [ ] Not started [ ] In progress [ ] Fixed

#### Medium

- [ ] Issue: [Description]
  - **Browser(s) affected**:
  - **Severity**: Medium
  - **Fix**:
  - **Status**: [ ] Not started [ ] In progress [ ] Fixed

#### Low

- [ ] Issue: [Description]
  - **Browser(s) affected**:
  - **Severity**: Low
  - **Fix**:
  - **Status**: [ ] Not started [ ] In progress [ ] Fixed

---

## 5. Color Implementation Verification

### ✅ Teal Color (#00C9A7) Implementation

- [x] CSS variable `--confidence` added to `:root`
- [x] CSS variable `--confidence-dim` added for background
- [x] `.hibp-safe` banner now uses teal color:
  - [x] Border: `var(--confidence)`
  - [x] Text: `var(--confidence)`
  - [x] Background: `var(--confidence-dim)`
- [x] Optional button class `.btn-confidence` created for future use

**Testing:**

- [ ] Type a common password (e.g., "password")
- [ ] Verify HIBP leak banner is RED (critical)
- [ ] Type a strong password
- [ ] Verify safe banner appears in TEAL color
- [ ] Verify contrast ratio meets WCAG AAA

---

## 6. Testing Summary Template

### Test Date: **\*\***\_\_\_**\*\***

| Browser | Version | Result | Notes |
| ------- | ------- | ------ | ----- |
| Chrome  |         | ✓ / ✗  |       |
| Firefox |         | ✓ / ✗  |       |
| Safari  |         | ✓ / ✗  |       |
| Edge    |         | ✓ / ✗  |       |

| Device             | Screen Size | Result | Notes |
| ------------------ | ----------- | ------ | ----- |
| Desktop            | 1920×1080   | ✓ / ✗  |       |
| Tablet             | 768×1024    | ✓ / ✗  |       |
| Mobile             | 375×812     | ✓ / ✗  |       |
| Mobile (Landscape) | 812×375     | ✓ / ✗  |       |

### Performance Metrics

| Metric | Target | Actual | Pass  |
| ------ | ------ | ------ | ----- |
| FCP    | < 1s   |        | ✓ / ✗ |
| LCP    | < 2.5s |        | ✓ / ✗ |
| TTI    | < 3s   |        | ✓ / ✗ |
| CLS    | < 0.1  |        | ✓ / ✗ |

### Issues Found: **\_** / Fixed: **\_** / Remaining: **\_**

### Sign-off

- [ ] All critical issues fixed
- [ ] All high-priority issues addressed
- [ ] Performance targets met
- [ ] Ready for deployment

---

## 7. Resources

### Browser DevTools

- Chrome DevTools: F12
- Firefox Developer: F12
- Safari Developer: Safari → Preferences → Advanced → Show Develop menu
- Edge DevTools: F12

### Accessibility Tools

- WCAG Contrast Checker: https://webaim.org/resources/contrastchecker/
- Lighthouse (built-in): DevTools → Lighthouse tab
- NVDA Screen Reader: https://www.nvaccess.org/

### Performance Tools

- WebPageTest: https://www.webpagetest.org/
- GTmetrix: https://gtmetrix.com/
- Chrome's Lighthouse: DevTools → Lighthouse

---

**Generated:** March 8, 2026  
**Status:** Ready for testing  
**Next Phase:** Fix issues and optimize based on findings
