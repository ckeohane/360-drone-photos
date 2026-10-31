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
| A7 | Pages reference real files | Every file `index.html` and `js/app.js` load exists, including the vendored libraries. |

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
