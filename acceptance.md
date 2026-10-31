# Acceptance targets: 360 Photo Viewer App

Status: accepted. Source: spec.md (accepted), "Acceptance checks" section.

A change is good to publish when every target below passes. Targets marked
"automated" run with `node test.mjs`. Targets marked "manual" are checked by
a person on a real phone.

## Automated (node test.mjs)

| # | Target | Pass when |
|---|--------|-----------|
| A1 | Photo list matches the files | Every photo in `photos.json` has a viewing copy and a thumbnail on disk, and no file in `site/photos/` is missing from the list. |
| A2 | Photo list is well formed | Every folder has a name, slug, cover and at least one photo. Slugs are unique and use only lowercase letters, digits and dashes. |
| A3 | Viewing copies are phone sized | No viewing copy is wider than 4096 pixels. 360 copies are exactly 2:1. |
| A4 | Files are small | Each viewing copy is under 5 MB and each thumbnail is under 150 KB. |
| A5 | Site stays small | The whole `site/` folder is under 100 MB. |
| A6 | Nothing too big in git | No tracked file is over 100 MB, and nothing from `Photos/` is tracked. |
| A7 | Pages reference real files | Every file `index.html` and `js/app.js` load exists, including files the vendored libraries load themselves. |
| A8 | Page routing works | A pretend browser runs `js/app.js`. Home lists every folder, each folder lists its photos, the viewer shows the photo name and a working back link, unknown folders and photos show an error, and the page listens for route changes. |
| B1 | Build never enlarges | Small photos keep their own size, both as viewing copy and thumbnail. |
| B2 | Build refuses clashing names | A photo whose name ends in "thumb" is rejected, because it would share a file with a thumbnail. |
| B3 | Build names unreadable files | A broken image stops the build with a message naming the file. |

B1 to B3 build into a throwaway copy and need macOS (they are skipped elsewhere).
A8 and B1 to B3 were added after the independent review in Stage 4.

## Manual (on a real phone, each release)

| # | Target | Pass when |
|---|--------|-----------|
| M1 | Pages work on a phone | Home, folder and viewer open and look right in portrait and landscape. |
| M2 | 360 photos move | A 360 photo can be dragged and pinch-zoomed in Safari. |
| M3 | Flat photos zoom | A flat photo opens and can be zoomed. (No flat photo exists yet; check when one is added.) |
| M4 | Adding a trip works | Copying a new folder into `Photos/` and running `node build.mjs` adds it to the site. |

## Out of scope for testing

Speed on slow mobile networks, other browsers than Safari and Chrome, and
accessibility audits. Revisit if the site is shared more widely.
