#!/usr/bin/env python3
"""Import an executiveaiinstitute.com (Wix) blog post into Insights.

Extracts headline / description / datePublished / author from JSON-LD, the
body from the post-description container, converts to markdown and writes
src/content/blog/<slug>.md. Used for the one-off Wix backfill before the
Wix site is retired.

Usage:
    .venv/bin/python import_wix_post.py <post-url> [--force]
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

AUTHORS = {"jamie bykov-brett": "jamie", "jonscott turco": "jonscott"}


def norm_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", t.lower())


def existing_titles() -> dict:
    """normalised-title -> filename for every post already in the collection."""
    out = {}
    for f in BLOG_DIR.glob("*.md"):
        m = re.search(r'^title:\s*"(.*)"\s*$', f.read_text(), re.M)
        if m:
            out[norm_title(m.group(1).replace('\\"', '"'))] = f.name
    return out


def import_post(url: str, force: bool = False):
    slug = url.rstrip("/").split("/")[-1].strip("-")
    out = BLOG_DIR / f"{slug}.md"

    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    title, pub, author_name = "", "", ""
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "{}")
        except (ValueError, TypeError):
            continue
        if isinstance(data, dict) and data.get("@type") == "BlogPosting":
            title = data.get("headline", "")
            pub = (data.get("datePublished") or "")[:10]
            author_name = ((data.get("author") or {}).get("name") or "").strip()
            break
    if not title:
        title = (soup.find("meta", property="og:title") or {}).get("content", "").strip()

    # Skip when the article already exists under another slug (e.g. the
    # bykovbrett.net version, which wins) — matched on normalised title.
    dupe = existing_titles().get(norm_title(title))
    if dupe and dupe != out.name and not force:
        print(f"skip (already have as {dupe}): {title[:60]}")
        return "dupe"
    if out.exists() and not force:
        print(f"exists: {out.name}")
        return "exists"

    desc = (soup.find("meta", attrs={"name": "description"}) or {}).get("content", "").strip()
    author = AUTHORS.get(author_name.lower(), "jamie")

    body = soup.find(attrs={"data-hook": "post-description"})
    if body is None:
        raise RuntimeError(f"post body not found at {url}")

    md = markdownify(str(body), heading_style="ATX", bullets="-")
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    md = md.replace(r"\.", ".").replace(r"\-", "-").replace(r"\+", "+")
    # Wix serves blurred lazy-load thumbnails in the static HTML; stripping the
    # /v1/<transform> suffix yields the full-resolution original.
    md = re.sub(r"(https://static\.wixstatic\.com/media/[^/\s)]+)/v1/[^\s)]*", r"\1", md)

    read_min = None
    m = re.search(r"\b(\d{1,2})\s*min read\b", soup.get_text())
    if m:
        read_min = int(m.group(1))

    if not desc:
        text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", md)
        text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
        para = next((p.strip() for p in text.split("\n\n") if len(p.strip()) > 60 and not p.startswith("#")), "")
        desc = (para[:157] + "…") if len(para) > 160 else para

    front = (
        "---\n"
        f'title: "{title.replace(chr(34), chr(92) + chr(34))}"\n'
        f'description: "{desc.replace(chr(34), chr(92) + chr(34))}"\n'
        f"pubDate: {pub or '1970-01-01'}\n"
        f"author: {author}\n"
        + (f"readMinutes: {read_min}\n" if read_min else "")
        + "---\n\n"
    )
    out.write_text(front + md + "\n")
    print(f"written: {out.name} ({pub}, {author}, {len(md)} chars)")
    return "written"


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(1)
    import_post(args[0], force="--force" in sys.argv)
