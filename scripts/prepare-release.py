#!/usr/bin/env python3
"""Applique les correctifs de publication sur une copie de travail avant déploiement.

Corrige ce que main ne porte pas encore par rapport à ce qui est réellement
publié sur time2crack.eu (branche codex-site-publish, servie par GitHub Pages) :

- domaine canonique : time2crack.com -> time2crack.eu (canonical, hreflang,
  og:image, og:url, twitter:image, liens absolus en dur dans le JS)

Idempotent : ré-exécuter sur une arborescence déjà corrigée ne change rien.
"""
import argparse
import sys
from pathlib import Path

OLD_DOMAIN = "time2crack.com"
NEW_DOMAIN = "time2crack.eu"

EXTENSIONS = {".html", ".js"}
SKIP_DIRS = {".git", "node_modules", ".venv", "scripts", "docs"}


def iter_target_files(root: Path):
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        if path.suffix in EXTENSIONS:
            yield path


def fix_file(path: Path, dry_run: bool) -> int:
    text = path.read_text(encoding="utf-8")
    count = text.count(OLD_DOMAIN)
    if count and not dry_run:
        path.write_text(text.replace(OLD_DOMAIN, NEW_DOMAIN), encoding="utf-8")
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Racine du site à corriger")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    total = 0
    files_changed = 0
    for path in iter_target_files(root):
        count = fix_file(path, args.dry_run)
        if count:
            files_changed += 1
            total += count
            rel = path.relative_to(root)
            action = "would fix" if args.dry_run else "fixed"
            print(f"{action}: {rel} ({count} occurrence{'s' if count > 1 else ''})")

    print(f"\n{'Would replace' if args.dry_run else 'Replaced'} {total} occurrence(s) of {OLD_DOMAIN!r} across {files_changed} file(s)")

    if total == 0:
        print("Nothing to fix — tree is already clean or root is wrong", file=sys.stderr)


if __name__ == "__main__":
    main()
