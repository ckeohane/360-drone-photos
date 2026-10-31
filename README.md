# 360 Photo Viewer App

A static website for showing 360 photos. See `intent.md`, `spec.md`, and
`plan.md` for what it is and how it is built.

## Add a trip

1. Copy a folder of original photos into `Photos/`. The folder name becomes
   the trip name.
2. Run `node build.mjs` (macOS only). It makes the web copies and rewrites
   `photos.json`.
3. Commit and push. The site updates.

The originals in `Photos/` stay on this computer and are not committed.

## Check the site

`node test.mjs` runs the automated checks listed in `acceptance.md`.
