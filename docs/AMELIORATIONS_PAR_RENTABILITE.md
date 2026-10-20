# Améliorations moteur — classées par rentabilité d'effort

*Synthèse de PISTES_AMELIORATION_MOTEUR.md — 2026-05-19*

---

## Tier 1 — Gain maximal, effort minimal (< 3h chacune)

### 1. Mise à jour GPU RTX 5090 *(~30 min)*
**Fichier** : `core/time.js` — mise à jour de constantes uniquement  
**Gain** : tous les temps divisés par ~2.5 pour un attaquant moderne → modèle actuel trop conservateur  
**Effort** : très faible — aucune logique à écrire  

### 2. Détection de keyboard walks *(~2-3h)*
**Fichier** : nouveau module de détection + `core/` existant  
**Gain** : `Qwerty123`, `azerty!` — actuellement surestimés comme hybride classique  
**Effort** : faible — liste statique de ~200-500 walks × variantes de casse, formule analytique simple  

### 3. Détection de dates *(~2-3h)*
**Fichier** : nouveau module de détection regex  
**Gain** : `14071990`, `01/07/1990` — espace réel ≈ 730 000 au lieu de milliards (brute force)  
**Effort** : faible — regex de formats + calcul d'espace analytique  

### 4. Profil "cloud attacker" avec coût en euros *(~2-3h)*
**Fichier** : `core/time.js` + UI  
**Gain** : différenciateur fort — "craquable pour moins de 50€" parle aux non-techniciens  
**Effort** : faible — nouveau profil AWS A100 × 8 + affichage coût monétaire  

---

## Tier 2 — Bon rapport effort/valeur, effort modéré (3-6h chacune)

### 5. Toggle-case / Fingerprint *(~2-3h)*
**Gain** : `PASSWORD123` actuellement sous-estimé par le modèle hybride  
**Effort** : faible — extension directe du modèle hybride existant  
**Formule** : `rank = rank_dict(base) × 2^longueur`  

### 6. Détection de patterns répétés *(~2-3h)*
**Gain** : `aaaa`, `abababab`, `1234512345` — traités comme brute force alors que l'espace est minuscule  
**Effort** : faible — regex + formule analytique (`charset_taille` pour répétition pure)  

### 7. Prince Attack *(~1 journée)*
**Gain** : couvre les passphrases sans séparateur que le combinator manque (empiriquement meilleur sur RockYou)  
**Effort** : moyen — calibration sur corpus réel nécessaire  
**Référence** : Steube & Marechal (2014), hashcat PRINCE processor  

### 8. Rule-based mangling *(~1 journée)*
**Gain** : modélise les vraies règles hashcat (best64 ~64 règles, rockyou-30000 ~30k) — plus réaliste que le modèle hybride actuel  
**Effort** : moyen — sélection et modélisation des règles pertinentes  

---

## Tier 3 — Valeur limitée ou effort disproportionné

### 9. Score de confiance bayésien *(effort : élevé)*
**Gain** : pondération des modèles selon précision historique par type de mot de passe  
**Frein** : nécessite un ground truth de validation → projet de recherche à part entière  
**Utilité** : interne uniquement, invisible pour l'utilisateur  

### 10. Neural / LSTM / PassGAN *(effort : très élevé)*
**Gain** : marginal — PCFG + Markov sont aussi précis sur mots de passe courants  
**Frein** : pipeline d'entraînement manquant (cf. `backlog_model_onnx.md`), pertinent uniquement hors-distribution  
**Verdict** : backlog longue durée  

---

## Récapitulatif

| # | Amélioration | Effort | Impact utilisateur | Priorité |
|---|---|---|---|---|
| 1 | GPU RTX 5090 | 30 min | Haute | ⭐⭐⭐⭐⭐ |
| 2 | Keyboard walks | 2-3h | Haute | ⭐⭐⭐⭐⭐ |
| 3 | Détection dates | 2-3h | Haute | ⭐⭐⭐⭐⭐ |
| 4 | Profil cloud € | 2-3h | Très haute | ⭐⭐⭐⭐⭐ |
| 5 | Toggle-case | 2-3h | Moyenne | ⭐⭐⭐⭐ |
| 6 | Patterns répétés | 2-3h | Moyenne | ⭐⭐⭐⭐ |
| 7 | Prince attack | ~1j | Moyenne | ⭐⭐⭐ |
| 8 | Rule-based mangling | ~1j | Moyenne | ⭐⭐⭐ |
| 9 | Score bayésien | élevé | Faible | ⭐⭐ |
| 10 | Neural / LSTM | très élevé | Faible | ⭐ |

**Séquence recommandée** : 1 → 2 → 3 → 4 (≈ 8-10h total, gain immédiat et mesurable)
