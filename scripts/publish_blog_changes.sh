#!/bin/bash
# Commit + push blog content changes made by the EAII portal editor.
# Triggered by eaii-blog-push.path whenever the blog dir changes; also safe to
# run by hand. Pushing main triggers the GitHub Pages deploy workflow.
set -euo pipefail
cd /home/kamino/eaii-site
sleep 5  # settle window so multi-file saves land in one commit
git add src/content/blog
if git diff --cached --quiet; then
  echo "no blog changes"
  exit 0
fi
git commit -m "content(insights): portal edit

Published from the EAII portal blog editor."
git push
echo "pushed $(git rev-parse --short HEAD)"
