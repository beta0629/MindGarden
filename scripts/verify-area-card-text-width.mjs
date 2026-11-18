/**
 * Fail when a card's primary text column is < 40% of the card width (mobile squeeze).
 *
 * Usage:
 *   PLAYWRIGHT_CHROMIUM=/path/to/chrome node scripts/verify-area-card-text-width.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4000';
const OUT = process.env.HOME_VERIFY_OUT || '/opt/cursor/artifacts';
const WIDTH = Number(process.env.AREA_VERIFY_WIDTH || 390);
const HEIGHT = 900;
const THRESHOLD = 0.4;
const EXE =
  process.env.PLAYWRIGHT_CHROMIUM ||
  process.env.CHROME_PATH ||
  '/usr/bin/google-chrome-stable';

const PAGES = [
  { path: '/', selectors: ['.home-area-card', '.area-card'] },
  { path: '/counseling', selectors: ['.area-card'] },
  { path: '/about', selectors: ['.area-list .area-card', '.area-card'] },
  { path: '/location', selectors: ['.area-card'] },
];

fs.mkdirSync(OUT, { recursive: true });

async function scanPage(page, route, selectors) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(400);

  return page.evaluate(
    ({ selectors: sels, threshold }) => {
      const seen = new Set();
      const offenders = [];
      const samples = [];

      const pickTextBlock = (card) => {
        const body = Array.from(card.children).find(
          (el) => el.tagName !== 'IMG' && !el.querySelector?.('img:only-child'),
        );
        if (body) return body;
        return (
          card.querySelector('h2, h3, p') ||
          Array.from(card.children).find((el) => el.tagName !== 'IMG') ||
          null
        );
      };

      for (const sel of sels) {
        for (const card of document.querySelectorAll(sel)) {
          if (seen.has(card)) continue;
          seen.add(card);
          const cardRect = card.getBoundingClientRect();
          if (cardRect.width < 80) continue;

          const style = getComputedStyle(card);
          if (style.display === 'block' || style.display === 'flex') {
            // Text-only / column cards: text uses full content box — skip grid squeeze check.
            if (style.display === 'block' || style.flexDirection === 'column') {
              const textEl = pickTextBlock(card);
              const textRect = textEl?.getBoundingClientRect();
              const ratio = textRect ? textRect.width / cardRect.width : 1;
              samples.push({
                page: location.pathname,
                className: card.className,
                cardW: Math.round(cardRect.width),
                textW: textRect ? Math.round(textRect.width) : null,
                ratio: Number(ratio.toFixed(3)),
                mode: style.display,
              });
              if (textRect && ratio < threshold) {
                offenders.push({
                  page: location.pathname,
                  className: card.className,
                  title: (card.querySelector('h2, h3')?.textContent || '').trim().slice(0, 60),
                  cardW: Math.round(cardRect.width),
                  textW: Math.round(textRect.width),
                  ratio: Number(ratio.toFixed(3)),
                });
              }
              continue;
            }
          }

          const textEl = pickTextBlock(card);
          if (!textEl) continue;
          const textRect = textEl.getBoundingClientRect();
          const ratio = textRect.width / cardRect.width;
          const row = {
            page: location.pathname,
            className: card.className,
            title: (card.querySelector('h2, h3')?.textContent || '').trim().slice(0, 60),
            cardW: Math.round(cardRect.width),
            textW: Math.round(textRect.width),
            ratio: Number(ratio.toFixed(3)),
            mode: style.display,
          };
          samples.push(row);
          if (ratio < threshold) offenders.push(row);
        }
      }
      return { offenders, samples };
    },
    { selectors, threshold: THRESHOLD },
  );
}

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  const allOffenders = [];
  const allSamples = [];

  for (const entry of PAGES) {
    const { offenders, samples } = await scanPage(page, entry.path, entry.selectors);
    allOffenders.push(...offenders);
    allSamples.push(...samples);
  }

  const reportPath = path.join(OUT, `area-card-text-width-${WIDTH}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      { width: WIDTH, threshold: THRESHOLD, offenders: allOffenders, samples: allSamples },
      null,
      2,
    ),
  );

  console.log(`Wrote ${reportPath}`);
  console.log(`Samples: ${allSamples.length}, offenders (<${THRESHOLD * 100}%): ${allOffenders.length}`);
  if (allOffenders.length) {
    console.error(JSON.stringify(allOffenders, null, 2));
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('OK: no text columns under 40% of card width.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
