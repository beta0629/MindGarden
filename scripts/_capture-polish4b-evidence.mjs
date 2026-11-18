/**
 * Polish-4b: pause outside AABB on cream; empty reviews compact host height.
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import sharp from 'sharp';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const CREAM = { r: 245, g: 240, b: 230 };

async function launch(kind) {
  if (kind === 'c') {
    return chromium.launch({
      headless: true,
      channel: 'chrome',
      executablePath: CHROME,
    });
  }
  return webkit.launch({ headless: true });
}

async function creamAt(file, cx, cy) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  // Sample under pause center; also a few neighbors outside the 26px glyph.
  const probes = [
    [0, 0],
    [0, 18],
    [14, 14],
    [-14, 14],
    [18, 0],
  ];
  const rows = [];
  for (const [dx, dy] of probes) {
    const x = Math.min(width - 1, Math.max(0, Math.round(cx + dx)));
    const y = Math.min(height - 1, Math.max(0, Math.round(cy + dy)));
    const i = (y * width + x) * channels;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const delta =
      Math.abs(rgb[0] - CREAM.r) +
      Math.abs(rgb[1] - CREAM.g) +
      Math.abs(rgb[2] - CREAM.b);
    rows.push({
      x,
      y,
      rgb,
      delta,
      onCream: delta <= 18 && data[i + 3] > 200,
      dx,
      dy,
    });
  }
  // Prefer center; else best neighbor.
  const center = rows[0];
  if (center.onCream) return center;
  return rows.slice(1).sort((a, b) => a.delta - b.delta)[0] || center;
}

async function captureHero(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelector('.hero-media')?.classList.contains('is-3d'),
    { timeout: 45000 },
  );
  await page.waitForTimeout(2200);

  const metrics = await page.evaluate(() => {
    const h1 = document.querySelector('.hero__copy h1');
    const sub = document.querySelector('.hero__subtitle');
    const copy = document.querySelector('.hero__copy');
    const media = document.querySelector('.hero-media');
    const pause = document.querySelector('.hero__pause');
    const hero = document.querySelector('.hero');
    const areas = document.querySelector('.home-areas .section__eyebrow');
    const h1R = h1.getBoundingClientRect();
    const subR = sub.getBoundingClientRect();
    const copyR = copy.getBoundingClientRect();
    const mediaR = media.getBoundingClientRect();
    const pauseR = pause.getBoundingClientRect();
    const heroR = hero.getBoundingClientRect();
    const areasR = areas?.getBoundingClientRect();
    const cs = getComputedStyle(media);
    const subj = {
      left: parseFloat(cs.getPropertyValue('--hero-subj-left')),
      top: parseFloat(cs.getPropertyValue('--hero-subj-top')),
      right: parseFloat(cs.getPropertyValue('--hero-subj-right')),
      bottom: parseFloat(cs.getPropertyValue('--hero-subj-bottom')),
    };
    const pauseCx = pauseR.left + pauseR.width / 2;
    const pauseCy = pauseR.top + pauseR.height / 2;
    const outsideAabb =
      pauseCx / mediaR.width - mediaR.left / mediaR.width >
        subj.right / 100 - 0.001 ||
      (pauseCy - mediaR.top) / mediaR.height > subj.bottom / 100 + 0.001 ||
      pauseCy > mediaR.bottom - 1;
    // More precise outside check in media-local units:
    const lx = (pauseCx - mediaR.left) / mediaR.width;
    const ly = (pauseCy - mediaR.top) / mediaR.height;
    const outside =
      lx > subj.right / 100 + 0.005 ||
      ly > subj.bottom / 100 + 0.005 ||
      ly > 1.0;
    const subjectBottomY = mediaR.top + (mediaR.height * subj.bottom) / 100;
    return {
      h1Lines: (h1.querySelectorAll('br').length || 0) + 1,
      subLines: Math.round(
        subR.height / parseFloat(getComputedStyle(sub).lineHeight),
      ),
      copyW: Math.round(copyR.width),
      pauseVars: {
        x: cs.getPropertyValue('--hero-pause-x').trim(),
        y: cs.getPropertyValue('--hero-pause-y').trim(),
      },
      pauseLocal: { x: lx, y: ly },
      pausePage: { x: pauseCx, y: pauseCy },
      pauseInHero: {
        x: pauseCx - heroR.left,
        y: pauseCy - heroR.top,
      },
      subj,
      outsideAabb: outside,
      belowMedia: pauseCy > mediaR.bottom - 0.5,
      gap: areasR ? Math.round(areasR.top - subjectBottomY) : null,
      after: {
        w: getComputedStyle(pause, '::after').width,
        h: getComputedStyle(pause, '::after').height,
      },
      heroSize: { w: heroR.width, h: heroR.height },
    };
  });

  const heroPath = `${OUT}/polish-hero-${kind}${width}.png`;
  await page.locator('.hero').screenshot({ path: heroPath });

  // Cream under pause center: hide the control so we sample page/GLB cream.
  await page.locator('.hero__pause').evaluate((el) => {
    el.style.opacity = '0';
  });
  const creamPath = `${OUT}/polish-hero-${kind}${width}-cream.png`;
  await page.locator('.hero').screenshot({ path: creamPath });
  const cream = await creamAt(
    creamPath,
    metrics.pauseInHero.x,
    metrics.pauseInHero.y,
  );
  metrics.cream = cream;
  await page.locator('.hero__pause').evaluate((el) => {
    el.style.opacity = '';
  });
  // Re-shot with pause visible for the deliverable artifact.
  await page.locator('.hero').screenshot({ path: heroPath });

  await browser.close();
  return { kind, width, ...metrics, heroPath };
}

async function captureReviews(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.locator('.home-reviews').scrollIntoViewIfNeeded();
  await page
    .waitForFunction(
      () => {
        const c = document.querySelector(
          '.home-reviews .v37-scene--bench canvas, .home-reviews .v37-scene__canvas',
        );
        return c instanceof HTMLCanvasElement && c.width > 8;
      },
      { timeout: 45000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const section = document.querySelector('.home-reviews');
    const header = section.querySelector('.home-reviews__header');
    const title = section.querySelector('.section__title');
    const bench = section.querySelector('.v37-scene--bench');
    const scene = section.querySelector('.home-reviews__scene');
    const cs = getComputedStyle(section);
    const sR = section.getBoundingClientRect();
    const hR = header.getBoundingClientRect();
    const tR = title.getBoundingClientRect();
    const bR = bench.getBoundingClientRect();
    const scR = scene.getBoundingClientRect();
    const benchCs = getComputedStyle(bench);
    return {
      empty: section.classList.contains('home-reviews--empty'),
      more: section.querySelector('.text-link')?.textContent?.trim() || null,
      padT: parseFloat(cs.paddingTop),
      padB: parseFloat(cs.paddingBottom),
      sectionH: sR.height,
      headerH: hR.height,
      sceneH: scR.height,
      titleTopInSection: tR.top - sR.top,
      benchTopInSection: bR.top - sR.top,
      blankAboveTitle: tR.top - sR.top - parseFloat(cs.paddingTop),
      benchPadT: parseFloat(benchCs.paddingTop),
      benchMarginT: parseFloat(benchCs.marginTop),
    };
  });

  const path = `${OUT}/polish-reviews-${kind}${width}.png`;
  await page.locator('.home-reviews').screenshot({ path });
  await browser.close();
  return { kind, width, ...metrics, path };
}

const hero = [];
for (const [kind, width] of [
  ['c', 390],
  ['c', 1280],
  ['c', 1440],
  ['w', 390],
  ['w', 1280],
  ['w', 1440],
]) {
  process.stderr.write(`hero ${kind}${width}\n`);
  hero.push(await captureHero(kind, width));
}

const reviews = [];
for (const [kind, width] of [
  ['c', 390],
  ['c', 1440],
  ['w', 390],
  ['w', 1440],
]) {
  process.stderr.write(`reviews ${kind}${width}\n`);
  reviews.push(await captureReviews(kind, width));
}

const summary = { hero, reviews };
fs.writeFileSync(`${OUT}/polish4b-summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
