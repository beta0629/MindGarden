/**
 * Pixel-truth evidence: hero CTA→paint, edge margin, pause cream;
 * bench ambient peak (not logo) clearance.
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import sharp from 'sharp';
import fs from 'node:fs';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const PEAK_WALK_F = 431;
const CREAM = { r: 245, g: 240, b: 230 };

function isSub(data, i, thr = 40) {
  if (data[i + 3] < 20) return false;
  return (
    Math.abs(data[i] - CREAM.r) +
      Math.abs(data[i + 1] - CREAM.g) +
      Math.abs(data[i + 2] - CREAM.b) >
    thr
  );
}

async function rawPng(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function analyzeHeroMedia(file) {
  const { data, info } = await rawPng(file);
  const { width, height, channels } = info;
  let firstYBody = null;
  let firstYAny = null;
  let edgeTop = 0;
  let edgeLeft = 0;
  let edgeRight = 0;
  let edgeBottom = 0;
  for (let y = 0; y < height; y += 1) {
    let hits = 0;
    for (let x = 0; x < width; x += 1) {
      if (isSub(data, (y * width + x) * channels)) hits += 1;
    }
    if (y === 0) edgeTop = hits;
    if (y === height - 1) edgeBottom = hits;
    if (hits > width * 0.005 && firstYAny == null) firstYAny = y;
    if (hits > width * 0.05 && firstYBody == null) firstYBody = y;
  }
  for (let y = 0; y < height; y += 1) {
    if (isSub(data, (y * width) * channels)) edgeLeft += 1;
    if (isSub(data, (y * width + width - 1) * channels)) edgeRight += 1;
  }
  const hard =
    edgeTop > width * 0.03 ||
    edgeLeft > height * 0.03 ||
    edgeRight > height * 0.03 ||
    edgeBottom > width * 0.03;
  return {
    firstYAny,
    firstYBody,
    edge: { t: edgeTop, l: edgeLeft, r: edgeRight, b: edgeBottom },
    hard,
    w: width,
    h: height,
  };
}

async function pauseOnCream(file, pause) {
  // pause: {cx, cy} in media-local CSS px; file is media screenshot at dpr1
  const { data, info } = await rawPng(file);
  const { width, height, channels } = info;
  const x = Math.min(width - 1, Math.max(0, Math.round(pause.cx)));
  const y = Math.min(height - 1, Math.max(0, Math.round(pause.cy)));
  const i = (y * width + x) * channels;
  const rgb = [data[i], data[i + 1], data[i + 2]];
  const d =
    Math.abs(rgb[0] - CREAM.r) +
    Math.abs(rgb[1] - CREAM.g) +
    Math.abs(rgb[2] - CREAM.b);
  return { x, y, rgb, delta: d, onCream: d <= 55 && data[i + 3] > 200 };
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
    () => document.querySelector('.hero-media')?.classList.contains('is-3d'),
    { timeout: 30000 },
  );
  await page.waitForTimeout(1800);
  const started = Date.now();
  const rows = [];
  for (const t of [0, 5, 10]) {
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed < t) await page.waitForTimeout((t - elapsed) * 1000);

    const dom = await page.evaluate(() => {
      const cta = document.querySelector('.hero__secondary');
      const media = document.querySelector('.hero-media');
      const pause = document.querySelector('.hero__pause');
      const ctaR = cta.getBoundingClientRect();
      const mR = media.getBoundingClientRect();
      const pR = pause.getBoundingClientRect();
      const after = getComputedStyle(pause, '::after');
      const cs = getComputedStyle(media);
      return {
        ctaBottom: ctaR.bottom,
        mediaTop: mR.top,
        mediaLeft: mR.left,
        gapBox: +(mR.top - ctaR.bottom).toFixed(1),
        fit: media.dataset.heroFit || '',
        pause: {
          cx: +(pR.left + pR.width / 2 - mR.left).toFixed(1),
          cy: +(pR.top + pR.height / 2 - mR.top).toFixed(1),
          afterW: after.width,
          afterH: after.height,
          inBR:
            pR.left + pR.width / 2 > mR.left + mR.width * 0.5 &&
            pR.top + pR.height / 2 > mR.top + mR.height * 0.5,
        },
        subj: {
          top: cs.getPropertyValue('--hero-subj-top').trim(),
          bottom: cs.getPropertyValue('--hero-subj-bottom').trim(),
          right: cs.getPropertyValue('--hero-subj-right').trim(),
          left: cs.getPropertyValue('--hero-subj-left').trim(),
        },
        pauseVars: {
          x: cs.getPropertyValue('--hero-pause-x').trim(),
          y: cs.getPropertyValue('--hero-pause-y').trim(),
        },
        transform: getComputedStyle(
          document.querySelector('.hero-3d'),
        ).transform,
        cropped: media.classList.contains('is-cropped'),
      };
    });

    const mediaFile = `${OUT}/hero3d-${kind}${width}-t${t}.png`;
    // Visible media (pause on) for edge / subject metrics.
    await page.locator('.hero-media').screenshot({ path: mediaFile });
    if (t === 5) {
      await page.screenshot({
        path: `${OUT}/hero3d-${kind}${width}-full-t5.png`,
        fullPage: false,
      });
    }
    // Cream-under-pause: hide the control so we sample the canvas/page, not the button.
    const creamFile = `${OUT}/hero3d-${kind}${width}-t${t}-nopause.png`;
    await page.evaluate(() => {
      const p = document.querySelector('.hero__pause');
      if (p) p.style.opacity = '0';
    });
    await page.locator('.hero-media').screenshot({ path: creamFile });
    await page.evaluate(() => {
      const p = document.querySelector('.hero__pause');
      if (p) p.style.opacity = '';
    });
    const png = await analyzeHeroMedia(mediaFile);
    const cream = await pauseOnCream(creamFile, dom.pause);

    // Full-page truth: CTA.bottom → first body pixel in media (screen Y).
    const subjGapBody =
      png.firstYBody == null
        ? null
        : +(dom.gapBox + png.firstYBody).toFixed(1);
    const subjGapAny =
      png.firstYAny == null ? null : +(dom.gapBox + png.firstYAny).toFixed(1);

    const row = {
      label: `${kind}${width}-t${t}`,
      gapBox: dom.gapBox,
      subjGapBody,
      subjGapAny,
      firstYBody: png.firstYBody,
      firstYAny: png.firstYAny,
      hard: png.hard,
      edge: png.edge,
      pause: { ...dom.pause, cream },
      subj: dom.subj,
      pauseVars: dom.pauseVars,
      fit: dom.fit,
      cropped: dom.cropped,
      transform: dom.transform,
      file: mediaFile,
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
  await page.evaluate(() => {
    document.querySelector('.home-reviews')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(1000);
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

  const arm = async () => {
    await page.evaluate(() => {
      const section = document.querySelector('.home-reviews');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY || 0;
      const triggerY =
        0.42 * (rect.height + window.innerHeight) -
        window.innerHeight +
        (scrollY + rect.top);
      window.scrollTo(0, Math.max(0, triggerY + 4));
    });
  };
  await arm();

  // Hit true peak window; reverse if we overshoot past track end (431).
  const deadline = Date.now() + 16000;
  let peaked = false;
  while (Date.now() < deadline) {
    const st = await page.evaluate(() => ({
      f: Number(document.querySelector('.v37-scene--bench')?.dataset?.walkF || 0),
      painted: Number(
        document.querySelector('.v37-scene--bench')?.dataset?.ambientPainted || 0,
      ),
    }));
    // Peak window: allow slight overshoot — ambient track holds the final pose.
    if (st.f >= PEAK_WALK_F - 2 && st.f <= PEAK_WALK_F + 2 && st.painted >= 1) {
      peaked = true;
      break;
    }
    if (st.f > PEAK_WALK_F + 8) {
      await page.evaluate(() => {
        const section = document.querySelector('.home-reviews');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const scrollY = window.scrollY || 0;
        const triggerY =
          0.42 * (rect.height + window.innerHeight) -
          window.innerHeight +
          (scrollY + rect.top);
        window.scrollTo(0, Math.max(0, triggerY - window.innerHeight * 0.55));
      });
      await page
        .waitForFunction(
          (floor) => {
            const f = Number(
              document.querySelector('.v37-scene--bench')?.dataset?.walkF || 0,
            );
            return f > 0 && f <= floor;
          },
          PEAK_WALK_F - 10,
          { timeout: 8000 },
        )
        .catch(() => null);
      await arm();
    }
    await page.waitForTimeout(25);
  }

  await page.waitForTimeout(60);

  const metrics = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const brand = document.querySelector(
      '.site-header .brand__mark, .site-header img, .site-header svg',
    );
    const wrap = document.querySelector('.v37-scene--bench');
    const canvas = document.querySelector(
      '.v37-scene--bench .v37-scene__canvas--overflow',
    );
    if (!header || !wrap || !canvas) return { error: 'missing' };
    const headerBottom = header.getBoundingClientRect().bottom;
    const brandR = brand?.getBoundingClientRect();
    const canvasR = canvas.getBoundingClientRect();
    const ambientTop = Number(wrap.dataset.ambientTop || NaN);
    const ambientPainted = Number(wrap.dataset.ambientPainted || 0);
    const walkF = wrap.dataset.walkF || '';

    // Canvas pixel search excluding brand screen rect.
    let pixelTop = NaN;
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
      const cream = [245, 240, 230];
      outer: for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          if (data[i + 3] < 30) continue;
          const d =
            Math.abs(data[i] - cream[0]) +
            Math.abs(data[i + 1] - cream[1]) +
            Math.abs(data[i + 2] - cream[2]);
          if (d <= 70) continue;
          const sy = canvasR.top + (y / height) * canvasR.height;
          const sx = canvasR.left + (x / width) * canvasR.width;
          if (
            brandR &&
            sy <= brandR.bottom + 8 &&
            sx >= brandR.left - 8 &&
            sx <= brandR.right + 8
          ) {
            continue;
          }
          // Must be inside canvas (ambient), not header.
          if (sy < headerBottom + 2) continue;
          pixelTop = sy;
          break outer;
        }
      }
    } catch {
      /* ignore */
    }

    const butterflyTop = Number.isFinite(ambientTop)
      ? ambientTop
      : pixelTop;
    return {
      headerBottom: +headerBottom.toFixed(1),
      canvasTop: +canvasR.top.toFixed(1),
      ambientTop: Number.isFinite(ambientTop) ? +ambientTop.toFixed(1) : null,
      pixelTop: Number.isFinite(pixelTop) ? +pixelTop.toFixed(1) : null,
      butterflyTop: Number.isFinite(butterflyTop)
        ? +butterflyTop.toFixed(1)
        : null,
      clearance: Number.isFinite(butterflyTop)
        ? +(butterflyTop - headerBottom).toFixed(1)
        : null,
      ambientPainted,
      walkF,
      translate: wrap.style.translate || wrap.style.transform || '',
      hOverflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  metrics.peaked = peaked;

  const file = `${OUT}/bench-peak-${kind}${width}.png`;
  const vp = `${OUT}/bench-peak-${kind}${width}-viewport.png`;
  await page.screenshot({ path: vp, fullPage: false });
  await page
    .locator('.home-reviews')
    .screenshot({ path: file })
    .catch(() => null);
  const row = { label: `bench-${kind}${width}`, ...metrics, file, viewport: vp };
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
    `${OUT}/hero-bench-form3-evidence-summary.json`,
    JSON.stringify(summary, null, 2),
  );
  console.log('wrote summary');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
