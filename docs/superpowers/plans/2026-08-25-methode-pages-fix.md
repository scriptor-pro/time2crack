# Correction des pages /methode/* — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les 63 pages `/<lang>/methode/{bruteforce,dictionary,hybrid,mask,markov,pcfg,combinator}.html` (9 langues) pour réafficher leur titre, réparer leur HTML cassé, nettoyer les traductions fautives repérées, réparer le sélecteur de langue, et ajouter deux call-to-action vers l'outil principal — afin de convertir le trafic SEO/LLM qui atterrit sur ces pages (25%+ du trafic total) au lieu de le laisser repartir immédiatement (88% de rebond, 39s en moyenne).

**Architecture:** Un script Python (BeautifulSoup + lxml, déjà installés) applique les 4 corrections mécaniques et identiques (h1, sélecteur de langue, CTA haut, CTA bas) sur les 63 fichiers en une passe par correction, car la structure de header/footer/sélecteur est strictement identique sur tous les fichiers (vérifié : `<h1 style="display:none">` toujours ligne 181, `</main>` toujours ligne 395). Le cas spécial de `hybrid.html` (2 `<h1>` fantômes supplémentaires dans le corps, 9 langues) est traité par un script dédié. Le nettoyage des blocs `<li>` orphelins et la relecture de traduction sont ensuite faits manuellement, langue par langue, car ils demandent un jugement sur le sens du texte que l'automatisation ne peut pas garantir sans risque de casser une phrase.

**Tech Stack:** Python 3.11 (bs4, lxml) pour les scripts de transformation ; `tidy` (déjà installé, utilisé en mode diagnostic/vérification uniquement, jamais en auto-fix aveugle) pour la validation post-correction.

**Spec:** `docs/superpowers/specs/2026-08-25-methode-pages-fix-design.md`

## Global Constraints

- Portée : exactement les 63 fichiers `v2/public/<lang>/methode/{bruteforce,dictionary,hybrid,markov,mask,pcfg,combinator}.html` pour `<lang>` ∈ {en, fr, es, pt, de, it, pl, nl, tr}. Le dossier `v2/public/time2crack.eu/` (structure différente, `main` sans classe `methode-page`) est hors périmètre. `methode/index.html` (sommaire) est hors périmètre.
- Ne pas retraduire le contenu technique existant — seulement corriger les erreurs de traduction flagrantes déjà identifiées ou trouvées à la relecture.
- Le style du CTA doit réutiliser les tokens CSS déjà définis dans `v2/public/style.min.css` (`--color-blue: #2563EB`, `--color-blue-subtle: #E0EEFF`, `--radius-md: 6px`) — pas de nouvelle palette, pas de nouveau `<style>` inline sur les pages methode (elles n'en ont pas actuellement, seulement un `<link>` vers `style.min.css` externe).
- Toute classe CSS nouvellement introduite pour le CTA va dans `v2/public/style.min.css`, pas inline, pour éviter d'avoir à régénérer un hash CSP par page.
- Ton du site en français : vouvoiement ("Tester un mot de passe", registre neutre/professionnel) — le CTA doit suivre ce registre dans toutes les langues.
- Chaque script de transformation doit être idempotent et vérifiable par diff avant application définitive (dry-run puis application), vu le volume de fichiers touchés.

---

## Task 1: Script de correction du `<h1>` masqué (63 fichiers)

**Files:**
- Create: `scripts/fix-methode-pages/01_unhide_h1.py`
- Modify (via script, pas édition manuelle): les 63 fichiers `v2/public/<lang>/methode/*.html` (hors `hybrid.html`, `index.html`)
- Modify (via script, cas spécial): les 9 fichiers `v2/public/<lang>/methode/hybrid.html`

**Interfaces:**
- Produces: script exécutable `python3 scripts/fix-methode-pages/01_unhide_h1.py [--dry-run] [--root v2/public]` qui, pour chaque fichier ciblé, retire `style="display:none"` du **premier** `<h1>` de la page (le titre légitime) et laisse un rapport des fichiers modifiés sur stdout.

- [ ] **Step 1: Écrire le script avec mode dry-run**

```python
#!/usr/bin/env python3
"""Réaffiche le <h1> masqué sur les pages /methode/*.html (sauf hybrid.html)."""
import argparse
import sys
from pathlib import Path
from bs4 import BeautifulSoup

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]
METHODS = ["bruteforce", "dictionary", "hybrid", "markov", "mask", "pcfg", "combinator"]


def target_files(root: Path):
    for lang in LANGS:
        for method in METHODS:
            path = root / lang / "methode" / f"{method}.html"
            if path.exists():
                yield path


def unhide_first_h1(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1", style=lambda v: v and "display:none" in v.replace(" ", ""))
    if h1 is None:
        return False
    del h1["style"]
    path.write_text(str(soup), encoding="utf-8")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="v2/public")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)

    changed = []
    for path in target_files(root):
        if args.dry_run:
            html = path.read_text(encoding="utf-8")
            if 'style="display:none"' in html and "<h1" in html:
                changed.append(path)
        else:
            if unhide_first_h1(path):
                changed.append(path)

    for path in changed:
        print(f"{'[dry-run] would change' if args.dry_run else 'changed'}: {path}")
    print(f"\nTotal: {len(changed)} file(s)")
    if not args.dry_run and len(changed) != 63:
        print(f"WARNING: expected 63 files changed, got {len(changed)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Lancer en dry-run et vérifier le compte**

Run: `cd /home/Baudouin/Documents/Projets/CrackDate && python3 scripts/fix-methode-pages/01_unhide_h1.py --dry-run --root v2/public`

Expected: liste de 63 chemins, puis `Total: 63 file(s)`. Si le total diffère de 63, ne pas continuer — investiguer quel fichier ne matche pas le pattern attendu avant de passer à l'étape suivante.

- [ ] **Step 3: Appliquer réellement**

Run: `python3 scripts/fix-methode-pages/01_unhide_h1.py --root v2/public`

Expected: `Total: 63 file(s)`, aucun warning.

- [ ] **Step 4: Vérifier un échantillon visuellement**

Run: `grep -n '<h1' v2/public/en/methode/mask.html v2/public/fr/methode/bruteforce.html`

Expected: le premier `<h1>` de chaque fichier n'a plus `style="display:none"` (ex: `<h1>Mask Attack — Comprehensive Operation</h1>`). Sur `hybrid.html`, vérifier que les 2 `<h1>` fantômes dans le corps du texte (lignes ~328, ~331) ont aussi perdu leur `style` — ils seront neutralisés proprement (convertis en texte normal) à la Task 2, donc ce n'est pas un problème s'ils sont temporairement visibles sous forme de titre à cette étape intermédiaire.

- [ ] **Step 5: Commit**

```bash
git -C v2/public add -A
git -C v2/public commit -m "fix: unhide h1 title on all methode pages (63 files, 9 languages)"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2 scripts/fix-methode-pages/01_unhide_h1.py
git commit -m "fix: unhide h1 title on methode pages + add transformation script"
```

---

## Task 2: Corriger le cas spécial `hybrid.html` (h1 fantômes dans le corps, 9 fichiers)

**Files:**
- Create: `scripts/fix-methode-pages/02_fix_hybrid_ghost_h1.py`
- Modify (via script): `v2/public/<lang>/methode/hybrid.html` pour les 9 langues

**Interfaces:**
- Consumes: fichiers déjà traités par Task 1 (le premier `<h1>` légitime est déjà visible, mais les 2 `<h1>` fantômes dans le corps le sont devenus aussi puisque Task 1 ne cible que le premier `<h1>` masqué — ce script cible spécifiquement les occurrences restantes).
- Produces: script `python3 scripts/fix-methode-pages/02_fix_hybrid_ghost_h1.py [--dry-run]` qui convertit chaque `<h1 ...>Test "..."</h1>` restant (2 par fichier) en texte simple dans un `<code>` ou `<p>`, sans balise de titre.

- [ ] **Step 1: Confirmer le pattern exact sur un fichier avant d'écrire le script**

Run: `grep -n '<h1' v2/public/en/methode/hybrid.html`

Expected: 3 lignes — la ligne ~181 (titre légitime, déjà sans `style` grâce à Task 1) et deux lignes contenant `<h1...>Test "sunshine0000", "sunshine0001", ..., "sunshine9999"</h1></code></pre>` et l'équivalent `"00sunshine"`. Confirmer aussi le texte exact en français (`Teste "sunshine0000"...` — notez le "Teste" avec un "e", différent de l'anglais "Test") pour que le script gère les deux variantes de texte sans dépendre d'un texte figé.

- [ ] **Step 2: Écrire le script ciblant tous les `<h1>` après le premier**

```python
#!/usr/bin/env python3
"""Neutralise les <h1> fantômes injectés dans le corps de hybrid.html (9 langues)."""
import argparse
import sys
from pathlib import Path
from bs4 import BeautifulSoup

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]


def fix_file(path: Path, dry_run: bool) -> int:
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    h1_tags = soup.find_all("h1")
    if len(h1_tags) <= 1:
        return 0
    ghost_count = 0
    for ghost in h1_tags[1:]:
        text = ghost.get_text()
        ghost.replace_with(soup.new_string(text))
        ghost_count += 1
    if not dry_run and ghost_count:
        path.write_text(str(soup), encoding="utf-8")
    return ghost_count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="v2/public")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)

    total = 0
    for lang in LANGS:
        path = root / lang / "methode" / "hybrid.html"
        if not path.exists():
            print(f"WARNING: missing {path}", file=sys.stderr)
            continue
        count = fix_file(path, args.dry_run)
        print(f"{path}: {count} ghost h1 {'found' if args.dry_run else 'fixed'}")
        total += count

    print(f"\nTotal: {total} ghost h1 across {len(LANGS)} files")
    if not args.dry_run and total != 18:
        print(f"WARNING: expected 18 (2 per file x 9 langs), got {total}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Dry-run et vérifier le compte**

Run: `python3 scripts/fix-methode-pages/02_fix_hybrid_ghost_h1.py --dry-run --root v2/public`

Expected: `2 ghost h1 found` pour chacun des 9 fichiers, `Total: 18 ghost h1 across 9 files`.

- [ ] **Step 4: Appliquer**

Run: `python3 scripts/fix-methode-pages/02_fix_hybrid_ghost_h1.py --root v2/public`

Expected: `Total: 18 ghost h1 across 9 files`, aucun warning.

- [ ] **Step 5: Vérifier qu'il ne reste qu'un seul `<h1>` par fichier**

Run: `for f in v2/public/{en,fr,es,pt,de,it,pl,nl,tr}/methode/hybrid.html; do echo -n "$f: "; grep -c '<h1' "$f"; done`

Expected: chaque ligne affiche `: 1`.

- [ ] **Step 6: Commit**

```bash
git -C v2/public add -A
git -C v2/public commit -m "fix: remove ghost h1 tags injected in hybrid.html body (9 languages)"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2 scripts/fix-methode-pages/02_fix_hybrid_ghost_h1.py
git commit -m "fix: remove ghost h1 tags in hybrid.html + add script"
```

---

## Task 3: Réparer le sélecteur de langue cassé (63 fichiers)

**Files:**
- Create: `scripts/fix-methode-pages/03_fix_lang_selector.py`
- Modify (via script): les 63 fichiers `v2/public/<lang>/methode/*.html`

**Interfaces:**
- Consumes: aucune dépendance sur les tasks précédentes (transformation indépendante, portant sur une zone différente du fichier — le menu `<menu id="method-lang-menu">`).
- Produces: script `python3 scripts/fix-methode-pages/03_fix_lang_selector.py [--dry-run]` qui corrige chaque `onclick="window.location='/<lang>/methode/.html'"` en `onclick="window.location='/<lang>/methode/<method>.html'"`, où `<method>` est déduit du nom de fichier courant.

- [ ] **Step 1: Confirmer le pattern cassé exact**

Run: `grep -n "onclick=\"window.location" v2/public/en/methode/mask.html`

Expected: 9 lignes de la forme `onclick="window.location='/<lang>/methode/.html'"` — noter l'absence du nom de méthode entre `methode/` et `.html`.

- [ ] **Step 2: Écrire le script**

```python
#!/usr/bin/env python3
"""Corrige les liens du sélecteur de langue sur les pages methode (ajoute le nom de méthode manquant)."""
import argparse
import re
import sys
from pathlib import Path

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]
METHODS = ["bruteforce", "dictionary", "hybrid", "markov", "mask", "pcfg", "combinator"]

BROKEN_PATTERN = re.compile(r"(/(?:en|fr|es|pt|de|it|pl|nl|tr)/methode/)\.html")


def fix_file(path: Path, method: str, dry_run: bool) -> int:
    html = path.read_text(encoding="utf-8")
    fixed, count = BROKEN_PATTERN.subn(rf"\g<1>{method}.html", html)
    if count and not dry_run:
        path.write_text(fixed, encoding="utf-8")
    return count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="v2/public")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)

    total = 0
    file_count = 0
    for lang in LANGS:
        for method in METHODS:
            path = root / lang / "methode" / f"{method}.html"
            if not path.exists():
                continue
            count = fix_file(path, method, args.dry_run)
            if count:
                file_count += 1
            total += count

    print(f"Fixed {total} links across {file_count} files")
    if not args.dry_run and total != 63 * 9:
        print(f"WARNING: expected {63*9} links (9 per file x 63 files), got {total}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Dry-run**

Run: `python3 scripts/fix-methode-pages/03_fix_lang_selector.py --dry-run --root v2/public`

Expected: `Fixed 567 links across 63 files` (63 fichiers × 9 boutons de langue chacun).

- [ ] **Step 4: Appliquer**

Run: `python3 scripts/fix-methode-pages/03_fix_lang_selector.py --root v2/public`

Expected: `Fixed 567 links across 63 files`, aucun warning.

- [ ] **Step 5: Vérifier qu'un lien précis fonctionne**

Run: `grep -n "onclick=\"window.location='/fr/methode/mask.html'\"" v2/public/en/methode/mask.html`

Expected: une ligne trouvée, confirmant que le bouton "Français" sur la page anglaise de mask.html pointe maintenant vers `/fr/methode/mask.html` (et non plus `/fr/methode/.html`).

- [ ] **Step 6: Commit**

```bash
git -C v2/public add -A
git -C v2/public commit -m "fix: repair language selector links on methode pages (63 files, 567 links)"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2 scripts/fix-methode-pages/03_fix_lang_selector.py
git commit -m "fix: repair methode pages language selector + add script"
```

---

## Task 4: Ajouter la classe CSS du CTA dans `style.min.css`

**Files:**
- Modify: `v2/public/style.min.css`

**Interfaces:**
- Produces: classes CSS `.methode-cta`, `.methode-cta__text`, `.methode-cta__button` réutilisées par Task 5 pour les 63 pages.

- [ ] **Step 1: Localiser un point d'insertion cohérent dans le fichier**

Run: `grep -n "\.privacy-notice{" v2/public/style.min.css`

Expected: une ligne trouvée — insérer les nouvelles règles juste après ce bloc, car `.privacy-notice` est la boîte d'info la plus proche stylistiquement du CTA recherché (fond `--color-blue-subtle`, bordure, padding).

- [ ] **Step 2: Ajouter les règles CSS**

Ajouter à la suite du bloc `.privacy-notice{...}` dans `v2/public/style.min.css` (fichier minifié en une ligne par règle, donc ajouter sur une nouvelle ligne à la suite, dans le même style compact) :

```css
.methode-cta{background-color:var(--color-blue-subtle);border:1px solid var(--color-blue);border-radius:var(--radius-md);padding:var(--space-4);margin:var(--space-5) 0;display:flex;flex-direction:column;gap:var(--space-3);align-items:flex-start}
.methode-cta__text{margin:0;color:var(--color-text)}
.methode-cta__button{display:inline-block;background-color:var(--color-blue);color:#fff;padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);text-decoration:none;font-weight:500}
.methode-cta__button:hover{background-color:var(--color-blue-dark);text-decoration:none}
```

- [ ] **Step 3: Vérifier que les variables référencées existent bien dans le fichier**

Run: `grep -o -- "--space-4:[^;]*\|--space-5:[^;]*\|--space-3:[^;]*\|--color-blue-dark:[^;]*\|--color-text:[^;]*" v2/public/style.min.css | sort -u`

Expected: chacune des 5 variables listée avec sa valeur (aucune ne doit être absente — si une manque, la remplacer dans le CSS ajouté par une valeur en dur correspondant à l'usage déjà présent ailleurs dans le fichier).

- [ ] **Step 4: Commit**

```bash
git -C v2/public add style.min.css
git -C v2/public commit -m "feat: add .methode-cta styles for password-tester call-to-action"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2
git commit -m "feat: add methode-cta CSS classes"
```

---

## Task 5: Insérer les CTA haut et bas de page (63 fichiers, 9 langues de texte)

**Files:**
- Create: `scripts/fix-methode-pages/04_insert_cta.py`
- Create: `scripts/fix-methode-pages/cta_translations.json`
- Modify (via script): les 63 fichiers `v2/public/<lang>/methode/*.html`

**Interfaces:**
- Consumes: classes CSS `.methode-cta`, `.methode-cta__text`, `.methode-cta__button` produites par Task 4.
- Produces: chaque page methode contient désormais deux blocs `<div class="methode-cta">...</div>` : un juste après le `<h1>` (avant le `<blockquote>` de citation), un juste avant `</main>`.

- [ ] **Step 1: Écrire les traductions du CTA dans les 9 langues**

Créer `scripts/fix-methode-pages/cta_translations.json` :

```json
{
  "en": {"text": "Curious whether your own password would resist this kind of attack? Test it for free, entirely in your browser, in a couple of seconds.", "button": "Test my password"},
  "fr": {"text": "Curieux de savoir si votre mot de passe résisterait à ce type d'attaque ? Testez-le gratuitement, entièrement dans votre navigateur, en quelques secondes.", "button": "Tester mon mot de passe"},
  "es": {"text": "¿Tiene curiosidad por saber si su contraseña resistiría este tipo de ataque? Pruébela gratis, totalmente en su navegador, en unos segundos.", "button": "Probar mi contraseña"},
  "pt": {"text": "Tem curiosidade em saber se a sua palavra-passe resistiria a este tipo de ataque? Teste-a gratuitamente, totalmente no seu navegador, em poucos segundos.", "button": "Testar a minha palavra-passe"},
  "de": {"text": "Neugierig, ob Ihr eigenes Passwort dieser Art von Angriff standhält? Testen Sie es kostenlos, vollständig in Ihrem Browser, in wenigen Sekunden.", "button": "Mein Passwort testen"},
  "it": {"text": "Curioso di sapere se la tua password resisterebbe a questo tipo di attacco? Provala gratuitamente, interamente nel tuo browser, in pochi secondi.", "button": "Testa la mia password"},
  "pl": {"text": "Ciekawi Cię, czy Twoje hasło oprze się tego typu atakowi? Przetestuj je za darmo, w całości w przeglądarce, w kilka sekund.", "button": "Przetestuj moje hasło"},
  "nl": {"text": "Benieuwd of jouw eigen wachtwoord bestand is tegen dit soort aanval? Test het gratis, volledig in je browser, in een paar seconden.", "button": "Test mijn wachtwoord"},
  "tr": {"text": "Kendi şifrenizin bu tür bir saldırıya dayanıp dayanamayacağını merak ediyor musunuz? Ücretsiz olarak, tamamen tarayıcınızda, birkaç saniyede test edin.", "button": "Şifremi test et"}
}
```

- [ ] **Step 2: Écrire le script d'insertion**

```python
#!/usr/bin/env python3
"""Insère les CTA haut/bas de page vers le testeur de mot de passe sur les pages methode."""
import argparse
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]
METHODS = ["bruteforce", "dictionary", "hybrid", "markov", "mask", "pcfg", "combinator"]


def build_cta(soup: BeautifulSoup, lang: str, translations: dict) -> BeautifulSoup:
    t = translations[lang]
    div = soup.new_tag("div", **{"class": "methode-cta"})
    p = soup.new_tag("p", **{"class": "methode-cta__text"})
    p.string = t["text"]
    a = soup.new_tag("a", href=f"/{lang}/index.html", **{"class": "methode-cta__button"})
    a.string = t["button"]
    div.append(p)
    div.append(a)
    return div


def insert_ctas(path: Path, lang: str, translations: dict) -> bool:
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find("main", class_="methode-page")
    h1 = soup.find("h1")
    if main is None or h1 is None:
        return False
    if main.find("div", class_="methode-cta") is not None:
        return False  # déjà inséré, idempotence

    top_cta = build_cta(soup, lang, translations)
    h1.insert_after(top_cta)

    bottom_cta = build_cta(soup, lang, translations)
    main.append(bottom_cta)

    path.write_text(str(soup), encoding="utf-8")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="v2/public")
    parser.add_argument("--translations", default="scripts/fix-methode-pages/cta_translations.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)
    translations = json.loads(Path(args.translations).read_text(encoding="utf-8"))

    changed = 0
    for lang in LANGS:
        for method in METHODS:
            path = root / lang / "methode" / f"{method}.html"
            if not path.exists():
                print(f"WARNING: missing {path}", file=sys.stderr)
                continue
            if args.dry_run:
                html = path.read_text(encoding="utf-8")
                if "methode-cta" not in html:
                    changed += 1
                    print(f"[dry-run] would add CTA: {path}")
            else:
                if insert_ctas(path, lang, translations):
                    changed += 1
                    print(f"added CTA: {path}")

    print(f"\nTotal: {changed} file(s)")
    if not args.dry_run and changed != 63:
        print(f"WARNING: expected 63 files changed, got {changed}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Dry-run**

Run: `python3 scripts/fix-methode-pages/04_insert_cta.py --dry-run --root v2/public`

Expected: 63 lignes `[dry-run] would add CTA: ...`, puis `Total: 63 file(s)`.

- [ ] **Step 4: Appliquer**

Run: `python3 scripts/fix-methode-pages/04_insert_cta.py --root v2/public`

Expected: `Total: 63 file(s)`, aucun warning.

- [ ] **Step 5: Vérifier visuellement un fichier par langue (échantillon EN + FR)**

Run: `grep -A2 'methode-cta__text' v2/public/en/methode/mask.html | head -6`
Run: `grep -A2 'methode-cta__text' v2/public/fr/methode/mask.html | head -6`

Expected: le texte anglais et français attendus apparaissent, chacun suivi d'un lien vers `/en/index.html` ou `/fr/index.html` respectivement. Vérifier aussi qu'il y a bien 2 occurrences de `methode-cta` par fichier (`grep -c methode-cta v2/public/en/methode/mask.html` → `2` ou plus selon la façon dont bs4 sérialise les attributs).

- [ ] **Step 6: Commit**

```bash
git -C v2/public add -A
git -C v2/public commit -m "feat: add top/bottom CTA to password tester on methode pages (63 files, 9 languages)"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2 scripts/fix-methode-pages/04_insert_cta.py scripts/fix-methode-pages/cta_translations.json
git commit -m "feat: add CTA to methode pages + translations + insertion script"
```

---

## Task 6: Réparer le HTML mal formé (listes orphelines, blocs `<pre><code>`, bibliographie) — par langue

**Files:**
- Modify (édition manuelle, page par page): les 63 fichiers `v2/public/<lang>/methode/*.html`

**Interfaces:**
- Consumes: fichiers déjà corrigés par Tasks 1–5 (h1 visible, CTA en place) — cette tâche ne touche que le balisage interne du corps de l'article, zones non modifiées par les scripts précédents.

Cette tâche ne peut pas être scriptée de façon fiable car corriger `<li>` orphelins nécessite de décider où chaque liste commence et finit sémantiquement (certaines suites de `<li>` sont interrompues par des `<p>` qui ne devraient pas l'être, d'autres sont de vraies ruptures de liste) — une transformation aveugle risque de fusionner des listes qui doivent rester séparées. Traiter langue par langue, méthode par méthode.

- [ ] **Step 1: Lister les zones à corriger avec `tidy` en mode diagnostic (jamais en auto-fix)**

Run (pour chaque fichier, ex. en/methode/mask.html) : `tidy -q -e v2/public/en/methode/mask.html 2>&1 | grep -v "&display\|remplacement de\|échappement de"`

Expected: liste des avertissements structurels réels (listes orphelines, `<em>` non fermé, etc.), en filtrant le bruit déjà connu et sans impact (l'avertissement `&display` vient des URLs de fonts avec `&` non échappé, déjà présent partout et sans effet visuel — l'avertissement `remplacement de </p> par <br>` et `échappement de référence d'URI` sont des suggestions de tidy à ignorer, pas des bugs réels).

- [ ] **Step 2: Corriger les listes orphelines dans le sommaire ("Contents"/"Table des matières")**

Pour chaque fichier, la table des matières (section juste après le premier CTA) contient une suite de `<li><a href="#...">...</a></li>` qui n'est pas enveloppée dans `<ul>`. Entourer l'ensemble de la séquence de `<ul>...</ul>` (une seule liste, pas de rupture, car ce sont tous des éléments de sommaire consécutifs). Faire de même pour toutes les autres suites de `<li>` orphelins repérées dans le corps de l'article (ex. listes à puces sous "1. Overview", "3.1 Humans generate structures...", etc. — dans mask.html ce sont les blocs après `<p>Most users build memory secrets:</p>` etc.).

- [ ] **Step 3: Réparer le bloc `<pre><code>` du pipeline (section "Architecture")**

Sur `mask.html` (et l'équivalent dans les 7 méthodes s'il existe une section pipeline similaire — vérifier au cas par cas), le bloc actuel :

```html
<pre><code class="language-text">1) Profilage de la cible / du corpus
   -&gt; structures fréquentes (L8D2, L6D4, U1L5D2, etc.)
<p>2) Generation of candidate masks
-&gt; ordered by probability</p>
<p>3) GPU execution (Hashcat -a 3)
-&gt; high speed parallel tests</p>
<p>4) Adaptive adjustment
-&gt; we keep the masks high, we spread the weak</p></code></pre>
```

doit devenir (fermeture propre, `<p>` internes retirés puisqu'un bloc `<pre>` gère déjà les sauts de ligne littéralement) :

```html
<pre><code class="language-text">1) Profilage de la cible / du corpus
   -&gt; structures fréquentes (L8D2, L6D4, U1L5D2, etc.)

2) Generation of candidate masks
-&gt; ordered by probability

3) GPU execution (Hashcat -a 3)
-&gt; high speed parallel tests

4) Adaptive adjustment
-&gt; we keep the masks high, we spread the weak</code></pre>
```

- [ ] **Step 4: Corriger l'imbrication `<em>`/`<strong>` de la bibliographie**

Sur `mask.html`, la section "15. Bibliographic references" a des balises `<em>` ouvertes sans fermeture correcte, par exemple :
```html
<strong>Wheeler, D.L. (2016).</strong> zxcvbn: Low-Budget Password Strength Estimate.<em> 25th USENIX Security Symposium.
```
Corriger en fermant chaque `<em>` sur la même entrée bibliographique :
```html
<strong>Wheeler, D.L. (2016).</strong> <em>zxcvbn: Low-Budget Password Strength Estimate.</em> 25th USENIX Security Symposium.
```
Appliquer ce correctif à toutes les entrées bibliographiques de la page (typiquement 4 à 8 entrées par page methode) en identifiant le titre d'article/ouvrage (à mettre en `<em>`) distinct de l'auteur (`<strong>`) et de la source (texte normal).

- [ ] **Step 5: Valider avec tidy après correction, comparer le nombre d'avertissements structurels**

Run: `tidy -q -e v2/public/en/methode/mask.html 2>&1 | grep -v "&display\|remplacement de\|échappement de" | wc -l`

Expected: 0, ou une réduction nette par rapport au compte de l'étape 1 (les avertissements liés aux listes orphelines et à l'imbrication `<em>` doivent avoir disparu).

- [ ] **Step 6: Répéter les Steps 1–5 pour les 6 autres méthodes en anglais, puis pour les 8 autres langues**

Traiter dans cet ordre pour limiter le risque : `en/methode/{bruteforce,dictionary,hybrid,markov,pcfg,combinator}.html`, puis répéter tout le processus (Steps 1–5) pour `fr`, `es`, `pt`, `de`, `it`, `pl`, `nl`, `tr` — chaque langue a la même structure de bugs (vérifié à l'audit) mais un contenu textuel différent, donc chaque fichier doit être vérifié individuellement avec `tidy`, pas supposé identique.

- [ ] **Step 7: Commit par lot de langue (9 commits, pour limiter la taille de chaque diff)**

```bash
# Répéter pour chaque langue une fois ses 7 fichiers corrigés
git -C v2/public add en/methode/*.html
git -C v2/public commit -m "fix: repair malformed HTML on English methode pages (orphan lists, pre/code, bibliography)"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2
git commit -m "fix: repair malformed HTML on English methode pages"
```

---

## Task 7: Nettoyer les erreurs de traduction repérées — par langue

**Files:**
- Modify (édition manuelle, relecture page par page): les 63 fichiers `v2/public/<lang>/methode/*.html`

**Interfaces:**
- Consumes: fichiers déjà corrigés par Tasks 1–6 (structure HTML valide, CTA en place) — cette tâche ne touche que le texte, pas le balisage.

- [ ] **Step 1: Corriger les erreurs déjà identifiées à l'audit (anglais)**

Occurrences confirmées à corriger dans les fichiers anglais :
- `en/methode/markov.html:253`, `en/methode/mask.html:210,260,295` — remplacer "tiny" par "lowercase" partout où le mot désigne une classe de caractères minuscules (contexte : liste de classes `?l : tiny (a-z)` doit devenir `?l : lowercase (a-z)`).
- `en/methode/bruteforce.html:282`, `en/methode/dictionary.html:722`, `en/methode/mask.html:235` — remplacer "randomity" par "randomness".

Run après correction : `grep -rn "\btiny\b\|randomity" v2/public/en/methode/*.html`

Expected: aucune occurrence restante.

- [ ] **Step 2: Relire chaque page anglaise pour d'autres erreurs de traduction/formulation**

Lire chaque fichier `en/methode/{bruteforce,dictionary,hybrid,mask,markov,pcfg,combinator}.html` en entier et corriger toute tournure qui trahit une traduction automatique non révisée — par exemple, dans le contenu déjà vu à l'audit : "diagrams" utilisé à la place de "patterns" dans certains contextes, fragments de français résiduel dans des exemples (ex. "Mot123!", "Prénom2024" sont des exemples volontairement laissés en français car ce sont des mots de passe démonstratifs — les garder tels quels, ce ne sont pas des erreurs), et toute phrase grammaticalement incorrecte en anglais rencontrée à la lecture. Corriger directement dans le fichier au fil de la lecture, sans réécrire les passages déjà corrects.

- [ ] **Step 3: Répéter Steps 1–2 pour les 8 autres langues**

Pour chaque langue (fr, es, pt, de, it, pl, nl, tr), lire les 7 fichiers methode et corriger les erreurs de traduction/formulation trouvées à la lecture — il n'y a pas de liste préétablie pour ces langues (l'audit initial n'a couvert que l'anglais en détail), donc cette relecture est le seul moyen de les repérer. Prioriser les langues dans l'ordre du volume de trafic Umami si connu (sinon ordre alphabétique).

- [ ] **Step 4: Commit par lot de langue**

```bash
# Répéter pour chaque langue une fois ses 7 fichiers relus
git -C v2/public add en/methode/*.html
git -C v2/public commit -m "fix: clean up machine-translation artifacts on English methode pages"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2
git commit -m "fix: clean up translation artifacts on English methode pages"
```

---

## Task 8: Validation finale et vérification CSP

**Files:**
- No new files — vérification uniquement.

- [ ] **Step 1: Valider le HTML des 63 fichiers avec tidy**

Run: `for f in v2/public/{en,fr,es,pt,de,it,pl,nl,tr}/methode/{bruteforce,dictionary,hybrid,markov,mask,pcfg,combinator}.html; do echo "=== $f ==="; tidy -q -e "$f" 2>&1 | grep -v "&display\|remplacement de\|échappement de"; done`

Expected: aucune sortie d'avertissement structurel restante sur l'ensemble des 63 fichiers (les avertissements filtrés — `&display`, `remplacement de </p>`, `échappement de référence d'URI` — sont des faux positifs déjà présents avant ce travail et sans impact visuel, confirmés à la Task 6 Step 1).

- [ ] **Step 2: Vérifier qu'aucun `<h1 style="display:none">` ne subsiste**

Run: `grep -rl 'h1 style="display:none"' v2/public/{en,fr,es,pt,de,it,pl,nl,tr}/methode/*.html`

Expected: aucune sortie (grep ne trouve rien = code de sortie 1, c'est le résultat attendu).

- [ ] **Step 3: Vérifier qu'aucun lien de sélecteur de langue cassé ne subsiste**

Run: `grep -rl "methode/\.html" v2/public/{en,fr,es,pt,de,it,pl,nl,tr}/methode/*.html`

Expected: aucune sortie.

- [ ] **Step 4: Vérifier que les 63 fichiers ont bien 2 CTA chacun**

Run: `for f in v2/public/{en,fr,es,pt,de,it,pl,nl,tr}/methode/{bruteforce,dictionary,hybrid,markov,mask,pcfg,combinator}.html; do n=$(grep -c "methode-cta__button" "$f"); if [ "$n" -ne 2 ]; then echo "MISMATCH $f: $n"; fi; done`

Expected: aucune sortie (tous les fichiers ont exactement 2 boutons CTA).

- [ ] **Step 5: Vérifier la politique CSP du site**

Run: `grep -n "Content-Security-Policy" v2/public/index.html v2/public/en/index.html 2>/dev/null`

Ce travail n'a introduit aucun `<style>` ni `<script>` inline nouveau (le CSS du CTA vit dans `style.min.css`, déjà chargé en `<link>`, et le HTML du CTA ne contient aucun attribut `onclick`/`style` inline) — donc aucune mise à jour de hash CSP n'est requise. Confirmer que cette hypothèse tient en vérifiant qu'aucune balise `<style>` n'a été ajoutée par erreur : `grep -c "<style" v2/public/en/methode/mask.html` doit renvoyer le même compte qu'avant ce travail (0, puisque ces pages ne chargent que `style.min.css` en externe).

- [ ] **Step 6: Test manuel dans un navigateur (au moins 2 pages, mobile + desktop)**

Servir le site localement : `cd v2/public && python3 -m http.server 8000`, puis ouvrir `http://localhost:8000/en/methode/mask.html` et `http://localhost:8000/fr/methode/hybrid.html` dans un navigateur, réduire la fenêtre à 375px de large (ou utiliser les devtools en mode responsive). Vérifier : le titre `<h1>` est visible en haut de page, le CTA bleu apparaît juste après avec un bouton cliquable qui mène vers la page d'accueil de l'outil, le sommaire est une vraie liste à puces, le bloc de code du pipeline (si présent) s'affiche sans `<p>` visibles à l'intérieur, le sélecteur de langue en haut de page redirige vers la bonne page traduite au clic, et le second CTA apparaît avant le footer.

- [ ] **Step 7: Commit final si des ajustements ont été faits pendant la validation**

```bash
git -C v2/public add -A
git -C v2/public commit -m "fix: final adjustments after validation pass on methode pages"
cd /home/Baudouin/Documents/Projets/CrackDate
git add v2
git commit -m "fix: final adjustments after methode pages validation"
```
