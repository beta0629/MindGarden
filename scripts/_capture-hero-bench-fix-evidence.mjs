/**
 * Evidence for hero frustum fit + bench sticky clearance.
 * Usage: node scripts/_capture-hero-bench-fix-evidence.mjs
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const { chromium, webkit } = pw;

const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';

fs.mkdirSync(OUT, { recursive: true });

/** Cream-ish page background; subject = non-transparent, non-cream pixels. */
async function analyzeMediaPng(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const cream = { r: 245, g: 240, b: 230 };
  let firstY = null;
  let lastY = null;
  let firstX = null;
  let lastX = null;
  let edgeTop = 0;
  let edgeBottom = 0;
  let edgeLeft = 0;
  let edgeRight = 0;

  const isSubject = (i) => {
    const a = data[i + 3];
    if (a < 28) return false;
    const dr = Math.abs(data[i] - cream.r);
    const dg = Math.abs(data[i + 1] - cream.g);
    const db = Math.abs(data[i + 2] - cream.b);
    return dr + dg + db > 40;
  };

  for (let y = 0; y < height; y += 1) {
    let rowHits = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      if (!isSubject(i)) continue;
      rowHits += 1;
      if (firstX == null || x < firstX) firstX = x;
      if (lastX == null || x > lastX) lastX = x;
    }
    if (rowHits > width * 0.015) {
      if (firstY == null) firstY = y;
      lastY = y;
    }
    if (y === 0) edgeTop = rowHits;
    if (y === height - 1) edgeBottom = rowHits;
  }
  for (let y = 0; y < height; y += 1) {
    const li = (y * width + 0) * channels;
    const ri = (y * width + (width - 1)) * channels;
    if (isSubject(li)) edgeLeft += 1;
    if (isSubject(ri)) edgeRight += 1;
  }

  return {
    width,
    height,
    firstSubjY: firstY,
    lastSubjY: lastY,
    firstSubjX: firstX,
    lastSubjX: lastX,
    edgeCrop: { top: edgeTop, bottom: edgeBottom, left: edgeLeft, right: edgeRight },
    /** True if a hard crop is likely (subject paints the outer edge densely). */
    hardCropLikely:
      edgeTop > width * 0.08 ||
      edgeBottom > width * 0.08 ||
      edgeLeft > height * 0.08 ||
      edgeRight > height * 0.08,
  };
}

async function waitHero3d(page, timeout = 25000) {
  await page.waitForFunction(
    () => document.querySelector('.hero-media')?.classList.contains('is-3d'),
    { timeout },
  );
  await page.waitForTimeout(1000);
}

async function heroDomMetrics(page) {
  return page.evaluate(() => {
    // 「상담 문의하기」 is the secondary link — the gap the review measures.
    const inquiry =
      document.querySelector('.hero__secondary') ||
      document.querySelector('.hero [data-booking-cta], .hero .btn');
    const copy = document.querySelector('.hero__copy');
    const media = document.querySelector('.hero-media');
    const pause = document.querySelector('.hero__pause');
    const canvas = document.querySelector('.hero-3d');
    if (!inquiry || !media) return null;
    const inquiryR = inquiry.getBoundingClientRect();
    const copyR = copy?.getBoundingClientRect();
    const mediaR = media.getBoundingClientRect();
    const pauseR = pause?.getBoundingClientRect();
    const cs = getComputedStyle(media);
    let pauseHit = null;
    if (pause && pauseR) {
      const after = getComputedStyle(pause, '::after');
      pauseHit = {
        visualW: Math.round(pauseR.width * 10) / 10,
        visualH: Math.round(pauseR.height * 10) / 10,
        afterW: after.width,
        afterH: after.height,
        insetR: Math.round((mediaR.right - pauseR.right) * 10) / 10,
        insetB: Math.round((mediaR.bottom - pauseR.bottom) * 10) / 10,
        centerX: Math.round((pauseR.left + pauseR.width / 2 - mediaR.left) * 10) / 10,
        centerY: Math.round((pauseR.top + pauseR.height / 2 - mediaR.top) * 10) / 10,
      };
    }
    const gapBox = Math.round((mediaR.top - inquiryR.bottom) * 10) / 10;
    const gapCopy = copyR
      ? Math.round((mediaR.top - copyR.bottom) * 10) / 10
      : null;
    return {
      gapBox,
      gapCopy,
      inquiryBottom: inquiryR.bottom,
      mediaTop: mediaR.top,
      media: { w: Math.round(mediaR.width), h: Math.round(mediaR.height) },
      overflow: cs.overflow,
      transform: canvas ? getComputedStyle(canvas).transform : null,
      is3d: media.classList.contains('is-3d'),
      subjVars: {
        left: cs.getPropertyValue('--hero-subj-left').trim(),
        top: cs.getPropertyValue('--hero-subj-top').trim(),
        right: cs.getPropertyValue('--hero-subj-right').trim(),
        bottom: cs.getPropertyValue('--hero-subj-bottom').trim(),
      },
      pause: pauseHit,
    };
  });
}

async function launchChromium() {
  return chromium.launch({
    headless: true,
    executablePath: CHROME,
  });
}

async function captureHeroSeries(browserType, labelPrefix, width) {
  const browser =
    browserType === 'chromium'
      ? await launchChromium()
      : await webkit.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await waitHero3d(page);

  const started = Date.now();
  const results = [];
  for (const t of [0, 5, 10]) {
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed < t) await page.waitForTimeout((t - elapsed) * 1000);
    const dom = await heroDomMetrics(page);
    const file = path.join(OUT, `hero3d-${labelPrefix}${width}-t${t}.png`);
    await page.locator('.hero-media').screenshot({ path: file });
    if (t === 5) {
      await page.screenshot({
        path: path.join(OUT, `hero3d-${labelPrefix}${width}-full-t5.png`),
        fullPage: false,
      });
    }
    const png = await analyzeMediaPng(file);
    const subjGap =
      png.firstSubjY == null || !dom
        ? null
        : Math.round((dom.gapBox + png.firstSubjY) * 10) / 10;
    const row = {
      label: `${labelPrefix}${width}-t${t}`,
      gapBox: dom?.gapBox,
      subjGap,
      firstSubjY: png.firstSubjY,
      hardCropLikely: png.hardCropLikely,
      edgeCrop: png.edgeCrop,
      pause: dom?.pause,
      transform: dom?.transform,
      overflow: dom?.overflow,
      subjVars: dom?.subjVars,
      file,
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }
  await browser.close();
  return results;
}

async function armBenchAndWaitPeak(page) {
  // Load assets near the section first.
  await page.evaluate(() => {
    document.querySelector('.home-reviews')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(600);

  await page.waitForFunction(
    () => {
      const c = document.querySelector(
        '.v37-scene--bench .v37-scene__canvas--overflow',
      );
      return Boolean(c && c.width > 0);
    },
    { timeout: 45000 },
  ).catch(() => null);

  // Arm ScrollClock at triggerP, then hold still for peak flight (~3700ms).
  await page.evaluate(() => {
    const section = document.querySelector('.home-reviews');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const scrollY = window.scrollY || 0;
    const sectionTop = scrollY + rect.top;
    const sectionHeight = Math.max(1, rect.height);
    const vh = window.innerHeight || 1;
    const triggerP = 0.42;
    const triggerY =
      triggerP * (sectionHeight + vh) - vh + sectionTop;
    window.scrollTo(0, Math.max(0, triggerY + 2));
  });
  await page.waitForTimeout(3700);
}

async function benchPeakMetrics(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const canvas = document.querySelector(
      '.v37-scene--bench .v37-scene__canvas--overflow',
    );
    const wrap = document.querySelector('.v37-scene--bench');
    if (!header || !canvas || !wrap) return { error: 'missing elements' };
    const headerBottom = header.getBoundingClientRect().bottom;
    const canvasR = canvas.getBoundingClientRect();

    let highestButterflyY = null;
    try {
      const probe = document.createElement('canvas');
      probe.width = canvas.width;
      probe.height = canvas.height;
      const ctx = probe.getContext('2d');
      ctx.drawImage(canvas, 0, 0);
      const { data, width, height } = ctx.getImageData(
        0,
        0,
        probe.width,
        probe.height,
      );
      for (let y = 0; y < height; y += 1) {
        let hit = 0;
        for (let x = 0; x < width; x += 2) {
          if (data[(y * width + x) * 4 + 3] > 30) hit += 1;
        }
        if (hit > 2) {
          highestButterflyY = canvasR.top + (y / height) * canvasR.height;
          break;
        }
      }
    } catch {
      highestButterflyY = canvasR.top + 8;
    }
    if (highestButterflyY == null) highestButterflyY = canvasR.top + 8;
    return {
      headerBottom: Math.round(headerBottom * 10) / 10,
      canvasTop: Math.round(canvasR.top * 10) / 10,
      highestButterflyY: Math.round(highestButterflyY * 10) / 10,
      clearance: Math.round((highestButterflyY - headerBottom) * 10) / 10,
      translate: wrap.style.translate || '',
      stickyTop: getComputedStyle(wrap).top,
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function captureBenchPeak(browserType, labelPrefix, width) {
  const browser =
    browserType === 'chromium'
      ? await launchChromium()
      : await webkit.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await armBenchAndWaitPeak(page);
  const metrics = await benchPeakMetrics(page);
  const file = path.join(OUT, `bench-peak-${labelPrefix}${width}.png`);
  try {
    await page.locator('.home-reviews').screenshot({ path: file });
  } catch {
    await page.screenshot({ path: file, fullPage: false });
  }
  const row = { label: `bench-${labelPrefix}${width}`, ...metrics, file };
  console.log(JSON.stringify(row));
  await browser.close();
  return row;
}

async function scrollMarginCheck(width) {
  const browser = await launchChromium();
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  const sections = [
    '.home-areas',
    '.home-experts',
    '.home-reviews',
    '.home-pricing',
  ];
  const rows = [];
  for (const sel of sections) {
    await page.evaluate((s) => {
      document.querySelector(s)?.scrollIntoView();
    }, sel);
    await page.waitForTimeout(450);
    const row = await page.evaluate((s) => {
      const header = document.querySelector('.site-header');
      const section = document.querySelector(s);
      const title = section?.querySelector('.section__title');
      const hb = header?.getBoundingClientRect().bottom ?? 0;
      const titleTop = title?.getBoundingClientRect().top ?? null;
      return {
        sel: s,
        headerBottom: Math.round(hb * 10) / 10,
        titleTop: titleTop == null ? null : Math.round(titleTop * 10) / 10,
        titleClearance:
          titleTop == null ? null : Math.round((titleTop - hb) * 10) / 10,
        stickyH: getComputedStyle(document.documentElement)
          .getPropertyValue('--header-sticky-h')
          .trim(),
        scrollMargin: section ? getComputedStyle(section).scrollMarginTop : null,
      };
    }, sel);
    rows.push(row);
    await page.screenshot({
      path: path.join(OUT, `scroll-margin-c${width}-${sel.slice(1)}.png`),
      fullPage: false,
    });
  }
  console.log(JSON.stringify({ scrollMargin: width, rows }, null, 2));
  await browser.close();
  return rows;
}

async function main() {
  const summary = { hero: [], bench: [], scrollMargin: {} };

  for (const width of [390, 1440]) {
    summary.hero.push(...(await captureHeroSeries('chromium', 'c', width)));
  }
  for (const width of [390, 1440]) {
    summary.hero.push(...(await captureHeroSeries('webkit', 'w', width)));
  }

  for (const width of [1280, 1440, 1920]) {
    summary.bench.push(await captureBenchPeak('chromium', 'c', width));
  }
  for (const width of [1280, 1440, 1920]) {
    summary.bench.push(await captureBenchPeak('webkit', 'w', width));
  }

  summary.scrollMargin[768] = await scrollMarginCheck(768);
  summary.scrollMargin[1440] = await scrollMarginCheck(1440);

  // Overflow invariant check
  const { spawnSync } = await import('node:child_process');
  const overflow = spawnSync(
    'node',
    ['scripts/verify-home-overflow.mjs'],
    {
      env: {
        ...process.env,
        HOME_VERIFY_URL: BASE,
        PLAYWRIGHT_CHROMIUM: CHROME,
      },
      encoding: 'utf8',
    },
  );
  summary.overflow = {
    status: overflow.status,
    stdout: (overflow.stdout || '').slice(-2000),
    stderr: (overflow.stderr || '').slice(-1000),
  };
  console.log('overflow status', overflow.status);

  const bounds = spawnSync('node', ['scripts/verify-bench-butterfly-bounds.mjs'], {
    encoding: 'utf8',
  });
  summary.bounds = {
    status: bounds.status,
    stdout: (bounds.stdout || '').slice(-1500),
  };
  console.log('bounds status', bounds.status);

  const outFile = path.join(OUT, 'hero-bench-fix-evidence-summary.json');
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log('wrote', outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
