# Methodology Section: Collapsible Details/Summary

**Date:** March 8, 2026  
**Change:** Convert static methodology section to collapsible `<details>` element

---

## Overview

The "Methodology and sources" section has been converted from a static `<section>` to a collapsible `<details>` element with a `<summary>` header for better UX and cleaner interface.

---

## What Changed

### Before

```html
<section class="methodology" aria-labelledby="method-heading">
  <h2 id="method-heading">Methodology and sources</h2>
  <div id="meth-content">
    <!-- Always visible -->
  </div>
  <ul class="source-list">
    <!-- Always visible -->
  </ul>
</section>
```

### After

```html
<details class="methodology">
  <summary class="methodology-summary">Methodology and sources</summary>
  <div id="meth-content">
    <!-- Hidden by default, shown on expand -->
  </div>
  <ul class="source-list">
    <!-- Hidden by default, shown on expand -->
  </ul>
</details>
```

---

## User Experience

### Benefits

1. **Cleaner interface** - Methodology hidden by default, less visual clutter
2. **Progressive disclosure** - Users can expand when interested
3. **Native browser support** - Works without JavaScript
4. **Keyboard accessible** - Can be toggled with keyboard (Enter/Space)
5. **Built-in animation** - Browser handles smooth expand/collapse

### Interaction

- **Default state:** Collapsed
- **Click on header:** Expands to show full methodology and sources
- **Click again:** Collapses content
- **Keyboard (Tab + Enter/Space):** Same functionality

---

## CSS Changes

### `.methodology` (container)

```css
/* Removed static padding */
padding: removed;

/* Added */
overflow: hidden; /* For border-radius */
```

### `.methodology-summary` (new header)

```css
font-size: 1.2rem;
font-weight: 800;
padding: 2rem;
text-transform: uppercase;
letter-spacing: 0.1em;
color: var(--text);
cursor: pointer; /* Shows it's clickable */
user-select: none; /* Prevents text selection */
display: flex; /* For alignment */
justify-content: space-between; /* Chevron at right */
align-items: center;
transition: background-color 0.25s ease;
list-style: none; /* Hide native triangle */
```

### `.methodology-summary svg`

```css
flex-shrink: 0; /* Prevent shrinking */
color: var(--accent); /* Orange color */
transition: transform 0.3s ease; /* Smooth rotation */
```

### `.methodology[open] .methodology-summary svg`

```css
transform: rotate(180deg); /* Rotate when expanded */
```

### `.methodology-summary:hover`

```css
background-color: var(--surface-alt); /* Visual feedback */
```

### `.methodology-summary::marker`

```css
color: var(--accent); /* Orange triangle color */
```

### `.methodology[open]` (when expanded)

```css
.methodology-summary {
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 1.5rem;
}
```

### Content padding (expanded state)

```css
.methodology > div,
.methodology > ul {
  padding: 0 2rem 2rem 2rem; /* Matches summary padding */
}
```

---

## HTML Structure

### Summary Element

```html
<summary class="methodology-summary" data-i18n="methTitle">
  Methodology and sources
  <svg class="lucide lucide-chevron-down" ...>...</svg>
</summary>
```

**Features:**

- Uses `data-i18n="methTitle"` for translations
- Chevron-down icon positioned at right (same as attack table)
- Native disclosure triangle hidden with `list-style: none`
- Chevron rotates 180° when expanded
- Styled with custom CSS for consistency

### Content

```html
<div id="meth-content" data-i18n-html="methContent">
  <!-- 3 subsections: Attack types, Algorithms, Limitations -->
</div>
<ul class="source-list">
  <!-- 6 sources with links -->
</ul>
```

---

## Styling Details

### Chevron Icon

- **Icon:** Chevron-down (same as attack table)
- **Default state:** Pointing down (▼)
- **Expanded state:** Rotated 180° (▲)
- **Color:** Orange (`--accent` color)
- **Position:** Right side of summary text
- **Transition:** Smooth 0.3s rotate animation
- **Native triangle:** Hidden with `list-style: none`

### Hover State

- **Background:** Changes to `var(--surface-alt)` (slightly lighter)
- **Transition:** Smooth 0.25s ease

### Expanded State

- **Border:** A divider appears between header and content
- **Padding:** Content is indented to match header padding

---

## Accessibility

### Keyboard Navigation

- **Tab:** Focus the summary
- **Enter/Space:** Toggle expand/collapse
- **Escape:** No special behavior (native browser default)

### Screen Readers

- **ARIA:** Native `<details>` element handles accessibility
- **Announcement:** "Expandable section" or similar
- **State:** Announces open/closed state

### Semantic HTML

- Uses native HTML5 `<details>` and `<summary>` elements
- No ARIA attributes needed (browser provides them)
- Works without JavaScript

---

## Browser Support

### Full Support

- Chrome/Edge: All versions
- Firefox: All versions (41+)
- Safari: All versions (15.1+)
- Mobile browsers: All modern versions

### Fallback

- Older browsers: Content shows by default (graceful degradation)
- No functionality lost, just always visible

---

## Testing Checklist

- [ ] Desktop: Click summary to expand/collapse
- [ ] Desktop: Hover shows background color change
- [ ] Desktop: Keyboard navigation works (Tab, Enter/Space)
- [ ] Tablet: Touch expands/collapses
- [ ] Mobile: Touch works on small screen
- [ ] Accessibility: Screen reader announces correctly
- [ ] Translations: Works with all 9 languages
- [ ] Default state: Content is hidden initially
- [ ] Smooth: Animation feels natural

---

## Files Modified

```
✓ index.html
  - Changed <section> to <details>
  - Changed <h2> to <summary>
  - Removed aria-labelledby (no longer needed)
  - Kept all content and translations

✓ styles.css
  - Removed .methodology h2 styles
  - Added .methodology-summary styles
  - Added .methodology[open] state styles
  - Added content padding for expanded state
```

---

## Git Commit

```
feat: convert methodology section to collapsible details/summary

- Replace methodology <section> with <details> element
- Replace h2 with <summary class="methodology-summary">
- Update CSS for .methodology-summary styling:
  - Add cursor pointer and hover effects
  - Add border transition when [open]
  - Style padding for expanded/collapsed states
- Content remains fully accessible and interactive
```

**Commit Hash:** 1bddd32  
**Branch:** pages

---

## Future Enhancements

1. **Animation:** Add custom expand/collapse animation with CSS `max-height`
2. **Icon:** Add chevron icon (like the attack table)
3. **State persistence:** Remember user's preference (localStorage)
4. **Initial state:** Could be `<details open>` for full visibility

---

## Comparison: Attack Table vs Methodology

Both now use `<details>/<summary>` with identical chevron styling:

| Feature       | Attack Table   | Methodology              |
| ------------- | -------------- | ------------------------ |
| Element       | `<details>`    | `<details>`              |
| Header        | `<summary>`    | `<summary>`              |
| Icon          | Chevron-down   | Chevron-down (identical) |
| Icon color    | Orange         | Orange                   |
| Icon position | Right          | Right                    |
| Rotation      | 180° when open | 180° when open           |
| Default state | Collapsed      | Collapsed                |
| Content       | Attack matrix  | Sources and info         |
| Transition    | 0.3s           | 0.3s                     |
| Styling       | Consistent     | Consistent               |

This creates a **consistent collapsible pattern** throughout the app with identical visual behavior.

---

**Status:** ✓ Complete  
**Date Applied:** March 8, 2026  
**Impact:** UI/UX improvement, better visual hierarchy
