/**
 * Homepage overflow + booking clearance checks at 390 / 768 / 1440.
 *
 * Usage:
 *   PLAYWRIGHT_CHROMIUM=/path/to/chrome node scripts/verify-home-overflow.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4000';
const OUT = process.env.HOME_VERIFY_OUT || '/opt/cursor/artifacts';
const WIDTHS = [390, 768, 1440];
const HEIGHT = 900;
const EXE =
  process.env.PLAYWRIGHT_CHROMIUM ||
  process.env.CHROME_PATH ||
  undefined;

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
    await page.waitForTimeout(120);
  }
  await page.locator('.home-booking').scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(3000);

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

  const fullPath = path.join(OUT, `home-full-${width}.png`);
  await page.screenshot({ path: fullPath, fullPage: true, animations: 'disabled' });
  const bookingPath = path.join(OUT, `home-sec-${width}-booking.png`);
  await page.locator('.home-booking').screenshot({
    path: bookingPath,
    animations: 'disabled',
  });
  const pngWidth = readPngWidth(fullPath);

  return {
    width,
    metrics,
    overflowOk: Math.abs(metrics.scrollWidth - metrics.innerWidth) <= 1,
    phoneOverlap,
    visitOverlap,
    phoneClear: phoneOverlap === 0,
    visitClear: visitOverlap === 0,
    thumbs: boxes.thumbs,
    pngWidth,
    pngWidthOk: Math.abs(pngWidth - width) <= 1,
    artifacts: { fullPath, bookingPath },
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
        r.thumbs === 4,
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
