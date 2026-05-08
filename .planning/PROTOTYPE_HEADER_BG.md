# Prototype: Header Background - Terminal Crack Simulation

## 📋 Description

Un prototype qui ajoute une **image de fond au header** montrant une simulation de craquage de mot de passe en terminal. L'effet reste **subtil et lisible** sur tous les appareils.

## 🎯 Design

### Visual Elements
- **Gradient background** : Dégradé bleu-gris foncé (#0D1116 → #0F1621)
- **Scanlines overlay** : Effet de lignes horizontales (CRT monitor)
- **Progress bar** : Barre rouge semi-transparente (65% remplie)
- **Terminal text** : Texte vert du style "hashcat" (semi-transparent)
- **Z-index layering** : Logo, menu langue, Codeberg link au-dessus du fond

### Terminal Text (responsive)
```
$ hashcat -m 1400 hash.txt wordlist.txt
$ Speed: 272.2 GH/s — Progress: 65% — Time: 47m 18s
```

Le texte se **contracte progressivement** selon la taille d'écran :
- **Desktop (1200px+)** : Texte complet, 14px
- **Tablet (768px)** : Texte réduit, 11px
- **Mobile (480px)** : 2 lignes condensées, 9px
- **Petit mobile (320px)** : 2 lignes minimales, 7px

## 📱 Responsive

| Écran | Hauteur header | Terminal text | Opacity |
|-------|---|---|---|
| Desktop (1200px) | 100% | Complet (14px) | 60% |
| Tablet (768px) | 100% | Réduit (11px) | 60% |
| Mobile (480px) | 100% | Condensé 2 lignes (9px) | 40% |
| Petit mobile (320px) | 100% | Minimal 2 lignes (7px) | 30% |

**Important** : La hauteur du header ne change PAS. C'est juste le texte du fond qui s'adapte.

## 🧪 Pour tester

```bash
http://localhost:8000/prototype-header-bg.html
```

Teste sur différentes tailles :
- F12 → Responsive Design Mode
- 320px, 375px, 480px, 768px, 1024px, 1200px

## 🎨 Implémentation technique

### CSS utilisé
```css
header[role="banner"]::before {
  /* Gradient + scanlines */
  background-image: linear-gradient(...), repeating-linear-gradient(...);
}

header[role="banner"]::after {
  /* Terminal text */
  content: '$ hashcat...';
  font-family: 'IBM Plex Mono';
  opacity: 0.3 - 0.6;
}
```

### Z-index
- `::before` et `::after` : z-index 0, 1 (derrière)
- `.lang-selector`, `.logo`, `.codeberg-link` : z-index 1 (devant)

## ✅ Avantages

✨ **Subtle** : N'interfère pas avec la lisibilité des contrôles
🎬 **Thématique** : Montre "craquage de mot de passe" dès le header
📱 **Responsive** : Adapté pour tous les appareils
⚡ **Performant** : CSS pur, pas d'images lourdes
🔧 **Maintenable** : Facile à modifier les couleurs/texte
♿ **Accessible** : Texte reste lisible, contrôles au-dessus

## ❌ Inconvénients

- Texte du fond peut être **trop subtil** pour certains (opacity 30-60%)
- Sur petit mobile (320px), le texte est **très comprimé**
- L'effet scanlines peut être **imperceptible** sur certains écrans

## 🔄 Alternatives / Ajustements possibles

### 1. Augmenter la visibilité du texte
```css
header[role="banner"]::after {
  opacity: 0.8; /* Au lieu de 0.3-0.6 */
  color: rgba(74, 222, 128, 0.5); /* Plus opaque */
}
```

### 2. Ajouter une animation
```css
header[role="banner"]::after {
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}
```

### 3. Remplacer le texte par une image PNG
```css
header[role="banner"] {
  background-image: url('header-bg-desktop.png');
  background-size: cover;
  background-position: center;
}

@media (max-width: 768px) {
  header[role="banner"] {
    background-image: url('header-bg-tablet.png');
  }
}
```

## 📥 Prochaines étapes

1. **Valider le look** : Est-ce que le texte terminal est assez visible ? Trop ?
2. **Ajuster opacity** : Selon le feedback sur lisibilité
3. **Tester sur appareils réels** : Vérifier sur vrais mobiles/tablettes
4. **Décider du format final** :
   - Option A : CSS pur (actuelle) → Léger, maintenable
   - Option B : Image PNG/WebP multi-résolution → Plus visuel mais plus lourd
   - Option C : Animated GIF ou WebP animé → Effet "crack en cours"

## 🎯 Question pour toi

Le texte du terminal est-il :
- ✅ Bien visible et pas trop intrusif ?
- ❌ Trop subtil (à augmenter) ?
- ❌ Trop en avant (à diminuer) ?

Veux-tu que j'ajuste l'opacity ou le texte ? 🚀
