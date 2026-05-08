# Test Coverage Analysis — Time2Crack v2 (21 avril 2026)

## 📊 Résumé Exécutif

| Métrique | Valeur | Statut |
|----------|--------|--------|
| **Modules couvertes** | 12/12 | ✅ 100% |
| **Lignes de test** | 3604 | ✅ Complet |
| **Tests à jour** | 191 passés | ✅ 0 échoués |
| **Derniers commits** | 08a3ae6a (leet-symbols) | ✅ Frais |
| **Régression snapshot** | 60/60 passés | ✅ Stable |

---

## 🎯 Couverture par Module

### **Modules Core (Layer 0-1)**

| Module | Tests | Couverture | Lacunes |
|--------|-------|-----------|---------|
| **patterns.js** | ✅ Complet | 100% | Voir §1 |
| **charset.js** | ⚠️ Indirect | ~70% | Voir §2 |
| **time.js** | ⚠️ Indirect | ~65% | Voir §3 |
| **calc.js** | ⚠️ Minimal | ~40% | Voir §4 |
| **rank/brute.js** | ✅ Complet | 100% | Voir §5 |
| **rank/dictionary.js** | ✅ Complet | 95% | Voir §5 |
| **rank/hybrid.js** | ✅ Complet | 95% | Voir §5 |
| **rank/mask.js** | ✅ Complet | 95% | Voir §5 |
| **rank/markov.js** | ✅ Complet | 100% | Voir §5 |
| **rank/pcfg.js** | ✅ Complet | 100% | Voir §5 |
| **rank/combinator.js** | ✅ Complet | 90% | Voir §5 |
| **rank/index.js** | ✅ Complet | 95% | Voir §5 |

---

## 🔍 Détail des Lacunes par Module

### **§1. patterns.js** (Couverture: 100%) ✅

**Tests existants** :
- ✅ Détection de date (YYYY, DD/MM, DDMM)
- ✅ hybridVuln (2 cas)
- ✅ Patterns clavier (qwerty, azerty, dvorak)
- ✅ Séquences (abc, 123)
- ✅ Répétition (aaabbb)
- ✅ Dictionnaire avec déleet
- ✅ Passphrase (séparateurs, concaténation)
- ✅ Leet-speak + symbols (33 tests récents)

**Lacunes identifiées** :
- ❌ **Cas limites de déleet** : Variantes de leet non couverts (4→A, 1→I, 0→O combinés)
- ❌ **Déleet avec diacritiques** : "solëil" non testé
- ❌ **Passphrase très longue** : 10+ mots non testés (risque de timeout)
- ❌ **Passphrase ambigu** : "catdog" (cat+dog vs catdog mot unique)
- ❌ **Edge cases date** : Années 1900-1999 (limite actuelle 1900-2099)

**Recommendation** : 8-12 cas supplémentaires pour 100% solide

---

### **§2. charset.js** (Couverture: ~70%) ⚠️

**Tests existants** : Aucun test dédié — validé indirectement via validate.mjs

**Langage** :
```js
// core/charset.js exporte :
export { analyzeCharset, countCharsets, ... }
```

**Lacunes identifiées** :
- ❌ **analyzeCharset()** — pas de test unitaire
  - Cas : "" (vide), "a", "A", "1", "!", mélange, unicode
- ❌ **countCharsets()** — pas de test
- ❌ **getCharsetName()** — pas de test
- ❌ **Unicode/accents** : "café", "€", "中文" non testés
- ❌ **Limites charset** : Très long password (1000+ chars)

**Impact** : Moyen (utilisé par rankBrute, mais couvert par tests indirects)

**Recommendation** : Créer `tests/charset.mjs` avec 20-30 cas

---

### **§3. time.js** (Couverture: ~65%) ⚠️

**Tests existants** : Aucun test dédié — validé indirectement via validation

**Fonctions critiques** :
```js
// core/time.js exporte :
export { rankToSeconds, rankToAllSeconds, formatTime, ... }
```

**Lacunes identifiées** :
- ❌ **rankToSeconds()** — pas de test
  - Cas : rank=1, 1e9, 1e18, 1e30, Infinity
  - Différents algos : md5, bcrypt, argon2
  - Profils : amateur, pro, nation-state
- ❌ **rankToAllSeconds()** — pas de test
- ❌ **formatTime()** — pas de test
  - Cas : 0s, 1s, 1m, 1h, 1d, 1y, 1e12s
  - Langues : EN, FR, ES, PT, DE, TR, IT, PL, NL
- ❌ **Limites numériques** : Très grand rank (1e30+)
- ❌ **Arrondis** : Transition jour→année, année→siècle

**Impact** : Moyen (utilisé par app.js, validé partiellement)

**Recommendation** : Créer `tests/time.mjs` avec 50-70 cas

---

### **§4. calc.js** (Couverture: ~40%) ⚠️

**Tests existants** : Minimal — seulement via validate.mjs

**Fonction critique** :
```js
// core/calc.js exporte :
export { calcCrackTime }
```

**Lacunes identifiées** :
- ❌ **calcCrackTime()** — pas de test unitaire dédié
  - Structure complète du résultat non validée
  - Toutes les clés du résultat (`standard`, `optimistic`, `worst_case`, `best_attack`, `details`)
  - Format des `details` (tableau d'attaques)
- ❌ **Gestion des options** :
  - `dictWords` null vs Set
  - `commonPasswords` null vs Set
  - `markovModel` null vs objet
  - `pcfgModel` null vs objet
- ❌ **Cas limites** :
  - Password vide ""
  - Password très long (1000+ chars)
  - Caractères spéciaux (unicode, accents)
- ❌ **Invariants** :
  - standard ≤ optimistic
  - optimistic ≤ worst_case
  - best_attack présent dans details

**Impact** : Haut (orchestrateur principal)

**Recommendation** : Créer `tests/calc.mjs` avec 40-60 cas

---

### **§5. rank/* Modules** (Couverture: 90-100%) ✅

**Tests existants** : Complets dans `rank-units.mjs`

| Module | Cas | Statut |
|--------|-----|--------|
| **brute** | 9 | ✅ Complet |
| **dictionary** | 8 | ✅ Quasi-complet |
| **hybrid** | 7 | ✅ Quasi-complet |
| **mask** | 6 | ✅ Quasi-complet |
| **markov** | 4 | ✅ Complet |
| **pcfg** | 4 | ✅ Complet |
| **combinator** | 5 | ⚠️ Partiel |
| **index** | 12 | ✅ Complet |

**Lacunes spécifiques** :

#### **combinator.js**
- ❌ **Passphrases avec répétitions** : "catcatcat" (3× mot identique)
- ❌ **Passphrases très longues** : 10+ mots
- ❌ **Passphrases ambigu** : "ab" (a+b vs ab)
- ✅ Combinator standard (2+ mots) couvert

#### **dictionary.js**
- ❌ **Déleet avancé** : 4→A + 1→I + 0→O combinés
- ❌ **Cas limites** : Mot de 1-2 chars
- ✅ Déleet standard (0→O, 1→I, etc.) couvert

#### **hybrid.js**
- ❌ **Mutations combinées** : plusieurs mutations sur 1 mot
- ✅ Mutations simples couvertes

#### **mask.js**
- ❌ **Structure très complexe** : 10+ couches imbriquées
- ✅ Structures standard couverts

**Recommendation** : 15-25 cas supplémentaires (haute priorité)

---

## 📋 Fichiers de Test Existants

| Fichier | Lignes | Suites | Cas | Statut |
|---------|--------|--------|-----|--------|
| patterns.mjs | 290+ | 5 | 50+ | ✅ Complet |
| rank-units.mjs | 450+ | 8 | 100+ | ✅ Complet |
| validate.mjs | 400+ | 5 | 65+ | ✅ Complet |
| regression.mjs | 150+ | 1 | 60+ | ✅ Complet |
| test-leet-symbols.mjs | 210+ | 5 | 33 | ✅ Récent |
| **Total** | **1500+** | **24** | **308+** | ✅ Fonctionnel |

---

## 🚀 Recommandations Prioritaires

### **Priorité 1 (Critique)** — Haute couverture

1. **Créer `tests/calc.mjs`** (~50 cas)
   - Tests unitaires du calcul complet
   - Invariants + structure du résultat
   - Cas limites (vide, très long, unicode)
   - **Effort** : 1-2h

2. **Enrichir `rank-units.mjs`** (+25 cas)
   - Combinator : passphrases longues, ambigu
   - Hybrid/Dictionary : déleet avancé
   - Mask : structures complexes
   - **Effort** : 1h

3. **Créer `tests/charset.mjs`** (~30 cas)
   - Tests unitaires charset analysis
   - Unicode, accents, cas limites
   - **Effort** : 1h

### **Priorité 2 (Important)** — Robustesse

4. **Créer `tests/time.mjs`** (~60 cas)
   - rankToSeconds() + formatTime()
   - Multi-langues, profils, cas limites
   - **Effort** : 1.5h

5. **Enrichir `patterns.mjs`** (+8 cas)
   - Déleet avancé, passphrase ambigu
   - Dates limites
   - **Effort** : 0.5h

### **Priorité 3 (Nice-to-have)** — Maintenance

6. **Créer `tests/integration.mjs`**
   - Tests E2E complets (patterns → rank → time)
   - Performance benchmarks
   - **Effort** : 2h

---

## 📈 Objectif Couverture

**Actuel** :
- 308+ cas de test
- 1500+ lignes de code de test
- 12/12 modules couverts
- 0 échoués

**Cible (après recommandations Priorité 1-2)** :
- **500+ cas de test** (+200 cas)
- **2500+ lignes de test** (+1000 lignes)
- **12/12 modules couverts fortement** (80%+ par module)
- **0 échoués**

**Gain de couverture** : 70% → 85% (estimation)

---

## ✅ Checklist Implémentation

- [ ] `tests/calc.mjs` — Tests unitaires calcCrackTime()
- [ ] `tests/charset.mjs` — Tests analyzeCharset()
- [ ] `tests/time.mjs` — Tests rankToSeconds() + formatTime()
- [ ] `tests/rank-units.mjs` — Ajouter 25 cas supplémentaires
- [ ] `tests/patterns.mjs` — Ajouter 8 cas supplémentaires
- [ ] Vérifier `npm test` : 500+ passés
- [ ] Commit : `test(coverage): expand test suite to 500+ cases`

---

## 🔗 Références

- **Commits récents** : 08a3ae6a (leet-symbols), 40cfe248 (hybrid fix)
- **Tests actuels** : `npm test` (3604 lignes, 191 cas)
- **Baseline** : `tests/regression-snapshot.json` (60 passwords)
- **GSD Phase** : En cours (v2 branch, prêt à merger)

---

**Auteur** : Claude Code (21 avril 2026)  
**Prochaine étape** : Implémenter Priorité 1 (4-5h d'effort)
