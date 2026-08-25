#!/usr/bin/env python3
"""Réaffiche le <h1> masqué sur les pages /methode/*.html (sauf hybrid.html)."""
import argparse
import re
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

    # Surgical text-based replacement: use regex to remove style="display:none" with proper spacing cleanup
    # Find and replace the first <h1...style="display:none"...> pattern
    # This regex handles: <h1 style="display:none"> or <h1 style="display:none">
    pattern = r'<h1\s+style="display:none"\s*>'
    replacement = '<h1>'

    if re.search(pattern, html):
        html = re.sub(pattern, replacement, html, count=1)
        path.write_text(html, encoding="utf-8")
        return True

    return False


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
