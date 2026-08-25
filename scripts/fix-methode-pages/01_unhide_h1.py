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

    # Find the FIRST <h1 tag in the document (regardless of style)
    match = re.search(r'<h1(?:\s+[^>]*)?>.*?</h1>', html, re.DOTALL)
    if not match:
        return False

    first_h1_start = match.start()
    # Extract just the opening tag of the first h1 (handles both <h1> and <h1 ...>)
    opening_tag_match = re.search(r'<h1(?:\s+[^>]*)?>',html[first_h1_start:])
    if not opening_tag_match:
        return False

    opening_tag_full = opening_tag_match.group(0)

    # Check if this first h1's opening tag contains style="display:none"
    if 'style="display:none"' not in opening_tag_full:
        return False

    # Replace style="display:none" in ONLY the first h1 tag
    # Remove the style attribute cleanly, leaving a simple <h1>
    modified_tag = '<h1>'

    # Replace in the original html at the first h1 position only
    html_modified = html[:first_h1_start] + html[first_h1_start:].replace(opening_tag_full, modified_tag, 1)

    path.write_text(html_modified, encoding="utf-8")
    return True


def would_change_first_h1(path: Path) -> bool:
    """Check if the first h1 in the file has style="display:none"."""
    html = path.read_text(encoding="utf-8")

    # Find the FIRST <h1 tag in the document (handles both <h1> and <h1 ...>)
    match = re.search(r'<h1(?:\s+[^>]*)?>.*?</h1>', html, re.DOTALL)
    if not match:
        return False

    first_h1_start = match.start()
    # Extract just the opening tag of the first h1
    opening_tag_match = re.search(r'<h1(?:\s+[^>]*)?>',html[first_h1_start:])
    if not opening_tag_match:
        return False

    opening_tag_full = opening_tag_match.group(0)

    # Check if this first h1's opening tag contains style="display:none"
    return 'style="display:none"' in opening_tag_full


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="v2/public")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root)

    changed = []
    for path in target_files(root):
        if args.dry_run:
            if would_change_first_h1(path):
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
