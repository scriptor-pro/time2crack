# Header Background Images - Terminal Crack Simulation

## 📋 Overview

Les images de fond du header montrent une **simulation de craquage de mot de passe en terminal**, optimisées pour tous les appareils (mobile, tablette, desktop).

## 🎨 Image Assets Generated

| Device | Size | Filename | Opacity | Text |
|--------|------|----------|---------|------|
| **Mobile** | 320×180 | `header-bg-mobile.png` | 30% | `$ hashcat` + `$ 65% — 47m 18s` |
| **Mobile HD** | 375×210 | `header-bg-mobile-hd.png` | 40% | `$ hashcat 272.2 GH/s` + `$ Progress: 65%` |
| **Mobile Large** | 480×270 | `header-bg-mobile-large.png` | 40% | `$ hashcat 272.2 GH/s` + `$ Progress: 65%` |
| **Tablet** | 768×350 | `header-bg-tablet.png` | 50% | `$ hashcat -m 1400 hash.txt wordlist.txt` + `$ Speed: 272.2 GH/s` |
| **Desktop** | 1200×400 | `header-bg-desktop.png` | 60% | Full command + speed + progress + time |

## 🚀 How to Generate

### Prerequisites
```bash
npm install canvas
```

### Generate Images
```bash
npm run generate:header-bg
```

**Output:** `data/images/header-bg-*.png` (5 files, ~30-50 KB each)

### What's Generated
Each image contains:
- ✓ Gradient background (#0D1116 → #0F1621)
- ✓ Scanlines overlay (CRT effect)
- ✓ Red progress bar (65% width)
- ✓ Green terminal text (responsive)
- ✓ Success message "✓ CRACKED"
- ✓ Time counter "47m 18s"

## 🔗 Integration into index.html

Replace the header background with:

```html
<header role="banner" style="background-image: url('data/images/header-bg-desktop.png'); background-size: cover; background-position: center top;">
  <!-- Existing header content -->
  <div class="lang-selector">...</div>
  <div class="logo">...</div>
  <a class="codeberg-link">...</a>
</header>
```

Or use responsive `<picture>` element:

```html
<header role="banner" class="header-with-bg">
  <picture class="header-bg">
    <source srcset="data/images/header-bg-desktop.png" media="(min-width: 1024px)">
    <source srcset="data/images/header-bg-tablet.png" media="(min-width: 768px)">
    <source srcset="data/images/header-bg-mobile-large.png" media="(min-width: 480px)">
    <img src="data/images/header-bg-mobile.png" alt="Terminal cracking simulation">
  </picture>

  <!-- Existing header content -->
  <div class="lang-selector">...</div>
  <div class="logo">...</div>
  <a class="codeberg-link">...</a>
</header>
```

With CSS:
```css
header.header-with-bg {
  position: relative;
}

header.header-with-bg .header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

header.header-with-bg .header-bg img,
header.header-with-bg .header-bg source {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

header.header-with-bg .lang-selector,
header.header-with-bg .logo,
header.header-with-bg .codeberg-link {
  position: relative;
  z-index: 1;
}
```

## 📱 Responsive Behavior

### Mobile (320px)
- Image: `header-bg-mobile.png` (320×180)
- Text: Minimal ("$ hashcat" + "65% — 47m 18s")
- Opacity: 30% (subtle, not distracting)

### Mobile HD (375px)
- Image: `header-bg-mobile-hd.png` (375×210)
- Text: Condensed command
- Opacity: 40%

### Mobile Large (480px)
- Image: `header-bg-mobile-large.png` (480×270)
- Text: Same as Mobile HD
- Opacity: 40%

### Tablet (768px)
- Image: `header-bg-tablet.png` (768×350)
- Text: Full command + speed info
- Opacity: 50%

### Desktop (1200px+)
- Image: `header-bg-desktop.png` (1200×400)
- Text: Complete info (command, speed, progress, time)
- Opacity: 60%

## 💾 File Sizes (Approximate)

| Image | Size |
|-------|------|
| Mobile (320×180) | ~8 KB |
| Mobile HD (375×210) | ~10 KB |
| Mobile Large (480×270) | ~12 KB |
| Tablet (768×350) | ~18 KB |
| Desktop (1200×400) | ~25 KB |
| **Total** | **~73 KB** (unoptimized PNG) |

**Optimization tips:**
- Use PNGQuant to reduce file size: `pngquant --quality 70-90 *.png`
- Convert to WebP for better compression: `cwebp -q 80 *.png -o %.webp`
- Use multiple formats with `<picture>`:

```html
<picture>
  <source srcset="header-bg-desktop.webp" type="image/webp" media="(min-width: 1024px)">
  <source srcset="header-bg-desktop.png" media="(min-width: 1024px)">
  <!-- ... -->
</picture>
```

## 🎯 Customization

Edit `scripts/generate-header-bg.mjs` to change:

```javascript
const sizes = [
  {
    name: 'mobile',
    width: 320,
    height: 180,
    fontSize: 7,
    textLines: ['$ hashcat', '$ 65% — 47m 18s'],  // ← Edit text
    opacity: 0.3  // ← Adjust visibility
  },
  // ...
];
```

Then regenerate:
```bash
npm run generate:header-bg
```

## ✅ Prototype Location

**Test before integration:**
```bash
http://localhost:8000/prototype-header-bg.html
```

This prototype uses SVG data URIs (fast preview). For production, use the generated PNG images.

## 🚀 Next Steps

1. ✅ Generate images: `npm run generate:header-bg`
2. ✅ Test with prototype: http://localhost:8000/prototype-header-bg.html
3. ✅ Integrate into `index.html`
4. ✅ Test responsive on real devices (mobile, tablet, desktop)
5. ✅ Optimize images (PNGQuant, WebP conversion)
6. ✅ Deploy to production

## 📊 Performance Impact

- **Initial load**: +73 KB (unoptimized) / ~30-40 KB (with WebP)
- **Render impact**: Minimal (background image only, no JavaScript)
- **Mobile bandwidth**: ~8-12 KB for mobile version
- **Caching**: Browser cache images for repeat visits

## 🔍 Browser Support

✓ All modern browsers (Chrome, Firefox, Safari, Edge)
✓ iOS Safari 12+
✓ Android Chrome 51+
✓ Fallback: If image fails to load, header gradient still visible (see CSS fallback)
