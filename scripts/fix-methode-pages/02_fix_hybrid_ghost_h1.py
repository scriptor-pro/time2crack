#!/usr/bin/env python3
"""Neutralises les <h1> fantômes injectés dans le corps de hybrid.html (9 langues)."""
import argparse
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup

LANGS = ["en", "fr", "es", "pt", "de", "it", "pl", "nl", "tr"]


def fix_file(path: Path, dry_run: bool) -> int:
    """Fix ghost h1 tags in hybrid.html using regex replacement to preserve formatting."""
    html = path.read_text(encoding="utf-8")

    # Use BeautifulSoup to find h1 tags
    soup = BeautifulSoup(html, "html.parser")
    h1_tags = soup.find_all("h1")

    if len(h1_tags) <= 1:
        return 0

    # Get the text of ghost h1s (after the first)
    ghost_texts = []
    for ghost in h1_tags[1:]:
        ghost_texts.append(ghost.get_text())

    # Apply replacements using regex on the original HTML string
    # This preserves formatting and only modifies the specific lines
    modified_html = html
    ghost_count = 0

    for ghost_text in ghost_texts:
        # Pattern: <h1 style="display:none">EXACT_TEXT</h1>
        # Replace with plain text (no <code> wrapper — the parent <pre><code> provides context)
        pattern = rf'<h1 style="display:none">{re.escape(ghost_text)}</h1>'
        replacement = ghost_text  # Plain text, no wrapper
        new_html = re.sub(pattern, replacement, modified_html, count=1)

        if new_html != modified_html:
            modified_html = new_html
            ghost_count += 1

    if not dry_run and ghost_count > 0:
        path.write_text(modified_html, encoding="utf-8")

    return ghost_count


def main():
    parser = argparse.ArgumentParser(
        description="Fix ghost h1 tags in hybrid.html"
    )
    parser.add_argument("--root", default="v2/public", help="Root directory (default: v2/public)")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    args = parser.parse_args()
    root = Path(args.root)

    total = 0
    for lang in LANGS:
        path = root / lang / "methode" / "hybrid.html"
        if not path.exists():
            print(f"WARNING: missing {path}", file=sys.stderr)
            continue
        count = fix_file(path, args.dry_run)
        action = "found" if args.dry_run else "fixed"
        print(f"{path}: {count} ghost h1 {action}")
        total += count

    print(f"\nTotal: {total} ghost h1 across {len(LANGS)} files")
    if not args.dry_run and total != 18:
        print(
            f"WARNING: expected 18 (2 per file x 9 langs), got {total}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
