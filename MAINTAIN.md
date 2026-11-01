# Keeping the site healthy: 360 Photo Viewer App

Status: accepted.

The site is live, so it needs a little upkeep. Every change still goes through
the checklist in `REVIEW.md` before it is pushed.

## Library updates (a couple of times a year)

The viewer libraries are copied into `vendor/` and never update themselves:
Photo Sphere Viewer 5.15.1 and three 0.185.1 (see `vendor/README.txt`).

1. Look up the latest Photo Sphere Viewer release and any security notes.
2. Ask Claude to copy in the new files, update `vendor/README.txt` and the
   import map in `index.html`.
3. Run `node test.mjs`, then open a 360 photo on the phone and check it drags
   and zooms (M2).
4. Push using `REVIEW.md`.

If the new version breaks something, go back to the previous commit.

## GitHub token

Tokens last 30 days. After each push session:

- Delete the token on GitHub (Settings, Developer settings, Personal access
  tokens) if you are not going to push again soon.
- To push again, make a new fine-grained token for the `360-drone-photos`
  repo only, with Contents read and write and nothing else.
- Never paste a token into chat or a file.

## Open findings

Known gaps, in the order worth fixing:

- Phone checks M1 to M4 are not done yet (`acceptance.md`).
- The flat-photo viewer has never been tried on a real flat photo. Check it
  (M3) the first time one is added.
- Photos that rely on EXIF rotation may show sideways.
- The "nothing from Photos/ is tracked" test only matches that exact
  capitalisation.
- The build decides whether a copy is out of date from file times alone, so
  changing the size settings does not rebuild old photos. Delete
  `site/photos/` and run `node build.mjs` to rebuild everything.

Remove a line when it is fixed. Add a line when something new turns up.

## Feedback to intent

Use the site for a few trips, then write down what you wanted that
`intent.md` did not cover. Ideas already mentioned: photo titles, flat photos,
sharing a single photo link. Anything written here is the start of the next
round: update `intent.md`, then go through the stages again.
