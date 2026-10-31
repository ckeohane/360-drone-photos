// Makes web copies of the photos in Photos/ and writes photos.json.
// Usage: node build.mjs   (macOS only, uses the built-in sips tool)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'Photos');
const OUT = join(ROOT, 'site', 'photos');

const VIEW_WIDTH = 4096;
const VIEW_HEIGHT = 2048;
const THUMB_SIZE = 480;
const JPEG_QUALITY = '80';

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function sips(...args) {
  return execFileSync('sips', args, { encoding: 'utf8' });
}

function dimensions(file) {
  const out = sips('-g', 'pixelWidth', '-g', 'pixelHeight', file);
  const width = Number(/pixelWidth: (\d+)/.exec(out)[1]);
  const height = Number(/pixelHeight: (\d+)/.exec(out)[1]);
  return { width, height };
}

// A copy is up to date if it exists and is newer than the original.
const isFresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

function resize(src, out, resizeArgs) {
  sips(...resizeArgs, '-s', 'format', 'jpeg', '-s', 'formatOptions', JPEG_QUALITY, src, '--out', out);
}

function processPhoto(srcFile, outDir, slug, displayName) {
  const { width, height } = dimensions(srcFile);
  const is360 = Math.abs(width / height - 2) < 0.02;
  const viewFile = join(outDir, `${slug}.jpg`);
  const thumbFile = join(outDir, `${slug}-thumb.jpg`);
  let status = 'kept';

  if (!isFresh(viewFile, srcFile)) {
    // Never enlarge: small originals keep their own size.
    const viewArgs = is360
      ? width > VIEW_WIDTH ? ['-z', String(VIEW_HEIGHT), String(VIEW_WIDTH)] : []
      : ['-Z', String(VIEW_WIDTH)];
    resize(srcFile, viewFile, viewArgs);
    status = 'made';
  }
  if (!isFresh(thumbFile, srcFile)) {
    resize(srcFile, thumbFile, ['-Z', String(THUMB_SIZE)]);
    status = 'made';
  }

  return {
    status,
    entry: { name: displayName, type: is360 ? '360' : 'flat', width, height },
    viewFile,
    thumbFile,
  };
}

if (!existsSync(SRC)) {
  console.error(`No Photos folder found at ${SRC}`);
  process.exit(1);
}

const rel = (file) => file.slice(ROOT.length + 1);
const folders = [];
const seenFolderSlugs = new Set();
let made = 0;
let kept = 0;
let flat = 0;

const folderNames = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .map((d) => d.name)
  .sort(byName);

for (const folderName of folderNames) {
  const name = folderName.trim().replace(/\s+/g, ' ');
  const folderSlug = slugify(name);
  if (!folderSlug) throw new Error(`Folder name "${folderName}" has no usable letters or digits`);
  if (seenFolderSlugs.has(folderSlug)) throw new Error(`Two folders turn into "${folderSlug}"`);
  seenFolderSlugs.add(folderSlug);

  const outDir = join(OUT, folderSlug);
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(join(SRC, folderName))
    .filter((f) => /\.jpe?g$/i.test(f) && !f.startsWith('.'))
    .sort(byName);

  const photos = [];
  const seenPhotoSlugs = new Set();
  for (const file of files) {
    const displayName = basename(file, extname(file)).trim();
    const slug = slugify(displayName);
    if (!slug) throw new Error(`Photo name "${file}" has no usable letters or digits`);
    if (seenPhotoSlugs.has(slug)) throw new Error(`Two photos in "${name}" turn into "${slug}"`);
    seenPhotoSlugs.add(slug);

    const result = processPhoto(join(SRC, folderName, file), outDir, slug, displayName);
    result.status === 'made' ? made++ : kept++;
    if (result.entry.type === 'flat') flat++;
    photos.push({
      ...result.entry,
      slug,
      file: rel(result.viewFile),
      thumb: rel(result.thumbFile),
    });
  }

  if (photos.length === 0) continue;
  folders.push({ name, slug: folderSlug, cover: photos[0].thumb, photos });
}

writeFileSync(join(ROOT, 'photos.json'), JSON.stringify({ folders }, null, 2) + '\n');

const total = folders.reduce((n, f) => n + f.photos.length, 0);
console.log(`${folders.length} folders, ${total} photos (${made} made, ${kept} already done, ${flat} flat)`);
