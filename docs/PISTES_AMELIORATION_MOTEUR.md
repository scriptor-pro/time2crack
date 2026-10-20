# Pistes d'amélioration du moteur de calcul — Time2Crack

*Analyse du 2026-05-18*

---

## État actuel

Le moteur couvre les 7 grandes familles de la littérature académique :
brute force, dictionnaire, hybride, mask, PCFG, Markov, combinator.
Sources : Weir (2009), Dürmuth (2015), Wheeler (2016), Bonneau (2012).

---

## 1. Méthodes d'attaque manquantes

### Prince Attack *(priorité haute)*

Développé par Steube & Marechal (2014). Extension du combinator : génère
toutes les concaténations de 1 à N éléments d'une wordlist, triées par
probabilité décroissante. Empiriquement plus efficace que le combinator
simple sur RockYou pour les passphrases sans séparateur.

**Formule** : `rank = Σ C(dictSize, k) × k! × rules` pour k mots concaténés  
**Valeur ajoutée** : couvre les passphrases courtes sans séparateur que le combinator manque  
**Difficulté** : moyenne — nécessite calibration sur corpus réel  
**Référence** : Steube & Marechal (2014), hashcat PRINCE processor

---

### Toggle-case / Fingerprint *(priorité moyenne)*

Attaque sur les variantes de casse d'un mot connu (`password`, `PASSWORD`,
`Password`, `pAsSwOrD`). Hashcat l'implémente nativement (`--attack-mode 1`
avec règle toggle).

**Formule** : `rank = rank_dict(base) × 2^longueur`  
**Valeur ajoutée** : `PASSWORD123` actuellement sous-estimé par le modèle hybride  
**Difficulté** : faible — extension directe du modèle hybride existant

---

### Rule-based / Mangling *(priorité moyenne)*

Les vraies attaques hashcat utilisent des fichiers de règles (best64.rule,
d3ad0ne.rule, rockyou-30000.rule) qui appliquent des transformations en
cascade. L'espace de règles est empiriquement connu et dénombrable.

**Formule** : `rank = rank_dict(base) × règles_actives`  
Avec `règles_actives` calibré : best64 (~64 règles), rockyou-30000 (~30k)  
**Valeur ajoutée** : plus réaliste que le modèle hybride actuel  
**Difficulté** : moyenne — nécessite sélectionner et modéliser les règles pertinentes  
**Référence** : Hashcat best64.rule, d3ad0ne.rule

---

### Neural / NLP *(priorité basse — backlog existant)*

Modèles LSTM ou PassGAN entraînés sur RockYou. Déjà dans le backlog
(`backlog_model_onnx.md`), pipeline d'entraînement manquant.

**Valeur marginale** : limitée — sur mots de passe courants, PCFG + Markov
sont aussi précis. Pertinent uniquement pour des mots de passe hors-distribution.

---

## 2. Améliorations de l'analyse structurelle

### Détection de keyboard walks *(priorité haute)*

`qwerty`, `azerty`, `1qaz2wsx`, `zxcvbn` — séquences de touches adjacentes
sur le clavier. Absent du moteur actuel alors que zxcvbn le traite bien.
L'espace de recherche est petit : ~200-500 séquences courantes × variantes de casse.

**Formule** : `rank = position_dans_liste_walks × variantes_casse`  
**Valeur ajoutée** : `Qwerty123` actuellement sous-estimé comme simple hybride  
**Difficulté** : faible — liste statique de walks connus  
**Référence** : Wheeler (2016) zxcvbn, adjacency graphs QWERTY/AZERTY

---

### Détection de dates *(priorité haute)*

`14071990`, `01/07/1990`, `juillet1990`, `19900714` — dates de naissance et
dates mémorables. L'espace de recherche est calculable et très petit.

**Formule** : `rank_date = 36500 jours × ~20 formats × séparateurs ≈ 730 000`  
**Valeur ajoutée** : espace réel << brute force, souvent mal estimé par le mask  
**Difficulté** : faible — regex de détection + calcul d'espace analytique

---

### Détection de patterns répétés *(priorité moyenne)*

`aaaa`, `abababab`, `1234512345`, `aaaaaa1` — répétitions et cycles.
Actuellement traités comme brute force alors que l'espace réel est
drastiquement réduit.

**Formule** :
- Répétition pure `c^n` : `rank = charset_taille`
- Cycle `AB^n` : `rank = charset^longueur_cycle`

**Difficulté** : faible — détection par regex + formule analytique

---

## 3. Améliorations de calibration

### Mise à jour vitesses GPU 2025-2026 *(priorité très haute)*

Les RTX 5090 sont disponibles (début 2025). Les benchmarks Hashcat montrent
~2.5× MD5 vs RTX 4090. Le modèle actuel est calibré sur RTX 4090 (2024).

**Impact** : tous les temps divisés par ~2.5 pour un attaquant équipé récent.  
**Difficulté** : très faible — mise à jour de constantes dans `core/time.js`  
**Source** : Hashcat v6.2.6+ benchmarks RTX 5090, Hive Systems 2026

---

### Profil "cloud attacker" avec coût en euros *(priorité haute)*

AWS p4d.24xlarge = 8× A100 à ~$32/heure. Un attaquant motivé peut louer
1000h pour ~$32k. Profil distinct du "nation-state" — plus accessible et
plus réaliste pour la menace corporative.

**Formule** : `coût_craquage = (rang / vitesse_A100×8) × tarif_horaire`  
**Valeur ajoutée** : afficher "craquable pour moins de 50€" est très parlant
pour l'utilisateur non-technique. Différenciateur fort vs concurrents.  
**Difficulté** : faible — nouveau profil dans `core/time.js` + affichage UI

---

### Score de confiance par modèle *(priorité moyenne)*

Actuellement `min()` des rangs sans pondération. Une approche bayésienne
pondèrerait chaque modèle selon sa précision historique sur le type de mot
de passe détecté (dictionnaire → fort poids sur hybride, aléatoire → fort
poids sur brute/PCFG).

**Référence** : Narayanan & Shmatikoff (2005), calibration bayésienne  
**Difficulté** : haute — nécessite ground truth de validation

---

## Synthèse : priorités recommandées

| Amélioration | Valeur scientifique | Difficulté | Impact utilisateur |
|---|---|---|---|
| Vitesses GPU 5090 | Haute | Très faible | Haute |
| Keyboard walks | Haute | Faible | Haute (très fréquent) |
| Détection dates | Haute | Faible | Haute |
| Profil "cloud €" | Moyenne | Faible | Très haute (tangible) |
| Toggle-case | Moyenne | Faible | Moyenne |
| Patterns répétés | Moyenne | Faible | Moyenne |
| Prince attack | Haute | Moyenne | Moyenne |
| Rule-based mangling | Haute | Moyenne | Moyenne |
| Score bayésien | Haute | Haute | Faible (interne) |
| Neural / LSTM | Moyenne | Très haute | Faible |

### Recommandation immédiate

Les 4 premières lignes du tableau ont le meilleur rapport effort/valeur et
s'appuient sur de la littérature solide. À implémenter dans cet ordre :

1. **Mise à jour GPU** (30 min) — corriger les constantes
2. **Keyboard walks** (2-3h) — liste statique + formule
3. **Détection dates** (2-3h) — regex + espace analytique
4. **Profil cloud €** (2-3h) — nouveau profil + UI

---

## Références

- Bonneau, J. (2012). The science of guessing. IEEE S&P.
- Wheeler, D. (2016). zxcvbn: Low-Budget Password Strength Estimation. USENIX Security.
- Weir, M. et al. (2009). Password Cracking Using Probabilistic Context-Free Grammars. IEEE S&P.
- Dürmuth, M. et al. (2015). OMEN: Faster Password Guessing. ESSoS, LNCS 8978.
- Steube, J. & Marechal, S. (2014). PRINCE: A Realistic Password Guessing Algorithm. USENIX.
- Narayanan, A. & Shmatikoff, V. (2005). Fast Dictionary Attacks on Passwords Using Time-Space Tradeoff. CCS.
- Hive Systems (2026). Password Table — GPU cracking benchmarks.
- Hashcat v6.2.6+. Official benchmarks. https://hashcat.net
