// Automated acceptance checks A1-A7 from acceptance.md.
// Usage: node test.mjs   (exits with an error if any check fails)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MB = 1024 * 1024;
const KB = 1024;

const MAX_WIDTH = 4096;
const MAX_VIEW_BYTES = 5 * MB;
const MAX_THUMB_BYTES = 150 * KB;
const MAX_SITE_BYTES = 100 * MB;
const MAX_GIT_FILE_BYTES = 100 * MB;

const results = [];
function check(id, name, problems) {
  results.push({ id, name, problems });
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

// Reads a JPEG's pixel size from its header without any libraries.
function jpegSize(file) {
  const data = readFileSync(file);
  if (data[0] !== 0xff || data[1] !== 0xd8) return null;
  let i = 2;
  while (i < data.length) {
    if (data[i] !== 0xff) { i++; continue; }
    const marker = data[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) };
    }
    i += 2 + data.readUInt16BE(i + 2);
  }
  return null;
}

const rel = (file) => relative(ROOT, file);
const library = JSON.parse(readFileSync(join(ROOT, 'photos.json'), 'utf8'));
const photos = library.folders.flatMap((f) => f.photos.map((p) => ({ folder: f, photo: p })));

// A1: photo list matches the files
{
  const problems = [];
  const listed = new Set();
  for (const { photo } of photos) {
    for (const path of [photo.file, photo.thumb]) {
      listed.add(resolve(ROOT, path));
      if (!existsSync(join(ROOT, path))) problems.push(`missing file: ${path}`);
    }
  }
  const siteDir = join(ROOT, 'site', 'photos');
  if (existsSync(siteDir)) {
    for (const file of walk(siteDir)) {
      if (file.endsWith('.DS_Store')) continue;
      if (!listed.has(resolve(file))) problems.push(`not in photos.json: ${rel(file)}`);
    }
  }
  check('A1', 'Photo list matches the files', problems);
}

// A2: photo list is well formed
{
  const problems = [];
  const slugOk = (s) => typeof s === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
  const folderSlugs = new Set();
  if (library.folders.length === 0) problems.push('no folders');
  for (const folder of library.folders) {
    if (!folder.name) problems.push('a folder has no name');
    if (!slugOk(folder.slug)) problems.push(`bad folder slug: ${folder.slug}`);
    if (folderSlugs.has(folder.slug)) problems.push(`duplicate folder slug: ${folder.slug}`);
    folderSlugs.add(folder.slug);
    if (!folder.photos.length) problems.push(`${folder.name} has no photos`);
    if (!folder.photos.some((p) => p.thumb === folder.cover)) problems.push(`${folder.name}: cover is not one of its photos`);
    const photoSlugs = new Set();
    for (const photo of folder.photos) {
      if (!photo.name) problems.push(`${folder.name}: a photo has no name`);
      if (!slugOk(photo.slug)) problems.push(`${folder.name}: bad photo slug: ${photo.slug}`);
      if (photoSlugs.has(photo.slug)) problems.push(`${folder.name}: duplicate photo slug: ${photo.slug}`);
      if (String(photo.slug).endsWith('-thumb')) problems.push(`${folder.name}: photo slug ends in -thumb: ${photo.slug}`);
      photoSlugs.add(photo.slug);
      if (!['360', 'flat'].includes(photo.type)) problems.push(`${photo.slug}: unknown type ${photo.type}`);
    }
  }
  check('A2', 'Photo list is well formed', problems);
}

// A3: viewing copies are phone sized
{
  const problems = [];
  for (const { photo } of photos) {
    const file = join(ROOT, photo.file);
    if (!existsSync(file)) continue;
    const size = jpegSize(file);
    if (!size) { problems.push(`${photo.file}: not a readable JPEG`); continue; }
    if (size.width > MAX_WIDTH) problems.push(`${photo.file}: ${size.width} px wide (limit ${MAX_WIDTH})`);
    if (photo.type === '360' && size.width !== size.height * 2) {
      problems.push(`${photo.file}: 360 photo is ${size.width}x${size.height}, not 2:1`);
    }
  }
  check('A3', 'Viewing copies are phone sized', problems);
}

// A4: files are small
{
  const problems = [];
  for (const { photo } of photos) {
    const view = join(ROOT, photo.file);
    const thumb = join(ROOT, photo.thumb);
    if (existsSync(view) && statSync(view).size > MAX_VIEW_BYTES) {
      problems.push(`${photo.file}: ${(statSync(view).size / MB).toFixed(1)} MB (limit 5 MB)`);
    }
    if (existsSync(thumb) && statSync(thumb).size > MAX_THUMB_BYTES) {
      problems.push(`${photo.thumb}: ${Math.round(statSync(thumb).size / KB)} KB (limit 150 KB)`);
    }
  }
  check('A4', 'Files are small', problems);
}

// A5: site stays small
{
  const problems = [];
  const total = walk(join(ROOT, 'site')).reduce((sum, f) => sum + statSync(f).size, 0);
  if (total > MAX_SITE_BYTES) problems.push(`site/ is ${(total / MB).toFixed(1)} MB (limit 100 MB)`);
  check('A5', `Site stays small (${(total / MB).toFixed(1)} MB)`, problems);
}

// A6: nothing too big in git, and no originals
{
  const problems = [];
  let tracked = [];
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch {
    problems.push('could not run git ls-files');
  }
  for (const file of tracked) {
    if (file.startsWith('Photos/')) problems.push(`original is tracked: ${file}`);
    const path = join(ROOT, file);
    if (existsSync(path) && statSync(path).size > MAX_GIT_FILE_BYTES) problems.push(`over 100 MB: ${file}`);
  }
  check('A6', 'Nothing too big in git, no originals', problems);
}

// A7: pages reference real files
{
  const problems = [];
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const exists = (from, target, how) => {
    if (/^(https?:|data:|#|mailto:)/.test(target)) return;
    const path = resolve(dirname(from), target.split(/[?#]/)[0]);
    if (!existsSync(path)) problems.push(`${rel(from)}: ${how} "${target}" does not exist`);
  };
  const indexPath = join(ROOT, 'index.html');
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) exists(indexPath, m[1], 'link');
  const importmap = /<script type="importmap">([\s\S]*?)<\/script>/.exec(html);
  const mapped = importmap ? JSON.parse(importmap[1]).imports : {};
  for (const target of Object.values(mapped)) exists(indexPath, target, 'import map entry');
  for (const file of readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js'))) {
    const path = join(ROOT, 'js', file);
    const source = readFileSync(path, 'utf8');
    const specifiers = [
      ...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
      ...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ].map((m) => m[1]);
    for (const spec of specifiers) {
      if (spec.startsWith('.')) exists(path, spec, 'import');
      else if (!mapped[spec]) problems.push(`${rel(path)}: import "${spec}" is not in the import map`);
    }
    for (const m of source.matchAll(/fetch\(\s*['"]([^'"]+)['"]/g)) exists(indexPath, m[1], 'fetch');
  }
  // The vendored libraries load further files of their own.
  for (const path of walk(join(ROOT, 'vendor')).filter((f) => f.endsWith('.js'))) {
    const source = readFileSync(path, 'utf8');
    const specifiers = [
      ...source.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g),
      ...source.matchAll(/\bfrom\s*["']([^"']+)["']/g),
    ].map((m) => m[1]);
    for (const spec of specifiers) if (spec.startsWith('.')) exists(path, spec, 'import');
  }
  check('A7', 'Pages reference real files', problems);
}

// A8: page routing works. A tiny pretend browser runs js/app.js and follows
// each route, so a broken router fails here instead of on the phone.
{
  const problems = [];
  const handlers = {};
  class El {
    constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; this.hidden = false; this.href = ''; this.className = ''; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener() {}
  }
  const els = { view: new El('main'), title: new El('h1'), back: new El('a') };
  const bodyClasses = new Set();
  globalThis.document = {
    title: '',
    getElementById: (id) => els[id],
    createElement: (tag) => new El(tag),
    addEventListener() {},
    body: { classList: { add: (c) => bodyClasses.add(c), remove: (c) => bodyClasses.delete(c) } },
  };
  globalThis.window = { addEventListener: (type, fn) => { handlers[type] = fn; }, scrollTo() {} };
  globalThis.location = { hash: '' };
  globalThis.fetch = async () => ({ ok: true, json: async () => library });

  // The viewer library cannot load outside a browser; the app reports that
  // with console.error, which would only be noise here.
  const realConsoleError = console.error;
  console.error = () => {};
  await import(`${join(ROOT, 'js', 'app.js')}?test=${Date.now()}`);
  const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
  await tick();

  const go = async (hash) => {
    location.hash = hash;
    if (handlers.hashchange) handlers.hashchange();
    await tick();
  };
  const cards = () => (els.view.children[0]?.children ?? []);
  const expect = (label, actual, wanted) => {
    if (actual !== wanted) problems.push(`${label}: got ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`);
  };

  if (!handlers.hashchange) problems.push('the page does not listen for route changes (hashchange)');
  const first = library.folders[0];
  const firstPhoto = first.photos[0];

  expect('home title', els.title.textContent, '360 Photos');
  expect('home back button hidden', els.back.hidden, true);
  expect('home folder cards', cards().length, library.folders.length);
  expect('home first card link', cards()[0]?.href, `#/${first.slug}`);

  await go(`#/${first.slug}`);
  expect('folder title', els.title.textContent, first.name);
  expect('folder back link', els.back.href, '#/');
  expect('folder back button shown', els.back.hidden, false);
  expect('folder photo cards', cards().length, first.photos.length);
  expect('folder first card link', cards()[0]?.href, `#/${first.slug}/${firstPhoto.slug}`);

  await go(`#/${first.slug}/${firstPhoto.slug}`);
  expect('viewer title', els.title.textContent, firstPhoto.name);
  expect('viewer back link', els.back.href, `#/${first.slug}`);
  expect('viewer full-screen mode', bodyClasses.has('is-viewer'), true);

  await go(`#/${first.slug}`);
  expect('full-screen mode ends after leaving the viewer', bodyClasses.has('is-viewer'), false);

  await go('#/no-such-folder');
  expect('unknown folder message', /not found/i.test(els.view.children[0]?.textContent ?? ''), true);
  await go(`#/${first.slug}/no-such-photo`);
  expect('unknown photo message', /not found/i.test(els.view.children[0]?.textContent ?? ''), true);

  await go('#/');
  expect('home again after going back', cards().length, library.folders.length);
  console.error = realConsoleError;
  check('A8', 'Page routing works (simulated browser)', problems);
}

// B1-B3: the build script. Each case builds into a throwaway copy, so it
// needs macOS (sips). Skipped elsewhere.
{
  const { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const haveSips = (() => { try { execFileSync('sips', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

  if (!haveSips) {
    console.log('SKIP B1-B3  build script checks need macOS (sips)');
  } else {
    const sample = join(ROOT, library.folders[0].photos[0].file);
    const makeRoot = () => {
      const dir = mkdtempSync(join(tmpdir(), 'photo-build-test-'));
      copyFileSync(join(ROOT, 'build.mjs'), join(dir, 'build.mjs'));
      mkdirSync(join(dir, 'Photos', 'Trip'), { recursive: true });
      return dir;
    };
    const makeImage = (dir, name, width, height) => {
      execFileSync('sips', ['-z', String(height), String(width), sample, '--out', join(dir, 'Photos', 'Trip', name)], { stdio: 'ignore' });
    };
    const build = (dir) => {
      try {
        const out = execFileSync('node', ['build.mjs'], { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
        return { code: 0, text: out };
      } catch (error) {
        return { code: error.status, text: `${error.stdout ?? ''}${error.stderr ?? ''}` };
      }
    };
    const widthOf = (file) => jpegSize(file)?.width;

    // B1: small photos are never enlarged
    {
      const problems = [];
      const dir = makeRoot();
      makeImage(dir, 'small-flat.jpg', 300, 200);
      makeImage(dir, 'small-pano.jpg', 1000, 500);
      const run = build(dir);
      if (run.code !== 0) problems.push(`build failed: ${run.text.trim().split('\n').pop()}`);
      else {
        const folder = join(dir, 'site', 'photos', 'trip');
        expectWidth(problems, 'small flat viewing copy', widthOf(join(folder, 'small-flat.jpg')), 300);
        expectWidth(problems, 'small flat thumbnail', widthOf(join(folder, 'small-flat-thumb.jpg')), 300);
        expectWidth(problems, 'small pano viewing copy', widthOf(join(folder, 'small-pano.jpg')), 1000);
        expectWidth(problems, 'small pano thumbnail', widthOf(join(folder, 'small-pano-thumb.jpg')), 480);
      }
      rmSync(dir, { recursive: true, force: true });
      check('B1', 'Build never enlarges small photos', problems);
    }

    // B2: a photo name that would clash with a thumbnail is refused
    {
      const problems = [];
      const dir = makeRoot();
      makeImage(dir, 'a.jpg', 400, 200);
      makeImage(dir, 'a-thumb.jpg', 400, 200);
      const run = build(dir);
      if (run.code === 0) problems.push('build accepted photos "a" and "a-thumb", which share a file name');
      else if (!/a-thumb/.test(run.text)) problems.push('error does not name the clashing photo');
      rmSync(dir, { recursive: true, force: true });
      check('B2', 'Build refuses names that clash with thumbnails', problems);
    }

    // B3: an unreadable image stops the build and names the file
    {
      const problems = [];
      const dir = makeRoot();
      makeImage(dir, 'good.jpg', 400, 200);
      writeFileSync(join(dir, 'Photos', 'Trip', 'broken.jpg'), 'this is not an image');
      const run = build(dir);
      if (run.code === 0) problems.push('build succeeded with a broken image');
      else if (!/broken\.jpg/.test(run.text)) problems.push(`error does not name the broken file: ${run.text.trim().split('\n').slice(-2).join(' | ').slice(0, 200)}`);
      rmSync(dir, { recursive: true, force: true });
      check('B3', 'Build names the file it cannot read', problems);
    }
  }
}

function expectWidth(problems, label, actual, wanted) {
  if (actual !== wanted) problems.push(`${label}: ${actual} px wide, wanted ${wanted}`);
}

let failed = 0;
for (const { id, name, problems } of results) {
  if (problems.length === 0) {
    console.log(`PASS ${id}  ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${id}  ${name}`);
    for (const p of problems.slice(0, 10)) console.log(`       - ${p}`);
    if (problems.length > 10) console.log(`       ... and ${problems.length - 10} more`);
  }
}
console.log(`\n${results.length - failed} of ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
