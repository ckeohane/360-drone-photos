# Spec: 360 Photo Viewer App

Status: accepted. Source: intent.md (accepted).

## Summary

A static website, hosted on GitHub Pages, that shows my 360 photos. A local
script turns my original photos into small web copies and a photo list. The
site reads that list and shows folders, photo lists, and a full-screen
pan-and-zoom viewer.

## Decisions made in design

- Viewer: Photo Sphere Viewer, copied into the repo (no build step).
- Image size: one viewing size, 4096x2048, JPEG. Plus a thumbnail per photo.
- Styling: plain CSS following Material 3 (top app bar, cards, colour and
  type tokens, touch ripples). No UI library.
- Hosting: GitHub Pages, public.

## Requirements

### Pages

1. **Home.** A top app bar with the app name and a grid of folder cards.
   Each card shows a cover thumbnail, the folder name, and the photo count.
2. **Folder.** A top app bar with a back button and the folder name, and a
   grid of photo cards with thumbnails.
3. **Viewer.** The photo fills the screen. The viewer can drag to look
   around, pinch or scroll to zoom, and has a back button. A flat photo
   shows in the same screen as an ordinary zoomable image.

### Behaviour

- Pages are reached by URL, so the browser back button works and a link to a
  folder or a photo can be shared.
- Works on phones and tablets first, and on a desktop browser.
- Light and dark theme follow the device setting.
- A photo that is not 360 (aspect ratio not 2:1) shows as a flat photo.
- Photo names shown to the viewer come from the filename without extension.
  Folder names come from the folder name with extra spaces trimmed.

### Adding a trip

1. Copy a folder of originals into `Photos/`.
2. Run one command, `node build.mjs`. It makes the 4096x2048 copies and
   thumbnails and rewrites the photo list.
3. Commit and push. The site updates.

The script only processes photos that are new or changed. Original photos
stay on my computer and are not committed.

## Design

### Files

- `index.html`, `css/`, `js/` for the app.
- `vendor/photo-sphere-viewer/` for the viewer library.
- `build.mjs` for the resize script, using Node and the built-in macOS `sips`
  tool. No other installs.
- `site/photos/<folder>/<name>.jpg` and `<name>-thumb.jpg` for the web copies.
- `photos.json` for the generated list of folders and photos, including
  whether each photo is 360 or flat.
- `Photos/` for the originals, listed in `.gitignore`.

### Sizes

- Viewing copy: 4096x2048, JPEG quality about 80. Expected about 1 to 2 MB
  each, so about 30 to 50 MB for the current 22 photos.
- Thumbnail: about 480 pixels wide.
- Flat photos are resized so the longest side is 4096 pixels.

## Out of scope

Same as intent.md: titles, downloads, accounts, uploads, VR mode.

## Defaults I chose, please check

- Folder cover is the first photo in the folder, sorted by filename.
- Photos are sorted by filename; folders by name.
- Names are shown as the filename, because titles are out of scope.
- The site uses hash links (for example `#/folder/photo`), because GitHub
  Pages cannot serve other URL paths without extra setup.
- `sips` is for macOS only, so the build script runs on this Mac only.

## Risks and open questions

- **Public photos.** Anyone with the link can see the photos, and the
  GitHub repository shows them too. Accepted in the intent.
- **Soft zoom.** At 4096 pixels wide, photos look softer when zoomed in all
  the way on a tablet. Accepted trade-off.
- **Photo Sphere Viewer on iPhone Safari.** Needs a real test on a phone
  before Build is finished.
- **Folder name with a trailing space** (`Lomnický Štít `). The script
  should rename it in the web copy path to avoid a broken URL.

## Acceptance checks

- Home, folder, and viewer pages work on a phone-size screen and on a
  desktop.
- A 360 photo can be dragged and zoomed. A flat photo can be zoomed.
- Dropping in a new folder and running the command adds it to the site.
- The whole site stays under 100 MB.
- No file in the repository is over 100 MB.
