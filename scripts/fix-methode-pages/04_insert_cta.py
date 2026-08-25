#!/usr/bin/env python3
"""Insère les CTA haut/bas de page vers le testeur de mot de passe sur les pages methode.

IMPORTANT — pourquoi ce script n'appelle jamais `path.write_text(str(soup), ...)` :
BeautifulSoup est utilisé UNIQUEMENT pour (a) localiser le bon `<h1>` (celui a
l'interieur de `<main class="methode-page">`, pas celui du logo dans le
header) et (b) generer le HTML des deux blocs CTA a inserer. L'ecriture du
fichier se fait par manipulation de la chaine brute d'origine (recherche du
fragment exact du `<h1>` et de `</main>`, insertion textuelle), jamais via une
resérialisation complete du document (`str(soup)`).

Un premier essai utilisant `str(soup)` pour reecrire tout le fichier a
demontre le probleme : html.parser de bs4 reformate l'intégralité du
document a la resérialisation (attributs retries par ordre alphabetique,
indentation/retours a la ligne d'origine perdus, `&` transformes en `&amp;`
dans les URLs de <link>, balises auto-fermantes ajoutees comme `<link .../>`,
etc.). Le diff sur un seul fichier montrait ~200 lignes changees pour
l'ajout de 2 blocs CTA. L'approche par insertion textuelle ciblee laisse le
reste du document strictement intact.
"""
import argparse
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]
METHODS = ["bruteforce", "dictionary", "hybrid", "markov", "mask", "pcfg", "combinator"]


def build_cta_html(lang: str, translations: dict) -> str:
    """Construit le HTML d'un bloc CTA via BeautifulSoup (génération pure,
    aucun lien avec le document source — donc aucun risque de reformatage)."""
    t = translations[lang]
    soup = BeautifulSoup("", "html.parser")
    div = soup.new_tag("div", **{"class": "methode-cta"})
    p = soup.new_tag("p", **{"class": "methode-cta__text"})
    p.string = t["text"]
    a = soup.new_tag("a", href=f"/{lang}/index.html", **{"class": "methode-cta__button"})
    a.string = t["button"]
    div.append(p)
    div.append(a)
    return str(div)


def insert_ctas(path: Path, lang: str, translations: dict) -> bool:
    html = path.read_text(encoding="utf-8")

    if "methode-cta" in html:
        return False  # déjà inséré, idempotence

    # Localisation en lecture seule via bs4 (le résultat de ce parsing n'est
    # jamais réécrit sur disque — on récupère juste le fragment texte exact
    # du <h1> pour le retrouver ensuite dans la chaîne brute d'origine).
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find("main", class_="methode-page")
    if main is None:
        return False
    # NOTE: chaque page methode contient DEUX <h1> : celui du logo dans le
    # header (hors de <main>) et celui du titre de la methode (dans <main>).
    # soup.find("h1") prendrait le premier (le logo) -> mauvais emplacement.
    # On cherche donc le <h1> a l'interieur de <main class="methode-page">.
    h1 = main.find("h1")
    if h1 is None:
        return False

    h1_fragment = str(h1)
    if html.count(h1_fragment) != 1:
        # Sécurité : si le fragment n'est pas identifiable de façon unique
        # dans le texte brut, on refuse d'insérer plutôt que de risquer une
        # insertion au mauvais endroit.
        print(f"SKIP (h1 fragment not uniquely found): {path}", file=sys.stderr)
        return False

    if html.count("</main>") != 1:
        print(f"SKIP (</main> not unique): {path}", file=sys.stderr)
        return False

    cta_html = build_cta_html(lang, translations)

    # Insertion 1 : juste après le <h1> de méthode.
    new_html = html.replace(h1_fragment, h1_fragment + "\n" + cta_html, 1)

    # Insertion 2 : juste avant </main>.
    new_html = new_html.replace("</main>", cta_html + "\n</main>", 1)

    path.write_text(new_html, encoding="utf-8")
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
