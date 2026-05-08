# Explications Détaillées des 10 Types d'Attaques (250+ mots chacune)

## 1. Brute Force (Force Brute)

La force brute est l'attaque la plus basique et la plus directe : essayer **toutes les combinaisons possibles** de caractères jusqu'à trouver le bon mot de passe. C'est comme essayer tous les codes d'un cadenas à 4 chiffres : 0000, 0001, 0002... 9999. Mathématiquement, si un mot de passe contient N caractères et que le jeu de caractères possibles contient C caractères (26 minuscules + 26 majuscules + 10 chiffres + 32 symboles = 94), alors il y a C^N combinaisons possibles.

**Exemple concret** : Un mot de passe de 6 caractères avec un jeu de 94 caractères génère 94^6 ≈ 689 milliards de combinaisons. Sur un GPU moderne capable de tester 2 milliards de combinaisons par seconde (MD5), cela prend environ 5 minutes. Un mot de passe de 8 caractères monte à ~6 quadrillions de combinaisons, requérant environ 95 heures. Un mot de passe de 12 caractères atteint 475 sextillions de combinaisons, soit des millions d'années.

**Pourquoi c'est efficace sur les mots de passe courts** : Les mots de passe courts (< 8 caractères) sont vulnérables car l'espace de recherche reste gérable. Chaque caractère supplémentaire multiplie le travail par 94, ce qui crée une protection exponentielle. C'est pourquoi la longueur est votre meilleure défense contre la force brute.

**Limitations de l'attaque** : La force brute ne considère pas la nature du mot de passe. Elle teste aléatoirement, donc même un mot de passe correct peut être trouvé au premier essai (chance) ou au dernier (malchance). Elle est complètement inefficace contre les mots de passe longs (12+ caractères) car le temps requis devient cosmiquement grand.

**Protection** : Utilisez au minimum 12-14 caractères, incluez majuscules, minuscules, chiffres et symboles, et évitez les patterns prévisibles qui réduiraient l'espace effectif.

---

## 2. Dictionary Attack (Attaque par Dictionnaire)

L'attaque par dictionnaire exploite une faiblesse humaine fondamentale : **les gens créent des mots de passe basés sur des mots réels**. Au lieu de tester les 94^12 combinaisons possibles, l'attaquant teste seulement les ~300 000 mots français (ou anglais) existants dans un dictionnaire. Magiquement, cela réduit le problème de trillions de combinaisons à quelques centaines de milliers d'essais, réalisables en millisecondes.

Time2Crack utilise la base HIBP (Have I Been Pwned) qui contient **14 milliards de mots de passe réellement volés** lors de fuites de données. Cette base incluut non seulement des mots du dictionnaire, mais aussi les mots de passe que les humains ont RÉELLEMENT utilisés. Si vous utilisez "password", "123456", "soleil", "dragon" ou "paris", vous êtes instantanément vulnérable car ces mots existent dans la base HIBP.

**Pourquoi c'est terriblement efficace** : Les statistiques montrent que **90% des mots de passe** utilisés par les humains sont basés sur des mots réels ou sur leurs mutations évidentes. Les gens pensent "je dois me souvenir du mot de passe" et choisissent donc un mot mémorisable. Cette nécessité psychologique crée une vulnérabilité exploitable. Un dictionnaire peut être testé en minutes, pas en années.

**Exemple** : Les mots de passe top 1000 mondiaux (password, 123456, 12345678, qwerty) craquent en millisecondes. Les mots de passe top 10 000 (incluant des noms courants, animaux, villes) craquent en secondes. Les dictionnaires complets (300k-1M mots) craquent en minutes.

**Variantes** : Les attaquants utilisent des dictionnaires spécialisés (noms de célébrités, équipes de foot, marques), des dictionnaires multilingues, et des dictionnaires contextuels (mots associés à l'industrie cible, prénoms des employés de l'entreprise, informations sur les réseaux sociaux).

**Protection** : Ne choisissez JAMAIS un mot réel seul. "soleil", "cheval", "tigre" = dangereux. Idéalement, générez un mot de passe aléatoire ou utilisez une passphrase de 5+ mots aléatoires (non prédictibles).

---

## 3. Hybrid Attack (Attaque Hybride)

L'attaque hybride combine les deux stratégies précédentes : elle prend **chaque mot du dictionnaire et l'ajoute des mutations**. C'est une attaque devastatingly efficace car elle cible directement **comment les humains créent réellement leurs mots de passe en pratique**.

La plupart des gens qui ajoutent de la complexité le font de manière prévisible : ils prennent un mot mémorisable et y ajoutent un chiffre à la fin, mettent en majuscule la première lettre, ou remplacent quelques lettres par des chiffres ("a"→"4", "e"→"3", "s"→"5", "o"→"0"). Les outils comme Hashcat documentent ~1000 règles de mutation courantes, testant chacune de ces variations pour chaque mot du dictionnaire.

**Exemple détaillé** : Le mot "password" génère ~1000 variantes :
- password, Password, PASSWORD, pASSWORD
- password0, password1...password9
- password!, password@, password#...
- passwor0d (e→0), p4ssword (a→4), p@ssw0rd
- drowssap (inversé), DROWSSAP
- Et toutes les combinaisons deux à deux : P@ssw0rd, etc.

Un dictionnaire français typique de 300 000 mots × 1000 mutations = 300 milliards de variantes testées. Sur un GPU à 2000 GH/s, cela prend quelques heures.

**Pourquoi c'est si efficace** : Les règles de mutation reflètent exactement les pensées des utilisateurs. Quand quelqu'un crée "Soleil2024!", il suit inconsciemment les étapes : 1) Choisir un mot mémorable, 2) Ajouter une majuscule, 3) Ajouter l'année courante, 4) Ajouter un symbole. Cette logique humaine est exactement ce que l'attaque hybride automatise.

**Résultat** : Un mot de passe apparemment "bon" comme "Soleil2024!" (diverse, long, mélange) est craqué en quelques secondes car il suit le pattern hybride prévisible.

**Protection** : Ne mélangez pas simplement un mot + mutations. Utilisez soit un mot de passe complètement aléatoire (K7#mNpL!2xQvS), soit une passphrase aléatoire (correct-horse-battery-staple), soit mélangez les mutations aléatoirement dans le mot (sOl3!eIL2nA024xYz) au lieu de la fin.

---

## 4. Mask Attack (Attaque par Masque)

L'attaque par masque cible les **structures grammaticales prévisibles** que les humains appliquent quasi-universellement. Au lieu de tester toutes les 2^72 combinaisons aléatoires, elle teste seulement les patterns que les gens utilisent réellement : "majuscule + minuscules + chiffres", "majuscule + minuscules + symboles", etc.

Les recherches montrent que **85% des mots de passe** suivent un des ~10 patterns principaux :
- [Maj][min...][chiffres] : Password123, Soleil2024
- [min...][chiffres] : password123, hello42
- [Maj][min...][chiffres][symbole] : Password1!
- [min...][maj][chiffres] : helloWorld123
- etc.

**Le calcul** : Un mot de passe "excellent" comme "Soleil2024" a 72 bits d'entropie théorique (log2(94^10)). En brute force, il faudrait 2^72 ≈ 10^21 tentatives. Mais détecté comme pattern [Maj][min 5-7][chiffres], l'attaque ne teste que 26 × (26^5 à 26^7) × (10^4) ≈ 10^12 combinaisons, soit ~500 secondes au lieu de 1 million d'années.

**Pourquoi c'est efficace** : Les humains pensent inconsciemment en structure. Ils mettent la majuscule au début "parce que c'est comme les mots", ajoutent les chiffres à la fin "parce que c'est traditionnel", ajoutent un symbole "pour la sécurité". Aucune de ces décisions n'est vraiment aléatoire — elles suivent des patterns culturels et cognitifs.

**Détection de pattern** : Les outils modernes détectent automatiquement les patterns en analysant quelques tentatives réussies. Une fois le pattern identifié, tester toutes les variations devient rapide.

**Protection** : Mélangez aléatoirement majuscules, minuscules, chiffres, symboles au lieu de les regrouper. Au lieu de Soleil2024!, utilisez sOl3!eIL2nA-024xYz (distribution aléatoire) ou une passphrase aléatoire qui ne suit aucun pattern grammatical courant.

---

## 5. Rainbow Table (Table Arc-en-Ciel)

Une table arc-en-ciel est un **tableau pré-calculé géant** qui mappe des hashes vers les mots de passe originaux. Au lieu de calculer le hash du mot de passe testé et le comparer (processus lent), on cherche simplement le hash dans la table (recherche rapide, O(log n)).

**Fonctionnement** : Un attaquant pré-calcule les hashes de milliards de mots de passe courants une seule fois. Pour MD5 (rapide), il peut pré-calculer les hashes de 14 milliards de mots de passe en quelques semaines avec un GPU, créant une table de ~500 GB. Ensuite, quand une base de données de hashes est volée, il peut chercher chaque hash dans la table en une fraction de seconde.

**Exemple** : Si la base de données volée contient le hash SHA-1 `5f4dcc3b5aa765d61d8327deb882cf99`, l'attaquant cherche ce hash dans sa table rainbow et trouve instantanément "password". Sans la table, il faudrait tester des milliards de mots pour reproduire ce hash exact.

**Limites modernes** : Les serveurs sécurisés utilisent le "salting" — ajouter une valeur aléatoire unique à chaque mot de passe avant de le hasher. Cela rend les tables arc-en-ciel inutiles car chaque hash est différent même pour le même mot de passe. Avec salting, chaque mot de passe unique requiert sa propre table, rendant les tables arc-en-ciel impractiquement grandes.

**Algorithmes vulnérables** : Les hashes rapides et sans salt (MD5, SHA-1, NTLM de vieux serveurs Windows) sont vulnérables. Les hashes modernes avec salt et lent (bcrypt, Argon2) rendent les tables inutiles.

**Protection** : Serveurs modernes = salting obligatoire. Pour les utilisateurs : les mots de passe courants existent déjà dans les tables, donc utilisez des mots de passe uniques et complexes que les tables n'ont probablement pas pré-calculés. Un mot de passe comme `xYz$qW9!pL2@xAbC` est extrêmement peu probable d'être dans une table.

---

## 6. Credential Stuffing (Remplissage de Credentials)

Le credential stuffing exploite un comportement humain quasi-universel : **la réutilisation de mots de passe**. Quand une base de données est piratée (ex: LinkedIn, Facebook, Yahoo), les attaquants obtiennent des millions de paires email/mot de passe. Ils utilisent ensuite ces paires comme "clés universelles" pour accéder à d'autres services.

**Le scénario** : En 2013, Yahoo subit une fuite affectant 3 milliards de comptes. Les données circulées incluaient des millions de paires email/mot de passe. En 2024, un attaquant utilise ces credentials vieilles de 11 ans pour essayer de se connecter à Gmail, Outlook, Twitter, Slack, Amazon. Même si vous avez changé votre mot de passe sur Yahoo, si vous réutilisez le même mot de passe ailleurs, l'attaquant accède à TOUS vos comptes.

**Statistiques** : Les études montrent que :
- 80% des utilisateurs réutilisent au moins partiellement leurs mots de passe
- 30% réutilisent le même mot de passe sur 3+ sites
- 10% utilisent le même mot de passe sur 10+ sites

Quand 100 millions de credentials sont testés contre 1 milliard de comptes Gmail, un taux de réutilisation de 2% signifie 20 millions d'accès compromis instantanément.

**Pourquoi c'est dévastateur** : C'est complètement hors du contrôle de l'utilisateur. Même si YOU créez un excellent mot de passe, si un site mineur que vous utilisez est piraté et que vous réutilisiez ce mot de passe, vous êtes compromis. L'attaquant ne teste que des credentials réels, donc le taux de succès est garanti (2-5% statistiquement).

**Cas réels** : LinkedIn (2012, 6.5M), Equifax (2017, 147M), Facebook (2019, 530M), Zoom (2020, 500k), etc. Chacun de ces incidents créa des millions de credentials utilisables pour d'autres attaques.

**Protection** : 1) Utilisez des mots de passe uniques par site (impossible à retenir → gestionnaire de mots de passe), 2) Activez 2FA/MFA partout (même si le mot de passe est volé, l'attaquant ne peut pas accéder sans le deuxième facteur), 3) Vérifiez HIBP.com régulièrement.

---

## 7. Password Spraying (Arrosage de Mots de Passe)

Le password spraying inverse la logique de brute force. Au lieu de tester **beaucoup de mots de passe sur un compte**, on teste **peu de mots de passe sur beaucoup de comptes**. C'est stratégiquement intelligent car cela évite les défenses anti-brute-force (verrouillage après N tentatives échouées).

**Fonctionnement** : Un attaquant compile une liste de 10-100 mots de passe extrêmement courants : "123456", "password", "admin", "letmein", "qwerty", "sunshine", "dragon", "monkey", "1qaz2wsx", "password123". Il cible une organisation complète (ex: tous les ~5000 utilisateurs @company.com) et essaie le premier mot de passe contre tous les comptes. Puis il attaque avec le deuxième mot de passe, etc.

**Stratégie** : Tester 10 mots de passe contre 5000 comptes = 50 000 tentatives. Si chaque compte se verrouille après 5 tentatives échouées, un attaquant qui teste 10 mots de passe par compte ne déclenche que 2 vérrous (10 > 5). En testant dans l'ordre pendant une journée, dispersé dans le temps, les défenses ne s'activent jamais efficacement.

**Taux de succès** : Statistiquement, ~1-2% des utilisateurs utilisent un des 50 mots de passe courants. Sur 5000 utilisateurs, cela signifie 50-100 accès compromis, suffisant pour une attaque initiale à l'intérieur d'une organisation.

**Cas d'usage réels** : Les attaquants utilisent password spraying pour :
- Obtenir un point d'appui initial dans une organisation
- Accéder à des rôles administrateurs (si "admin" fonctionne)
- Voler des données sensibles depuis ces comptes compromis
- Escalader les privilèges

**Défenses antispray** : 1) Interdire complètement les mots de passe courants (validation stricte), 2) Verrouillage temps-réel sur tentatives globales (pas par compte), 3) Alertes sur patterns anormaux (connexions depuis IPs inhabituelles), 4) 2FA obligatoire (même avec le bon mot de passe, l'attaquant ne peut pas entrer).

**Protection individuelle** : Ne choisissez JAMAIS un mot de passe courant. Même si votre organisation impose une politique stricte, votre mot de passe personnel doit être imprévisible. Activez 2FA partout où c'est possible.

---

## 8. Markov/Probabilistic Attack (Attaque Markovienne)

L'attaque markovienne utilise l'intelligence statistique pour deviner smartly. Au lieu de tester aléatoirement "aaaaaa", puis "aaaaab", puis "aaaaac", elle apprend les patterns statistiques des mots de passe réels et teste **les séquences probables d'abord**.

**Comment ça fonctionne** : L'attaquant analyse 1 milliard de mots de passe réels (fuites publiques) et construit une chaîne de Markov : "Quel caractère suit le plus souvent 'p'?". Résultat : 'a' (15%), 'e' (12%), 'r' (10%), etc. L'attaque génère ensuite des mots de passe dans l'ordre de probabilité décroissante : "password" (très probable), "passwor" (probable), "passwork" (moins probable), "passwordx" (improbable), "xyzabcd" (rarissime).

**Efficacité** : Sur une cible sans contrainte (juste "un mot de passe"), l'attaque markovienne teste les 10% les plus probables des mots de passe en 90% moins de temps que brute force. Elle craque les mots de passe "naturels" 10-1000× plus vite en priorisant les séquences statistiquement courantes.

**Pourquoi c'est efficace** : Les mots de passe humains ne sont PAS aléatoires. Ils suivent des patterns linguistiques subtils. Les lettres courantes en français ("e", "a", "s") apparaissent plus souvent. Les combinaisons naturelles ("qu", "tion", "able") apparaissent plus souvent que les combinaisons improbables ("xz", "kv", "jw"). L'attaque exploite ces biais statistiques.

**Limitations** : Complètement inefficace contre les mots de passe véritablement aléatoires générés par machine. "K7#mNpL!2xQvS9" n'a aucun pattern markovien courant, donc l'attaque revient à brute force aléatoire.

**Comparaison** :
- Brute force "aaaaaa" → "aaaaab" → ... → "password" (millions d'essais)
- Markov "password" → "passwor" → "qwerty" → "admin" → ... (quelques centaines d'essais)

**Protection** : Utilisez un générateur aléatoire. Ne pensez pas "comment créer un bon mot de passe" (vous créerez un pattern markovien prévisible). Laissez une machine générer `K7#mNpL!2xQvS9` — c'est aléatoire, c'est sûr, c'est storable en gestionnaire.

---

## 9. PCFG (Probabilistic Context-Free Grammar)

PCFG est une attaque très sophistiquée qui apprend les **structures grammaticales** des mots de passe, pas juste les caractères individuels. Elle détecte que 95% des mots de passe humains suivent une des ~20 structures grammaticales courantes et teste ces structures en priorité.

**Concept de grammaire** : Au lieu de penser "caractère par caractère", PCFG pense "structure par structure". Elle apprend :
- Les majuscules apparaissent généralement au début (40% des cas)
- Les minuscules forment un groupe continu (pas dispersées)
- Les chiffres apparaissent généralement à la fin (60% des cas)
- Les symboles sont rares et généralement à la fin (5% des cas)

**Structures courantes** :
1. [Maj][min 5-10] (majuscule + minuscules) : "Password", "Soleil"
2. [Maj][min 5-10][chiffre 1-4] : "Password123", "Soleil2024"
3. [Maj][min 5-10][chiffre 1-4][symbole] : "Password1!", "Soleil2024!"
4. [mot dict][chiffre] : "hello42", "tiger99"
5. etc.

**Le pouvoir** : Un mot de passe "excellent" dans tous les métriques comme "Soleil2024" a ~72 bits d'entropie. En brute force, c'est 2^72 combinaisons. En PCFG, c'est détecté comme structure [Maj][min 5][chiffre 4], réduisant les tentatives à ~10^11. Au lieu de 300 millions d'années, c'est 1 seconde.

**Cas d'étude PCFG vs autres attaques** :
- Brute force : 2^72 = 10^21 tentatives ≈ 1 million ans
- Markov : ~10^14 tentatives ≈ 50 heures
- PCFG : ~10^11 tentatives ≈ 1 seconde

PCFG craque le même mot de passe 10 million× plus vite que brute force.

**Pourquoi c'est redoutable** : Les humains créent avec une logique prévisible. Quand vous pensez "je dois créer un mot de passe sécurisé", vous appliquez inconsciemment un ensemble de règles : "une majuscule au début", "quelques minuscules", "des chiffres à la fin", "un symbole pour la sécurité". PCFG a appris exactement ces règles à partir de milliards de vrais mots de passe et peut les reproduire efficacement.

**Protection** : Brisez la grammaire. Ne faites pas [Maj][min][chiffre]. Faites [min][chiffre][Maj][symbole][min][chiffre] (aléatoirement distribué). Ou utilisez une passphrase aléatoire (correct-horse-battery-staple) qui n'a aucune structure grammaticale prévisible.

---

## 10. Combinator Attack (Attaque Combinatoire)

L'attaque combinatoire **concatène deux dictionnaires** pour générer des "passphrases" — mots multiples combinés. C'est efficace contre les utilisateurs qui pensent "deux mots = très long = très sûr" sans réaliser que l'attaquant peut simplement combiner les deux dictionnaires de manière exhaustive.

**Fonctionnement** : L'attaquant utilise deux dictionnaires :
- Dictionnaire 1 : 300 000 mots français courants
- Dictionnaire 2 : 10 000 noms communs et termes

Il génère ensuite toutes les paires : "soleil" + "cheval" = "soleilcheval", "lune" + "tigre" = "lunetigre", "correct" + "horse" = "correcthorse", etc. Total : 300k × 10k = 3 milliards de combinaisons. À 2000 GH/s, cela prend quelques heures.

**Exemple de target** : Quelqu'un crée "soleilcheval" en pensant "soleil" (mot courant) + "cheval" (mot courant) = très long = très sûr. En réalité, c'est juste deux mots du dictionnaire combinés, crackable en heures par combinator.

**Pourquoi c'est efficace** : Beaucoup de gens reçoivent des conseils "utilisez une passphrase" et les appliquent naïvement. Ils créent "correcthorsebatterystaple" — ce qui semble excellent (long, mémorizable, sûr). Mais si les mots viennent du dictionnaire sans séparation aléatoire, une attaque 4-dictionary-combinator peut la craquer.

**Temps estimés** :
- 2 mots du dictionnaire : quelques heures
- 3 mots du dictionnaire : plusieurs jours
- 4 mots du dictionnaire : plusieurs mois
- 4 mots aléatoires + séparateurs aléatoires : plusieurs millénaires

**Cas d'étude** : La passphrase xkcd "correct-horse-battery-staple" est souvent citée comme "très sûre". Elle l'est, MAIS seulement si les mots sont vraiment aléatoires (probabilité 1 sur 10^15 dans un dictionnaire de 10k mots^4). Si les mots viennent d'une liste de mots courants ordonnée ("correct" #1, "horse" #50, "battery" #100, "staple" #200), elle devient crackable.

**Protection** :
1. Utilisez 4+ mots (attaque 2-combinator ne peut pas tester les combinaisons 4-mots)
2. Incluez séparateurs aléatoires : "correct-horse!battery#staple@2024" (les séparateurs cassent les patterns)
3. Incluez au moins un symbole ou chiffre : "correct-horse-battery-staple2024!"
4. Alternativement : générateur aléatoire purement (pas de dictionnaire) : "K7#mNpL!2xQvS9-xAbC@3pQr"

**Verdict** : Les passphrases avec 4+ mots restent excellentes si les mots sont aléatoires. Elles sont mémorables ET sûres. Mais les passphrases courtes (2-3 mots) ou prédictibles restent vulnérables.

---

## Récapitulatif Comparatif

| Attaque | Vitesse | Cible Idéale | Faiblesse |
|---------|---------|--------------|-----------|
| Brute Force | Lente | Mots de passe courts | Exponentiellement lente sur longs mots |
| Dictionary | Très rapide | Mots réels seuls | Inefficace si pas de mots réels |
| Hybrid | Très rapide | Mots + mutations prévisibles | Inefficace si mutations aléatoires |
| Mask | Très rapide | Structures [Maj][min][chiffre] | Inefficace si aléatoire distribué |
| Rainbow | Instantanée | Hashes sans salt | Inutile avec salting moderne |
| Credential Stuffing | Instantanée | Mots de passe réutilisés | Nécessite fuite antérieure |
| Spraying | Rapide | Mots de passe courants | Inefficace contre mots forts |
| Markov | Rapide | Mots de passe "naturels" | Inefficace contre aléatoire |
| PCFG | Très rapide | Structures grammaticales | Inefficace contre structures aléatoires |
| Combinator | Rapide | 2-3 mots dictionnaire | Inefficace 4+ mots aléatoires |

---

## Les Vrais Mots de Passe Sûrs

**Option A : Aléatoire complexe (14+ caractères)**
```
K7#mNpL!2xQvS9
xAbC@3pQrMkL7#
9$vWxY2@aBcDeF
```
Généré par machine, stocké en gestionnaire (Bitwarden, 1Password, KeePass).

**Option B : Passphrase aléatoire (5+ mots)**
```
correct-horse-battery-staple-monkey
blizzard-penguin-submarine-telescope-keyboard
phoenix-algorithm-cryptography-security-audit
```
Facile à retenir, très sûre contre toutes les attaques combinatoire.

**Option C : Combinaison hybride (passphrase + symboles aléatoires)**
```
correct-h0rse!battery#staple-m0nkey2024
blizzard!peng-uin#subm@rine-telescope$keyboard
```
Meilleur des deux mondes : mémorability + sécurité maximale.

---

**Créé pour Time2Crack — Comprendre la sécurité réelle des mots de passe.**
