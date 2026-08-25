# Correction des pages `/methode/*` — Design

**Date** : 2026-08-25
**Statut** : En attente de revue utilisateur

## Contexte et diagnostic

Le site time2crack.eu a un taux de rebond de 88% et un temps de visite moyen de 39s (données Umami, 810 visiteurs/an). L'analyse des chemins d'entrée révèle que 25%+ du trafic total atterrit directement sur les 7 pages `/<lang>/methode/{bruteforce,dictionary,hybrid,mask,markov,pcfg,combinator}.html`, avec un point d'entrée particulièrement marqué : `/en/methode/mask.html` à elle seule (105 visiteurs, 17-18% du trafic total), alimentée à 84% par recherche organique (Google, Bing, DuckDuckGo) et 11% directement par ChatGPT.com. Le chemin de sortie de cette page est identique à son chemin d'entrée — les visiteurs repartent sans naviguer ailleurs sur le site.

Ce trafic est un signal de qualité SEO/LLM réel (autorité de contenu), pas du bruit de bot : les référents sont des moteurs de recherche et des IA conversationnelles légitimes. Le problème n'est donc pas l'absence de trafic mais l'échec de conversion de ce trafic en usage de l'outil principal.

Inspection du code source de ces pages (structure identique dans les 9 langues : EN, FR, ES, PT, DE, IT, PL, NL, TR — 63 fichiers au total) révèle des défauts structurels concrets, indépendants du design visuel global (qui est déjà propre : thème clair, palette cohérente, typographie IBM Plex) :

1. **Titre principal masqué** : chaque page contient `<h1 style="display:none">...</h1>` — le titre n'est jamais visible à l'écran. Un visiteur voit une citation ("Project reference document Time2Crack") suivie directement d'une table des matières à 15 sections, sans contexte.
2. **HTML mal formé** : listes (`<li>`) orphelines hors de tout `<ul>`/`<ol>` parent (78 occurrences sur mask.html seul) ; balises `<pre><code>` mal fermées cassant la mise en page d'un bloc ; balises `<em>`/`<strong>` mal imbriquées dans la section bibliographie.
3. **Contenu manifestement traduit/généré automatiquement** avec des erreurs qui nuisent à la crédibilité : ex. "tiny" utilisé pour "minuscule/lowercase", "randomity" pour "randomness", fragments de langue source résiduels dans les exemples.
4. **Bug additionnel sur `hybrid.html`** (les 9 langues) : un exemple de code contenant du texte type `Test "sunshine0000", ...` a été mal échappé et interprété comme un second et un troisième `<h1 style="display:none">` littéralement injectés au milieu du corps de texte (lignes ~328 et ~331), cassant le contour sémantique de la page.
5. **Sélecteur de langue cassé** : les boutons de changement de langue utilisent `onclick="window.location='/<lang>/methode/.html'"` — le nom du fichier de méthode est absent de l'URL cible, donc chaque lien de changement de langue redirige vers une page inexistante (`/fr/methode/.html` au lieu de `/fr/methode/mask.html`).
6. **Absence de call-to-action vers l'outil principal** : le seul chemin retour vers le testeur de mot de passe est un lien texte générique ("Test a password") noyé dans le menu de navigation du header, identique sur toutes les pages du site. Aucune invitation contextuelle, ni en haut ni en bas de l'article, n'encourage le visiteur à essayer l'outil après avoir lu le contenu.

## Objectif

Réduire le rebond sur ces 63 pages d'entrée sans perdre l'autorité SEO/LLM déjà acquise. Le contenu technique dense est conservé — c'est vraisemblablement ce qui motive le référencement Google et les citations ChatGPT — mais son exécution (accessibilité, HTML valide, navigation) est corrigée, et un chemin de conversion clair vers l'outil est ajouté.

## Portée

**Fichiers concernés** : les 63 pages `/<lang>/methode/{bruteforce,dictionary,hybrid,mask,markov,pcfg,combinator}.html` pour les 9 langues (EN, FR, ES, PT, DE, IT, PL, NL, TR). La page d'index `/<lang>/methode/index.html` (sommaire des méthodes) est hors périmètre — elle a déjà un `<h1>` visible et n'est pas un point d'entrée significatif d'après les données Umami.

**Hors périmètre pour cette spec** : la page d'accueil (`/index.html` vs `/en/index.html`, duplication non synchronisée identifiée séparément) sera traitée dans un travail ultérieur distinct.

## Design

### 1. Réafficher le titre (`h1`)

Retirer `style="display:none"` du `<h1>` principal de chaque page. Simplifier le libellé pour un titre de page plus naturel à l'affichage (ex. "Mask Attack — Comprehensive Operation" → "Mask Attack Explained" ou équivalent traduit par langue), en conservant le sens. Le `<h1>` doit être visuellement le premier élément fort de la page, avant la table des matières.

### 2. Corriger le HTML mal formé

- Fermer proprement toutes les listes : regrouper les `<li>` orphelins identifiés dans un `<ul>` (ou `<ol>` si la séquence est numérotée) parent correct.
- Réparer le bloc `<pre><code>` de la section "Architecture d'une attaque" (pipeline en 4 étapes) : actuellement le tag de fermeture est mal positionné, cassant l'affichage du bloc de code.
- Corriger l'imbrication `<em>`/`<strong>` dans la section "Références bibliographiques" (bascule incohérente entre balises ouvrantes non refermées).
- Corriger spécifiquement sur `hybrid.html` (9 langues) : neutraliser les deux `<h1 style="display:none">` injectés par erreur au milieu du corps de texte — le texte d'exemple `Test "sunshine0000", ...` doit être un simple texte ou bloc de code, pas un titre de page.

### 3. Nettoyer les traductions automatiques

Repasser sur le texte de chaque page pour corriger les tournures clairement erronées identifiées à l'audit (ex. "tiny" → traduction correcte de "minuscule/lowercase" dans la langue de la page, fragments de langue source résiduels). Ce nettoyage se fait langue par langue ; pas de retraduction complète, seulement correction des erreurs factuelles/grammaticales flagrantes.

### 4. Réparer le sélecteur de langue

Corriger les URLs du menu de langue pour inclure le nom du fichier de méthode courant : `/<lang>/methode/.html` → `/<lang>/methode/<methode>.html` (ex. `/fr/methode/mask.html`). Le nom de fichier de méthode est déjà connu côté page (identique pour les 9 variantes linguistiques d'une même méthode) donc la correction est mécanique.

### 5. Ajouter deux call-to-action vers l'outil

- **CTA haut de page** : juste après le `<h1>` (ou juste avant/après le sommaire), un encart visuellement distinct — pas un simple lien texte — invitant à tester son propre mot de passe. Exemple de message : *"Curieux de savoir si votre mot de passe résiste à ce type d'attaque ? Testez-le gratuitement, en local, en 2 secondes."* avec bouton vers `/<lang>/index.html`.
- **CTA bas de page** : même invitation reformulée, placée après la conclusion/bibliographie, avant le footer.
- Le style du CTA doit réutiliser les tokens CSS déjà définis sur la page (`--color-blue`, `--radius-md`, etc.) pour rester cohérent avec l'identité visuelle existante, sans introduire de nouvelle palette.
- Traduire ce message dans les 9 langues.

### 6. Méthode d'application

Les 7 pages partagent une structure identique (header, sélecteur de langue, navigation, footer) et ne diffèrent que par le contenu de l'article central et les métadonnées (title, meta description, og:*). Les corrections 1, 2 (hors cas spécifique hybrid.html), 4 et 5 sont mécaniques et identiques sur les 63 fichiers — elles seront appliquées par transformation scriptée plutôt que par édition manuelle répétée, pour garantir la cohérence et limiter le risque d'erreur humaine sur un si grand nombre de fichiers. La correction 3 (nettoyage de traduction) nécessite une relecture ciblée par langue sur les passages identifiés comme erronés.

## Tests / vérification

- Validation HTML avec `tidy` (déjà installé localement) sur les 63 fichiers après correction, pour confirmer l'absence d'erreurs de structure.
- Vérification visuelle du rendu du `<h1>` et des deux CTA sur au moins une page par langue.
- Vérification manuelle que chaque lien du sélecteur de langue sur une page donnée pointe vers une page existante dans la langue cible.
- Il n'existe pas de suite de tests automatisés couvrant le contenu HTML statique de ces pages (confirmé : aucun test ni script `test` dans `v2/package.json` référençant `methode`). La vérification reste manuelle/visuelle, appuyée par `tidy` pour la validité structurelle.

## Risques et points d'attention

- **CSP (Content Security Policy)** : la mémoire projet indique une politique CSP stricte avec vérification de hash après modification de HTML/CSS inline. Si les CTA ajoutés introduisent du CSS inline nouveau, le hash CSP devra être régénéré (protocole existant, voir `CRITICAL_PROTOCOLS.md`).
- **Volume** : 63 fichiers à modifier de façon cohérente — le risque principal est une divergence accidentelle entre langues si le script de transformation n'est pas appliqué uniformément. À traiter avec un script réutilisable plutôt que 63 éditions manuelles.
- **hybrid.html** a un contenu plus long (848 lignes, la plus grosse page du lot) et un bug unique (les h1 injectés) — à traiter avec une attention spécifique, pas seulement le patron générique.
