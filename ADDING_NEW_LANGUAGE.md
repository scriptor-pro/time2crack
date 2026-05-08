# Documentation : Ajouter une nouvelle langue à Time2Crack

## Contexte

Time2Crack supporte actuellement 9 langues (EN, FR, ES, PT, DE, TR, IT, PL, NL). Ce document décrit le processus complet et reproductible pour ajouter une 10e langue — depuis les ressources d'entraînement jusqu'à l'UI. C'est une documentation de référence, non un plan d'exécution immédiate.

---

## Aperçu des fichiers à modifier

| Fichier | Rôle |
|---------|------|
| `app.js` | `supportedLangs[]`, bloc traduction `I.{lang}`, `setLang()` |
| `index.html` | Bouton dans `#lang-menu` |
| `404.html` | Bloc traduction inline + bouton sélecteur |
| `scripts/download-wordlists.mjs` | URL source du wordlist |
| `core/rank/mask.js` | Table `L_WORD_COUNT[lang]` (calibration optionnelle) |
| `sitemap.xml` | Alternates `hreflang` |
| `{lang}/` | 8 pages de contenu statique + sous-répertoire `methode/` |

---

## Phase 1 — Ressources & corpus

### 1.1 Wordlist principale
- **Source prioritaire** : SecLists Wikipedia si disponible pour la langue cible.
  - Format URL : `https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Wikipedia/wikipedia_{lang}_vowels_no_compounds_top-1000000.txt`
- **Fallback** : kkrypt0nn (`https://raw.githubusercontent.com/kkrypt0nn/wordlists/main/wordlists/languages/{nom_langue}.txt`)
- **Pour le russe** : `data/wordlists/ru.txt` existe déjà (fusion de 100k + 50k mots cyrilliques) — passer directement à la phase 2.

### 1.2 Filtre qualité du wordlist
Critères appliqués dans `download-wordlists.mjs` (à respecter manuellement si wordlist existante) :
- Minuscules, normalisé NFC
- Longueur ≥ 4 caractères
- Regex : `/^[a-z0-9àâäáäåèéêëìíîïòóôõöùúûüçñß…]+$/i` — **étendre la regex pour les scripts non-latin** (cyrillique, arabe, etc.)
- Tronqué à 200 000 mots
- Sortie : `data/wordlists/{lang}.txt`

### 1.3 Enregistrer l'URL dans le script de téléchargement
**Fichier** : `scripts/download-wordlists.mjs`, objet `wordlists` (ligne ~16)

```js
ru: {
  url: "https://raw.githubusercontent.com/kkrypt0nn/wordlists/main/wordlists/languages/russian.txt",
}
```

---

## Phase 2 — Traduction de l'UI

### 2.1 Ajouter la langue à `supportedLangs`
**Fichier** : `app.js`, ligne 17

```js
const supportedLangs = ["en", "fr", "es", "pt", "de", "tr", "it", "pl", "nl", "ru"];
```

### 2.2 Créer le bloc de traduction `I.{lang}`
**Fichier** : `app.js`, avant la ligne 1845 (après le bloc `nl`, avant le `};` fermant)

Copier le bloc `nl` (lignes 1664–1844) comme template, puis traduire **toutes les clés** dans la nouvelle langue. Clés obligatoires (~100 clés) :

```
skip, subtitle, inputLabel, placeholder, show, hide, showAria, hideAria,
reset, resetAria, languageAria, strengthAria, dictLoading, hibpTitle, hibpText,
hibpPrivacy, hibpSafe, hibpError, weak, strong, chars, entropyBits,
descDict, descHybrid, descMask, descBrute, descMorph, descPCFG, descMarkov,
descCombi, descRule, descTargeted, bloomCheckNote, bloomFoundTitle,
bloomFoundText, bloomNotFound, bloomLoading, bloomError, dominantAttack,
profileExperienced, ctNotApplicable, genLength, ...
```

**Note critique** : La fonction `t(k)` (ligne 1847) fait un fallback vers `I.en[k]` pour toute clé manquante — les clés non traduites afficheront silencieusement l'anglais. Vérifier l'exhaustivité.

### 2.3 Cas particuliers (hardcodés)
Ces 13 vérifications `LANG === "fr"` dans `app.js` ne nécessitent **pas** de modification pour ajouter une nouvelle langue — elles tomberont naturellement sur la branche `else` (comportement anglais) :
- Lignes 2482, 2487 — badge RockYou
- Ligne 2920–2922 — `document.title`
- Ligne 3225 — dispatch description attaque
- Ligne 3359 — `toLocaleDateString`
- Lignes 5600, 5615, 5631 — formatage années/date
- Lignes 5649–5652 — `confidenceText()`
- Lignes 5898, 6075 — badge HIBP

Si la nouvelle langue a des besoins grammaticaux spécifiques (articles, genre, etc.), ajouter les branches `LANG === "ru"` correspondantes dans ces sections.

---

## Phase 3 — Sélecteur de langue UI

### 3.1 Bouton dans `index.html`
**Fichier** : `index.html`, div `#lang-menu` (lignes 271–281)

```html
<button type="button" class="lang-option" data-lang="ru">RU — Русский</button>
```

### 3.2 Bouton dans `404.html`
**Fichier** : `404.html`, groupe `.lang-switch` (lignes 146–158)

```html
<button class="lang-btn" data-lang="ru">RU</button>
```

Et ajouter le bloc de traduction dans l'objet `translations` inline (lignes 319–392) :

```js
ru: {
  title: "404 — Страница не найдена | Time2Crack",
  heading: "Страница не найдена",
  message: "...",
  btn: "На главную",
  // ...
}
```

---

## Phase 4 — Calibration du modèle de masque (optionnel mais recommandé)

**Fichier** : `core/rank/mask.js`, objet `L_WORD_COUNT` (lignes 40–63)

Sans calibration, la nouvelle langue utilisera les statistiques anglaises (fallback ligne 106). Pour une meilleure précision :

1. **Compter les mots par longueur** dans `data/wordlists/{lang}.txt` :
   ```bash
   awk '{print length}' data/wordlists/ru.txt | sort -n | uniq -c
   ```

2. **Ajouter l'entrée** dans `L_WORD_COUNT` :
   ```js
   ru: { 4: XXXX, 5: XXXX, 6: XXXX, ... }
   ```

3. **Mettre à jour le commentaire de source** (lignes 65–71 du fichier) avec la date et l'origine du corpus.

---

## Phase 5 — Pages de contenu statique

### 5.1 Structure à créer
Créer le répertoire `{lang}/` avec la même structure que `fr/` ou `en/` :

```
{lang}/
├── about.html
├── faq.html
├── generator.html
├── hibp.html
├── how-time2crack-works.html
├── privacy.html
├── sources.html
└── methode/
    ├── index.html
    ├── bruteforce.html
    ├── combinator.html
    ├── dictionary.html
    ├── hybrid.html
    ├── markov.html
    ├── mask.html
    └── pcfg.html
```

### 5.2 Méthode de génération
- Copier l'intégralité d'un répertoire existant (ex : `cp -r en/ ru/`)
- Traduire le contenu de chaque fichier HTML
- Mettre à jour les balises `<html lang="">`, `<title>`, `<meta description>`, `hreflang`
- **Chemins `detect-language.js`** : `./` pour les pages racine, `../../` pour `methode/` — **attention : ce fichier n'existe pas encore**

### 5.3 Miroir dans `site/`
Reproduire la même structure dans `site/{lang}/` (le répertoire `site/` est le build output déployé).

---

## Phase 6 — SEO & sitemap

**Fichier** : `sitemap.xml`

Pour chaque `<url>` existante, ajouter un `<xhtml:link>` pour la nouvelle langue :

```xml
<xhtml:link rel="alternate" hreflang="ru" href="https://time2crack.eu/?lang=ru"/>
```

Et ajouter une nouvelle `<url>` pour la page de la nouvelle langue si des pages dédiées existent.

---

## Phase 7 — Tests & validation

### 7.1 Tests automatisés
```bash
npm test                    # Suite complète (régression, patterns, rank)
npm run test:regression     # Vérifier que les estimations temps ne régressent pas
```

### 7.2 Tests manuels (navigateur)
```bash
python3 -m http.server 8000
# http://localhost:8000
```

Checklist :
- [ ] Sélectionner la nouvelle langue dans le menu → UI se met à jour
- [ ] Saisir un mot du wordlist → détection dictionnaire fonctionne
- [ ] Résultat table affiche toutes les attaques
- [ ] Vérifier onglet Réseau : HIBP n'envoie que 5 chars SHA-1
- [ ] Tester à 320px, 375px, 480px (mobile-first)
- [ ] Aucune erreur console
- [ ] La langue est mémorisée au rechargement (URL `?lang=xx`)

---

## Ordre d'exécution recommandé

```
1. Préparer wordlist → data/wordlists/{lang}.txt
2. Enregistrer URL source → scripts/download-wordlists.mjs
3. Ajouter supportedLangs → app.js ligne 17
4. Créer bloc I.{lang} → app.js avant ligne 1845
5. Ajouter bouton → index.html + 404.html
6. Calibration L_WORD_COUNT → core/rank/mask.js (optionnel)
7. Créer pages statiques → {lang}/ + site/{lang}/
8. Mettre à jour sitemap.xml
9. Tester en navigateur + npm test
```

---

## Estimation effort par scope

| Scope | Tâches | Effort |
|-------|--------|--------|
| **Minimal** (UI seulement) | Wordlist + traduction UI + boutons sélecteur | 2–4h |
| **Complet** (UI + contenu) | Minimal + 16 pages statiques + calibration | 12–22h |
| **Production** | Complet + SEO + tests exhaustifs | 15–25h |

**Note** : Si le wordlist existe déjà (comme `ru.txt`), enlever 1–2h du total.

---

## Cas particulier : russe (RU)

`data/wordlists/ru.txt` existe déjà (fusion de 100k + 50k mots cyrilliques). Pour intégrer le russe :
- Sauter **Phase 1** entièrement
- **Phase 2** : Traduire les ~100 clés UI en russe
- **Phase 3** : Ajouter 2 boutons
- **Phase 4** : Calibrer `L_WORD_COUNT.ru` via `awk '{print length}' data/wordlists/ru.txt | sort -n | uniq -c`
- **Effort minimal** : 2–3h (sans pages statiques)

---

## Points d'attention critiques

1. **Regex du wordlist** (`download-wordlists.mjs`) : Pour scripts non-latin (cyrillique, arabe, CJK), étendre `/^[a-z0-9àâ...]+$/i` à `[\p{L}\p{N}]+u` (Unicode property escapes)

2. **Fallback traduction** : La fonction `t(k)` (app.js:1847) retourne silencieusement `I.en[k]` si une clé manque — vérifier l'exhaustivité des traductions

3. **Hardcodé LANG === "fr"** : 13 vérifications dans app.js ne nécessitent pas de modification pour ajouter une langue (tomberont sur branche `else`), sauf si grammatique spéciale requise

4. **Pages statiques** : Créer `{lang}/` + `site/{lang}/` en miroir (16 fichiers + répertoire methode/)

5. **SEO/Sitemap** : Ajouter alternates `hreflang` pour la nouvelle langue dans sitemap.xml
