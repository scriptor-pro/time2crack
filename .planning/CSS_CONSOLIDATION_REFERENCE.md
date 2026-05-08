# CSS Consolidation Quick Reference

This document provides exact line numbers and ready-to-copy consolidations for implementing CSS duplicate removal in `styles.css`.

---

## Implementation Priority Guide

### HIGH IMPACT (Implement First)
- **Priority 1.1**: GROUP 1 - display: none (22 selectors, ~36 lines saved)
- **Priority 1.2**: GROUP 2 - Focus outlines (6 selectors, ~8 lines saved)
- **Priority 1.3**: GROUP 3-4 - Advanced panel margins (10 selectors, ~12 lines saved)

### MEDIUM IMPACT (Implement Second)
- **Priority 2.1**: GROUP 5 - Chevron rotation (4 selectors, ~5 lines saved)
- **Priority 2.2**: GROUPS 6-9 - Icon sizing & flex patterns (8 selectors, ~10 lines saved)

---

## PHASE 1: HIGH IMPACT CONSOLIDATIONS

### 1.1 GROUP 1 CONSOLIDATION: display: none

**Locations to remove:**
- Line 252: `header h1 { display: none; }`
- Line 609: `.action-btn--icon-only span { display: none; }`
- Line 651: `.strength-bar-wrapper .bar-chevron { display: none; }`
- Lines 749-750: `.advanced-panel summary::-webkit-details-marker { display: none; }`
- Lines 983-984: `.hibp-banner[hidden] { display: none; }`
- Lines 1032-1034: `.hibp-safe[hidden] { display: none; }`
- Lines 1054-1056: `.hibp-error[hidden] { display: none; }`
- Lines 1075-1077: `.hibp-loading[hidden] { display: none; }`
- Lines 1283: `.result-card--danger .big-date { display: none; }`
- Lines 1287: `.result-card--professional .big-date { display: none; }`
- Line 1340: `.attacker-tabs::-webkit-scrollbar { display: none; }`
- Lines 1405-1406: `.attacker-panel[hidden] { display: none; }`
- Lines 1439-1440: `.results.is-empty .attacker-frame { display: none; }`
- Lines 1443-1444: `.results.is-empty .result-cards-row { display: none; }`
- Lines 1447-1448: `.results.is-empty .secondary-panels { display: none; }`
- Lines 1451-1452: `.results.is-empty .details-summary { display: none; }`
- Lines 1693-1695: `.live-details[hidden] { display: none; }`
- Line 1825: `.methodology-summary::-webkit-details-marker { display: none; }`
- Lines 2357-2359: `.lang-menu[hidden] { display: none !important; }` (note: !important)
- Lines 2457-2459: `.dict-loading-indicator[hidden] { display: none; }`
- Lines 2521-2523: `.tooltip[hidden] { display: none; }`

**Replacement to add** (place around line 250-255, before @media queries):

```css
header h1,
.action-btn--icon-only span,
.strength-bar-wrapper .bar-chevron,
.advanced-panel summary::-webkit-details-marker,
.result-card--danger .big-date,
.result-card--professional .big-date,
.attacker-tabs::-webkit-scrollbar,
.results.is-empty .attacker-frame,
.results.is-empty .result-cards-row,
.results.is-empty .secondary-panels,
.results.is-empty .details-summary,
.methodology-summary::-webkit-details-marker,
[hidden] {
  display: none;
}

.lang-menu[hidden] {
  display: none !important;
}
```

**Note**: `.lang-menu[hidden]` needs `!important` to override other styles

---

### 1.2 GROUP 2 CONSOLIDATION: Focus outlines

**Locations to consolidate:**
- Lines 390-392: `.password-wrapper button:focus-visible`
- Lines 459-461: `.password-wrapper-row .reset-btn-inline:focus-visible`
- Lines 744-746: `.advanced-panel summary:focus-visible`
- Lines 1488-1490: `.attack-table-wrapper summary:focus-visible`
- Lines 1740-1742: `.attack-descriptions summary:focus-visible`
- Lines 1821-1823: `.methodology-summary:focus-visible`

**Replacement to add** (place around line 388):

```css
.password-wrapper button:focus-visible,
.password-wrapper-row .reset-btn-inline:focus-visible,
.advanced-panel summary:focus-visible,
.attack-table-wrapper summary:focus-visible,
.attack-descriptions summary:focus-visible,
.methodology-summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}
```

**Delete these individual rules:**

```css
.password-wrapper button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.password-wrapper-row .reset-btn-inline:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.advanced-panel summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.attack-table-wrapper summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.attack-descriptions summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.methodology-summary:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}
```

---

### 1.3 GROUP 3-4 CONSOLIDATION: Advanced panel child margins

#### Desktop Version (Lines 757-764):

**Current** (5 separate rules):
```css
.advanced-panel > #vuln-tags {
  margin-left: 1rem;
  margin-right: 1rem;
}
.advanced-panel > .hibp-banner {
  margin-left: 1rem;
  margin-right: 1rem;
}
.advanced-panel > .hibp-safe {
  margin-left: 1rem;
  margin-right: 1rem;
}
.advanced-panel > .hibp-error {
  margin-left: 1rem;
  margin-right: 1rem;
}
.advanced-panel > .live-details {
  margin-left: 1rem;
  margin-right: 1rem;
}
```

**Replacement:**
```css
.advanced-panel > #vuln-tags,
.advanced-panel > .hibp-banner,
.advanced-panel > .hibp-safe,
.advanced-panel > .hibp-error,
.advanced-panel > .live-details {
  margin-left: 1rem;
  margin-right: 1rem;
}
```

#### Mobile Version (Lines 2070-2080):

**Current** (5 separate rules inside `@media`):
```css
@media (max-width: 600px) {
  .advanced-panel > #vuln-tags { margin-left: 0.85rem; margin-right: 0.85rem; }
  .advanced-panel > .hibp-banner { margin-left: 0.85rem; margin-right: 0.85rem; }
  .advanced-panel > .hibp-safe { margin-left: 0.85rem; margin-right: 0.85rem; }
  .advanced-panel > .hibp-error { margin-left: 0.85rem; margin-right: 0.85rem; }
  .advanced-panel > .live-details { margin-left: 0.85rem; margin-right: 0.85rem; }
}
```

**Replacement** (keep inside `@media`):
```css
@media (max-width: 600px) {
  .advanced-panel > #vuln-tags,
  .advanced-panel > .hibp-banner,
  .advanced-panel > .hibp-safe,
  .advanced-panel > .hibp-error,
  .advanced-panel > .live-details {
    margin-left: 0.85rem;
    margin-right: 0.85rem;
  }
}
```

---

## PHASE 2: MEDIUM IMPACT CONSOLIDATIONS

### 2.1 GROUP 5 CONSOLIDATION: Chevron rotation

**Locations:**
- Line 755: `.advanced-panel[open] summary .ui-chevron { transform: rotate(180deg); }`
- Line 1501: `.attack-table-wrapper[open] summary svg { transform: rotate(180deg); }`
- Line 1749: `.attack-descriptions[open] summary svg { transform: rotate(180deg); }`
- Line 1832: `.methodology[open] .methodology-summary svg { transform: rotate(180deg); }`

**Replacement to add** (place around line 753):

```css
.advanced-panel[open] summary .ui-chevron,
.attack-table-wrapper[open] summary svg,
.attack-descriptions[open] summary svg,
.methodology[open] .methodology-summary svg {
  transform: rotate(180deg);
}
```

**Remove individual rules at lines**: 755, 1501, 1749, 1832

---

### 2.2 GROUP 6 CONSOLIDATION: HIBP icons

**Locations:**
- Lines 1035-1038: `.hibp-safe-icon`
- Lines 1057-1060: `.hibp-error-icon`

**Original:**
```css
.hibp-safe-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.hibp-error-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
```

**Replacement:**
```css
.hibp-safe-icon,
.hibp-error-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
```

---

### 2.3 GROUP 7 CONSOLIDATION: Open state styling

**Locations:**
- Lines 1753-1756: `.attack-descriptions[open] summary`
- Lines 1834-1837: `.methodology[open] .methodology-summary`

**Original:**
```css
.attack-descriptions[open] summary {
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 1.5rem;
}

.methodology[open] .methodology-summary {
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 1.5rem;
}
```

**Replacement:**
```css
.attack-descriptions[open] summary,
.methodology[open] .methodology-summary {
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 1.5rem;
}
```

---

### 2.4 GROUP 8 CONSOLIDATION: SVG sizing

**Locations:**
- Lines 208-211: `.codeberg-link svg`
- Lines 1957-1960: `.social-link svg`

**Original:**
```css
.codeberg-link svg {
  width: 24px;
  height: 24px;
}

.social-link svg {
  width: 24px;
  height: 24px;
}
```

**Replacement:**
```css
.codeberg-link svg,
.social-link svg {
  width: 24px;
  height: 24px;
}
```

---

### 2.5 GROUP 9 CONSOLIDATION: Flexbox pattern

**Locations:**
- Lines 516-520: `.action-buttons-right`
- Lines 864-868: `.legend-item`

**Original:**
```css
.action-buttons-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.legend-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
```

**Replacement:**
```css
.action-buttons-right,
.legend-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
```

---

## Testing Checklist for Each Consolidation

### GROUP 1 (display: none)
- [ ] header h1 is hidden
- [ ] Copy button text is hidden on mobile
- [ ] Chevron in strength bar is hidden
- [ ] All [hidden] elements remain hidden
- [ ] Empty result containers are hidden
- [ ] Language code is hidden on mobile
- [ ] Tooltips are hidden until triggered

### GROUP 2 (Focus outlines)
- [ ] Tab through password input - see outline
- [ ] Tab through reset button - see outline
- [ ] Tab through collapsible sections - see outline
- [ ] All focus styles use 3px solid var(--accent)
- [ ] Outline offset is -3px (inside button)

### GROUPS 3-4 (Margins)
- [ ] Desktop: Vulnerability tags have 1rem margin
- [ ] Desktop: HIBP banners have 1rem margin
- [ ] Mobile (< 600px): Same elements have 0.85rem margin
- [ ] No overlap or spacing issues

### GROUP 5 (Chevron rotation)
- [ ] Click advanced panel - chevron rotates 180deg
- [ ] Click attack descriptions - chevron rotates 180deg
- [ ] Click methodology - chevron rotates 180deg
- [ ] Click attack table - chevron rotates 180deg

### GROUPS 6-9 (Icons & flex)
- [ ] HIBP safe/error icons display correctly
- [ ] SVG icons (codeberg, social) sized at 24px
- [ ] Action buttons row aligns correctly
- [ ] Legend items display as flex

---

## Commit Message Suggestions

Use these as templates for git commits:

```
refactor: consolidate duplicate CSS rules (display: none)

- Combine 22 selectors using display: none
- Consolidate hidden element styling (~15 lines saved)
- No visual changes, CSS maintainability improved
```

```
refactor: consolidate focus outline styles

- Combine 6 focus-visible selectors
- Shared outline: 3px solid var(--accent) with -3px offset
- ~8 lines saved
```

```
refactor: consolidate advanced-panel child margins

- Combine margin rules for panel children (1rem desktop)
- Add mobile override (0.85rem mobile)
- ~8 lines saved total
```

```
refactor: consolidate chevron rotation and icon sizing

- Combine 4 rotate(180deg) rules
- Combine HIBP icon sizing rules
- Combine SVG sizing rules
- ~13 lines saved
```
