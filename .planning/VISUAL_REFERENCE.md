# Time2Crack Visual Reference Guide

## Color Swatches, Typography Examples, and Component States

---

## COLOR PALETTE REFERENCE

### Dark Theme (Primary)

```
BACKGROUNDS & SURFACES
├─ --bg:          #0C0C0E  (Ultra-dark, main background)
├─ --surface:     #161619  (Card backgrounds, lifted elements)
├─ --surface-alt: #1E1E22  (Hover state, alternates)
└─ --border:      #2A2A30  (Dividers, outlines)

NEUTRAL TEXT
├─ --text:        #E8E6E3  (Primary text, body copy)
├─ --text-lighter:#B0ADAA  (Secondary labels)
└─ --text-muted:  #8A8A8E  (Tertiary hints, disabled)

SEMANTIC COLORS — NEW PALETTE
├─ --critical:    #FF5A5A  (Danger, weak passwords, breaches) + --critical-dim: #FF5A5A22
├─ --warning:     #FFB84D  (Caution, suspicious patterns) + --warning-dim: #FFB84D22
├─ --success:     #2ECC71  (Good, strong passwords) + --success-dim: #2ECC7122
├─ --accent:      #FFD93D  (UI chrome, primary action) + --accent-dim: #FFD93D33
│                           + --accent-hover: #FFEB6B
└─ --excellent:   #00D4FF  (Exceptional, beyond strong) + --excellent-dim: #00D4FF22
```

### Light Theme

```
BACKGROUNDS & SURFACES
├─ --bg:          #FEFDFB  (Warm white, main background)
├─ --surface:     #F8F7F6  (Card backgrounds, lifted elements)
├─ --surface-alt: #F0EEEC  (Hover state, alternates)
└─ --border:      #DDD9D3  (Dividers, outlines)

NEUTRAL TEXT
├─ --text:        #1A1814  (Primary text, body copy, warm dark)
├─ --text-lighter:#6B6560  (Secondary labels)
└─ --text-muted:  #9A9390  (Tertiary hints, disabled)

SEMANTIC COLORS — ADAPTED FOR LIGHT
├─ --critical:    #E63946  (Danger, more vibrant) + --critical-dim: #E6394622
├─ --warning:     #FF9F1C  (Caution) + --warning-dim: #FF9F1C22
├─ --success:     #06A77D  (Good, muted emerald) + --success-dim: #06A77D22
├─ --accent:      #D4A500  (Golden yellow) + --accent-dim: #D4A50333
└─ --excellent:   #0099CC  (Cyan, less neon) + --excellent-dim: #0099CC22
```

---

## STRENGTH BAR VISUAL PROGRESSION

```
Score 0-20: VERY WEAK
████ (15% fill)
Color: --critical (#FF5A5A)
Label: "Very weak"
Status: ⚠ Warning icon

Score 20-35: WEAK
█████ (25% fill)
Color: --warning (#FFB84D)
Label: "Weak"
Status: ⚠ Alert icon

Score 35-60: MODERATE
████████ (50% fill)
Color: --accent (#FFD93D)
Label: "Moderate"
Status: — Neutral dash

Score 60-90: STRONG
███████████ (75% fill)
Color: --success (#2ECC71)
Label: "Strong"
Status: ✓ Check mark

Score 90-100: VERY STRONG
████████████ (100% fill)
Color: --excellent (#00D4FF)
Label: "Very strong"
Status: ★ Star icon
```

---

## TYPOGRAPHY SCALE

### Headlines

```
h1 (Logo area)
Font: system-ui, weight 900
Size: clamp(1.5rem, 5vw, 2.2rem)
Letter-spacing: -0.04em
Line-height: 1.1
Example: "Time2Crack" (with warm yellow <span> for "2")

h2 (Section headings)
Font: system-ui, weight 800
Size: 1.15rem
Letter-spacing: 0.08em
Line-height: 1.2
Text-transform: uppercase
Example: "METHODOLOGY AND SOURCES"

h3 (Sub-sections)
Font: system-ui, weight 700
Size: 0.95rem
Letter-spacing: 0.05em
Line-height: 1.3
Text-transform: none, but often uppercase by context
Color: var(--accent)
Example: "10 attack types modeled"
```

### Body Text

```
p (Normal paragraph)
Font: system-ui, weight 400
Size: 1rem
Line-height: 1.65
Color: var(--text)
Example: Lorem ipsum dolor sit amet...

.text-muted (Secondary text)
Font: system-ui, weight 400
Size: 0.9rem
Color: var(--text-muted)
Line-height: 1.6
Example: Hints, secondary information

.label (Form labels, headings)
Font: system-ui, weight 600
Size: 0.75rem
Letter-spacing: 0.12em
Text-transform: uppercase
Color: var(--text-lighter)
Example: "CHARACTERS" or "CHARSET SIZE"
```

### Monospace (Technical)

```
.detail-value (Results, metrics)
Font: 'DM Mono', monospace, weight 600
Size: 1.3rem
Letter-spacing: -0.02em
Line-height: 1.2
Example: "18" (password length) or "2^132" (combinations)

.time-cell (Attack table, timings)
Font: 'DM Mono', monospace, weight 600
Letter-spacing: -0.02em
White-space: nowrap
Example: "47 years" or "< 1 second"

input[type="password"]
Font: 'DM Mono', monospace, weight 400
Size: 1rem
Line-height: 1.5
Example: User's typed password
```

---

## VULNERABILITY TAG STYLES

```
CRITICAL (Red)
┌─────────────────────────────┐
│ ⚠ Common password           │
└─────────────────────────────┘
Background: --critical-dim (#FF5A5A22)
Border: 1.5px solid --critical (#FF5A5A)
Text color: --critical (#FF5A5A)
Font size: 0.7rem, weight 700
Padding: 0.4rem 0.8rem
Border-radius: 20px
Examples:
  • Common password
  • Too short (< 8)
  • Single char type
  • Keyboard pattern

WARNING (Orange)
┌─────────────────────────────┐
│ ⚡ Sequence detected       │
└─────────────────────────────┘
Background: --warning-dim (#FFB84D22)
Border: 1.5px solid --warning (#FFB84D)
Text color: --warning (#FFB84D)
Examples:
  • Sequence detected
  • Repetition
  • Date detected
  • Predictable structure

SUCCESS (Green)
┌─────────────────────────────┐
│ ✓ Excellent length          │
└─────────────────────────────┘
Background: --success-dim (#2ECC7122)
Border: 1.5px solid --success (#2ECC71)
Text color: --success (#2ECC71)
Examples:
  • Good diversity
  • Good length
  • Excellent length
```

---

## CARD & CONTAINER STYLES

### Standard Card

```
┌─────────────────────────┐
│ [content]               │
└─────────────────────────┘

Background: --surface (#161619)
Border: 1.5px solid --border (#2A2A30)
Border-radius: 12px (--radius)
Padding: 1.5rem
Box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
On hover: border-color: --accent (#FFD93D)
```

### Input Section (Focus State)

```
┌─────────────────────────────────────────────────┐
│  [Your password...                      ] [Show]│
└─────────────────────────────────────────────────┘

Border: 2px solid --accent (#FFD93D)
Background: --bg (#0C0C0E)
Box-shadow: 0 0 0 3px --accent-dim (#FFD93D33),
            inset 0 0 0 1px --accent
Glow effect: inset 0 0 8px rgba(255, 217, 61, 0.1)
```

### Result Cards (Fast vs. Slow)

FASTEST (Red-bordered)

```
┌────────────────────┐
│ ⚠ FASTEST CRACK    │
│ < 1 second         │
│ Now                │
│ Dictionary (MD5)   │
└────────────────────┘

Border-left: 4px solid --critical (#FF5A5A)
Accent color on duration: --critical

SLOWEST (Green-bordered)
┌────────────────────┐
│ ✓ SLOWEST CRACK    │
│ 4 trillion years   │
│ Beyond universe    │
│ Brute (Argon2id)   │
└────────────────────┘

Border-left: 4px solid --success (#2ECC71)
Accent color on duration: --success
```

---

## ALERT/BANNER STATES

### HIBP Breach Alert

```
┌──────────────────────────────────────────────┐
│ ⚠ This password has been leaked!             │
│ Appears 847 times in data breaches.          │
│ Verified via k-anonymity: only first 5       │
│ characters of SHA-1 hash sent.               │
│ → Do not use this password.                  │
└──────────────────────────────────────────────┘

Background: --critical-dim (#FF5A5A22)
Border: 2px solid --critical (#FF5A5A)
Title color: --critical
Text color: --text-lighter
Icon: ⚠ (emoji or SVG)
Animation: Slide in from top (200ms)
```

### HIBP Safe Signal

```
┌──────────────────────────────────────────────┐
│ ✓ Not in known breaches                      │
│ Verified via Have I Been Pwned.              │
└──────────────────────────────────────────────┘

Background: --success-dim (#2ECC7122)
Border: 2px solid --success (#2ECC71)
Text color: --success
Icon: ✓ (emoji or SVG)
Animation: Slide in from top (200ms)
Tone: Reassuring, brief
```

### Network Error

```
┌──────────────────────────────────────────────┐
│ ⚠ Could not verify (network issue)           │
│ Check your connection and try again.         │
└──────────────────────────────────────────────┘

Background: --warning-dim (#FFB84D22)
Border: 2px solid --warning (#FFB84D)
Text color: --warning
Icon: ⚠ (emoji or SVG)
Tone: Informational, not alarming
```

---

## INTERACTIVE ELEMENT STATES

### Button (Primary — Accent Color)

```
Default:
┌──────────────────┐
│  Show            │
└──────────────────┘
Background: --surface (#161619)
Border: 2px solid --border (#2A2A30)
Text color: --text-muted

Hover:
┌──────────────────┐
│  Show            │
└──────────────────┘
Background: --surface-alt (#1E1E22)
Border: 2px solid --accent (#FFD93D)
Text color: --accent-hover (#FFEB6B)

Active:
Background: --accent-dim (#FFD93D33)
Transform: scale(0.98)
```

### Reset Button

```
Default:
┌────────────────────┐
│  ↻ Reset           │
└────────────────────┘
Background: transparent
Border: 2px solid --border
Text color: --text-muted

Hover:
Background: --accent-dim (#FFD93D33)
Border: 2px solid --accent
Text color: --accent-hover
Transform: none (on desktop), scale(0.98) on mobile

Active:
Transform: scale(0.98)
```

### Toggle Visibility Button

```
Default: "Show"
Text color: --text-muted
Hover:   "Show" (color shifts to --accent-hover)
Active:  "Hide" (text changes, color to --accent)
```

---

## FOCUS & KEYBOARD ACCESSIBILITY

### Focus Ring (Universal)

```
Outline: 3px solid --accent (#FFD93D)
Outline-offset: 3px
Border-radius: 2px
Applied to: All focusable elements (buttons, inputs, links, tabs)

On inputs: Outline-offset: 0 (inside border) or -3px for tight fit
On links: Outline-offset: 3px (outside element)
```

### Focus Within (Container)

```
.input-section:focus-within
Border-color: --accent (#FFD93D)
Box-shadow: 0 0 0 3px --accent-dim (#FFD93D33)
Subtle enhancement to guide attention
```

---

## RESPONSIVE TYPOGRAPHY

### Mobile (< 480px)

```
h1: clamp(1.3rem, 4vw, 1.8rem) — smaller at breakpoint
h2: 0.95rem (unchanged)
Body: 1rem (unchanged)
.label: 0.75rem, smaller line-height
Input: 1rem, slightly larger touch target
```

### Tablet (480px - 768px)

```
h1: clamp(1.5rem, 5vw, 2rem) — medium
Body: 1rem (standard)
Details grid: 2 columns instead of 5
```

### Desktop (768px+)

```
h1: clamp(1.5rem, 5vw, 2.2rem) — full size
Body: 1rem (standard)
Details grid: 5 columns
Results: 2-column layout (desktop optimized)
```

---

## ANIMATION & TRANSITION TIMINGS

```
Fast (micro-interactions):
  Duration: 0.2s
  Easing: ease
  Use for: Hover states, toggles, small element changes

Standard (component states):
  Duration: 0.3s - 0.4s
  Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy
  Use for: Results appearing, details updating, bar fill

Slow (attention-grabbing):
  Duration: 0.5s - 0.7s
  Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — smooth bounce
  Use for: HIBP banners, major state changes

Respect prefers-reduced-motion:
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
```

---

## SHADOW SYSTEM

```
--shadow-sm (cards at rest, subtle depth):
  0 1px 3px rgba(0, 0, 0, 0.12),
  0 1px 2px rgba(0, 0, 0, 0.24)

--shadow-md (cards on hover, elevated):
  0 3px 6px rgba(0, 0, 0, 0.15),
  0 2px 4px rgba(0, 0, 0, 0.12)

Inset shadow (input focus):
  inset 0 0 8px rgba(255, 217, 61, 0.1)
  (glow effect with accent color at very low opacity)

Glow effect (HIBP banner):
  box-shadow: 0 0 12px rgba(255, 90, 90, 0.1)
  (subtle outer glow for attention)
```

---

## SPACING SCALE

```
--spacing-xs: 0.5rem    (8px)
--spacing-sm: 0.75rem   (12px)
--spacing-md: 1rem      (16px)
--spacing-lg: 1.5rem    (24px)
--spacing-xl: 2rem      (32px)

Applied to:
  Padding: Cards (1.5rem), Inputs (0.75rem, 1rem)
  Margin: Between sections (2rem, 1.5rem)
  Gap: Grid/flex gaps (0.75rem, 1rem)
  Border-radius:
    Standard: 12px (--radius)
    Small: 8px (--radius-sm)
    Pill: 20px (tags, badges)
```

---

## COMPONENT STATES QUICK REFERENCE

### Password Length Status

```
< 8 chars    → ⚠ Warning (red)          [--critical]
8-12 chars   → ✓ Good (green)           [--success]
12-16 chars  → ✓ Good (green)           [--success]
16+ chars    → ★ Excellent (cyan)       [--excellent]
```

### Strength Score Mapping

```
0-20    → Very Weak  (Critical Red)     [--critical #FF5A5A]
20-35   → Weak       (Warning Orange)   [--warning #FFB84D]
35-60   → Moderate   (Accent Yellow)    [--accent #FFD93D]
60-90   → Strong     (Success Green)    [--success #2ECC71]
90-100  → V. Strong  (Excellent Cyan)   [--excellent #00D4FF]
```

### Entropy Indicators

```
0-28 bits    → Low entropy (red danger)
28-36 bits   → Moderate entropy (yellow)
36-60 bits   → Good entropy (green)
60-128 bits  → Excellent entropy (cyan)
128+ bits    → Exceptional (cyan + star)
```

---

## PRINT CONSIDERATIONS

Time2Crack is digital-only, but if printed:

- Dark theme converts to light for readability
- All semantic colors maintain WCAG AA contrast
- Emojis/icons print as-is
- Monospace values remain monospace
- Timeline/strength bar adapt to grayscale if needed

---

## DESIGN SYSTEM METADATA

| Aspect                   | Value                                                |
| ------------------------ | ---------------------------------------------------- |
| **Color Depth**          | 24-bit (8 bits per channel)                          |
| **Font Loading**         | System + Google Fonts (DM Mono, Outfit optional)     |
| **Animation Frame Rate** | 60 FPS (60Hz monitors), respects device capabilities |
| **Accessibility Level**  | WCAG 2.1 AA+                                         |
| **Supported Browsers**   | Modern (ES6+, CSS Grid/Flexbox, CSS Variables)       |
| **Mobile Viewport**      | 320px minimum (responsive)                           |
| **Print Optimization**   | Not required (web-only tool)                         |

---

**Visual Reference Version**: 1.0  
**Last Updated**: March 2026  
**Companion to**: Time2Crack Design Analysis
