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

// The page functions below are placeholders. Steps 4 and 5 fill them in.
function showHome() {
  setBar(APP_NAME, null);
  showMessage(`Home: ${library.folders.length} folders`);
}

function showFolder(folder) {
  setBar(folder.name, '#/');
  showMessage(`Folder "${folder.name}": ${folder.photos.length} photos`);
}

function showViewer(folder, photo) {
  setBar(photo.name, `#/${encodeURIComponent(folder.slug)}`);
  showMessage(`Viewer: ${photo.name} (${photo.type})`);
}

function render() {
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
