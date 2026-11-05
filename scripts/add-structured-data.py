#!/usr/bin/env python3
"""Add schema.org JSON-LD to the static pages of Time2Crack.

Reads each page (canonical URL, language, h1, meta description, FAQ list)
and writes one <script type="application/ld+json" id="ld-page"> block just
before </head>. Running it again replaces the block, so it is safe to rerun
after editing a page.

Usage: python3 scripts/add-structured-data.py [--root .] [--check]
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup

SITE = "https://time2crack.eu/"
LANGS = ["en", "fr", "es", "pt", "de", "it", "tr", "pl", "nl"]
AUTHOR_ID = SITE + "#author"
WEBSITE_ID = SITE + "#website"
REPO = "https://github.com/scriptor-pro/time2crack"

AUTHOR = {
    "@type": "Person",
    "@id": AUTHOR_ID,
    "name": "Baudouin Van Humbeeck",
    "url": SITE + "en/about.html",
    "sameAs": [
        "https://www.linkedin.com/in/baudouinvanhumbeeck/",
        "https://mastodon.social/@baudouinvh",
        "https://bsky.app/profile/bvh.fyi",
        "https://github.com/scriptor-pro",
    ],
}

WEBSITE = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    "name": "Time2Crack",
    "url": SITE,
    "inLanguage": LANGS,
    "publisher": {"@id": AUTHOR_ID},
}

# Pages that get structured data, relative to a language folder (or the root).
ARTICLE_PAGES = ["how-time2crack-works.html", "hibp.html"]
BLOCK_RE = re.compile(r'\s*<script type="application/ld\+json" id="ld-page">.*?</script>', re.S)


def text(node):
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip() if node else ""


def git_date(path):
    out = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", str(path)],
        capture_output=True, text=True, cwd=path.parent,
    ).stdout.strip()
    return out or None


class Page:
    def __init__(self, path):
        self.path = path
        self.html = path.read_text(encoding="utf-8")
        soup = BeautifulSoup(self.html, "lxml")
        self.soup = soup
        canon = soup.find("link", rel="canonical")
        self.url = canon["href"] if canon else None
        self.lang = soup.html.get("lang", "en") if soup.html else "en"
        desc = soup.find("meta", attrs={"name": "description"})
        self.description = desc["content"].strip() if desc and desc.get("content") else None
        self.h1 = text(soup.find("h1"))
        title = text(soup.find("title"))
        self.short_title = title.split(" — ")[0].strip() if title else self.h1

    @property
    def name(self):
        return self.h1 or self.short_title


def home_url(lang_dir):
    page = Page(lang_dir / "index.html")
    return page.url or SITE


def breadcrumb(items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": name, "item": url}
            for i, (name, url) in enumerate(items, 1)
        ],
    }


def base_page(page, type_):
    node = {"@type": type_, "@id": page.url + "#webpage", "url": page.url,
            "name": page.name, "inLanguage": page.lang, "isPartOf": {"@id": WEBSITE_ID}}
    if page.description:
        node["description"] = page.description
    return node


def build(page, rel, lang_dir):
    """Return the list of nodes for a page, or None if the page is skipped."""
    home = ("Time2Crack", home_url(lang_dir))
    trail = [home]
    if rel.startswith("methode/"):
        idx = lang_dir / "methode" / "index.html"
        if idx.exists() and rel != "methode/index.html":
            ip = Page(idx)
            trail.append((ip.name, ip.url))
    trail.append((page.name, page.url))

    if rel == "index.html":
        app = {
            "@type": "WebApplication",
            "@id": page.url + "#app",
            "name": "Time2Crack",
            "url": page.url,
            "inLanguage": page.lang,
            "applicationCategory": "SecurityApplication",
            "operatingSystem": "Any",
            "browserRequirements": "Requires JavaScript",
            "isAccessibleForFree": True,
            "license": "https://www.gnu.org/licenses/gpl-3.0.html",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
            "author": {"@id": AUTHOR_ID},
            "publisher": {"@id": AUTHOR_ID},
            "isPartOf": {"@id": WEBSITE_ID},
            "sameAs": [REPO],
        }
        if page.description:
            app["description"] = page.description
        return [WEBSITE, AUTHOR, app]

    if rel == "faq.html":
        qa = []
        for dt in page.soup.select("dl.faq-list > dt"):
            dd = dt.find_next_sibling("dd")
            if dd:
                qa.append({"@type": "Question", "name": text(dt),
                           "acceptedAnswer": {"@type": "Answer", "text": text(dd)}})
        if not qa:
            return None
        node = base_page(page, "FAQPage")
        node["mainEntity"] = qa
        return [WEBSITE, AUTHOR, node, breadcrumb(trail)]

    if rel == "about.html":
        node = base_page(page, "AboutPage")
        node["mainEntity"] = {"@id": AUTHOR_ID}
        return [WEBSITE, AUTHOR, node, breadcrumb(trail)]

    if rel in ("sources.html", "methode/index.html"):
        return [WEBSITE, AUTHOR, base_page(page, "CollectionPage"), breadcrumb(trail)]

    if rel in ARTICLE_PAGES or rel.startswith("methode/"):
        art = {
            "@type": "TechArticle",
            "@id": page.url + "#article",
            "headline": page.name[:110],
            "url": page.url,
            "mainEntityOfPage": page.url,
            "inLanguage": page.lang,
            "author": {"@id": AUTHOR_ID},
            "publisher": {"@id": AUTHOR_ID},
            "isPartOf": {"@id": WEBSITE_ID},
        }
        if page.description:
            art["description"] = page.description
        modified = git_date(page.path)
        if modified:
            art["dateModified"] = modified
        return [WEBSITE, AUTHOR, art, breadcrumb(trail)]

    return None


def render(nodes):
    data = {"@context": "https://schema.org", "@graph": nodes}
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/")  # never close the <script> early
    return f'<script type="application/ld+json" id="ld-page">{payload}</script>'


def targets(root):
    for lang in [""] + LANGS:
        lang_dir = root / lang if lang else root
        if not (lang_dir / "index.html").exists():
            continue
        rels = ["index.html", "faq.html", "about.html", "sources.html", *ARTICLE_PAGES]
        rels += sorted(f"methode/{p.name}" for p in (lang_dir / "methode").glob("*.html"))
        for rel in rels:
            path = lang_dir / rel
            if path.exists():
                # Root pages are English copies; their breadcrumbs use the en/ pages.
                yield path, rel, (root / "en" if not lang else lang_dir)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--check", action="store_true", help="report pages that would change, write nothing")
    args = ap.parse_args()
    root = Path(args.root).resolve()

    changed, skipped = [], []
    for path, rel, lang_dir in targets(root):
        page = Page(path)
        if not page.url:
            skipped.append(f"{path.relative_to(root)} (no canonical)")
            continue
        nodes = build(page, rel, lang_dir)
        if nodes is None:
            skipped.append(f"{path.relative_to(root)} (nothing to describe)")
            continue
        html = BLOCK_RE.sub("", page.html)
        if "</head>" not in html:
            skipped.append(f"{path.relative_to(root)} (no </head>)")
            continue
        html = html.replace("</head>", render(nodes) + "\n</head>", 1)
        if html != page.html:
            changed.append(str(path.relative_to(root)))
            if not args.check:
                path.write_text(html, encoding="utf-8")

    print(f"{'Would update' if args.check else 'Updated'} {len(changed)} pages")
    for s in skipped:
        print("  skipped:", s)
    return 1 if args.check and changed else 0


if __name__ == "__main__":
    sys.exit(main())
