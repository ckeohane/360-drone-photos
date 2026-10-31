# Build plan: 360 Photo Viewer App

Status: accepted. Source: spec.md (accepted).

Each step ends with a check and a commit. I stop after each step so you can
look at it before the next one starts.

## Steps

1. **Repo setup.**
   Add `.gitignore` (ignores `Photos/` and `.DS_Store`) and a short
   `README.md` explaining how to add a trip.
   Check: `git status` no longer lists `Photos/` or `.DS_Store`.

2. **Build script.**
   `build.mjs` reads `Photos/`, makes the 4096x2048 copy and the 480 px
   thumbnail of each photo with `sips`, trims folder names, skips photos that
   are already done, flags non-2:1 photos as flat, and writes `photos.json`.
   Check: run it on the real photos. Open a few outputs. Total size is under
   100 MB.
   Commit: the script, `photos.json`, and the web copies.

3. **App shell and routing.**
   `index.html`, `css/`, `js/`: top app bar, hash routes for home, folder, and
   viewer, and the light and dark theme tokens. Pages are empty placeholders.
   Check: open locally, move between routes, back button works.

4. **Home and folder pages.**
   Folder cards with cover thumbnails and counts, and photo cards with
   thumbnails, all in Material 3 styling.
   Check: looks right at phone width and desktop width.

5. **Viewer.**
   Copy Photo Sphere Viewer into `vendor/` (pinned version, needs a network
   download). A 360 photo drags and zooms. A flat photo shows with zoom.
   Check: view one 360 and one flat photo, in the browser.

6. **Polish and phone test.**
   Loading and error states, touch ripples, and large tap targets.
   Check: open on your phone through your Mac's local address. Drag and
   pinch a 360 photo in Safari.

7. **Publish.**
   Create the GitHub repository, push, and turn on GitHub Pages.
   Check: the public link works on your phone.
   Needs you: your GitHub account and your OK to create the public repo.

## Risks

- Photo Sphere Viewer on iPhone Safari: tested at step 6.
- `sips` JPEG quality control is limited. If the files come out too big,
  step 2 gets a quality setting adjustment.
- Step 7 makes the photos public. I will ask before doing it.
