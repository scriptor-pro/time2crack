# 🎨 Time2Crack Design Improvements — Strategic UX Enhancements

**Date**: 2026-05-07  
**Status**: ✅ Ready for Implementation  
**Scope**: Enhance existing design (not redesign)  
**Based on**: Current dark theme + 6-level semantic palette  

---

## 📊 Executive Summary

Time2Crack has a **solid, science-based foundation** (dark theme, semantic palette, attacker profiles). These improvements focus on:

1. **Hero Element Clarity** — Make the crack-time number MORE prominent & memorable
2. **Trust Visibility** — Surface "100% local" earlier (currently buried)
3. **Results Scanability** — Help users find their biggest threat faster
4. **HIBP Integration** — Make breach alerts impossible to ignore
5. **Password Analysis** — Make problems + solutions crystal clear

**Philosophy**: Keep what works. Amplify what's important. Remove noise.

---

## 🎯 4 Strategic Changes

### 1️⃣ HERO ELEMENT: Amplify "Time to Crack"

**Current State**: Crack time displayed in a table format, somewhat buried in results  
**Problem**: User has to scan to find "the answer"  
**Goal**: Make the hero number impossible to miss

#### Design Strategy

**Visual Treatment**:
```
┌─────────────────────────────────┐
│   Temps estimé pour craquer     │ ← Small label (uppercase, muted)
│                                 │
│        47 ANS                   │ ← BIG (3rem+), gradient blue→cyan→green
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Accent bar (same gradient)
│                                 │
│   ⚠️  Modéré — Crackable        │ ← Verdict + emoji (orange text)
│                                 │
│   Baseline: 12× GPU RTX 4090    │ ← Subtext (disclaimer, small)
└─────────────────────────────────┘
```

**Implementation**:
- Gradient text: blue (#3b82f6) → cyan (#06b6d4) → green (#10b981)
- Font: IBM Plex Sans Bold, 3rem (48px on desktop, 2rem on mobile)
- Animation: Staggered reveal (label 0s → number 200ms → bar 300ms → verdict 400ms)
- Position: **Above** the attacker tabs & table (not below)

**Why This Works**:
- Gradient = visual warmth + trust (blue = secure, green = safe)
- Large size = immediately scannable
- Animation = feels alive, not static
- Position = "answer first" (not bury in results)

#### Code Changes

**File**: `index.html` (main hero section)

**Add new hero card** (place after password input, before attacker tabs):
```html
<div class="hero-crack-time" id="hero-crack-time" hidden>
  <div class="hero-label" data-i18n="crackTimeLabel">Estimated crack time</div>
  <div class="hero-number" id="hero-number">47 years</div>
  <div class="hero-bar"></div>
  <div class="hero-verdict" id="hero-verdict">
    <span class="verdict-icon">⚠️</span>
    <span class="verdict-text" data-i18n="verdictModerate">Moderate — Can be cracked</span>
  </div>
  <div class="hero-subtext" data-i18n="heroBaseline">
    Baseline: 12× GPU RTX 4090 (bcrypt)
  </div>
</div>
```

**CSS** (in `styles.css`):
```css
.hero-crack-time {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(6, 182, 212, 0.03));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  animation: fadeInUp 0.4s ease 0s;
}

.hero-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.hero-number {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  margin-bottom: var(--spacing-md);
  animation: scaleIn 0.4s ease 0.1s backwards;
}

.hero-bar {
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%);
  border-radius: 2px;
  width: 120px;
  margin: var(--spacing-md) auto;
  animation: expandWidth 0.4s ease 0.2s backwards;
}

.hero-verdict {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: var(--spacing-lg);
  font-size: 1.1rem;
  font-weight: 600;
  animation: fadeInUp 0.4s ease 0.3s backwards;
}

.verdict-icon {
  font-size: 1.25rem;
}

.verdict-text.critical { color: var(--critical); }
.verdict-text.danger { color: var(--danger); }
.verdict-text.warning { color: var(--warning); }
.verdict-text.success { color: var(--success); }

.hero-subtext {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--spacing-md);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes expandWidth {
  from { width: 0; opacity: 0; }
  to { width: 120px; opacity: 1; }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .hero-crack-time {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .hero-number {
    font-size: 2rem;
  }

  .hero-verdict {
    font-size: 1rem;
  }
}
```

**JavaScript** (in `app.js` or existing calc code):
```js
function updateHeroElement(crackTime, verdict) {
  const heroElement = document.getElementById('hero-crack-time');
  const heroNumber = document.getElementById('hero-number');
  const heroVerdict = document.getElementById('hero-verdict');
  
  // Update content
  heroNumber.textContent = crackTime; // e.g., "47 years"
  
  // Update verdict styling based on severity
  const verdictClass = getVerdictClass(crackTime); // 'critical', 'danger', 'warning', 'success'
  heroVerdict.querySelector('.verdict-text').className = `verdict-text ${verdictClass}`;
  
  // Show element if results exist
  heroElement.hidden = false;
}

function getVerdictClass(crackTime) {
  // Map time ranges to verdict classes
  const seconds = parseTimeToSeconds(crackTime);
  if (seconds < 60) return 'critical';
  if (seconds < 3600) return 'danger';
  if (seconds < 86400) return 'warning';
  return 'success';
}
```

---

### 2️⃣ TRUST VISIBILITY: Surface Security Messaging Early

**Current State**: "100% local" is buried in copy, not visually prominent  
**Problem**: Users don't immediately understand why to trust the tool  
**Goal**: Show trust signals in first 2 seconds

#### Design Strategy

**Trust Badge Bar** (place just below logo/header):
```
┌────────────────────────────────────────────┐
│ 🔒 100% Local  👁️ Open Source  ⚡ Offline   │
│    Aucun partage  Code visible    Sans net │
└────────────────────────────────────────────┘
```

**Implementation**:
- 3-4 small badge cards (horizontal flex on desktop, 2x2 grid on mobile)
- Icons + short text (no long descriptions, user reads in 2 sec)
- Place: Right after header, before password input
- Accessibility: Each badge should be clickable → expandable details (future)

#### Code Changes

**File**: `index.html` (after header, before password input)

```html
<section class="trust-indicators" aria-label="Security features">
  <div class="trust-badge">
    <div class="trust-icon">🔒</div>
    <div class="trust-title" data-i18n="trustLocal">100% Local</div>
    <div class="trust-desc" data-i18n="trustLocalDesc">No transmission</div>
  </div>
  <div class="trust-badge">
    <div class="trust-icon">👁️</div>
    <div class="trust-title" data-i18n="trustOpen">Open Source</div>
    <div class="trust-desc" data-i18n="trustOpenDesc">Audit the code</div>
  </div>
  <div class="trust-badge">
    <div class="trust-icon">⚡</div>
    <div class="trust-title" data-i18n="trustOffline">Works Offline</div>
    <div class="trust-desc" data-i18n="trustOfflineDesc">No connection needed</div>
  </div>
  <div class="trust-badge">
    <div class="trust-icon">🔐</div>
    <div class="trust-title" data-i18n="trustHibp">k-anonymity</div>
    <div class="trust-desc" data-i18n="trustHibpDesc">HIBP safe check</div>
  </div>
</section>
```

**CSS**:
```css
.trust-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.trust-badge {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.trust-badge:hover {
  border-color: var(--confidence);
  background: rgba(74, 144, 217, 0.03);
}

.trust-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.trust-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.trust-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Mobile: 2x2 grid */
@media (max-width: 640px) {
  .trust-indicators {
    grid-template-columns: repeat(2, 1fr);
  }

  .trust-badge {
    padding: var(--spacing-sm);
  }
}
```

---

### 3️⃣ RESULTS TABLE: Highlight Biggest Threat

**Current State**: Table of 10 attacks × 6 algorithms = 60 cells of data = visual chaos  
**Problem**: Hard to understand "which attack is the real threat?"  
**Goal**: Make the most dangerous attack row visually dominant

#### Design Strategy

**Use existing semantic palette** + subtle highlights:

1. **Cell Colors** (already defined in CSS):
   - Red (#EB4949) = Instant to minutes (critical)
   - Orange (#e65100) = Minutes to hours (danger)
   - Amber (#d97706) = Hours to days (warning)
   - Green (#16A34A) = Days to years (success)
   - Cyan (#0891B2) = Exceptional (100+ years)

2. **Best Attack Row Highlight**:
   - Add left border in red (#EB4949)
   - Add ⚡ emoji prefix
   - Slightly increase opacity/contrast vs. other rows

#### Code Changes

**File**: `styles.css` (existing table styles, add/modify):

```css
/* Results table enhancements */
.result-row {
  transition: opacity 0.2s ease;
}

.result-row:not(.is-best-attack) {
  opacity: 0.75;  /* Fade non-best attacks */
}

.result-row.is-best-attack {
  border-left: 4px solid var(--critical);
  background: rgba(235, 73, 73, 0.08);
}

.result-row.is-best-attack .attack-name::before {
  content: "⚡ ";  /* Lightning emoji before best attack */
}

/* Intensity-based cell colors (enhance existing) */
.cell-critical {
  background: rgba(235, 73, 73, 0.15);
  color: var(--critical);
  font-weight: 500;
}

.cell-danger {
  background: rgba(230, 81, 0, 0.15);
  color: var(--danger);
  font-weight: 500;
}

.cell-warning {
  background: rgba(217, 119, 6, 0.15);
  color: var(--warning);
  font-weight: 500;
}

.cell-success {
  background: rgba(22, 163, 74, 0.15);
  color: var(--success);
  font-weight: 500;
}

.cell-excellent {
  background: rgba(16, 185, 129, 0.15);
  color: var(--excellent);
  font-weight: 500;
}

.cell-exceptional {
  background: rgba(8, 145, 178, 0.15);
  color: var(--exceptional);
  font-weight: 500;
}
```

**JavaScript** (in calc code):
```js
function renderResultsTable(results, bestAttackName) {
  // ... existing code ...
  
  results.forEach(row => {
    const rowElement = createRow(row);
    
    // Add class if this is best attack
    if (row.attackName === bestAttackName) {
      rowElement.classList.add('is-best-attack');
    }
    
    // Color cells based on time intensity
    row.cells.forEach(cell => {
      const timeClass = getTimeIntensityClass(cell.time);
      cell.classList.add(timeClass);
    });
  });
}

function getTimeIntensityClass(timeInSeconds) {
  if (timeInSeconds < 1) return 'cell-critical';
  if (timeInSeconds < 3600) return 'cell-danger';
  if (timeInSeconds < 86400) return 'cell-warning';
  if (timeInSeconds < 2592000) return 'cell-success'; // 30 days
  if (timeInSeconds < 31536000) return 'cell-excellent'; // 1 year
  return 'cell-exceptional';
}
```

---

### 4️⃣ HIBP ALERT: Make Breach Unmissable

**Current State**: HIBP check exists but display could be more prominent  
**Problem**: Users might miss "your password was breached" message  
**Goal**: Two-level alert (immediate + confirmation)

#### Design Strategy

**Level 1: Alert Strip** (under password input, appears real-time)
```
┌─────────────────────────────────────────┐
│ ⚠️  Password compromised                │
│    Found in 5M+ breaches. Change now.   │
└─────────────────────────────────────────┘
```

**Level 2: Badge in Results** (reinforcement)
```
┌─────────────────────────────────────────┐
│ 🚨 COMPROMISED                          │
│ This password appears in millions of    │
│ leaks. Change it everywhere you used it.│
└─────────────────────────────────────────┘
```

#### Code Changes

**File**: `index.html` (add after password input):

```html
<div class="hibp-alert" id="hibp-alert" hidden>
  <div class="hibp-icon">⚠️</div>
  <div class="hibp-content">
    <div class="hibp-title" data-i18n="hibpCompromised">Password compromised</div>
    <div class="hibp-message" data-i18n="hibpFound">Found in 5+ million breaches. Change it immediately.</div>
  </div>
</div>
```

**CSS**:
```css
.hibp-alert {
  background: rgba(235, 73, 73, 0.1);
  border-left: 4px solid var(--critical);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  animation: slideDown 0.3s ease;
}

.hibp-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.hibp-content {
  flex: 1;
}

.hibp-title {
  font-weight: 600;
  color: var(--critical);
  margin-bottom: 0.25rem;
}

.hibp-message {
  font-size: 0.9rem;
  color: var(--text-muted);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**JavaScript** (in HIBP check code):
```js
function showHibpAlert() {
  const alert = document.getElementById('hibp-alert');
  alert.hidden = false;
}

function hideHibpAlert() {
  const alert = document.getElementById('hibp-alert');
  alert.hidden = true;
}
```

---

## 📋 Implementation Checklist

### Phase 1: Hero Element (P0 — 2h)
- [ ] Add hero crack-time card HTML
- [ ] Add CSS styling + animations
- [ ] Wire up JavaScript to populate from calc
- [ ] Test verdict coloring (critical/danger/warning/success)
- [ ] Test mobile (320px, 375px, 480px)

### Phase 2: Trust Badges (P0 — 1h)
- [ ] Add trust badges HTML
- [ ] Style cards + hover states
- [ ] Test responsive grid (4 cols → 2×2 on mobile)
- [ ] Verify i18n keys exist in translations

### Phase 3: Results Table Enhancement (P1 — 1.5h)
- [ ] Add best-attack highlighting (red border + emoji)
- [ ] Fade non-best rows (opacity 0.75)
- [ ] Verify cell color classes applied
- [ ] Test table remains scannable

### Phase 4: HIBP Alert (P1 — 1h)
- [ ] Add alert strip HTML
- [ ] Style alert + animation
- [ ] Wire HIBP check to show/hide
- [ ] Test both positive (breach) and negative (safe) cases

### Phase 5: Polish & Testing (P2 — 1.5h)
- [ ] CSP hash verification (inline styles)
- [ ] Responsive testing across breakpoints
- [ ] Animation performance (no jank)
- [ ] Accessibility review (color contrast, ARIA labels)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Mobile)

---

## 🎨 Design Decisions Rationale

### Why Gradient Text for Hero Number?

- **Blue** = tech, trust, security (your existing palette)
- **Cyan** = clarity, precision, modern
- **Green** = safety, protected, strong password
- **Combination** = "you're protected & informed"
- **Better than** static color = feels alive, dynamic, not boring

### Why Fade Non-Best Attacks?

- **Reduces cognitive load**: Users focus on "the real threat" first
- **Not hiding data**: All rows still visible, just de-emphasized
- **Works on mobile**: Table stays compact, doesn't require horizontal scroll
- **Scientific**: Focuses attention on statistically most likely attack

### Why Two-Level HIBP Alert?

- **Level 1 (strip)**: Catches user before they scroll (immediate danger)
- **Level 2 (badge)**: Reinforces after they've analyzed (no doubt left)
- **Prevents ignoring**: Two confirmations, user can't miss it
- **Mobile-friendly**: Works even on narrow viewports

---

## ✅ Success Criteria

1. **Hero number immediately visible** — User sees answer in <1 second
2. **Trust signals obvious** — User understands "safe to use here" in 2 seconds
3. **Best attack stands out** — No scanning needed to find biggest threat
4. **HIBP unmissable** — Breach warning impossible to ignore
5. **Mobile seamless** — Works at 320px, 375px, 480px with no overflow
6. **Performance good** — No jank, animations smooth (<500ms total)

---

## 🔧 Notes for Implementation

### CSP Hash Update

After adding new inline `<style>`, update CSP hash:
```bash
# Get new hash of <style> content
echo -n "your_style_content" | openssl dgst -sha256 -binary | openssl enc -base64

# Update in index.html meta tag:
# <meta http-equiv="Content-Security-Policy" 
#       content="... style-src 'sha256-NEWHASH=' ..." />
```

### i18n Keys Needed

Ensure these keys exist in all language files (I.en, I.fr, etc.):
- `crackTimeLabel`
- `verdictCritical`, `verdictDanger`, `verdictWarning`, `verdictSuccess`
- `heroBaseline`
- `trustLocal`, `trustLocalDesc`
- `trustOpen`, `trustOpenDesc`
- `trustOffline`, `trustOfflineDesc`
- `trustHibp`, `trustHibpDesc`
- `hibpCompromised`, `hibpFound`

### Mobile Breakpoints

- **320px** (iPhone SE) — 2×2 trust grid, hero number 2rem
- **375px** (iPhone 12/13) — Still 2×2 grid, comfortable spacing
- **480px** (larger phones) — Can expand to 4 cols if space allows
- **768px+** (tablets/desktop) — Full 4-col trust grid, larger typography

---

## 📚 Files to Modify

| File | Changes | Complexity |
|------|---------|-----------|
| `index.html` | Add hero card, trust badges, HIBP alert HTML | Medium |
| `styles.css` | Add hero styling, trust badge styles, table enhancements, animations | Medium |
| `app.js` (existing calc) | Wire up hero population, HIBP alert toggle | Low |
| CSP meta tag | Update hash for new inline styles | Low |

---

## 🎬 Expected Result

After implementation:
- **Home screen**: User sees "🔒 Local • 👁️ Open • ⚡ Offline" immediately
- **After typing password**: Real-time results show "47 ans" big & prominent
- **If HIBP hit**: Alert strip warns immediately, badge reinforces in results
- **Looking at results**: Best attack row highlighted in red with ⚡, others faded
- **Mobile experience**: Everything readable at 320px, no horizontal scroll

---

**Document Version**: 1.0  
**Status**: Ready for implementation  
**Estimated Total Time**: 6-7 hours (split across days)  
**Priority**: P0 (hero + trust) then P1 (table + HIBP)
