# 🎨 Design System: Time2Crack — "Trust Through Clarity"

**Date**: 2026-05-07  
**Status**: ✅ Approved Design Direction  
**Authored by**: Claude Code (Brainstorming + Frontend Design)  

---

## 📋 Executive Summary

Time2Crack's design system prioritizes **Security + Clarity** to build trust with users. The crack-time calculation is the hero element, supported by visual hierarchy, trust indicators, and educational analysis.

### Core Principles

| Principle | Why | How |
|-----------|-----|-----|
| **Hero First** | Time-to-crack IS the product | Large gradient number, dominant position, immediate visibility |
| **Transparency** | Trust comes from honesty | Trust badges (4 icons), "100% local" visible everywhere |
| **Clarity Over Style** | Confusing = scary | Sémantic colors, flat info hierarchy, no decorative noise |
| **Mobile-First** | Primary use case is mobile | Single-column, large tap targets, readable at 320px |
| **Semantic Colors** | Color = information | Red (critical), Orange (warning), Yellow (moderate), Green (safe) |

---

## 🎯 Visual Hierarchy

### Page Flow (Mobile-First)

```
┌─────────────────────────────┐
│  TRUST BADGES (4 icons)     │ ← Immediate: "This is safe & honest"
├─────────────────────────────┤
│  PASSWORD INPUT             │ ← "100% local" label + secure input
├─────────────────────────────┤
│  ⚠️  HIBP ALERT (if breach) │ ← Real-time danger signal
├─────────────────────────────┤
│  HERO: TIME (47 ans)        │ ← THE ANSWER (gradient, large, dominant)
│  Verdict: Modéré            │
├─────────────────────────────┤
│  RESULTS TABLE              │ ← Details (10 attacks × 6 algos)
│  (colored rows)             │    Color-coded by severity
├─────────────────────────────┤
│  PASSWORD ANALYSIS          │ ← What's wrong & how to fix
│  - Critical issues (red)    │
│  - Checklist (✅/❌)         │
│  - Details (expandable)     │
├─────────────────────────────┤
│  🚨 HIBP BADGE (if breach)  │ ← Reinforcement: breach details
├─────────────────────────────┤
│  FOOTER: Trust Summary      │ ← Recap: What makes us trustworthy
└─────────────────────────────┘
```

### Why This Order?

1. **Trust badges at top** → "This site is honest" (immediate reassurance)
2. **Input + HIBP alert** → "Your password is safe here" (immediate safety)
3. **Hero element** → "Here's the answer you came for" (immediate value)
4. **Details** → "Here's how we calculated it" (verification)
5. **Footer** → "Remember why you trust us" (reinforcement)

---

## 🎨 Color Palette

### Semantic Meaning

```
🔵 Blue (#3b82f6)       → Trust, security, technology
  - Primary actions, borders, highlights
  
🟢 Green (#10b981)      → Safe, strong, protected
  - Strong passwords, secure estimates
  
🟡 Yellow (#fbbf24)     → Moderate, attention, caution
  - Medium-risk passwords, warnings
  
🟠 Orange (#f97316)     → Weak, vulnerable, risky
  - Weak passwords, exploitable conditions
  
🔴 Red (#dc2626)        → Critical, danger, breach
  - HIBP compromised, immediate action needed
```

### Implementation in CSS

```css
--color-intensity-critical: #dc2626;   /* Instant to minutes */
--color-intensity-warning: #f97316;    /* Minutes to hours */
--color-intensity-moderate: #fbbf24;   /* Hours to days */
--color-intensity-safe: #10b981;       /* Months to years */
```

### Table Cell Colors

| Time Range | Color | Hex | Usage |
|-----------|-------|-----|-------|
| Instant - 1 min | Critical Red | #dc2626 | Immediate danger |
| 1 min - 1 hour | Warning Orange | #f97316 | Fast crack possible |
| 1 hour - 1 day | Moderate Yellow | #fbbf24 | Concerning |
| 1 day - 100 years | Safe Green | #10b981 | Strong password |

---

## 🏆 Hero Element: The Crack-Time Display

### Visual Design

```
┌──────────────────────────────────┐
│  "Temps de crack estimé"         │ ← Label (small caps, uppercase)
│                                  │
│      47 ans                      │ ← BIG NUMBER (gradient blue→cyan→green)
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │ ← Gradient bar (same colors)
│                                  │
│  ⚠️  Modéré — Peut être cracké   │ ← Verdict + emoji (colored text)
│                                  │
│  Contre 12× GPU RTX 4090 (bcrypt)│ ← Subtext (disclaimer)
└──────────────────────────────────┘
```

### CSS Implementation

```css
.hero-time {
    font-size: 3rem;              /* 2rem on mobile (320px) */
    font-weight: 700;
    background: linear-gradient(90deg, 
        #3b82f6 0%,    /* Blue (start) */
        #06b6d4 50%,   /* Cyan (middle) */
        #10b981 100%   /* Green (end) */
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;       /* Tighter for impact */
}

.hero-border {
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);
    width: 120px;
    margin: 1rem auto;
    animation: expandWidth 0.6s ease 0.3s backwards;
}
```

### Verdict Colors

```
🔴 Critical (0-1 day)     → color: #dc2626
🟠 Weak (1-7 days)        → color: #f97316
🟡 Moderate (1-30 days)   → color: #fbbf24
🟢 Strong (30+ years)     → color: #10b981
```

### Animation Strategy

- **Load state**: Staggered reveal (label → number → border → verdict)
- **Hover**: Subtle scale (1 → 1.02)
- **Real-time**: Smooth transition (0.3s ease) as user types

---

## 📊 Results Table: Scannable Chaos → Clear Priority

### Problem Solved

**Before**: 60 rows (10 attacks × 6 algorithms) = confusing, no hierarchy  
**After**: Color-coded intensity + best attack highlighted = immediately clear where the threat is

### Visual Design

```
┌─────────────────────────────────────────────┐
│ Attaque        │ MD5      │ SHA-1   │ bcrypt│
├─────────────────────────────────────────────┤
│⚡ Force brute  │ 🔴 Instant│ 🔴 Instant│ 🟢 47 ans  │  ← Best (RED highlight)
│(highlighted)   │ (red bg) │ (red bg)│(green bg) │
├─────────────────────────────────────────────┤
│ Dictionnaire   │ 🟠 3 min │ 🟡 15 min│ 🟢 10 ans │  ← Other (faded 70%)
│(faded 70%)     │ (orange) │ (yellow) │(green) │
└─────────────────────────────────────────────┘
```

### Implementation

**1. Intensity-based cell colors**

```css
.cell-critical {
    background: rgba(220, 38, 38, 0.2);      /* Red + transparency */
    color: #fca5a5;
    font-weight: 500;
}

.cell-warning {
    background: rgba(249, 115, 22, 0.2);     /* Orange + transparency */
    color: #fdba74;
}

.cell-moderate {
    background: rgba(251, 191, 36, 0.2);     /* Yellow + transparency */
    color: #fde047;
}

.cell-safe {
    background: rgba(16, 185, 129, 0.2);     /* Green + transparency */
    color: #86efac;
}
```

**2. Best attack row highlight**

```css
.row-best-attack {
    background: rgba(220, 38, 38, 0.15);     /* Subtle red overlay */
    border-left: 4px solid #dc2626;          /* Red left border */
}

.row-best-attack td:first-child {
    color: #dc2626;                          /* Red text */
}

.row-other {
    opacity: 0.7;                            /* Fade non-best rows */
}
```

**3. Visual signal: ⚡ emoji**

- "⚡" prefix on best attack row
- Immediately recognizable (lightning = energy, speed, danger)

### Mobile Responsiveness

```css
@media (max-width: 640px) {
    .results-table {
        font-size: 0.8rem;
    }
    
    .results-table th,
    .results-table td {
        padding: 0.5rem 0.75rem;    /* Tighter spacing */
    }
}
```

---

## 🛡️ HIBP Alert Strategy: 2-Level Notification

### Problem: "Password compromised" must be visible but not scary

### Solution: Double-confirmation approach

#### Level 1: Alert Strip (Under Input, Real-Time)

**When**: Immediately after user types password in input field  
**Where**: Below password input, above hero element  
**Why**: Catch user before they analyze further

```html
<div class="alert-hibp">
    <div class="alert-hibp-title">⚠️ Mot de passe compromis</div>
    <div class="alert-hibp-message">
        Ce mot de passe a déjà fuité dans plus de 5 millions de fuites connues.
        Changez-le immédiatement partout où vous l'avez utilisé.
    </div>
</div>
```

**CSS**:
```css
.alert-hibp {
    background: rgba(220, 38, 38, 0.1);      /* Light red */
    border-left: 4px solid #dc2626;          /* Red left border */
    border-radius: 8px;
    padding: 1rem;
    animation: slideIn 0.4s ease;
}
```

**Animation**: `slideIn` (top → down, 0.4s)
- Draws attention without being jarring
- User can't miss it while reading page

#### Level 2: Badge + Message (In Results)

**When**: After hero element and table  
**Where**: Prominent card, separate from other results  
**Why**: Reinforce danger after user reads analysis

```html
<div class="hibp-badge-section">
    <div class="hibp-badge">🚨 COMPROMIS</div>
    <div class="hibp-badge-message">
        Ce mot de passe apparaît dans plus de 5 millions de fuites documentées...
    </div>
    <div class="hibp-badge-action">
        <strong>Action immédiate:</strong> Changez ce mot de passe partout...
    </div>
</div>
```

**CSS**:
```css
.hibp-badge {
    display: inline-block;
    background: #dc2626;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
}

.hibp-badge-section {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid #dc2626;
    border-radius: 12px;
    padding: 1.5rem;
}
```

### Why 2-Level?

| Aspect | Strip Only | Badge Only | Both |
|--------|-----------|-----------|------|
| **Immediate warning** | ✅ | ❌ | ✅ |
| **Reinforcement** | ❌ | ✅ | ✅ |
| **Mobile scrolling** | ❌ (may hide) | ❌ (may hide) | ✅ |
| **Desktop scanning** | ✅ | ✅ | ✅ |

**Conclusion**: 2-level approach ensures user cannot miss breach notification.

---

## 👁️ Trust Indicators: Visibility of Honesty

### Problem: Users don't read terms. How do we show we're trustworthy in 3 seconds?

### Solution: 4 Trust Badges at Top of Page

```
┌──────────┬──────────┬──────────┬──────────┐
│    🔒    │    👁️    │    ⚡    │    🔐    │
│  100%    │   Open   │  Rapide  │  k-anon  │
│  Local   │  Source  │ Sans net │   HIBP   │
└──────────┴──────────┴──────────┴──────────┘
```

### CSS Implementation

```css
.trust-badges {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.badge-trust {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    transition: all 0.3s ease;
}

.badge-trust:hover {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.05);
}

.badge-trust-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.badge-trust-text {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    font-weight: 600;
}
```

### Four Trust Signals

| Icon | Title | Message | Why |
|------|-------|---------|-----|
| 🔒 | 100% Local | Aucune transmission | Privacy-first (no cloud) |
| 👁️ | Open Source | Code visible | Transparency (audit it yourself) |
| ⚡ | Rapide | Sans connexion | Works offline (can't send data) |
| 🔐 | k-anonymity | HIBP sûr | Privacy-preserving checks |

### Placement Strategy

1. **At top** (above input): Immediate reassurance
2. **In input help text**: "Votre mot ne quitte jamais votre navigateur"
3. **In footer**: Recap + links to source code

### Accessibility

- Each badge has icon + text (not just icon)
- Hover state (color change) for discovery
- Clickable → expandable details (optional future enhancement)

---

## 📝 Password Analysis Section

### Design Goals

- **Actionable**: Show what's wrong + how to fix
- **Hierarchized**: Critical issues first, then composition
- **Educational**: Expandable details for users who want to learn

### Layout

```
┌─────────────────────────────┐
│  CRITICAL ISSUES            │  ← Red boxes (immediate attention)
│  ❌ Pas de symboles         │
│     → Ajoutez !@#$%        │
├─────────────────────────────┤
│  COMPOSITION                │  ← Checklist (what's there, what's not)
│  ✅ Minuscules              │
│  ✅ Majuscules              │
│  ✅ Chiffres                │
│  ❌ Symboles                │
│  ✅ Longueur (14)           │
├─────────────────────────────┤
│  ℹ️ Pourquoi ces critères?  │  ← Expandable (progressive disclosure)
│  → Why minuscules matter    │
│  → Why symbols help         │
│  → Why length is key        │
└─────────────────────────────┘
```

### CSS Implementation

**Critical Issues (Red boxes)**:
```css
.issue-critical {
    background: rgba(220, 38, 38, 0.1);
    border-left: 4px solid #dc2626;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
}

.issue-critical-title {
    color: #dc2626;
    font-weight: 600;
}
```

**Composition Checklist**:
```css
.checklist {
    background: var(--color-bg-dark);
    border-radius: 8px;
    padding: 1rem;
}

.checklist-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.checklist-item.present {
    color: var(--color-success);
}

.checklist-item.missing {
    color: var(--color-text-tertiary);
}
```

**Expandable Details**:
```css
.details-expandable details {
    cursor: pointer;
}

.details-expandable summary {
    color: var(--color-primary-light);
    font-weight: 600;
    user-select: none;
}

.details-expandable-content {
    background: var(--color-bg-dark);
    border-left: 2px solid var(--color-primary);
    padding: 1rem;
    margin-top: 1rem;
}
```

### Progressive Disclosure

- **Critical issues** visible by default (can't ignore)
- **Checklist** visible by default (educational, not threatening)
- **Details** hidden by default (let curious users dig deeper)

---

## 📱 Mobile Responsiveness

### Breakpoints

```css
/* Mobile-first base (0px - 640px) */
/* Defaults set for this range */

/* Tablet and up (641px+) */
@media (min-width: 641px) {
    .trust-badges {
        grid-template-columns: repeat(4, 1fr);  /* Side-by-side */
    }
    
    .hero-time {
        font-size: 3rem;  /* Larger on bigger screens */
    }
}
```

### Mobile Considerations

| Element | Mobile (320px) | Desktop (1024px) | Why |
|---------|----------------|------------------|-----|
| Hero font | 1.75rem | 3rem | Readability, doesn't overflow |
| Trust badges | 2 cols | 4 cols | Single column at narrow width |
| Table padding | 0.5rem | 0.75rem | Tight spacing on mobile |
| Hero section | 1.5rem padding | 2rem padding | More breathing room on desktop |

### Testing Checklist

- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13/14)
- [ ] 480px (larger phones, landscape)
- [ ] 768px (tablets)
- [ ] 1024px+ (desktop)

---

## 🎬 Animation & Motion

### Principles

- **Purposeful**: Animation communicates (not decorative)
- **Fast**: < 500ms total for page load
- **Accessible**: Respects `prefers-reduced-motion`

### Key Animations

#### 1. Hero Element Staggered Reveal

```css
.hero-label {
    animation: fadeInUp 0.6s ease 0s backwards;
}

.hero-time {
    animation: scaleIn 0.6s ease 0.2s backwards;
}

.hero-border {
    animation: expandWidth 0.6s ease 0.3s backwards;
}

.hero-verdict {
    animation: fadeInUp 0.6s ease 0.4s backwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes expandWidth {
    from {
        width: 0;
        opacity: 0;
    }
    to {
        width: 120px;
        opacity: 1;
    }
}
```

**Total duration**: 600ms (label) + 400ms (verdict) = ~1s total reveal

#### 2. HIBP Alert Slide-In

```css
.alert-hibp {
    animation: slideIn 0.4s ease;
}

@keyframes slideIn {
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

**Trigger**: Real-time, as user types password in input

#### 3. Hover States

```css
.badge-trust:hover {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.05);
    transition: all 0.3s ease;
}

.results-table tr:hover {
    background: rgba(59, 130, 246, 0.05);
}
```

### Accessibility

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 🔤 Typography

### Font Stack

```css
--font-sans: 'IBM Plex Sans', system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
```

**Why IBM Plex?**
- Geometric, modern, readable at small sizes
- Professional without being sterile
- Excellent for security-focused tools
- Strong multilingual support

### Hierarchy

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 (Verdict) | 1.25rem | 600 | "Votre mot: Faible" |
| H2 (Section) | 1.1rem | 600 | "Temps de crack" |
| **Hero Number** | 3rem | 700 | **47 ans** (vedette) |
| Body text | 1rem | 400 | Explanations |
| Small text | 0.9rem | 400 | Secondary info |
| Caption | 0.85rem | 400 | Metadata |
| Mono (input) | 1rem | 400 | Password display |

### Line Height

```css
body {
    line-height: 1.6;  /* Comfortable reading */
}

.details-expandable-content {
    line-height: 1.6;  /* More breathing room for explanations */
}
```

### Mobile Typography

```css
@media (max-width: 640px) {
    h1 { font-size: 1.125rem; }
    h2 { font-size: 1rem; }
    .hero-time { font-size: 1.75rem; }  /* 2rem might overflow */
    body { font-size: 0.95rem; }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Hero + Table (P0 - 4h)

- [ ] Replace hero element with gradient number + border
- [ ] Add staggered animations (label → number → border → verdict)
- [ ] Implement table intensity colors (red/orange/yellow/green)
- [ ] Highlight best attack row with ⚡ emoji + red background
- [ ] Fade non-best rows to 70% opacity
- [ ] Test responsive (320px, 375px, 480px)

### Phase 2: HIBP + Analysis (P1 - 5.5h)

- [ ] Add alert strip under password input (HIBP detection)
- [ ] Add badge + message in results section (if breach)
- [ ] Implement critical issues red boxes
- [ ] Add composition checklist
- [ ] Add expandable details
- [ ] Test HIBP positive/negative cases

### Phase 3: Trust + Polish (P2 - 3h)

- [ ] Add 4 trust badges at top
- [ ] Make badges interactive (hover states)
- [ ] Add footer trust summary
- [ ] Polish animations
- [ ] Final responsive testing
- [ ] CSP hash verification

---

## 🔐 CSP Hash Management

**Important**: Any changes to inline `<style>` or `<script>` requires CSP hash update.

```bash
# After modifying style content:
echo -n "inline_style_content" | openssl dgst -sha256 -binary | openssl enc -base64

# Update in index.html:
# <meta http-equiv="Content-Security-Policy" 
#       content="... style-src 'sha256-NEWHASH=' ..." />
```

---

## 📊 Design Metrics

### Color Contrast (WCAG AA)

| Combination | Ratio | Pass |
|------------|-------|------|
| Text on dark background | 7:1+ | ✅ |
| Text on colored background | 4.5:1+ | ✅ |
| Border on border | 3:1+ | ✅ |

### Spacing Grid

- Base unit: 0.25rem (4px)
- Margins: 0.5rem, 1rem, 1.5rem, 2rem
- Padding: 0.75rem, 1rem, 1.5rem, 2rem

### Typography Scale

```
1rem (base)
× 1.125 = 1.125rem (small)
× 1.25 = 1.25rem (h2)
× 1.5 = 1.5rem (h1 secondary)
× 2.5-3 = 2.5-3rem (hero)
```

---

## 🎯 Success Criteria

Design is successful if:

1. **Security perceived**: User feels protected (not scared) within 3 seconds
2. **Clarity immediate**: User understands "47 ans" is the crack time within 1 second
3. **Trust visible**: Trust badges communicate honesty without reading text
4. **Action clear**: Password problems + solutions are obvious
5. **Mobile seamless**: No horizontal scroll, all tap targets > 44×44px
6. **HIBP unmissable**: Breach notification impossible to ignore

---

## 📝 Prototype Files

- **`PROTOTYPE_DESIGN_SYSTEM_COMPLETE.html`** — Interactive prototype (open in browser)
- **`BRAINSTORM_DESIGN_SYSTEM.html`** — Brainstorming companion (options comparison)

---

## 🚀 Next Steps

1. **Review prototype** in browser (test at 320px, 375px, 480px)
2. **Approve design decisions** (4 key choices validated above)
3. **Create branch**: `v2-ux-improvements`
4. **Implement Phase 1** (hero + table): 4 hours
5. **Implement Phase 2** (HIBP + analysis): 5.5 hours
6. **Testing & polish**: 1-2 hours
7. **PR ready**: Commit + review

---

**Design Document Version**: 1.0  
**Last Updated**: 2026-05-07  
**Status**: ✅ Ready for Implementation
