#!/bin/sh
# Copies only the site files into deploy/, then uploads that folder to
# Cloudflare Pages. Run `node build.mjs` first if you added photos.
# Usage: ./deploy.sh <cloudflare-pages-project-name>
set -e
cd "$(dirname "$0")"

rm -rf deploy
mkdir deploy
cp -R index.html photos.json css js vendor site deploy/
find deploy -name .DS_Store -delete

echo "deploy/ holds $(find deploy -type f | wc -l | tr -d ' ') files, $(du -sh deploy | cut -f1)"

if [ -n "$1" ]; then
  npx wrangler pages deploy deploy --project-name "$1" --branch main
fi
