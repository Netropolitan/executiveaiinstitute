#!/usr/bin/env python3
"""Import a bykovbrett.net blog post into the EAII Insights collection.

Fetches the public HubSpot CMS post page, extracts title / description /
publish date / read time / body, converts the body to markdown and writes
src/content/blog/<slug>.md. Used both for the one-off backfill and by
sync_leadership_posts.py (the cross-post automation).

Usage:
    .venv/bin/python import_bbe_post.py <post-url> [--force]

Exit codes: 0 written, 3 already exists (without --force), 1 error.
"""
import json
import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify

SITE_ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = SITE_ROOT / "src" / "content" / "blog"
UA = {"User-Agent": "Mozilla/5.0 (EAII insights importer)"}


def clean_slug(url: str) -> str:
    slug = url.rstrip("/").split("/")[-1]
    return slug.strip("-")


def import_post(url: str, force: bool = False) -> Path | None:
    slug = clean_slug(url)
    out = BLOG_DIR / f"{slug}.md"
    if out.exists() and not force:
        print(f"exists: {out.name}")
        sys.exit(3)

    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    title = (soup.find("meta", property="og:title") or {}).get("content", "").strip()
    desc = (soup.find("meta", attrs={"name": "description"}) or {}).get("content", "").strip()

    pub = ""
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (ValueError, TypeError):
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("datePublished"):
                pub = item["datePublished"][:10]
                break
        if pub:
            break

    read_min = None
    m = re.search(r"(\d+)\s*min read", soup.get_text())
    if m:
        read_min = int(m.group(1))

    body = soup.find(id="hs_cos_wrapper_post_body")
    if body is None:
        raise RuntimeError(f"post body element not found at {url}")

    md = markdownify(str(body), heading_style="ATX", bullets="-")
    # tidy: collapse 3+ blank lines, strip leading/trailing whitespace
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    # markdownify escapes some punctuation we want verbatim
    md = md.replace(r"\.", ".").replace(r"\-", "-").replace(r"\+", "+")

    if not desc:
        # fall back to the first body paragraph, trimmed to ~160 chars
        text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", md)
        text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
        para = next((p.strip() for p in text.split("\n\n") if len(p.strip()) > 60 and not p.startswith("#")), "")
        desc = (para[:157] + "…") if len(para) > 160 else para

    fm_title = title.replace('"', '\\"')
    fm_desc = desc.replace('"', '\\"')
    front = (
        "---\n"
        f'title: "{fm_title}"\n'
        f'description: "{fm_desc}"\n'
        f"pubDate: {pub or '1970-01-01'}\n"
        "author: jamie\n"
        + (f"readMinutes: {read_min}\n" if read_min else "")
        + "---\n\n"
    )
    out.write_text(front + md + "\n")
    print(f"written: {out.name} ({pub}, {len(md)} chars)")
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(1)
    import_post(args[0], force="--force" in sys.argv)
