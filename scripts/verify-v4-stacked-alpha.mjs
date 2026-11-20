/**
 * Verify v4 stacked-alpha home scenes (Chromium 1440 + WebKit 390).
 * Usage: node scripts/verify-v4-stacked-alpha.mjs [baseUrl]
 */
import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const BASE = process.argv[2] || 'http://127.0.0.1:4000';
const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

const SCENE_BG = {
  hero: [245, 240, 230],
  gate: [234, 226, 210],
  bench: [245, 240, 230],
  booking: [234, 226, 210],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withTimeout(promise, ms, label) {
  let t;
  try {
    return await Promise.race([
      promise,
      new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`timeout:${label}:${ms}`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(t);
  }
}

async function pixelBorderScan(page, selector, bgRgb) {
  const box = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, selector);
  if (!box || box.w < 2 || box.h < 2) return { maxDiff: 999, ok: false };
  const shot = await page.screenshot({ type: 'png' });
  const { data, info } = await sharp(shot)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const get = (x, y) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= width || yi >= height) return null;
    const i = (yi * width + xi) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  // Sample 1px inside the box corners/edges — stacked-alpha UV feather makes
  // the outermost texels fully transparent against the section background.
  // (Outside samples can hit sticky header / sibling photos and are not valid.)
  const pts = [
    [box.x + 1, box.y + 1],
    [box.x + box.w - 2, box.y + 1],
    [box.x + 1, box.y + box.h - 2],
    [box.x + box.w - 2, box.y + box.h - 2],
    [box.x + box.w / 2, box.y + 1],
    [box.x + box.w / 2, box.y + box.h - 2],
    [box.x + 1, box.y + box.h / 2],
    [box.x + box.w - 2, box.y + box.h / 2],
  ];
  let maxDiff = 0;
  for (const [x, y] of pts) {
    const p = get(x, y);
    if (!p) continue;
    maxDiff = Math.max(
      maxDiff,
      Math.abs(p[0] - bgRgb[0]),
      Math.abs(p[1] - bgRgb[1]),
      Math.abs(p[2] - bgRgb[2]),
    );
  }
  return { maxDiff, ok: maxDiff === 0, box };
}

async function sceneStats(page, sceneSel) {
  return page.evaluate((sceneSel) => {
    const root = document.querySelector(sceneSel);
    if (!root) return null;
    const videos = [...root.querySelectorAll('video')];
    const canvases = [...root.querySelectorAll('canvas')];
    return {
      videos: videos.length,
      canvases: canvases.length,
      videoSrcs: videos
        .map((v) => v.currentSrc || v.src)
        .map((s) => s.split('/').pop()),
      paused: videos.map((v) => v.paused),
      currentTime: videos.map((v) => Number(v.currentTime.toFixed(3))),
      ready: canvases.map((c) => c.dataset.ready || '0'),
      hidden: canvases.map((c) => c.dataset.hidden || '0'),
      liveClass: root.className.includes('is-live'),
    };
  }, sceneSel);
}

async function measureFps(page, sceneSel, durationMs = 800) {
  return withTimeout(
    page.evaluate(
      async ({ sceneSel, durationMs }) => {
        const root = document.querySelector(sceneSel);
        const video = root?.querySelector('video');
        if (!video) return { fps: 0, frames: 0, mode: 'none' };
        if (video.paused || video.ended) {
          return {
            fps: 0,
            frames: 0,
            mode: 'paused',
            currentTime: video.currentTime,
          };
        }
        let frames = 0;
        const t0 = performance.now();
        if (typeof video.requestVideoFrameCallback === 'function') {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };
            const timer = setTimeout(finish, durationMs + 200);
            const cb = (_now, meta) => {
              frames += 1;
              if (
                performance.now() - t0 >= durationMs ||
                video.paused ||
                video.ended
              ) {
                clearTimeout(timer);
                finish();
                return;
              }
              video.requestVideoFrameCallback(cb);
            };
            video.requestVideoFrameCallback(cb);
          });
          const elapsed = Math.max(0.001, (performance.now() - t0) / 1000);
          return {
            fps: Number((frames / elapsed).toFixed(1)),
            frames,
            mode: 'rvfc',
          };
        }
        return { fps: null, frames: 0, mode: 'no-rvfc' };
      },
      { sceneSel, durationMs },
    ),
    durationMs + 1500,
    `fps:${sceneSel}`,
  ).catch((e) => ({ fps: null, error: String(e.message || e) }));
}

async function forcePastTrigger(page, selector, triggerP) {
  await page.evaluate(
    ({ selector, triggerP }) => {
      const el = document.querySelector(selector);
      const section = el?.closest('section') || el;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = section.offsetHeight;
      const vh = window.innerHeight;
      const triggerY = triggerP * (sectionHeight + vh) - vh + sectionTop;
      window.scrollTo(0, Math.max(0, triggerY + 12));
    },
    { selector, triggerP },
  );
  await sleep(250);
}

async function waitReady(page, sel, ms = 10000) {
  return page
    .waitForFunction(
      (sel) => !!document.querySelector(`${sel} canvas[data-ready="1"]`),
      sel,
      { timeout: ms },
    )
    .then(() => true)
    .catch(() => false);
}

async function runEngine(browserType, label, viewport, deviceName) {
  console.error(`[${label}] launch`);
  // Headless shell lacks H.264 — use system Chrome for Chromium runs.
  const launchOpts =
    browserType === chromium
      ? {
          headless: true,
          channel: 'chrome',
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--autoplay-policy=no-user-gesture-required',
          ],
        }
      : { headless: true };
  const browser = await browserType.launch(launchOpts);
  const context = await browser.newContext({
    ...(deviceName ? devices[deviceName] : { viewport, deviceScaleFactor: 1 }),
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const result = { engine: label, viewport, scenes: {} };
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.hero-media', { timeout: 12000 });
  // Poster gate + hero idle import + deferred scene chunks.
  await sleep(2500);

  const heroReady = await waitReady(page, '.hero-media', 15000);
  result.heroFirstFrameMs = heroReady ? Date.now() - t0 : null;
  await page.screenshot({ path: path.join(OUT, `v4-${label}-hero.png`) });
  result.scenes.hero = {
    ready: heroReady,
    stats: await sceneStats(page, '.hero-media'),
    borderPx: await pixelBorderScan(page, '.hero-media__stage', SCENE_BG.hero),
    fps: await measureFps(page, '.hero-media', 700),
  };
  console.error(`[${label}] hero`, result.scenes.hero.fps, result.heroFirstFrameMs);

  const gateTrig = viewport.width >= 768 ? 0.5291 : 0.4365;
  await forcePastTrigger(page, '.v37-scene--gate', gateTrig);
  await waitReady(page, '.v37-scene--gate', 12000);
  await sleep(900);
  const gateFps = await measureFps(page, '.v37-scene--gate', 600);
  await sleep(1800);
  await page.screenshot({ path: path.join(OUT, `v4-${label}-gate.png`) });
  result.scenes.gate = {
    stats: await sceneStats(page, '.v37-scene--gate'),
    borderPx: await pixelBorderScan(page, '.v37-scene--gate', SCENE_BG.gate),
    fps: gateFps,
    holdsLast: await page.evaluate(() => {
      const v = document.querySelector('.v37-scene--gate video');
      if (!v) return false;
      const nearEnd =
        v.duration > 0 && v.currentTime >= Math.max(0, v.duration - 0.05);
      return Boolean(v.paused && (nearEnd || v.currentTime > 0.4));
    }),
  };
  console.error(`[${label}] gate`, result.scenes.gate.holdsLast, gateFps);

  const benchTrig = viewport.width >= 768 ? 0.5082 : 0.5057;
  await forcePastTrigger(page, '.v37-scene--bench', benchTrig);
  await sleep(650);
  await waitReady(page, '.v37-scene--bench', 12000);
  await sleep(500);
  const benchFps = await measureFps(page, '.v37-scene--bench', 700);
  await page.screenshot({ path: path.join(OUT, `v4-${label}-bench-mid.png`) });
  await sleep(3200);
  result.scenes.bench = {
    stats: await sceneStats(page, '.v37-scene--bench'),
    borderPx: await pixelBorderScan(page, '.v37-scene--bench', SCENE_BG.bench),
    fps: benchFps,
    hiddenAfterEnd: await page.evaluate(() => {
      const root = document.querySelector('.v37-scene--bench');
      if (!root) return false;
      const canvases = [...root.querySelectorAll('canvas')];
      const videos = [...root.querySelectorAll('video')];
      // Videos unmounted after end, or canvases marked hidden / opacity 0.
      if (canvases.length === 0 && videos.length === 0) {
        return !!root.querySelector('.v37-bench__body');
      }
      return canvases.every(
        (c) =>
          c.dataset.hidden === '1' ||
          c.style.opacity === '0' ||
          getComputedStyle(c).opacity === '0',
      );
    }),
  };
  await page.screenshot({ path: path.join(OUT, `v4-${label}-bench-end.png`) });
  console.error(`[${label}] bench`, result.scenes.bench.hiddenAfterEnd, benchFps);

  const bookTrig = viewport.width >= 768 ? 0.5612 : 0.5659;
  await forcePastTrigger(page, '.v37-scene--booking', bookTrig);
  await waitReady(page, '.v37-scene--booking', 12000);
  await sleep(400);
  await page.screenshot({
    path: path.join(OUT, `v4-${label}-booking-landing.png`),
  });
  const bookingFps = await measureFps(page, '.v37-scene--booking', 600);
  const swap = await withTimeout(
    page.evaluate(async () => {
      const root = document.querySelector('.v37-scene--booking');
      const v = root?.querySelector('video');
      if (!v) return { ok: false, reason: 'no-video' };
      const before = (v.currentSrc || v.src).split('/').pop();
      if (before.includes('breathe')) {
        return { ok: true, before, after: before, blank: false, already: true };
      }
      const t0 = performance.now();
      let after = before;
      let blank = false;
      while (performance.now() - t0 < 3500) {
        const src = (v.currentSrc || v.src).split('/').pop();
        if (src.includes('breathe')) {
          after = src;
          const c = root.querySelector('canvas');
          if (c && getComputedStyle(c).opacity === '0') blank = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      return {
        ok: after.includes('breathe'),
        before,
        after,
        blank,
        t: Number(((performance.now() - t0) / 1000).toFixed(2)),
      };
    }),
    5000,
    'booking-swap',
  ).catch((e) => ({ ok: false, error: String(e.message || e) }));
  await page.screenshot({
    path: path.join(OUT, `v4-${label}-booking-breathe.png`),
  });
  result.scenes.booking = {
    stats: await sceneStats(page, '.v37-scene--booking'),
    borderPx: await pixelBorderScan(
      page,
      '.v37-scene--booking',
      SCENE_BG.booking,
    ),
    fps: bookingFps,
    landingToBreathe: swap,
  };
  console.error(`[${label}] booking`, swap);

  result.bootBarPresent = await page.evaluate(
    () => !!document.querySelector('.home-boot-progress'),
  );
  result.clsApprox = await page.evaluate(() => {
    let cls = 0;
    try {
      const entries = performance.getEntriesByType('layout-shift');
      for (const e of entries) if (!e.hadRecentInput) cls += e.value;
    } catch {
      /* ignore */
    }
    return Number(cls.toFixed(4));
  });
  result.consoleErrors = consoleErrors.filter(
    (t) => !/favicon|net::ERR|Failed to load resource/i.test(t),
  );

  await context.close();
  await browser.close();

  console.error(`[${label}] reduced-motion`);
  const browser2 = await browserType.launch(launchOpts);
  const ctx2 = await browser2.newContext({
    ...(deviceName ? devices[deviceName] : { viewport }),
    reducedMotion: 'reduce',
  });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(1800);
  result.reducedMotion = await page2.evaluate(() => {
    const roots = [
      ...document.querySelectorAll(
        '.hero-media, .v37-scene--gate, .v37-scene--bench, .v37-scene--booking',
      ),
    ];
    let videos = 0;
    let canvases = 0;
    for (const s of roots) {
      videos += s.querySelectorAll('video').length;
      canvases += s.querySelectorAll('canvas').length;
    }
    return { videos, canvases };
  });
  await page2.screenshot({
    path: path.join(OUT, `v4-${label}-reduced-motion.png`),
  });
  await ctx2.close();
  await browser2.close();
  console.error(`[${label}] done`, result.reducedMotion);
  return result;
}

const results = [];
try {
  results.push(
    await runEngine(
      chromium,
      'chromium-1440',
      { width: 1440, height: 900 },
      null,
    ),
  );
} catch (e) {
  console.error('chromium failed', e);
  results.push({ engine: 'chromium-1440', error: String(e) });
}
try {
  results.push(
    await runEngine(webkit, 'webkit-390', { width: 390, height: 844 }, 'iPhone 13'),
  );
} catch (e) {
  console.error('webkit failed', e);
  results.push({ engine: 'webkit-390', error: String(e) });
}

const outPath = path.join(OUT, 'v4-stacked-alpha-verify.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log('Wrote', outPath);
