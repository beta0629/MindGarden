/**
 * Follow-up evidence: hero subjGap @390 + true bench peak clearance.
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import sharp from 'sharp';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const PEAK_WALK_F = 431;

async function analyzeMedia(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const cream = { r: 245, g: 240, b: 230 };
  let firstY = null;
  let edgeTop = 0;
  let edgeLeft = 0;
  let edgeRight = 0;
  let edgeBottom = 0;
  const isSub = (i) => {
    if (data[i + 3] < 20) return false;
    return (
      Math.abs(data[i] - cream.r) +
        Math.abs(data[i + 1] - cream.g) +
        Math.abs(data[i + 2] - cream.b) >
      40
    );
  };
  for (let y = 0; y < height; y += 1) {
    let hits = 0;
    for (let x = 0; x < width; x += 1) {
      if (isSub((y * width + x) * channels)) hits += 1;
    }
    if (y === 0) edgeTop = hits;
    if (y === height - 1) edgeBottom = hits;
    if (hits > width * 0.015 && firstY == null) firstY = y;
  }
  for (let y = 0; y < height; y += 1) {
    if (isSub((y * width) * channels)) edgeLeft += 1;
    if (isSub((y * width + width - 1) * channels)) edgeRight += 1;
  }
  return {
    firstY,
    edgeTop,
    edgeLeft,
    edgeRight,
    edgeBottom,
    hard:
      edgeTop > width * 0.04 ||
      edgeLeft > height * 0.04 ||
      edgeRight > height * 0.04 ||
      edgeBottom > width * 0.04,
    w: width,
    h: height,
  };
}

async function launch(kind) {
  if (kind === 'c') {
    return chromium.launch({ headless: true, executablePath: CHROME });
  }
  return webkit.launch({ headless: true });
}

async function captureHero(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForFunction(
    () =>
      document.querySelector('.hero-media')?.classList.contains('is-3d') &&
      document.querySelector('.hero-media')?.classList.contains('is-cropped'),
    { timeout: 30000 },
  );
  await page.waitForTimeout(1500);
  const started = Date.now();
  const rows = [];
  for (const t of [0, 5, 10]) {
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed < t) await page.waitForTimeout((t - elapsed) * 1000);
    const dom = await page.evaluate(() => {
      const inquiry = document.querySelector('.hero__secondary');
      const media = document.querySelector('.hero-media');
      const pause = document.querySelector('.hero__pause');
      const iR = inquiry.getBoundingClientRect();
      const mR = media.getBoundingClientRect();
      const pR = pause?.getBoundingClientRect();
      const after = pause ? getComputedStyle(pause, '::after') : null;
      const cs = getComputedStyle(media);
      return {
        gapBox: +(mR.top - iR.bottom).toFixed(1),
        cropH: cs.height,
        glH: cs.getPropertyValue('--hero-gl-h').trim(),
        pause: pause
          ? {
              afterW: after.width,
              afterH: after.height,
              insetR: +(mR.right - pR.right).toFixed(1),
              insetB: +(mR.bottom - pR.bottom).toFixed(1),
              cy: +(pR.top + pR.height / 2 - mR.top).toFixed(1),
            }
          : null,
        subj: {
          top: cs.getPropertyValue('--hero-subj-top').trim(),
          bottom: cs.getPropertyValue('--hero-subj-bottom').trim(),
          right: cs.getPropertyValue('--hero-subj-right').trim(),
        },
        transform: getComputedStyle(document.querySelector('.hero-3d')).transform,
      };
    });
    const file = `${OUT}/hero3d-${kind}${width}-t${t}.png`;
    await page.locator('.hero-media').screenshot({ path: file });
    if (t === 5) {
      await page.screenshot({
        path: `${OUT}/hero3d-${kind}${width}-full-t5.png`,
        fullPage: false,
      });
    }
    const png = await analyzeMedia(file);
    const row = {
      label: `${kind}${width}-t${t}`,
      gapBox: dom.gapBox,
      subjGap: png.firstY == null ? null : +(dom.gapBox + png.firstY).toFixed(1),
      firstY: png.firstY,
      hard: png.hard,
      edge: {
        t: png.edgeTop,
        l: png.edgeLeft,
        r: png.edgeRight,
        b: png.edgeBottom,
      },
      pause: dom.pause,
      subj: dom.subj,
      cropH: dom.cropH,
      glH: dom.glH,
      transform: dom.transform,
      file,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  await browser.close();
  return rows;
}

async function captureBenchPeak(kind, width) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });

  // Warm assets near the section.
  await page.evaluate(() => {
    document.querySelector('.home-reviews')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(800);
  await page
    .waitForFunction(
      () => {
        const c = document.querySelector(
          '.v37-scene--bench .v37-scene__canvas--overflow',
        );
        return Boolean(c && c.width > 0);
      },
      { timeout: 45000 },
    )
    .catch(() => null);

  /*
   * Ambient tracks end at walkF=431 (true peak Y). Capture inside [428, 431]
   * immediately — past 431 trackAt returns null and butterflies vanish.
   */
  const armBench = async () => {
    await page.evaluate(() => {
      const section = document.querySelector('.home-reviews');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY || 0;
      const sectionTop = scrollY + rect.top;
      const sectionHeight = Math.max(1, rect.height);
      const vh = window.innerHeight || 1;
      const triggerY = 0.42 * (sectionHeight + vh) - vh + sectionTop;
      window.scrollTo(0, Math.max(0, triggerY + 4));
    });
  };
  await armBench();

  // Poll until we enter the peak window (or reverse back into it).
  const peakDeadline = Date.now() + 14000;
  let peaked = false;
  while (Date.now() < peakDeadline) {
    const f = await page.evaluate(() =>
      Number(document.querySelector('.v37-scene--bench')?.dataset?.walkF || 0),
    );
    if (f >= PEAK_WALK_F - 3 && f <= PEAK_WALK_F + 0.2) {
      peaked = true;
      break;
    }
    if (f > PEAK_WALK_F + 0.5) {
      // Reverse: scroll above trigger so clock walks back, then re-arm.
      await page.evaluate(() => {
        const section = document.querySelector('.home-reviews');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const scrollY = window.scrollY || 0;
        const sectionTop = scrollY + rect.top;
        const sectionHeight = Math.max(1, rect.height);
        const vh = window.innerHeight || 1;
        const triggerY = 0.42 * (sectionHeight + vh) - vh + sectionTop;
        window.scrollTo(0, Math.max(0, triggerY - vh * 0.6));
      });
      await page.waitForFunction(
        (floor) => {
          const wf = Number(
            document.querySelector('.v37-scene--bench')?.dataset?.walkF || 0,
          );
          return wf > 0 && wf <= floor;
        },
        PEAK_WALK_F - 8,
        { timeout: 8000 },
      ).catch(() => null);
      await armBench();
    }
    await page.waitForTimeout(30);
  }
  if (!peaked) {
    console.warn(`bench-${kind}${width}: failed to hit peak window`);
  }
  await page.waitForTimeout(40);

  const metrics = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const canvas = document.querySelector(
      '.v37-scene--bench .v37-scene__canvas--overflow',
    );
    const wrap = document.querySelector('.v37-scene--bench');
    if (!header || !canvas || !wrap) return { error: 'missing' };
    const headerBottom = header.getBoundingClientRect().bottom;
    const canvasR = canvas.getBoundingClientRect();
    let highestButterflyY = canvasR.top + canvasR.height;
    let found = false;
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
      // Sparse top-of-canvas butterflies: any opaque run ≥1px counts.
      for (let y = 0; y < height; y += 1) {
        let hit = 0;
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 20) hit += 1;
        }
        if (hit >= 1) {
          highestButterflyY = canvasR.top + (y / height) * canvasR.height;
          found = true;
          break;
        }
      }
    } catch {
      /* keep fallback */
    }
    return {
      headerBottom: +headerBottom.toFixed(1),
      canvasTop: +canvasR.top.toFixed(1),
      highestButterflyY: +highestButterflyY.toFixed(1),
      clearance: +(highestButterflyY - headerBottom).toFixed(1),
      walkF: wrap.dataset.walkF || '',
      translate: wrap.style.translate || '',
      hOverflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
      nearCanvasTop: found && highestButterflyY - canvasR.top < 120,
      found,
    };
  });

  const file = `${OUT}/bench-peak-${kind}${width}.png`;
  await page
    .locator('.home-reviews')
    .screenshot({ path: file })
    .catch(() => page.screenshot({ path: file, fullPage: false }));
  const row = { label: `bench-${kind}${width}`, ...metrics, file };
  console.log(JSON.stringify(row));
  await browser.close();
  return row;
}

async function main() {
  const summary = { hero: [], bench: [] };
  for (const w of [390, 1440]) {
    summary.hero.push(...(await captureHero('c', w)));
  }
  for (const w of [390, 1440]) {
    summary.hero.push(...(await captureHero('w', w)));
  }
  for (const w of [1280, 1440, 1920]) {
    summary.bench.push(await captureBenchPeak('c', w));
  }
  for (const w of [1280, 1440, 1920]) {
    summary.bench.push(await captureBenchPeak('w', w));
  }
  fs.writeFileSync(
    `${OUT}/hero-bench-fix2-evidence-summary.json`,
    JSON.stringify(summary, null, 2),
  );
  console.log('wrote summary');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
