/**
 * Sticky header + empty-reviews flight-pad evidence.
 * Artifacts: sticky-pad-{w390|c1440}-y{scroll}.png + sticky-pad-summary.json
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';

const RUNS = [
  { kind: 'w', width: 390, height: 844, label: 'w390' },
  { kind: 'c', width: 1440, height: 900, label: 'c1440' },
];

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

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const reviews = document.querySelector('.home-reviews');
    const title = reviews?.querySelector('.section__title');
    const bench = reviews?.querySelector('.v37-scene--bench');
    const canvas =
      bench?.querySelector('canvas.v37-scene__canvas--overflow') ||
      bench?.querySelector('canvas');
    const hCs = header ? getComputedStyle(header) : null;
    const bCs = bench ? getComputedStyle(bench) : null;
    const rCs = reviews ? getComputedStyle(reviews) : null;
    const hR = header?.getBoundingClientRect();
    const tR = title?.getBoundingClientRect();
    const bR = bench?.getBoundingClientRect();
    const cR = canvas?.getBoundingClientRect();
    const creamAboveTitle =
      tR && reviews
        ? Math.round(tR.top - reviews.getBoundingClientRect().top)
        : null;

    let flightPadAlpha = 0;
    let seatBandAlpha = 0;
    if (canvas instanceof HTMLCanvasElement && canvas.width > 8) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = canvas.width;
      const h = canvas.height;
      const sample = (y0, y1, x0 = 0.1, x1 = 0.9) => {
        const yy0 = Math.floor(h * y0);
        const yy1 = Math.min(h, Math.ceil(h * y1));
        const xx0 = Math.floor(w * x0);
        const xx1 = Math.min(w, Math.ceil(w * x1));
        if (yy1 <= yy0 || xx1 <= xx0) return 0;
        const data = ctx.getImageData(xx0, yy0, xx1 - xx0, yy1 - yy0).data;
        let hits = 0;
        for (let i = 3; i < data.length; i += 20) {
          if (data[i] > 8) hits += 1;
        }
        return hits;
      };
      flightPadAlpha = sample(0.02, 0.2, 0.05, 0.95);
      seatBandAlpha = sample(0.5, 0.72, 0.15, 0.85);
    }

    return {
      scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
      headerPosition: hCs?.position || null,
      headerTopCss: hCs?.top || null,
      headerTop: hR ? Math.round(hR.top * 10) / 10 : null,
      headerHeight: hR ? Math.round(hR.height) : null,
      bodyPadTop: parseFloat(getComputedStyle(document.body).paddingTop) || 0,
      headerStickyVar:
        getComputedStyle(document.documentElement).getPropertyValue(
          '--header-sticky-h',
        ) || null,
      reviewsEmpty: reviews?.classList.contains('home-reviews--empty') || false,
      creamAboveTitle,
      titleTop: tR ? Math.round(tR.top) : null,
      benchTop: bR ? Math.round(bR.top) : null,
      benchPadT: bCs ? parseFloat(bCs.paddingTop) : null,
      benchH: bR ? Math.round(bR.height) : null,
      canvasTop: cR ? Math.round(cR.top) : null,
      canvasAboveBench:
        cR && bR ? Math.round((bR.top - cR.top) * 10) / 10 : null,
      reviewsOverflow: rCs ? `${rCs.overflowX}/${rCs.overflowY}` : null,
      flightPadAlpha,
      seatBandAlpha,
      hOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function waitHome(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.site-header', { timeout: 30000 });
  await page.waitForSelector('.home-reviews', { timeout: 30000 });
  // Allow bench canvas / reveal boot to settle.
  await page.waitForTimeout(2500);
}

async function scrollSteps(page, width, height) {
  const info = await page.evaluate(() => {
    const reviews = document.querySelector('.home-reviews');
    const areas = document.querySelector('.home-areas');
    const docH = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    return {
      reviewsTop: reviews
        ? Math.round(reviews.getBoundingClientRect().top + window.scrollY)
        : 0,
      areasTop: areas
        ? Math.round(areas.getBoundingClientRect().top + window.scrollY)
        : Math.round(window.innerHeight * 0.8),
      docH,
      vh: window.innerHeight,
    };
  });

  // Full-viewport scroll steps covering hero → areas → reviews → mid/end.
  const targets = [
    0,
    Math.max(0, info.areasTop - Math.round(height * 0.35)),
    Math.max(0, info.reviewsTop - Math.round(height * 0.85)),
    Math.max(0, info.reviewsTop - Math.round(height * 0.35)),
    Math.max(0, info.reviewsTop + Math.round(height * 0.1)),
    Math.min(
      Math.max(0, info.docH - height),
      info.reviewsTop + Math.round(height * 0.55),
    ),
  ];

  // Deduplicate nearby targets.
  const uniq = [];
  for (const y of targets) {
    if (!uniq.some((u) => Math.abs(u - y) < 40)) uniq.push(y);
  }
  return uniq;
}

async function runOne(run) {
  const browser = await launch(run.kind);
  const page = await browser.newPage({
    viewport: { width: run.width, height: run.height },
    deviceScaleFactor: 1,
  });
  const results = [];
  try {
    await waitHome(page);
    const steps = await scrollSteps(page, run.width, run.height);
    for (const y of steps) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(700);
      const m = await measure(page);
      const yLabel = m.scrollY;
      const file = `sticky-pad-${run.label}-y${yLabel}.png`;
      const path = `${OUT}/${file}`;
      await page.screenshot({ path, fullPage: false });
      results.push({ file, ...m, targetY: y });
    }
  } finally {
    await browser.close();
  }
  return { label: run.label, kind: run.kind, width: run.width, results };
}

fs.mkdirSync(OUT, { recursive: true });
const summary = {
  base: BASE,
  capturedAt: new Date().toISOString(),
  runs: [],
  pass: { headerTopAlwaysZero: true, lessCreamAboveTitle: null, notes: [] },
};

for (const run of RUNS) {
  console.log('run', run.label);
  const one = await runOne(run);
  summary.runs.push(one);
  for (const r of one.results) {
    const topOk = r.headerTop != null && Math.abs(r.headerTop) <= 1.5;
    if (!topOk) {
      summary.pass.headerTopAlwaysZero = false;
      summary.pass.notes.push(
        `${run.label} y${r.scrollY}: headerTop=${r.headerTop}`,
      );
    }
  }
  const reviewsShot = one.results.find(
    (r) => r.creamAboveTitle != null && r.titleTop != null && r.titleTop < 700,
  );
  if (reviewsShot) {
    summary.pass.notes.push(
      `${run.label} creamAboveTitle=${reviewsShot.creamAboveTitle} benchPadT=${reviewsShot.benchPadT} canvasAboveBench=${reviewsShot.canvasAboveBench} flightPadAlpha=${reviewsShot.flightPadAlpha} seatBandAlpha=${reviewsShot.seatBandAlpha}`,
    );
  }
}

const outPath = `${OUT}/sticky-pad-summary.json`;
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('wrote', outPath);
process.exit(summary.pass.headerTopAlwaysZero ? 0 : 1);
