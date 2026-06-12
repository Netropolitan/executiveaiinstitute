#!/usr/bin/env python3
"""Cross-post bykovbrett.net leadership-tagged articles to the EAII site.

Polls the leadership tag RSS feed; any post without a matching file in
src/content/blog/ is imported (via import_bbe_post.py), committed, and pushed
when a git remote exists (GitHub Pages then redeploys the site automatically).
The LinkedIn announcement is Brew a Brew automation, fed by the same RSS feed.

Run by the eaii-sync-leadership systemd timer (hourly).
"""
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import requests

SCRIPTS = Path(__file__).resolve().parent
SITE = SCRIPTS.parent
BLOG = SITE / "src" / "content" / "blog"
FEED = "https://bykovbrett.net/blog/tag/leadership/rss.xml"
PY = SCRIPTS / ".venv" / "bin" / "python"


def main() -> int:
    feed = requests.get(FEED, timeout=30, headers={"User-Agent": "EAII sync"})
    feed.raise_for_status()
    links = [
        el.text.strip()
        for el in ET.fromstring(feed.content).iter("link")
        if el.text and "/blog/" in el.text and "/tag/" not in el.text
    ]

    imported = []
    for url in links:
        slug = url.rstrip("/").split("/")[-1].strip("-")
        if (BLOG / f"{slug}.md").exists():
            continue
        r = subprocess.run([str(PY), str(SCRIPTS / "import_bbe_post.py"), url], cwd=SITE)
        if r.returncode == 0:
            imported.append(slug)

    if not imported:
        print("nothing new")
        return 0

    subprocess.run(["git", "add", "src/content/blog"], cwd=SITE, check=True)
    msg = "content(insights): cross-post from bykovbrett.net leadership tag\n\n" + "\n".join(
        f"- {s}" for s in imported
    )
    subprocess.run(["git", "commit", "-m", msg], cwd=SITE, check=True)

    # Push only when a remote is configured (set up at GitHub publish time)
    remotes = subprocess.run(["git", "remote"], cwd=SITE, capture_output=True, text=True).stdout.strip()
    if remotes:
        subprocess.run(["git", "push"], cwd=SITE, check=True)
        print(f"imported + pushed: {', '.join(imported)}")
    else:
        print(f"imported + committed (no remote yet): {', '.join(imported)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
