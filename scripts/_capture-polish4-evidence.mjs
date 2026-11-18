/**
 * Polish-4 evidence: hero 2-line headline, pause onCream, hero→areas gap,
 * empty reviews padding + hidden 더보기.
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import sharp from 'sharp';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const CREAM = { r: 245, g: 240, b: 230 };

function lineCount(elBox, lineHeight) {
  if (!elBox || !lineHeight) return null;
  return Math.round(elBox.height / lineHeight);
}

async function launch(kind) {
  if (kind === 'c') {
    return chromium.launch({
      headless: true,
      channel: 'chrome',
      executablePath: CHROME,
    });
  }
  return webkit.launch({
    headless: true,
    executablePath: undefined,
  });
}

async function pauseOnCream(file, cx, cy) {
  // Sample just outside the 26px visual (below-right) so we don't read the
  // semi-transparent button fill — cream under the control center.
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const probes = [
    [0, 0],
    [14, 14],
    [18, 10],
    [10, 18],
    [-14, 14],
    [14, -10],
  ];
  let best = null;
  for (const [dx, dy] of probes) {
    const x = Math.min(width - 1, Math.max(0, Math.round(cx + dx)));
    const y = Math.min(height - 1, Math.max(0, Math.round(cy + dy)));
    const i = (y * width + x) * channels;
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const delta =
      Math.abs(rgb[0] - CREAM.r) +
      Math.abs(rgb[1] - CREAM.g) +
      Math.abs(rgb[2] - CREAM.b);
    // Strict: pastel petals were passing delta≤55.
    const onCream = delta <= 28 && data[i + 3] > 200;
    const row = { x, y, rgb, delta, onCream, dx, dy };
    if (!best || row.delta < best.delta) best = row;
  }
  return best;
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
    const areas = document.querySelector('.home-areas');
    const areasEyebrow =
      areas?.querySelector('.section__eyebrow') ||
      areas?.querySelector('.section__title') ||
      areas?.querySelector('h2');
    const csH1 = h1 ? getComputedStyle(h1) : null;
    const csSub = sub ? getComputedStyle(sub) : null;
    const h1R = h1?.getBoundingClientRect();
    const subR = sub?.getBoundingClientRect();
    const copyR = copy?.getBoundingClientRect();
    const mediaR = media?.getBoundingClientRect();
    const pauseR = pause?.getBoundingClientRect();
    const areasR = areasEyebrow?.getBoundingClientRect();
    const areasBox = areas?.getBoundingClientRect();
    const subjBottom = parseFloat(
      getComputedStyle(media).getPropertyValue('--hero-subj-bottom'),
    );
    const subjectBottomY =
      mediaR && Number.isFinite(subjBottom)
        ? mediaR.top + (mediaR.height * subjBottom) / 100
        : mediaR?.bottom;
    const brCount = h1 ? h1.querySelectorAll('br').length : 0;
    return {
      h1Text: h1?.textContent?.replace(/\s+/g, ' ').trim() || '',
      h1Html: h1?.innerHTML || '',
      h1Br: brCount,
      h1Height: h1R?.height ?? null,
      h1LineHeight: csH1 ? parseFloat(csH1.lineHeight) : null,
      subHeight: subR?.height ?? null,
      subLineHeight: csSub ? parseFloat(csSub.lineHeight) : null,
      copyWidth: copyR?.width ?? null,
      copyMinWidth: copy ? getComputedStyle(copy).minWidth : null,
      media: mediaR
        ? {
            w: mediaR.width,
            h: mediaR.height,
            left: mediaR.left,
            top: mediaR.top,
            bottom: mediaR.bottom,
          }
        : null,
      pause: pauseR
        ? {
            cx: pauseR.left + pauseR.width / 2,
            cy: pauseR.top + pauseR.height / 2,
            localX: pauseR.left + pauseR.width / 2 - (mediaR?.left ?? 0),
            localY: pauseR.top + pauseR.height / 2 - (mediaR?.top ?? 0),
            afterW: getComputedStyle(pause, '::after').width,
            afterH: getComputedStyle(pause, '::after').height,
          }
        : null,
      pauseVars: {
        x: getComputedStyle(media).getPropertyValue('--hero-pause-x').trim(),
        y: getComputedStyle(media).getPropertyValue('--hero-pause-y').trim(),
      },
      subj: {
        bottom: getComputedStyle(media)
          .getPropertyValue('--hero-subj-bottom')
          .trim(),
        right: getComputedStyle(media)
          .getPropertyValue('--hero-subj-right')
          .trim(),
      },
      gapSubjectToAreas:
        subjectBottomY != null && areasR
          ? areasR.top - subjectBottomY
          : null,
      gapMediaToAreasSection:
        mediaR && areasBox ? areasBox.top - mediaR.bottom : null,
      gapSubjectToAreasSection:
        subjectBottomY != null && areasBox
          ? areasBox.top - subjectBottomY
          : null,
    };
  });

  metrics.h1Lines =
    metrics.h1Br > 0
      ? metrics.h1Br + 1
      : metrics.h1Height && metrics.h1LineHeight
        ? Math.round(metrics.h1Height / metrics.h1LineHeight)
        : null;
  metrics.subLines =
    metrics.subHeight && metrics.subLineHeight
      ? Math.round(metrics.subHeight / metrics.subLineHeight)
      : null;

  const prefix = `polish-hero-${kind}${width}`;
  const heroPath = `${OUT}/${prefix}.png`;
  await page.locator('.hero').screenshot({ path: heroPath });
  const mediaPath = `${OUT}/${prefix}-media.png`;
  await page.locator('.hero-media').screenshot({ path: mediaPath });

  let cream = null;
  if (metrics.pause) {
    cream = await pauseOnCream(
      mediaPath,
      metrics.pause.localX,
      metrics.pause.localY,
    );
  }

  await browser.close();
  return { kind, width, ...metrics, cream, heroPath, mediaPath };
}

async function captureReviews(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.locator('.home-reviews').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => {
      const c = document.querySelector(
        '.home-reviews .v37-scene--bench canvas, .home-reviews .v37-scene__canvas',
      );
      return c instanceof HTMLCanvasElement && c.width > 8 && c.height > 8;
    },
    { timeout: 45000 },
  ).catch(() => undefined);
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const section = document.querySelector('.home-reviews');
    const more = section?.querySelector('.text-link');
    const grid = section?.querySelector('.home-reviews__grid');
    const cs = section ? getComputedStyle(section) : null;
    const r = section?.getBoundingClientRect();
    const header = section?.querySelector('.home-reviews__header');
    const headerR = header?.getBoundingClientRect();
    const scene = section?.querySelector('.home-reviews__scene');
    const sceneR = scene?.getBoundingClientRect();
    const bench = section?.querySelector('.v37-scene--bench');
    const benchCs = bench ? getComputedStyle(bench) : null;
    const canvas = section?.querySelector(
      '.v37-scene--bench canvas, .v37-scene__canvas',
    );
    return {
      hasEmptyClass: section?.classList.contains('home-reviews--empty') ?? false,
      moreLabel: more?.textContent?.replace(/\s+/g, ' ').trim() || null,
      hasGrid: Boolean(grid),
      sectionPadTop: cs ? parseFloat(cs.paddingTop) : null,
      sectionPadBottom: cs ? parseFloat(cs.paddingBottom) : null,
      sectionHeight: r?.height ?? null,
      headerHeight: headerR?.height ?? null,
      sceneHeight: sceneR?.height ?? null,
      benchPadTop: benchCs ? parseFloat(benchCs.paddingTop) : null,
      benchMarginTop: benchCs ? parseFloat(benchCs.marginTop) : null,
      canvasSize:
        canvas instanceof HTMLCanvasElement
          ? { w: canvas.width, h: canvas.height }
          : null,
    };
  });

  const path = `${OUT}/polish-reviews-${kind}${width}.png`;
  await page.locator('.home-reviews').screenshot({ path });
  await browser.close();
  return { kind, width, ...metrics, path };
}

const heroJobs = [];
for (const kind of ['c', 'w']) {
  for (const width of [390, 1280, 1440, 1920]) {
    if (width === 1920 && kind === 'w') continue; // still capture 1920 chrome
    heroJobs.push([kind, width]);
  }
}
// Ensure 1920 for both
heroJobs.push(['w', 1920]);

const heroResults = [];
for (const [kind, width] of [
  ['c', 390],
  ['c', 1280],
  ['c', 1440],
  ['c', 1920],
  ['w', 390],
  ['w', 1280],
  ['w', 1440],
  ['w', 1920],
]) {
  process.stderr.write(`hero ${kind}${width}...\n`);
  heroResults.push(await captureHero(kind, width));
}

const reviewResults = [];
for (const [kind, width] of [
  ['c', 390],
  ['c', 1440],
  ['w', 390],
  ['w', 1440],
]) {
  process.stderr.write(`reviews ${kind}${width}...\n`);
  reviewResults.push(await captureReviews(kind, width));
}

const summary = { hero: heroResults, reviews: reviewResults };
fs.writeFileSync(
  `${OUT}/polish4-summary.json`,
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
