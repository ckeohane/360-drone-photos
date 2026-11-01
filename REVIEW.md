# Review checklist: 360 Photo Viewer App

Status: accepted. This is the gate between a change and the live site.

Anything pushed to `main` goes live on GitHub Pages within about a minute, and
the repository is public. Git history keeps everything, so a photo that is
pushed and then deleted is still readable. Check before pushing, not after.

The person who owns the site (Chris) opens this gate. Claude can prepare a
change and run these checks, but does not push without being asked.

## Before every push

1. **Tests pass.** `node test.mjs` reports every check passing.
2. **Photos reviewed.** For any new or changed photo, look at it on screen.
   Look for faces, people, house numbers, number plates and places you do not
   want public. If unsure, leave the photo out.
3. **Only site files staged.** `git status` shows nothing from `Photos/` (the
   originals), and no tokens, keys or personal files.

## After every push

4. **Look at it live.** Open https://ckeohane.github.io/360-drone-photos/
   (allow a minute), confirm a new trip appears, and open one photo.

## If a bad photo goes live

Removing it in a new commit is not enough, because history still has it.
Remove it from history (the same way it was done once in Stage 3), force push,
and tell Claude so the steps can be done carefully.

## Pushing

Pushing needs a GitHub token, which only Chris handles. Claude never sees it.
Chris runs `git push` in their own terminal.
