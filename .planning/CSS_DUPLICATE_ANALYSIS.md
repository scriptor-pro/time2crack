# CSS Duplicate Analysis Report: styles.css

## Overview
- **File analyzed**: `/home/Baudouin/Documents/Projets/CrackDate/styles.css` (2,595 lines)
- **Total unique declaration sets**: 330
- **Duplicate groups found**: 36
- **Potential optimization**: ~70 lines of CSS can be consolidated

---

## CRITICAL DUPLICATES (Highest Priority)

### 🔴 GROUP 1: `display: none` (22 selectors)
**Location**: Lines 252, 609, 651, 749, 983-984, 1032-1034, 1054-1056, 1075-1077, 1283, 1287, 1405-1406, 1439-1453, 1693-1695, 1825-1827, 2357-2359, 2457-2459

**Affected selectors**:
```css
header h1
.action-btn--icon-only span
.strength-bar-wrapper .bar-chevron
.advanced-panel summary::-webkit-details-marker
[hidden] (all hidden elements)
.result-card--danger .big-date
.result-card--professional .big-date
.attacker-tabs::-webkit-scrollbar
.results.is-empty .attacker-frame
.results.is-empty .result-cards-row
.results.is-empty .secondary-panels
.results.is-empty .details-summary
.live-details[hidden]
.methodology-summary::-webkit-details-marker
.lang-code (mobile only)
.dict-loading-indicator[hidden]
.tooltip[hidden]
```

**Consolidation suggestion**:
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
```

**Savings**: ~15 lines

---

### 🔴 GROUP 2: Focus outline styles (6 selectors)
**Location**: Lines 390-392, 459-461, 744-746, 1488-1490, 1740-1742, 1821-1823

**Affected selectors**:
```css
.password-wrapper button:focus-visible
.password-wrapper-row .reset-btn-inline:focus-visible
.advanced-panel summary:focus-visible
.attack-table-wrapper summary:focus-visible
.attack-descriptions summary:focus-visible
.methodology-summary:focus-visible
```

**Shared styles**:
```css
outline: 3px solid var(--accent);
outline-offset: -3px;
```

**Consolidation**:
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

**Savings**: ~10 lines

---

### 🔴 GROUP 3: Advanced panel margins (5 selectors at 1rem)
**Location**: Lines 757-764

**Affected selectors**:
```css
.advanced-panel > #vuln-tags
.advanced-panel > .hibp-banner
.advanced-panel > .hibp-safe
.advanced-panel > .hibp-error
.advanced-panel > .live-details
```

**Shared styles**:
```css
margin-left: 1rem;
margin-right: 1rem;
```

**Consolidation**:
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

**Savings**: ~4 lines (desktop)

---

### 🔴 GROUP 4: Advanced panel margins (5 selectors at 0.85rem - mobile)
**Location**: Lines 2070-2080 (inside `@media (max-width: 600px)`)

**Affected selectors**: Same as Group 3 (mobile override)

**Consolidation**:
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

**Savings**: ~4 lines (mobile)

---

## SECONDARY DUPLICATES (Medium Priority)

### 🟠 GROUP 5: Chevron rotation (4 selectors)
**Location**: Lines 755, 1501, 1749, 1832

**Affected selectors**:
```css
.advanced-panel[open] summary .ui-chevron
.attack-table-wrapper[open] summary svg
.attack-descriptions[open] summary svg
.methodology[open] .methodology-summary svg
```

**Shared style**: `transform: rotate(180deg);`

**Consolidation**:
```css
.advanced-panel[open] summary .ui-chevron,
.attack-table-wrapper[open] summary svg,
.attack-descriptions[open] summary svg,
.methodology[open] .methodology-summary svg {
  transform: rotate(180deg);
}
```

**Savings**: ~8 lines

---

### 🟠 GROUP 6: HIBP icons sizing (2 selectors)
**Location**: Lines 1035-1038, 1057-1060

**Affected selectors**:
```css
.hibp-safe-icon
.hibp-error-icon
```

**Shared styles**:
```css
font-size: 1.1rem;
flex-shrink: 0;
```

**Consolidation**:
```css
.hibp-safe-icon,
.hibp-error-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
```

**Savings**: ~3 lines

---

### 🟠 GROUP 7: HIBP banner open state (2 selectors)
**Location**: Lines 1753-1756, 1834-1837

**Affected selectors**:
```css
.attack-descriptions[open] summary
.methodology[open] .methodology-summary
```

**Shared styles**:
```css
border-bottom: 1.5px solid var(--border);
padding-bottom: 1.5rem;
```

**Consolidation**:
```css
.attack-descriptions[open] summary,
.methodology[open] .methodology-summary {
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 1.5rem;
}
```

**Savings**: ~3 lines

---

### 🟠 GROUP 8: SVG sizing (2 selectors)
**Location**: Lines 208-211, 1957-1960

**Affected selectors**:
```css
.codeberg-link svg
.social-link svg
```

**Shared styles**:
```css
width: 24px;
height: 24px;
```

**Consolidation**:
```css
.codeberg-link svg,
.social-link svg {
  width: 24px;
  height: 24px;
}
```

**Savings**: ~2 lines

---

### 🟠 GROUP 9: Flexbox with gap (2 selectors)
**Location**: Lines 516-520, 864-868

**Affected selectors**:
```css
.action-buttons-right
.legend-item
```

**Shared styles**:
```css
display: flex;
gap: 0.5rem;
align-items: center;
```

**Consolidation**:
```css
.action-buttons-right,
.legend-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
```

**Savings**: ~2 lines

---

## ALREADY OPTIMIZED ✅

The following groups are already consolidated and don't need changes:
- ✅ `*, *::before, *::after` (box-sizing, margin, padding reset)
- ✅ `.attack-link:hover, .attack-link:focus` (color styles)
- ✅ `.methodology > div, .methodology > ul` (padding)
- ✅ `.logo-icon, .hibp-banner, .hibp-safe, .hibp-error` (animation: none)

---

## SUMMARY OF POTENTIAL SAVINGS

| Group | Selectors | Current Lines | Consolidated | Savings |
|-------|-----------|-------------|--------------|---------|
| 1. display: none | 22 | ~44 | ~8 | 36 lines |
| 2. Focus outlines | 6 | ~12 | ~4 | 8 lines |
| 3. Margins 1rem | 5 | ~10 | ~4 | 6 lines |
| 4. Margins 0.85rem | 5 | ~10 | ~4 | 6 lines |
| 5. Rotate 180deg | 4 | ~8 | ~3 | 5 lines |
| 6-9. Other pairs | 8 | ~16 | ~8 | 8 lines |
| **TOTAL** | **50+** | **~100** | **~31** | **~70 lines** |

**Estimated file reduction**: ~70 lines (~2.7% of 2,595 total lines)

---

## IMPLEMENTATION STRATEGY

### Phase 1: High Priority (Safe to implement)
1. Consolidate GROUP 1 (display: none)
2. Consolidate GROUP 2 (focus outlines)
3. Consolidate GROUPS 3 & 4 (margins in media queries)

### Phase 2: Medium Priority
4. Consolidate GROUP 5 (chevron rotation)
5. Consolidate GROUPS 6-9 (small SVG/flex rules)

### Phase 3: Code Organization (Optional)
- Create utility classes:
  - `.flex-center` → `display: flex; gap: 0.5rem; align-items: center;`
  - `.icon-lg` → `width: 24px; height: 24px;`
  - `.chevron-rotate` → `transform: rotate(180deg);`

---

## TESTING CHECKLIST

After consolidation, verify:
- [ ] All hidden elements remain hidden
- [ ] Focus states work on all interactive elements (buttons, summaries)
- [ ] Mobile responsivity unchanged at 320px, 375px, 480px
- [ ] Chevron icons rotate correctly on expand/collapse
- [ ] HIBP icons display correctly
- [ ] No regression in button/input focus-visible behavior
- [ ] SVG sizes correct across all components
