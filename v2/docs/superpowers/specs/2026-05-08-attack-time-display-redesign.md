---
name: Attack Time Display Redesign
description: Redesign of the hero "estimated crack time" card with integrated badge for security/trust universe
type: design-spec
---

# Attack Time Display Redesign

**Date:** 2026-05-08  
**Status:** Approved  
**Scope:** Redesign the `.best-attack-card` component to make estimated crack time the visual hero of results

---

## Overview

The **estimated crack time** is the primary information users seek from Time2Crack. Currently displayed as a simple card, it needs visual prominence that conveys security, honesty, trust, and protection — matching the app's security-first universe.

**Design Direction:** Security frame with integrated "✓ Estimé" badge in a blue header bar. Professional, official, confident. No flashy colors — just solid, factual design.

---

## Visual Design

### Component Structure

```
┌─ Blue Header Bar ──────────────┐
│ ✓ Estimé                       │
├────────────────────────────────┤
│ 🔐                             │
│ Temps estimé                   │
│ 15 jours                       │
│ ⚡ Brute Force • 12 GPU        │
└────────────────────────────────┘
```

### Visual Elements

#### 1. Header Bar (`.best-attack-card-header`)
- **Background:** `var(--color-blue)` (#2563EB)
- **Text color:** White
- **Padding:** `var(--space-3)` vertical, `var(--space-4)` horizontal
- **Alignment:** Flex, centered
- **Gap:** `var(--space-2)` between icon and text

**Contents:**
- Badge icon: `✓` (check mark)
- Badge text: "Estimé" (uppercase, `0.7rem`, font-weight 600, letter-spacing 0.08em)

#### 2. Content Area (`.best-attack-card-content`)
- **Background:** `var(--color-surface)` (white)
- **Padding:** `var(--space-5)` all sides
- **Text-align:** center
- **Border:** 2px `var(--color-border)` (#E2E8F0) on left/right/bottom
- **Border-radius:** Bottom corners only (top inherited from header)

**Sub-elements:**

**Icon (`.best-attack-card-icon`)**
- Font-size: `2.2rem` (desktop), `1.8rem` (mobile)
- Margin-bottom: `var(--space-3)`
- Dynamic: changes based on password strength
  - 🔓 = weak (< 1 hour)
  - 🔒 = moderate (1 hour - 1 month)
  - 🔐 = strong (> 1 month)

**Label (`.best-attack-card-label`)**
- Font-size: `0.7rem`
- Text-transform: uppercase
- Letter-spacing: `0.1em`
- Color: `var(--color-text-muted)` (#64748B)
- Margin-bottom: `var(--space-3)`
- Font-weight: 600

**Time Display (`.best-attack-card-time`)**
- Font-size: `3rem` (desktop), `2.2rem` (mobile)
- Font-weight: 700
- Font-family: "IBM Plex Mono" (monospace)
- Color: `var(--color-text)` (#0F172A)
- Line-height: 1
- Letter-spacing: `-0.02em` (tighter)
- Margin-bottom: `var(--space-4)`

**Attack Info (`.best-attack-card-attack`)**
- Font-size: `0.9rem`
- Color: `var(--color-text-muted)` (#64748B)
- Display: flex, centered, gap `var(--space-2)`
- Icon before: ⚡

### Container (`.best-attack-card`)

**Desktop (> 768px):**
- Width: 100%
- Max-width: 320px
- Margin: auto (centered)
- Border-radius: `var(--radius-lg)` (10px)
- Overflow: hidden (ensures header bar borders align)
- Box-shadow: `var(--shadow-sm)` (light shadow for depth)
- Margin-bottom: `var(--space-5)`

**Mobile (< 768px):**
- Width: calc(100% - 2 * `var(--space-4)`)
- Max-width: none
- Margin: auto `var(--space-4)` (horizontal padding)
- Font-size reductions (as noted above)

---

## HTML Structure

```html
<div class="best-attack-card">
  <div class="best-attack-card-header">
    <span class="best-attack-card-badge-icon">✓</span>
    <span class="best-attack-card-badge-text">Estimé</span>
  </div>
  <div class="best-attack-card-content">
    <div class="best-attack-card-icon" id="best-attack-icon">🔐</div>
    <div class="best-attack-card-label">Temps estimé</div>
    <div class="best-attack-card-time" id="best-attack-time">15 jours</div>
    <div class="best-attack-card-attack">
      <span id="best-attack-name">Brute Force</span>
      <span class="best-attack-card-divider">•</span>
      <span id="best-attack-gpus">12 GPU</span>
    </div>
  </div>
</div>
```

---

## JavaScript Behavior

### Icon Selection
```javascript
function setAttackIcon(timeInSeconds) {
  const icon = document.getElementById('best-attack-icon');
  if (timeInSeconds < 3600) {
    icon.textContent = '🔓'; // unlocked = weak
  } else if (timeInSeconds < 2592000) { // 30 days
    icon.textContent = '🔒'; // locked = moderate
  } else {
    icon.textContent = '🔐'; // locked + key = strong
  }
}
```

### Content Population
The following IDs are populated by existing JavaScript (no changes needed):
- `#best-attack-icon` — dynamically set (see above)
- `#best-attack-time` — time string (e.g., "15 jours", "2 heures")
- `#best-attack-name` — attack type (e.g., "Brute Force", "Dictionary")
- `#best-attack-gpus` — GPU count (e.g., "12 GPU")

---

## Styling Changes

### Removed CSS Rules
The old `.best-attack-card`, `.best-attack-label`, and `.best-attack-result` rules are **replaced entirely**. These old rules had:
- `background: #f1f5f9` (subtle blue)
- `border: 2px solid #2563eb`
- Simple layout with flex

### New CSS Classes

```css
.best-attack-card {
  width: 100%;
  max-width: 320px;
  margin: auto 0 var(--space-5);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: none;
}

.best-attack-card-header {
  background: var(--color-blue);
  color: white;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.best-attack-card-badge-icon {
  font-size: 0.85rem;
  font-weight: 700;
}

.best-attack-card-badge-text {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.best-attack-card-content {
  background: var(--color-surface);
  padding: var(--space-5);
  border: 2px solid var(--color-border);
  border-top: none;
  text-align: center;
}

.best-attack-card-icon {
  font-size: 2.2rem;
  margin-bottom: var(--space-3);
}

.best-attack-card-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: var(--space-3);
}

.best-attack-card-time {
  font-size: 3rem;
  font-weight: 700;
  font-family: "IBM Plex Mono", monospace;
  color: var(--color-text);
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-4);
}

.best-attack-card-attack {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.best-attack-card-attack::before {
  content: '⚡';
  margin-right: 2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .best-attack-card {
    width: calc(100% - 2 * var(--space-4));
    margin: auto var(--space-4) var(--space-5);
  }

  .best-attack-card-icon {
    font-size: 1.8rem;
  }

  .best-attack-card-time {
    font-size: 2.2rem;
  }
}
```

---

## Color & Spacing Rationale

| Element | Color | Rationale |
|---------|-------|-----------|
| Header background | Blue (#2563EB) | Trust, authority, security |
| Header text | White | Contrast, clarity, "official" |
| Content background | White (#FFFFFF) | Clean, factual, professional |
| Content text (time) | Dark (#0F172A) | Maximum readability, primary focus |
| Content text (label/attack) | Muted (#64748B) | Secondary info, doesn't distract |
| Border | Light gray (#E2E8F0) | Subtle definition, not aggressive |

**No dynamic colors:** Unlike some options explored, this design uses **constant blue** throughout. The emoji icon (🔓🔒🔐) is the signal for password strength — no need for red/orange/green alarm colors.

---

## Accessibility

- **Contrast:** All text meets WCAG AAA standards (already verified for palette)
- **Semantics:** Header uses `<div>` (purely visual), content uses appropriate elements
- **Icon fallback:** Emoji icons are presentational; text content ("15 jours") is the actual information
- **Focus:** If componentized as interactive, needs focus ring on `.best-attack-card-header` (currently read-only)

---

## Implementation Checklist

- [ ] Update HTML structure in all language index files (EN, FR, ES, PT, DE, IT, PL, NL, NL, TR)
- [ ] Replace `.best-attack-card` CSS rules in `style.min.css` (or source if exists)
- [ ] Update JavaScript icon selection logic in `app.js`
- [ ] Test responsive behavior at 320px, 375px, 480px, 768px+
- [ ] Verify badge visibility on mobile (no overflow)
- [ ] Test with weak/moderate/strong password examples
- [ ] Commit with banner update
- [ ] Verify all 8 language pages render correctly

---

## Success Criteria

✅ **Visual:** Time is clearly the hero (large, monospace, centered)  
✅ **Trust:** Badge + header bar conveys "certified/official"  
✅ **Responsive:** Looks good on 320px phone to 1920px desktop  
✅ **Accessible:** Contrast and semantics meet WCAG AAA  
✅ **Cohesive:** Uses existing color palette (no new colors)  
✅ **Professional:** Matches security/honesty/confidence universe  

---

## Notes

- This is a **display-only change** — no new data, no API changes
- The component receives its content from existing JavaScript
- The change affects the `.best-attack-card` region only; other results sections remain unchanged
- All language strings ("Estimé", time format) are already handled by the app's localization system
