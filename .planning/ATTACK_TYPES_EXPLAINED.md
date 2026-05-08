# Les 10 Types d'Attaques Expliqués

## Introduction

Quand vous entrez un mot de passe dans Time2Crack, l'application évalue sa résistance contre 10 types d'attaques différentes. Chaque attaque représente une stratégie réelle utilisée par les pirates informatiques pour craquer les mots de passe. Comprendre ces attaques vous aide à créer des mots de passe vraiment sécurisés.

L'enjeu fondamental est simple : plus une attaque peut tester de combinaisons rapidement, plus le mot de passe doit être complexe pour résister. Mais la complexité n'est pas tout — la **prévisibilité** de la structure compte tout autant.

---

## 1. Brute Force (Force Brute)

### Concept

L'attaque par force brute est la méthode la plus basique : essayer **toutes les combinaisons possibles** jusqu'à trouver le bon mot de passe. C'est comme essayer tous les codes de 0000 à 9999 sur un cadenas à 4 chiffres.

### Comment ça fonctionne

1. L'attaquant détermine l'ensemble de caractères possibles : lettres minuscules (26), majuscules (26), chiffres (10), symboles (~32)
2. Pour un mot de passe de N caractères, il y a `charset_size ^ N` combinaisons possibles
3. En testant des millions/milliards de combinaisons par seconde (grâce aux GPUs), l'attaquant essaie chaque possibilité jusqu'à trouver la bonne

### Exemple

Mot de passe : `abc123`
- Longueur : 6 caractères
- Charset possible : 94 caractères (minuscules + majuscules + chiffres + symboles courants)
- Combinaisons totales : 94^6 ≈ 689 milliards
- Temps estimé à 2000 GH/s (vitesse MD5) : ~300 secondes (~5 minutes)

### Pourquoi c'est efficace

La force brute fonctionne quand le mot de passe est court. Plus un mot de passe s'allonge, plus elle devient inefficace exponentiellement.

### Comment s'en protéger

- **Augmentez la longueur** : Chaque caractère supplémentaire multiplie les tentatives par 94
- **Diversifiez les caractères** : Incluez minuscules, majuscules, chiffres ET symboles
- **Acceptez une durée aléatoire** : Même un mot de passe parfait peut être trouvé par chance (premier essai)

---

## 2. Dictionary Attack (Attaque par Dictionnaire)

### Concept

Au lieu d'essayer toutes les combinaisons, l'attaquant utilise un **dictionnaire de mots courants** : mots français/anglais, noms célèbres, termes techniques. C'est comme essayer d'ouvrir un cadenas en testant les codes les plus courants d'abord (0000, 1234, 1111) au lieu de tous les codes.

Time2Crack vérifie votre mot de passe contre environ **14 milliards de mots de passe fuités** enregistrés dans HIBP (Have I Been Pwned) — une base de données réelle de mots de passe volés.

### Comment ça fonctionne

1. L'attaquant crée/utilise une liste de mots : dictionnaire français, anglais, noms propres, marques connues
2. Il teste chaque mot de la liste contre le mot de passe visé
3. Si le mot de passe est simplement un mot courant (ex: `soleil`, `password`, `123456`), l'attaque réussit en millisecondes

### Exemple

- Mot de passe : `soleil`
- Dictionnaire français : ~300 000 mots
- Temps pour tester tous les mots : < 1 seconde
- **Résultat : Craqué instantanément**

Mot de passe : `xYz$qW9!pL2@`
- Ce mot n'existe pas dans le dictionnaire
- **Résultat : Attaque inefficace**

### Pourquoi c'est efficace

**Parce que 90% des utilisateurs créent des mots de passe basés sur des mots réels.** Les gens mémorisent les mots, pas les séquences aléatoires. C'est psychologique.

### Comment s'en protéger

- **Évitez les mots réels** : `chaton`, `tigre`, `soleil` sont dangereux
- **Mélangez mots et caractères aléatoires** : `soleil@45xK` est plus sûr que `soleil45`
- **Utilisez des passphrases aléatoires** : `correct-horse-battery-staple` (mots aléatoires concaténés) est très sûr

---

## 3. Hybrid Attack (Attaque Hybride)

### Concept

Une attaque hybride combine les deux précédentes : elle prend chaque mot du dictionnaire et l'**ajoute des mutations** (ajout de chiffres, symboles, etc.). C'est une attaque très efficace car elle exploite le comportement humain : les gens prennent un mot mémorisable et y ajoutent un chiffre à la fin.

### Comment ça fonctionne

1. Prenez un mot du dictionnaire : `password`
2. Appliquez des mutations intelligentes (hashcat rules) : ~1000 variantes par mot
   - Ajouter un chiffre à la fin : `password0`, `password1`, ..., `password9`
   - Ajouter un symbole : `password!`, `password@`
   - Mettre en majuscule le premier caractère : `Password`
   - Remplacer des lettres par des chiffres : `p4ssw0rd` (l → 1, s → 5, o → 0)
   - Inverser : `drowssap`
3. Tester environ 1000 variantes pour chaque mot du dictionnaire

### Exemple

Mot de passe : `soleil2024!`

Dictionnaire contient le mot `soleil`. Les règles de mutation générées testent :
- `soleil2024` ← Correspond !
- `soleil2024!` ← Correspond !

**Résultat : Craqué en quelques secondes**

Mot de passe : `xYz$qW9!pL2@`
- Ne contient pas de mot du dictionnaire avec mutations
- **Résultat : Attaque inefficace**

### Pourquoi c'est efficace

**Parce que c'est exactement comme les gens créent les mots de passe en pratique.**
- "Je dois un mot difficile à retenir... Je vais prendre un mot courant et ajouter l'année : `Soleil2024`"
- Cette approche logique (humainement raisonnable) est exactement ce que l'attaque hybride teste.

### Comment s'en protéger

- **N'ajoutez pas simplement des chiffres/symboles à la fin d'un mot** : `soleil2024!` est faible
- **Mélangez les parties** : `s0le1l2-024` est meilleur (mutation distribuée)
- **Utilisez des mots non-anglais/non-français** : Les dictionnaires multilingues couvrent les langues courantes, pas les mots inventés
- **Meilleure solution : Plusieurs mots aléatoires** : `soleil-cheval-montagne-2024` (passphrase)

---

## 4. Mask Attack (Attaque par Masque)

### Concept

L'attaque par masque cible les **structures prévisibles** que les humains appliquent inconsciemment. Au lieu de tester toutes les combinaisons aléatoires, elle teste les patterns courants comme "lettre majuscule + lettres minuscules + chiffres".

### Comment ça fonctionne

1. L'attaquant identifie que 90% des mots de passe suivent des patterns prévisibles
2. Il crée des "masques" pour ces patterns :
   - `[Uppercase][lowercase...][digits]` → `Password123`, `Soleil2024`
   - `[Uppercase][lowercase...][digits][symbols]` → `Password1!`
   - `[word][digits]` → `hello42`, `tiger99`
3. Au lieu de tester 2^72 combinaisons aléatoires, il teste seulement les 26 × 26^7 × 10^3 combinaisons qui correspondent au pattern

### Exemple

Mot de passe : `Soleil2024`
- Pattern identifié : `[Uppercase][lowercase...][digits]`
- Combinaisons testées : ~26 × (26^6) × (10^4) ≈ 10^12
- Temps à 2000 GH/s : ~500 secondes (~8 minutes)

Mot de passe : `s0Le!lNa2024@xYz`
- Ne suit aucun pattern prévisible
- **Résultat : Attaque inefficace**

### Pourquoi c'est efficace

Les humains **pensent aléatoire mais créent prévisible**. Une étude montre que 85% des mots de passe suivent un des 5 patterns principaux. L'attaque par masque exploite cette faille psychologique.

### Comment s'en protéger

- **Évitez les patterns reconnaissables** : Ne mettez PAS la majuscule au début, les chiffres à la fin
- **Mélangez aléatoirement** : `sOl3!eIL2nA024xYz` (majuscules, minuscules, chiffres, symboles mélangés)
- **Utilisez une passphrase** : `correct-horse-battery-staple` a une structure imprévisible aux attaques par masque

---

## 5. Rainbow Table (Table Arc-en-Ciel)

### Concept

Au lieu de **calculer** le hash du mot de passe, une table arc-en-ciel **pré-calcule** les hashes de millions de mots de passe et les stocke dans une énorme table. C'est comme avoir un dictionnaire inverse : "hash → mot de passe".

Si vous avez volé une base de données de hashes (non salés), vous pouvez chercher le hash dans la table en **millisecondes** au lieu d'heures.

### Comment ça fonctionne

1. Les attaquants pré-calculent des billions de mots de passe courants et créent une table : `MD5(password) → password`
2. Quand ils volent une base de données de hashes (non salés), ils cherchent simplement le hash dans la table
3. **Lookup instant** : O(1) à O(log n) au lieu de calcul itératif

### Exemple

Base de données volée contient le hash : `5f4dcc3b5aa765d61d8327deb882cf99`

Table arc-en-ciel :
```
5f4dcc3b5aa765d61d8327deb882cf99 → "password"
```

Résultat : **Trouvé en une fraction de seconde**

### Pourquoi c'est efficace

- **Pré-calcul une fois, utilisé 1 million de fois**
- Les tables existantes couvrent 14+ milliards de mots de passe courants
- **Très efficace contre les mots de passe non salés** (MD5, SHA-1 sans salt)

### Comment s'en protéger

- **Les serveurs modernes utilisent le "salting"** : Ajouter une valeur aléatoire unique à chaque mot de passe avant hachage rend les tables arc-en-ciel inutiles
- **Si vous choisissez le mot de passe vous-même** : Les mots de passe courants existent dans les tables (peu importe le salt)
- **Solution : Utilisez des mots de passe uniques et complexes** : Les tables ne contiennent pas `xYz$qW9!pL2@xAbC`

---

## 6. Credential Stuffing (Remplissage de Credentials)

### Concept

Le "credential stuffing" utilise des **paires identifiant/mot de passe volés** lors de fuites antérieures. Si vous utilisez le même mot de passe sur plusieurs sites, un attaquant peut prendre vos identifiants volés sur un site mineur et les essayer sur Gmail, Facebook, banque, etc.

### Comment ça fonctionne

1. Attaquant achète/télécharge une liste de 100 millions de paires email/mot de passe d'une fuite antérieure
2. Il essaie ces pairs sur des cibles : Facebook, Gmail, Twitter, banques
3. **Taux de succès courant : 2-5%** car les gens réutilisent les mots de passe

### Exemple

Fuite de 2020 (ex: Adobe) : `jean@example.com:SoleilBleu42`

Attaquant essaie en 2024 :
- Gmail avec `jean@example.com:SoleilBleu42` → ✓ Accès
- Facebook avec la même paire → ✓ Accès
- Banque en ligne → ✓ Accès

**Résultat : Accès à tous les comptes de Jean en quelques secondes**

### Pourquoi c'est efficace

**Parce que 80% des gens réutilisent le même mot de passe** sur plusieurs sites. Une fuite = accès à tous vos comptes.

### Comment s'en protéger

- **Utilisez des mots de passe uniques par site** : Essentiellement impossible à retenir (utiliser un gestionnaire de mots de passe : Bitwarden, 1Password, KeePass)
- **Activez l'authentification multi-facteurs (2FA)** : Même si le mot de passe est volé, l'attaquant ne peut pas accéder sans le deuxième facteur (SMS, authenticator app)
- **Consultez HIBP (haveibeenpwned.com)** : Vérifiez si votre email a été volé et changez les mots de passe compromis

---

## 7. Password Spraying (Arrosage de Mots de Passe)

### Concept

Au lieu de tenter des milliers de mots de passe sur **un seul compte**, l'attaquant teste **un petit nombre de mots de passe courants** sur **des milliers/millions de comptes différents**. C'est comme essayer d'ouvrir 1 million de portes avec 10 clés différentes au lieu d'essayer 1 million de clés sur une seule porte.

### Comment ça fonctionne

1. Attaquant compile une liste de 10-100 mots de passe extrêmement courants :
   - `123456`, `password`, `admin`, `letmein`, `qwerty`, `sunshine`, `dragon`
2. Il cible une organisation : 50 000 utilisateurs Gmail/Office365
3. Il essaie `password` sur les 50 000 comptes → quelques accès réussis
4. Il essaie `123456` sur les 50 000 comptes → plus d'accès
5. Résultat : **Accès à 500-1000 comptes au total**

### Exemple

Cible : `@company.com` (5000 employés)
Mots de passe testés : `password`, `123456`, `admin`, `letmein`

Résultat statistique :
- ~1% des mots de passe sont `password` → 50 accès
- ~0.5% sont `123456` → 25 accès
- **Total : ~150-200 accès compromis en quelques heures**

### Pourquoi c'est efficace

- **Évite les verrouillages de compte** : En testant peu de mots de passe par compte, l'attaquant ne déclenche pas les protections anti-brute-force
- **Taux de succès garanti** : Statistiquement, quelques comptes utilisent toujours les mots de passe courants
- **Très utilisé contre les entreprises** : Accès initial pour voler des données sensibles

### Comment s'en protéger

- **Ne choisissez JAMAIS un mot de passe courant** : `123456`, `password`, `admin` sont interdits
- **Activez la 2FA obligatoire** : Même avec un mot de passe courant, l'attaquant ne peut pas accéder sans le deuxième facteur
- **Organisations : Implémenter les protections** :
  - Verrouillage après N tentatives échouées
  - Alertes sur tentatives anormales
  - Authentification multi-facteurs obligatoire

---

## 8. Markov/Probabilistic Attack (Attaque Markovienne/Probabiliste)

### Concept

Une attaque markovienne **apprend les patterns statistiques** des mots de passe réels et teste d'abord les **séquences les plus probables**. Au lieu de tester aléatoirement, elle utilise l'intelligence statistique : "Les lettres qui suivent fréquemment 'e' sont 'r', 's', 't'... Je vais les tester en priorité."

### Comment ça fonctionne

1. Analyser 1 milliard de mots de passe réels (fuites publiques) et apprendre : "Quel caractère suit généralement 'p'?"
   - 'a' : 15%
   - 'e' : 12%
   - 'a' : 10%
2. Générer des séquences prioritaires : `password` (très probable), `passwok` (improbable)
3. Tester les séquences probables d'abord → plus de succès avec moins d'essais

### Exemple

Attaque markovienne teste dans cet ordre :
1. `password` (séquence courante) → ✓ Craqué
2. `qwerty` (séquence courante)
3. `abc123` (séquence courante)
4. ...
5. `xYz$qW9!` (séquence improbable) → jamais testé

Attaque brute force teste :
1. `aaaaaa`
2. `aaaaab`
3. ...
4. Quelques millions de combinaisons aléatoires inutiles avant `password`

**Résultat : Markov craque les mots de passe "courants" 10-1000× plus vite que brute force**

### Pourquoi c'est efficace

Les mots de passe humains ne sont **pas aléatoires**. Ils suivent des patterns linguistiques subtils. Apprendre ces patterns permet de tester les mots de passe probables en priorité.

### Comment s'en protéger

- **Créez aléatoirement** : `xYz$qW9!pL2@` n'a aucun pattern markovien courant
- **Utilisez un générateur aléatoire** : Ne pensez pas "comment créer un bon mot de passe", laissez un outil générer `K7#mNpL!2xQvS`
- **Passphrase aléatoire reste efficace** : `correct-horse-battery-staple` est imprévisible statistiquement

---

## 9. PCFG (Probabilistic Context-Free Grammar)

### Concept

Le PCFG est une **attaque grammaticale** plus sophistiquée. Au lieu de tester les caractères individuels, elle apprend la **structure grammaticale** des mots de passe :
- "Les mots de passe commencent souvent par une majuscule"
- "Puis viennent 5-7 lettres minuscules"
- "Puis 1-3 chiffres"

Elle teste les structures probables en priorité, ce qui réduit exponentiellement les combinaisons.

### Comment ça fonctionne

1. Analyser 1 milliard de mots de passe et apprendre les structures fréquentes
2. Créer une grammaire :
   - Structure courante : `[Maj][min min min min min min][digit digit digit]`
   - Exemple généré : `Password123`
3. Générer les structures probables dans l'ordre : `Password000` → `Password999` → `Password000` (avec lettres variées) → ...

### Exemple

Mot de passe : `Soleil2024`
- Structure détectée : `[Maj][min min min min min][digit digit digit digit]`
- Combinaisons testées : 26 × (26^5) × (10^4) ≈ 10^11
- **Temps : ~1 seconde (contre 300 secondes en brute force)**

Mot de passe : `s0Le!lNa2024@xYz`
- Structure imprévisible (majuscules, minuscules, chiffres, symboles mélangés aléatoirement)
- **PCFG ne sait pas comment la générer efficacement**

### Pourquoi c'est efficace

**Parce que 95% des mots de passe humains suivent 10-20 structures grammaticales courantes.** Le PCFG exploite cette convergence.

### Comment s'en protéger

- **Évitez les structures prévisibles** : Ne faites pas `[Maj][min...][digit]`
- **Mélangez aléatoirement majuscules, minuscules, chiffres, symboles** : `sOL3e!iL2nA024xYz`
- **Utilisez une passphrase** : `correct-horse-battery-staple` a une structure grammaticale imprévisible (mots + tirets, pas le pattern [Maj][min][digit])

---

## 10. Combinator Attack (Attaque Combinatoire)

### Concept

L'attaque combinatoire **concatène deux mots de passe/dictionnaires**. Au lieu de tester un seul mot du dictionnaire, elle en combine deux : "mot1 + mot2". Cela permet de tester des "passphrases" — plusieurs mots combinés.

### Comment ça fonctionne

1. Créer deux dictionnaires : dictionnaire français (300 000 mots) et liste de noms (10 000 noms)
2. Concaténer toutes les paires : `soleil` + `cheval` = `soleilcheval`, `lune` + `tigre` = `lunetigre`
3. Tester les 300 000 × 10 000 = 3 milliards de combinaisons en quelques heures

### Exemple

Mot de passe : `soleilcheval`
- Dictionnaire 1 contient `soleil`
- Dictionnaire 2 contient `cheval`
- Combinaison : `soleil` + `cheval` → **Trouvé**
- Temps : quelques secondes

Mot de passe : `correct-horse-battery-staple`
- Concaténation de 4 mots aléatoires
- Attaque combinatoire 2-mots ne teste que `correct-horse`, `horse-battery`, `battery-staple`
- **Attaque inefficace contre 4+ mots**

### Pourquoi c'est efficace

Les gens créent parfois des "passphrases" comme `correcthorse` pensant que c'est sûr ("deux mots = très long = très sûr"). L'attaque combinatoire craque cela en quelques secondes.

### Comment s'en protéger

- **Utilisez 4+ mots aléatoires** : L'attaque combinatoire 2-mots ne peut pas tester les combinaisons 4-mots
- **Incluez séparateurs aléatoires** : `correct-horse-battery-staple` au lieu de `correcthorsebatterystaple`
- **Utilisez des symboles/chiffres** : `correct-horse!battery#staple2024` rend plus difficile le prétraitement

---

## Résumé : Quel Type d'Attaque Est le Plus Dangereux Pour Vous ?

Cela dépend de votre mot de passe :

| Type de Mot de Passe | Attaque Dominante | Temps Estimé | Sécurité |
|---|---|---|---|
| `password` | Dictionary | < 1 sec | ❌ Critique |
| `Password123` | PCFG / Mask | 1 sec | ❌ Très faible |
| `soleil2024` | Hybrid | 1 min | ❌ Faible |
| `SoleilBleu42` | PCFG / Markov | 1 min | ❌ Faible |
| `xYz$qW9!pL2@` | Brute Force | 100 ans | ✅ Excellent |
| `correct-horse-battery-staple` | Brute Force | 1000 ans | ✅ Excellent |
| `c0rrect-h0rse!battery#staple2024` | Brute Force | 1 million ans | ✅ Très excellent |

---

## Recommandations Finales

### ✅ Créez des mots de passe vraiment sûrs :

1. **Option A : Aléatoire complexe (12+ caractères)**
   - Utilisez un générateur : `K7#mNpL!2xQvS9`
   - Stockez dans un gestionnaire : Bitwarden, 1Password, KeePass
   - Chaque site = mot de passe unique

2. **Option B : Passphrase aléatoire (5-7 mots)**
   - Exemple : `correct-horse-battery-staple-monkey`
   - Pas de patterns prévisibles (pas `CorrectionBatterie2024`)
   - Facile à retenir, très sûr

3. **Option C : Combinaison**
   - Base : passphrase aléatoire
   - Modification : ajouter symboles aléatoires
   - Exemple : `correct-h0rse!battery#staple-m0nkey`

### ✅ Activez la 2FA partout

Même le meilleur mot de passe peut être volé. L'authentification multi-facteurs (Google Authenticator, SMS, clés de sécurité) ajoute une barrière supplémentaire.

### ✅ Vérifiez si vous avez été compromis

Visitez [haveibeenpwned.com](https://haveibeenpwned.com) et entrez votre email pour voir si vos identifiants ont circulé dans des fuites publiques. Si oui, changez le mot de passe immédiatement.

---

**Créé pour Time2Crack — Comprendre la sécurité des mots de passe par la pratique.**
