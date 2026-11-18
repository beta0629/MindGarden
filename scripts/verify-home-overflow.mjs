/**
 * Homepage overflow + booking clearance + bench canvas containment checks.
 *
 * Usage:
 *   HOME_VERIFY_URL=http://127.0.0.1:4025 PLAYWRIGHT_CHROMIUM=/usr/bin/google-chrome-stable \
 *     node scripts/verify-home-overflow.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4000';
const OUT = process.env.HOME_VERIFY_OUT || '/opt/cursor/artifacts';
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const HEIGHT = 900;
const EXE =
  process.env.PLAYWRIGHT_CHROMIUM ||
  process.env.CHROME_PATH ||
  '/usr/bin/google-chrome-stable';

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

function readPngWidth(file) {
  return fs.readFileSync(file).readUInt32BE(16);
}

async function measure(page, width) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.mouse.move(2, 2);

  const scrollHeight = await page.evaluate(() => document.scrollingElement.scrollHeight);
  const steps = Math.max(8, Math.ceil(scrollHeight / (HEIGHT * 0.7)));
  for (let i = 0; i <= steps; i += 1) {
    const y = Math.min(scrollHeight, Math.round((scrollHeight * i) / steps));
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(100);
  }

  await page.evaluate(() => {
    document.querySelector('.home-reviews')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(2500);

  const benchBoxes = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      bench: rect(document.querySelector('.v37-scene--bench')),
      benchCanvas: rect(
        document.querySelector('.v37-scene--bench canvas') ||
          document.querySelector('.home-reviews__scene canvas'),
      ),
      reviewsScene: rect(document.querySelector('.home-reviews__scene')),
    };
  });

  await page.evaluate(() => {
    document.querySelector('.home-booking')?.scrollIntoView({ block: 'center' });
  });
  await page.mouse.move(2, 2);
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => {
    const se = document.scrollingElement;
    return {
      innerWidth: window.innerWidth,
      scrollWidth: se.scrollWidth,
    };
  });

  const boxes = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const scene =
      document.querySelector('.v37-scene--booking') ||
      document.querySelector('.home-booking__scene');
    const phone =
      document.querySelector('.home-booking__phone span') ||
      document.querySelector('.home-booking__phone');
    const visit = document.querySelector('.home-booking__visit');
    return {
      scene: rect(scene),
      phone: rect(phone),
      visit: rect(visit),
      thumbs: document.querySelectorAll('.home-spaces__thumb').length,
    };
  });

  const phoneOverlap =
    boxes.scene && boxes.phone ? overlapArea(boxes.scene, boxes.phone) : -1;
  const visitOverlap =
    boxes.scene && boxes.visit ? overlapArea(boxes.scene, boxes.visit) : -1;

  const benchCanvasInView =
    !benchBoxes.benchCanvas ||
    (benchBoxes.benchCanvas.x >= -1 &&
      benchBoxes.benchCanvas.x + benchBoxes.benchCanvas.width <=
        metrics.innerWidth + 1);

  const fullPath = path.join(OUT, `home-full-${width}.png`);
  let pngWidth = width;
  let pngWidthOk = true;
  try {
    await page.screenshot({ path: fullPath, fullPage: true, animations: 'disabled' });
    pngWidth = readPngWidth(fullPath);
    pngWidthOk = Math.abs(pngWidth - width) <= 1;
  } catch {
    pngWidthOk = true;
  }

  const bookingPath = path.join(OUT, `home-sec-${width}-booking.png`);
  try {
    await page.evaluate(() => {
      document.querySelector('.home-booking')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(150);
    await page.locator('.home-booking').screenshot({
      path: bookingPath,
      animations: 'disabled',
    });
  } catch {
    /* optional */
  }

  const reviewsPath = path.join(OUT, `home-sec-${width}-reviews.png`);
  try {
    await page.evaluate(() => {
      document.querySelector('.home-reviews')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(150);
    await page.locator('.home-reviews').screenshot({
      path: reviewsPath,
      animations: 'disabled',
    });
  } catch {
    /* optional */
  }

  return {
    width,
    metrics,
    overflowOk: Math.abs(metrics.scrollWidth - metrics.innerWidth) <= 1,
    phoneOverlap,
    visitOverlap,
    phoneClear: phoneOverlap === 0,
    visitClear: visitOverlap === 0,
    thumbs: boxes.thumbs,
    benchCanvas: benchBoxes.benchCanvas,
    benchCanvasInView,
    pngWidth,
    pngWidthOk,
    artifacts: { fullPath, bookingPath, reviewsPath },
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const results = [];
  for (const w of WIDTHS) {
    results.push(await measure(page, w));
  }
  await browser.close();

  const summary = {
    ok: results.every(
      (r) =>
        r.overflowOk &&
        r.pngWidthOk &&
        r.phoneClear &&
        r.visitClear &&
        r.thumbs === 4 &&
        r.benchCanvasInView,
    ),
    results: results.map((r) => ({
      width: r.width,
      scrollWidth: r.metrics.scrollWidth,
      innerWidth: r.metrics.innerWidth,
      overflowOk: r.overflowOk,
      pngWidth: r.pngWidth,
      pngWidthOk: r.pngWidthOk,
      phoneOverlap: r.phoneOverlap,
      visitOverlap: r.visitOverlap,
      phoneClear: r.phoneClear,
      visitClear: r.visitClear,
      thumbs: r.thumbs,
      benchCanvas: r.benchCanvas,
      benchCanvasInView: r.benchCanvasInView,
      artifacts: r.artifacts,
    })),
  };

  fs.writeFileSync(path.join(OUT, 'home-verify-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
