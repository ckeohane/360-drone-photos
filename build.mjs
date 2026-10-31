// Makes web copies of the photos in Photos/ and writes photos.json.
// Usage: node build.mjs   (macOS only, uses the built-in sips tool)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

// The first useful line of a failed command, without Node's stack trace.
const firstLine = (error) =>
  String(error.stderr || error.message).trim().split('\n').find(Boolean) ?? 'unknown error';

// Problems in the photos are reported as one clear message, not a stack trace.
process.on('uncaughtException', (error) => {
  console.error(error.message);
  process.exit(1);
});

function sips(...args) {
  return execFileSync('sips', args, { encoding: 'utf8' });
}

function dimensions(file) {
  const out = sips('-g', 'pixelWidth', '-g', 'pixelHeight', file);
  const width = /pixelWidth: (\d+)/.exec(out)?.[1];
  const height = /pixelHeight: (\d+)/.exec(out)?.[1];
  if (!width || !height) throw new Error('not a readable image');
  return { width: Number(width), height: Number(height) };
}

// A copy is up to date if it exists and is newer than the original.
const isFresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

function resize(src, out, resizeArgs) {
  sips(...resizeArgs, '-s', 'format', 'jpeg', '-s', 'formatOptions', JPEG_QUALITY, src, '--out', out);
}

function processPhoto(srcFile, outDir, slug, displayName) {
  let size;
  try {
    size = dimensions(srcFile);
  } catch (error) {
    throw new Error(`Could not read "${rel(srcFile)}": ${firstLine(error)}`);
  }
  const { width, height } = size;
  const is360 = Math.abs(width / height - 2) < 0.02;
  const longest = Math.max(width, height);
  const viewFile = join(outDir, `${slug}.jpg`);
  const thumbFile = join(outDir, `${slug}-thumb.jpg`);
  let status = 'kept';

  try {
    if (!isFresh(viewFile, srcFile)) {
      // Never enlarge: small originals keep their own size.
      let viewArgs = [];
      if (is360 && width > VIEW_WIDTH) viewArgs = ['-z', String(VIEW_HEIGHT), String(VIEW_WIDTH)];
      else if (!is360 && longest > VIEW_WIDTH) viewArgs = ['-Z', String(VIEW_WIDTH)];
      resize(srcFile, viewFile, viewArgs);
      status = 'made';
    }
    if (!isFresh(thumbFile, srcFile)) {
      resize(srcFile, thumbFile, longest > THUMB_SIZE ? ['-Z', String(THUMB_SIZE)] : []);
      status = 'made';
    }
  } catch (error) {
    throw new Error(`Could not resize "${rel(srcFile)}": ${firstLine(error)}`);
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
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('.'))
    .sort(byName);

  const photos = [];
  const seenPhotoSlugs = new Set();
  for (const file of files) {
    const displayName = basename(file, extname(file)).trim();
    const slug = slugify(displayName);
    if (!slug) throw new Error(`Photo name "${file}" has no usable letters or digits`);
    if (seenPhotoSlugs.has(slug)) throw new Error(`Two photos in "${name}" turn into "${slug}"`);
    // "<slug>-thumb.jpg" is the thumbnail file, so no photo may use that name.
    if (slug.endsWith('-thumb')) {
      throw new Error(`Photo "${file}" in "${name}" would clash with a thumbnail file; rename it so it does not end in "thumb"`);
    }
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

// Delete web copies whose original photo has been removed.
const wanted = new Set(
  folders.flatMap((f) => f.photos.flatMap((p) => [join(ROOT, p.file), join(ROOT, p.thumb)])),
);
let removed = 0;
for (const entry of readdirSync(OUT, { withFileTypes: true })) {
  const dir = join(OUT, entry.name);
  if (!entry.isDirectory()) continue;
  for (const file of readdirSync(dir)) {
    if (!wanted.has(join(dir, file))) {
      rmSync(join(dir, file), { force: true });
      removed++;
    }
  }
  if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

writeFileSync(join(ROOT, 'photos.json'), JSON.stringify({ folders }, null, 2) + '\n');

const total = folders.reduce((n, f) => n + f.photos.length, 0);
console.log(`${folders.length} folders, ${total} photos (${made} made, ${kept} already done, ${flat} flat, ${removed} old files removed)`);
