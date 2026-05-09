---
title: Refactorisation Progressive — Findings & Lessons Learned
date: 2026-05-08
status: ROLLED BACK
---

# Refactorisation Progressive app.js — Session Report

## Objectif
Centraliser l'état dispersé (40+ variables `let` globales) en un objet `state` unique, sans faire une réécriture complète de zéro.

## Ce qui a été tenté

### ✅ Phase 1-3 (Succès)
- Créé objet `state` consolidé avec 130 lignes (dom, cache, ui, results, i18n)
- Remplacé 40+ variables par `state.*` (230+ références)
- Syntaxe JavaScript validée (`node -c app.js` ✓)
- Supprimé `type="module"` de 9 templates Nunjuck
- Build 11ty réussi (143 fichiers)

### ❌ Phase 4-5 (Problèmes découverts)
- **Scope collision** : Variables locales (ex: `input`) redéfinies dans closures
- **Ordre d'exécution** : Code utilisant `input` en dehors de DOMContentLoaded
- **Accès DOM non protégés** : Mutations sur `null` (éléments pas trouvés)
- **Effet domino** : Patches isolés créent nouvelles erreurs ailleurs

### 🔴 Test navigateur
- "input is not defined" — variable utilisée avant initialisation
- "Cannot set properties of null" — DOM elements non trouvés
- Analyse de mot de passe **ne fonctionne plus**

## Pourquoi ça a échoué

**Le problème fondamental** : Le code original a une **architecture implicite**
- Variables globales partagées entre 150+ fonctions
- Dépendances circulaires (fonction A appelle B, B modifie A)
- Initialisation couplée à DOMContentLoaded mais code appelé partout

**Refactoriser progressivement exige** : Comprendre toutes les dépendances AVANT de toucher au code

**Centralisé != Refactorisé** : Mettre des variables dans `state` ne résout pas les vrais problèmes (scope, ordre, dépendances)

## Recommandations pour prochaine tentative

### ✓ Approche A : Rewrite complet (handoff original)
- 8-12 heures avec session fraîche
- IIFE pure + état immutable
- Zéro dettes techniques
- **Risque** : Régressions difficiles à tester

### ✓ Approche B : Refactoriser par domaine
1. Isoler domaine (ex: "ML prediction" ou "HIBP check")
2. Extraire dans fonction pure
3. Mettre en `state`
4. Tester isolément
5. Répéter par domaine

- **Avantage** : Incrémental, testé à chaque étape
- **Durée** : 3-4 jours (15-20h)

### ✓ Approche C : Wrapper seulement
- Garder code actuel intact
- Créer objet `state` comme **proxy/cache**
- Sync manuel quand nécessaire
- **Avantage** : Zéro risque de régression
- **Inconvénient** : Pas une vraie refactorisation

## Fichiers modifiés cette session

| Fichier | État | Notes |
|---------|------|-------|
| `app.js` | **ROLLED BACK** | 6854 lignes (original) |
| `app.js.backup` | ✓ Safe | Sauvegarde complète |
| 9× `src/pages/*/index.njk` | ✓ Updated | `type="module"` supprimé (garder ✓) |
| `src/index.njk` | ✓ Updated | `type="module"` supprimé (garder ✓) |

## Template Update (à garder)

Les changements des templates sont **sans risque** et **bénéfiques** :
- Supprimé `type="module"` incompatible avec IIFE
- Rend le script compatible avec n'importe quelle architecture JS

```html
<!-- AVANT -->
<script src="/app.js" type="module"></script>

<!-- APRÈS (à garder) -->
<script src="/app.js"></script>
```

## Prochaines étapes recommandées

1. **Court terme** : Rien à faire, code original fonctionne
2. **Moyen terme** : Décider approche B ou C + C complet
3. **Long terme** : Handoff rewrite complet (approche A) avec session fraîche

## Memory Update

Créé memory file : `app_js_refactor_strategy_2026_05_08.md`

---

**Session durée** : ~1 heure  
**Contexte consommé** : 80% → rollback à 0%  
**Leçon** : Refactorisation progressive sans understanding complet = risqué
