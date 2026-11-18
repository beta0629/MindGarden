/**
 * Screenshot 상담 분야 cards at mobile widths for home / counseling / about.
 *
 * Usage:
 *   PLAYWRIGHT_CHROMIUM=/path/to/chrome node scripts/capture-area-cards.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4000';
const OUT = process.env.HOME_VERIFY_OUT || '/opt/cursor/artifacts';
const WIDTHS = [360, 375, 390, 430];
const HEIGHT = 900;
const EXE =
  process.env.PLAYWRIGHT_CHROMIUM ||
  process.env.CHROME_PATH ||
  '/usr/bin/google-chrome-stable';

const TARGETS = [
  { path: '/', key: 'home', scrollSel: '.home-areas', shotSel: '.home-areas__grid' },
  { path: '/counseling', key: 'counseling', scrollSel: '.area-list', shotSel: '.area-list' },
  { path: '/about', key: 'about', scrollSel: '.area-list', shotSel: '.area-list' },
];

fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: HEIGHT });
    for (const target of TARGETS) {
      await page.goto(`${BASE}${target.path}`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      await page.waitForTimeout(300);
      const loc = page.locator(target.scrollSel).first();
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const shot = page.locator(target.shotSel).first();
      const file = path.join(OUT, `areas-c${width}-${target.key}.png`);
      await shot.screenshot({ path: file });
      console.log(`Wrote ${file}`);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
