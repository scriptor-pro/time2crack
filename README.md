# Time2Crack — Free Open-Source Password Strength Checker & Generator

![Time2Crack Logo](time2crack.svg)

**Honnête, transparent et open-source.** Time2Crack calcule gratuitement le temps de résistance au piratage de votre mot de passe, sans jamais transmettre votre mot de passe.

## 🎯 Features

- **100% Client-Side**: Aucun mot de passe transmis. Exécution locale complète dans votre navigateur.
- **Zero Privacy Risk**: Seul le hash SHA-1 des 5 premiers caractères est envoyé à Have I Been Pwned (k-anonymité).
- **10 Types d'Attaque**: Brute force, Dictionary, Hybrid, Mask, Rainbow table, Credential stuffing, Password spraying, Markov, PCFG, Combinator.
- **6 Algorithmes de Hashing**: MD5, SHA-1, SHA-256, NTLM, bcrypt, Argon2id.
- **9 Languages**: EN, FR, ES, PT, DE, TR, IT, PL, NL avec wordlists spécifiques par langue.
- **Advanced Analysis**: Character-by-character heatmap, entropy, charset diversity, pattern detection.
- **No Build Required**: Static SPA - fonctionne directement en navigateur, zéro dépendance.

## 🚀 Quick Start

### Local Development
```bash
# Serve locally
python3 -m http.server 8000
# ou
npx http-server
# ou
npx live-server

# Ouvrir http://localhost:8000
```

### Project Structure
```
.
├── index.html              # Single HTML page (CSP-hardened)
├── app.js                  # Main app (~3850 lines, IIFE)
├── styles.css              # Dark theme, responsive design
├── time2crack.svg          # Logo (vectoriel)
├── time2crack.webp         # Logo (optimisé WebP)
├── time2crack.avif         # Logo (ultra-optimisé AVIF)
├── data/
│   ├── translations.json   # i18n (9 languages)
│   ├── common-passwords.json  # Top 1000 leaked passwords
│   ├── wordlists/          # Language-specific dictionaries (lazy-loaded)
│   │   ├── en.txt, fr.txt, es.txt, pt.txt, de.txt, tr.txt, it.txt, pl.txt, nl.txt
│   └── lang-french-full.txt   # Backup French wordlist
├── scripts/
│   ├── download-wordlists.mjs  # Fetch & filter wordlists
│   └── sync-common-passwords.mjs  # Update leaked passwords dataset
├── CLAUDE.md               # Development guide for Claude Code
└── README_DESIGN.md        # Detailed design documentation
```

## 📊 Password Strength Calculation

### Entropy & Complexity Analysis
Calcul basé sur Shannon entropy:
- Longueur du mot de passe
- Charset utilisé (minuscules, majuscules, chiffres, symboles)
- Patterns détectés (mots du dictionnaire, patterns clavier, séquences, dates, etc.)

### Attack Time Estimation
**Baseline: 12× NVIDIA RTX 4090 (Experienced Attacker 2025)**

| Algorithm | Hash Rate | Exemple (11 chars mixed) |
|-----------|-----------|--------------------------|
| MD5 | 2,027 GH/s | ~2 jours |
| SHA-1 | 610 GH/s | ~1 semaine |
| SHA-256 | 272 GH/s | ~1 mois |
| NTLM | 3,462 GH/s | ~1 jour |
| bcrypt (cost 5) | 2.2 MH/s | ~500 ans |
| Argon2id | 800 H/s | ~10 millions d'années |

### 10 Attack Types
1. **Brute Force**: Tous les caractères possibles testés séquentiellement
2. **Dictionary**: Mots du dictionnaire + mutations
3. **Hybrid**: Dictionnaire + mutations (1000 variantes/mot)
4. **Mask**: Structures prévisibles (Name123!, CapsWord+digits)
5. **Rainbow Table**: Lookup instantané sur hashes non-salés
6. **Credential Stuffing**: Réutilisation de paires leakées (HIBP)
7. **Password Spraying**: Mots de passe communs testés en masse
8. **Markov**: Priorité statistique aux séquences probables
9. **PCFG**: Context-Free Grammar matching (grammatical patterns)
10. **Combinator**: Concaténation de 2 mots du dictionnaire

### Vulnerability Detection
- **Common passwords**: HIBP k-anonymity check (5-char SHA-1)
- **Dictionary words**: Language-specific wordlist (50k–200k words)
- **Keyboard patterns**: qwerty, asdf, diagonal walks
- **Sequences**: 123, abc, aaa
- **Dates**: MM/DD/YYYY, DD/MM/YYYY patterns
- **Mask patterns**: Predictable structures
- **Passphrases**: Multiple dict words detected

## 🛡️ Security & Privacy

### Zero Password Transmission
- Passwords **never leave your device**
- All calculations happen **locally in your browser**
- Only external request: HIBP k-anonymity verification (SHA-1 first 5 chars)
- See [Have I Been Pwned API](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange) for details

### Content Security Policy
Strict CSP headers prevent:
- `eval()`, `setTimeout(string)`, `new Function()`
- Inline event handlers
- External scripts (except Umami analytics + Bunny fonts)

### Dependencies
- **Zero runtime dependencies** (static SPA)
- **Optional dev**: Node.js scripts for wordlist management

## 📱 Responsive Design
- **Mobile-first**: Fully responsive UI
- **Dark theme**: Reduces eye strain (based on Szpak et al. 2020)
- **Accessible**: WCAG 2.1 AA compliance, screen reader support
- **Fast**: <500ms initial load, <200ms dictionary load

## 🌐 Internationalization (i18n)

9 fully supported languages with language-specific wordlists:

| Language | Code | Wordlist | Source |
|----------|------|----------|--------|
| English | en | 100k words | SecLists Wikipedia |
| Français | fr | 150k words | SecLists Wikipedia |
| Español | es | 120k words | SecLists Wikipedia |
| Português | pt | 100k words | SecLists Wikipedia |
| Deutsch | de | 100k words | SecLists Wikipedia |
| Türkçe | tr | 80k words | SecLists Wikipedia |
| Italiano | it | 100k words | kkrypt0nn |
| Polski | pl | 120k words | kkrypt0nn |
| Nederlands | nl | 100k words | kkrypt0nn |

Switch languages in UI selector (top navigation).

## 🔧 Development

### Update Wordlists
```bash
node scripts/download-wordlists.mjs
```
Downloads & filters wordlists from SecLists + kkrypt0nn, keeping words ≥4 chars.

### Update Common Passwords
```bash
node scripts/sync-common-passwords.mjs
```
Refreshes `data/common-passwords.json` with top leaked credentials.

### Release Fingerprinting (Anti-Drift)
```bash
# Build deployable static output with hashed assets in ./dist
npm run release:fingerprint
```

This generates:
- `dist/index.html` with cache-busted references to hashed local assets
- `dist/app.<hash>.js` and `dist/styles.<hash>.css`
- `dist/manifest.json` containing original file names, hashes, and generated file names

Recommended cache policy for production/CDN:
- `index.html`: `Cache-Control: no-cache, must-revalidate`
- `app.<hash>.js` + `styles.<hash>.css`: `Cache-Control: public, max-age=31536000, immutable`

### Cross-Domain Parity Check
```bash
# Default: time2crack.eu vs baudouin.codeberg.page/crack-date
npm run verify:parity

# Custom domains
node scripts/verify-parity.mjs --a https://example-a.tld --b https://example-b.tld
```

### Unified Deployment (single source for both domains)
```bash
# Build dist + sync to pages branch worktree + local commit only
npm run deploy:unified

# Same, then push to origin/pages
npm run deploy:unified:push

# Same, then push and verify parity between time2crack.eu and Codeberg Pages
npm run deploy:unified:verify
```

Notes:
- Source of truth for deployment is always the fingerprinted `dist/` output.
- The script publishes to the `pages` branch (configurable with `--branch`).
- `.domains` is included in `dist/` to keep custom domains (`time2crack.eu`, `www.time2crack.eu`) attached to the same deployment.
- This removes manual drift risk between custom domain and Codeberg Pages URL.

### Code Organization (app.js)
```
Lines 1–10        : Global state (LANG, DICT_WORDS, DICT_LOADING)
Lines 14–~600     : Translations (I.en, I.fr, I.es, etc.)
Lines ~600–~1200  : Utility functions (entropy, charset, patterns)
Lines ~1200–~1800 : Vulnerability analysis (analyzePassword)
Lines ~1800–~2200 : Attack time calculations (calcTTC)
Lines ~2200–~2500 : UI rendering (updateDisplay, renderTable)
Lines ~2500–~2700 : Initialization & event listeners
```

**Key principle**: Each section is self-contained. Modify independently.

## Branch Overview

| Branch | Purpose |
|---|---|
| `main` | Development — source of truth, edit here |
| `sync-main` | Experimental — ML model, advanced build pipeline, password generator |
| `pages` | Deployment — fingerprinted static builds, auto-published to production |

## 📚 Sources & References

### Government Standards & Guidelines
- **NIST SP 800-171 Revision 2 (2021)**. "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations"
  - Password entropy minimum: 60 bits (comptes généraux)
  - Password entropy recommended: 80+ bits
  - Reference: https://csrc.nist.gov/publications/detail/sp/800-171/rev-2
- **OWASP Password Security**. "Password Guidelines"
  - Minimum entropy: 60+ bits
  - Reference: https://owasp.org/www-community/controls/Authentication_cheat_sheet

### Peer-Reviewed Academic Research
- **Wheeler, D. (2016)**. "zxcvbn: Low-Budget Password Strength Estimation" — USENIX Security Symposium
- **Pasquini, D., et al. (2021)**. "Reducing bias in modeling real-world password strength" — USENIX Security '21
- **Hatzivasilis, G., & Papaefstathiou, I. (2015)**. "Password hashing competition" — IACR ePrint

### Industry Benchmarks & Performance Data
- **Hive Systems (2025)**. "2025 Password Table" — 12× NVIDIA RTX 4090 benchmarks
- **Hashcat (2025)**. "Hashcat - Advanced password recovery" — Official v6.2.6 benchmarks
- **Gosney, J. (2016)**. "8× Nvidia GTX 1080 Hashcat Benchmarks" — Sagitta Brutalis system

### Compromised Credentials & Breach Data
- **Have I Been Pwned (Troy Hunt)**. 14+ billion compromised credentials, k-anonymity API
- **Kaspersky Security (2024)**. "193M passwords study: 45% cracked in < 1 minute"

### Wordlist & Dictionary Sources
- **SecLists Project** — EN, FR, ES, PT, DE, TR wordlists
- **kkrypt0nn Wordlists** — IT, PL, NL wordlists

## 🎨 Design System

### Color Palette (Dark Theme)

| Level | Range | Hex | Purpose |
|-------|-------|-----|---------|
| Critical | 0-20 bits | #DC2626 | Very weak |
| Danger | 20-40 bits | #EA580C | Weak |
| Warning | 40-60 bits | #D97706 | Medium |
| Success | 60-80 bits | #16A34A | Good |
| Excellent | 80-120 bits | #15803D | Very strong |
| Exceptional | 120+ bits | #0891B2 | Virtually unbreakable |

### Typography
- **Display/Body**: IBM Plex Sans
- **Monospace**: IBM Plex Mono (code, passwords)

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load | <500ms |
| Dictionary Load | <200ms |
| Per-character Analysis | <5ms |
| Memory (all dicts) | <50MB |

## 📝 License

Apache-2.0 (See LICENSE file)

## 🙋 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

See [CLAUDE.md](CLAUDE.md) for development standards and code organization.

## 📞 Support & Contact

- **Codeberg**: [codeberg.org/baudouin/crack-date](https://codeberg.org/baudouin/crack-date)
- **LinkedIn**: [@baudouinvanhumbeeck](https://www.linkedin.com/in/baudouinvanhumbeeck/)
- **Bluesky**: [@bvh.fyi](https://bsky.app/profile/bvh.fyi)

---

**Version**: 1.1.0
**Last Updated**: 2026-04-01
**Made with 🍫 in Brussels**
