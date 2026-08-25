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
