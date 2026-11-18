/**
 * Empty reviews uncrop evidence: full VIEWPORT shots at 3 scroll points
 * × widths 390/1280/1440/1920 × Chromium + WebKit.
 *
 * Naming: reviews-vp-{c,w}{390,1280,1440,1920}-s{1,2,3}.png
 * Scroll: s1 entering / s2 mid (bench+flight) / s3 near exit
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const WIDTHS = [390, 1280, 1440, 1920];
const KINDS = ['c', 'w'];

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

function vpHeight(width) {
  return width <= 430 ? 844 : 900;
}

/**
 * Sample canvas alpha near place bottom (seat/legs/grass) and mid-flight pads.
 * Returns whether non-transparent pixels exist in those bands of the bench canvas.
 */
async function sampleBenchVisibility(page) {
  return page.evaluate(() => {
    const section = document.querySelector('.home-reviews');
    const scene = section?.querySelector('.home-reviews__scene');
    const bench = section?.querySelector('.v37-scene--bench');
    const canvas =
      bench?.querySelector('canvas') ||
      section?.querySelector('.v37-scene__canvas');
    const more = section?.querySelector('.text-link');
    const grid = section?.querySelector('.home-reviews__grid');
    const sR = section.getBoundingClientRect();
    const scR = scene.getBoundingClientRect();
    const bR = bench.getBoundingClientRect();
    const cs = getComputedStyle(section);
    const benchCs = getComputedStyle(bench);
    const sceneCs = getComputedStyle(scene);

    let placeVisible = {
      seatBandAlpha: 0,
      legsBandAlpha: 0,
      grassBandAlpha: 0,
      flightPadAlpha: 0,
      canvasW: 0,
      canvasH: 0,
    };

    if (canvas instanceof HTMLCanvasElement && canvas.width > 8) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = canvas.width;
      const h = canvas.height;
      placeVisible.canvasW = w;
      placeVisible.canvasH = h;

      const sampleBand = (y0Frac, y1Frac, x0Frac = 0.2, x1Frac = 0.8) => {
        const y0 = Math.floor(h * y0Frac);
        const y1 = Math.min(h, Math.ceil(h * y1Frac));
        const x0 = Math.floor(w * x0Frac);
        const x1 = Math.min(w, Math.ceil(w * x1Frac));
        if (y1 <= y0 || x1 <= x0) return 0;
        const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
        let hits = 0;
        for (let i = 3; i < data.length; i += 16) {
          if (data[i] > 8) hits += 1;
        }
        return hits;
      };

      // Place box sits below top pad; seat/legs/grass in lower ~55–95% of canvas.
      placeVisible.flightPadAlpha = sampleBand(0.02, 0.18, 0.05, 0.95);
      placeVisible.seatBandAlpha = sampleBand(0.48, 0.68, 0.15, 0.85);
      placeVisible.legsBandAlpha = sampleBand(0.68, 0.86, 0.2, 0.8);
      placeVisible.grassBandAlpha = sampleBand(0.82, 0.98, 0.1, 0.9);
    }

    const overflowHidden =
      sceneCs.overflow === 'hidden' ||
      sceneCs.overflowY === 'hidden' ||
      benchCs.overflow === 'hidden';

    return {
      empty: section.classList.contains('home-reviews--empty'),
      moreHidden: !more,
      gridAbsent: !grid,
      sectionH: Math.round(sR.height),
      sceneH: Math.round(scR.height),
      benchH: Math.round(bR.height),
      sectionTop: Math.round(sR.top),
      sectionBottom: Math.round(sR.bottom),
      padT: parseFloat(cs.paddingTop),
      padB: parseFloat(cs.paddingBottom),
      benchPadT: parseFloat(benchCs.paddingTop),
      benchPadB: parseFloat(benchCs.paddingBottom),
      benchMarginT: parseFloat(benchCs.marginTop),
      sceneOverflow: `${sceneCs.overflowX}/${sceneCs.overflowY}`,
      overflowHidden,
      hOverflow: section.scrollWidth > section.clientWidth + 1,
      placeVisible,
      seatLegsPresent:
        placeVisible.seatBandAlpha > 20 && placeVisible.legsBandAlpha > 10,
      grassPresent: placeVisible.grassBandAlpha > 10,
    };
  });
}

async function scrollToPoint(page, point) {
  await page.evaluate((p) => {
    const section = document.querySelector('.home-reviews');
    const sR = section.getBoundingClientRect();
    const absTop = window.scrollY + sR.top;
    const vh = window.innerHeight;
    const sh = sR.height;
    let y;
    if (p === 1) {
      // Entering: section top near viewport bottom third → top of section in view
      y = absTop - vh * 0.55;
    } else if (p === 2) {
      // Mid: center section in viewport so full bench + flight pad visible
      y = absTop + sh / 2 - vh / 2;
    } else {
      // Near exit: section bottom near top of viewport
      y = absTop + sh - vh * 0.45;
    }
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  }, point);
  await page.waitForTimeout(point === 2 ? 1800 : 700);
}

async function captureKindWidth(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: vpHeight(width) },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page
    .waitForFunction(
      () => {
        const c = document.querySelector(
          '.home-reviews .v37-scene--bench canvas, .home-reviews .v37-scene__canvas',
        );
        return c instanceof HTMLCanvasElement && c.width > 8;
      },
      { timeout: 60000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(800);

  const rows = [];
  for (const s of [1, 2, 3]) {
    await scrollToPoint(page, s);
    const file = `${OUT}/reviews-vp-${kind}${width}-s${s}.png`;
    await page.screenshot({ path: file, fullPage: false });
    const metrics = await sampleBenchVisibility(page);
    rows.push({ kind, width, scroll: s, file, ...metrics });
    process.stderr.write(
      `${kind}${width}-s${s}: sectionH=${metrics.sectionH} sceneH=${metrics.sceneH} ` +
        `seat=${metrics.seatLegsPresent} grass=${metrics.grassPresent} ` +
        `padT=${metrics.benchPadT} marginT=${metrics.benchMarginT} ` +
        `overflowHidden=${metrics.overflowHidden}\n`,
    );
  }

  await browser.close();
  return rows;
}

async function main() {
  const all = [];
  for (const kind of KINDS) {
    for (const width of WIDTHS) {
      process.stderr.write(`\n=== ${kind}${width} ===\n`);
      all.push(...(await captureKindWidth(kind, width)));
    }
  }

  const summary = {
    ok: all.every(
      (r) =>
        r.empty &&
        r.moreHidden &&
        r.gridAbsent &&
        !r.overflowHidden &&
        !r.hOverflow &&
        r.benchPadT > 1 &&
        r.benchMarginT >= -0.5 &&
        r.sectionH > 400 &&
        (r.scroll !== 2 || (r.seatLegsPresent && r.grassPresent)),
    ),
    count: all.length,
    rows: all,
  };

  fs.writeFileSync(
    `${OUT}/empty-reviews-uncrop-summary.json`,
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) {
    console.error('empty-reviews-uncrop: FAIL — see summary');
    process.exit(1);
  }
  console.log(`empty-reviews-uncrop: OK — ${all.length} viewport shots`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
