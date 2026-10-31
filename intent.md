# Intent: 360 Photo Viewer App

Author: Chris. Status: accepted.

## Problem

- I have an Insta360 X5 and a DJI drone that I use to take 360 photos.
- The Apple Photos app does not support viewing 360 photos, so I have no
  easy way to show them to other people.
- My photos are stored in a folder on my desktop, organized into folders by
  location or trip.

## Proposed outcome

A responsive web app for showing my 360 photos.

- The home page shows a list of the folders with thumbnails.
- Clicking a folder shows a list of its images.
- Tapping an image shows it full screen, so the viewer can pan and zoom the
  photo.
- The app follows the Material design system.
- If a photo is not 360, it is shown as an ordinary flat photo.

## Affected users and systems

- Me: adding new trips and showing the photos.
- Viewers: friends and other people I share the link with.
- Devices: phones and tablets first, since that is where I will show it.
- Source photos: a `Photos` folder with one subfolder per location or trip.
  Today: 3 folders, 22 photos, about 311 MB. Most are 7680x3840, the largest
  are 11968x5984.
- GitHub Pages as the host.

## Constraints

- Free hosting on GitHub Pages. Limits to respect: each file under 100 MB,
  site under about 1 GB.
- The site and its photos are public, because a free GitHub account has no
  private Pages.
- The photos were sized for a Meta Quest headset and are too large for phones
  and tablets. They must be resized, with smaller copies for viewing and
  separate thumbnails.
- Adding a trip must be simple: drop a folder of photos in and push. A script
  makes the smaller copies and thumbnails, and nothing needs to be listed by
  hand.
- Works well on a phone.

## Out of scope for now

- Adding or editing photo titles in the app. It was in my first draft, but
  I decided it is not important for now. Revisit later.
- Selling or downloading the photos.
- Comments, accounts, or other people's uploads.
- Support for headsets or VR mode.

## Open questions

- What size should the smaller copies be for phone and tablet, and does a
  tablet need a larger copy than a phone? To be tested in design (Stage 2).
- Which viewer approach handles 360 pan and zoom best on phones? To be tested
  in design (Stage 2).
