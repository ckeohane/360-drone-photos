// App shell: loads photos.json and shows a page for the current hash route.
//   #/                       home (folders)
//   #/<folder>               folder (photos)
//   #/<folder>/<photo>       viewer
const APP_NAME = '360 Photos';

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('title');
const backEl = document.getElementById('back');

let library = null;

async function loadLibrary() {
  const response = await fetch('photos.json');
  if (!response.ok) throw new Error(`photos.json: ${response.status}`);
  return response.json();
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { folder: parts[0], photo: parts[1] };
}

function setBar(title, backHref) {
  titleEl.textContent = title;
  document.title = title === APP_NAME ? title : `${title} · ${APP_NAME}`;
  backEl.hidden = !backHref;
  if (backHref) backEl.href = backHref;
}

function showMessage(text, isError = false) {
  const p = document.createElement('p');
  p.className = isError ? 'message message--error' : 'message';
  p.textContent = text;
  viewEl.replaceChildren(p);
}

function makeCard({ href, thumb, title, subtitle }) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = href;

  const img = document.createElement('img');
  img.className = 'card__media';
  img.src = thumb;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';

  const text = document.createElement('div');
  text.className = 'card__text';
  const heading = document.createElement('div');
  heading.className = 'card__title';
  heading.textContent = title;
  text.append(heading);
  if (subtitle) {
    const sub = document.createElement('div');
    sub.className = 'card__subtitle';
    sub.textContent = subtitle;
    text.append(sub);
  }

  card.append(img, text);
  return card;
}

function showGrid(cards) {
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.append(...cards);
  viewEl.replaceChildren(grid);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function showHome() {
  setBar(APP_NAME, null);
  if (library.folders.length === 0) return showMessage('No photos yet.');
  showGrid(
    library.folders.map((folder) =>
      makeCard({
        href: `#/${encodeURIComponent(folder.slug)}`,
        thumb: folder.cover,
        title: folder.name,
        subtitle: plural(folder.photos.length, 'photo'),
      }),
    ),
  );
}

function showFolder(folder) {
  setBar(folder.name, '#/');
  showGrid(
    folder.photos.map((photo) =>
      makeCard({
        href: `#/${encodeURIComponent(folder.slug)}/${encodeURIComponent(photo.slug)}`,
        thumb: photo.thumb,
        title: photo.name,
        subtitle: photo.type === 'flat' ? 'Flat photo' : null,
      }),
    ),
  );
}

// Material ripple: a circle grows from the touch point on any card.
document.addEventListener('pointerdown', (event) => {
  const card = event.target.closest('.card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const size = Math.hypot(rect.width, rect.height) * 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  card.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

let closeViewer = null;

async function showViewer(folder, photo) {
  setBar(photo.name, `#/${encodeURIComponent(folder.slug)}`);
  const stage = document.createElement('div');
  stage.className = 'viewer';
  viewEl.replaceChildren(stage);
  document.body.classList.add('is-viewer');

  const myRoute = location.hash;
  const fail = () => {
    if (location.hash === myRoute) showMessage('This photo could not be loaded.', true);
  };
  try {
    const viewers = await import('./viewer.js');
    const close = photo.type === 'flat'
      ? viewers.showFlat(stage, photo.file, fail)
      : await viewers.showPanorama(stage, photo.file, fail);
    // The route may have changed while the viewer was loading.
    if (location.hash === myRoute) closeViewer = close;
    else close();
  } catch (error) {
    console.error(error);
    fail();
  }
}

function render() {
  if (closeViewer) {
    closeViewer();
    closeViewer = null;
  }
  document.body.classList.remove('is-viewer');
  const { folder: folderSlug, photo: photoSlug } = parseRoute();
  window.scrollTo(0, 0);

  if (!folderSlug) return showHome();

  const folder = library.folders.find((f) => f.slug === folderSlug);
  if (!folder) {
    setBar(APP_NAME, '#/');
    return showMessage('That folder was not found.', true);
  }
  if (!photoSlug) return showFolder(folder);

  const photo = folder.photos.find((p) => p.slug === photoSlug);
  if (!photo) {
    setBar(folder.name, '#/');
    return showMessage('That photo was not found.', true);
  }
  showViewer(folder, photo);
}

async function start() {
  try {
    library = await loadLibrary();
  } catch (error) {
    setBar(APP_NAME, null);
    showMessage('Could not load the photo list. Try reloading the page.', true);
    console.error(error);
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

start();
