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

/**
 * Edge check: screenshot with canvas visible vs forced-hidden, diff pixels
 * inside the stage (excludes sticky header / section-bg outside samples).
 */
async function canvasEdgeDiff(page, stageSel) {
  const box = await page.evaluate((stageSel) => {
    const el = document.querySelector(stageSel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.floor(r.x)),
      y: Math.max(0, Math.floor(r.y)),
      w: Math.floor(r.width),
      h: Math.floor(r.height),
    };
  }, stageSel);
  if (!box || box.w < 4 || box.h < 4) {
    return { ok: false, maxDiff: 0, reason: 'no-box' };
  }

  const canvases = `${stageSel} canvas`;
  await page.evaluate((sel) => {
    for (const c of document.querySelectorAll(sel)) {
      c.dataset._prevOpacity = c.style.opacity || '';
      c.style.opacity = '1';
      c.style.visibility = 'visible';
    }
  }, canvases);
  const shownPng = await page.screenshot({ type: 'png' });

  await page.evaluate((sel) => {
    for (const c of document.querySelectorAll(sel)) {
      c.style.opacity = '0';
      c.style.visibility = 'hidden';
    }
  }, canvases);
  const hiddenPng = await page.screenshot({ type: 'png' });

  await page.evaluate((sel) => {
    for (const c of document.querySelectorAll(sel)) {
      const prev = c.dataset._prevOpacity ?? '';
      if (prev) c.style.opacity = prev;
      else c.style.removeProperty('opacity');
      c.style.removeProperty('visibility');
      delete c.dataset._prevOpacity;
    }
  }, canvases);

  const shown = await sharp(shownPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const hidden = await sharp(hiddenPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = shown.info;
  if (
    hidden.info.width !== width ||
    hidden.info.height !== height ||
    hidden.info.channels !== channels
  ) {
    return { ok: false, maxDiff: 0, reason: 'size-mismatch' };
  }

  // Sample inset edge points of the stage (not sticky header).
  const pts = [
    [box.x + 2, box.y + 2],
    [box.x + box.w - 3, box.y + 2],
    [box.x + 2, box.y + box.h - 3],
    [box.x + box.w - 3, box.y + box.h - 3],
    [box.x + Math.floor(box.w / 2), box.y + 2],
    [box.x + Math.floor(box.w / 2), box.y + box.h - 3],
    [box.x + 2, box.y + Math.floor(box.h / 2)],
    [box.x + box.w - 3, box.y + Math.floor(box.h / 2)],
  ];
  let maxDiff = 0;
  let changed = 0;
  for (const [x, y] of pts) {
    const xi = Math.min(width - 1, Math.max(0, x));
    const yi = Math.min(height - 1, Math.max(0, y));
    const i = (yi * width + xi) * channels;
    const d = Math.max(
      Math.abs(shown.data[i] - hidden.data[i]),
      Math.abs(shown.data[i + 1] - hidden.data[i + 1]),
      Math.abs(shown.data[i + 2] - hidden.data[i + 2]),
    );
    maxDiff = Math.max(maxDiff, d);
    if (d > 8) changed += 1;
  }
  return { ok: changed >= 2 && maxDiff > 8, maxDiff, changed, box };
}

async function sceneStats(page, sceneSel) {
  return page.evaluate((sceneSel) => {
    const root = document.querySelector(sceneSel);
    if (!root) return null;
    const videos = [...root.querySelectorAll('video')];
    // Hero adopts SSR video which may sit as a sibling of .hero-stacked.
    const heroVideos =
      sceneSel === '.hero-media'
        ? [...document.querySelectorAll('.hero-media video')]
        : videos;
    const list = sceneSel === '.hero-media' ? heroVideos : videos;
    const canvases = [...root.querySelectorAll('canvas')];
    return {
      videos: list.length,
      canvases: canvases.length,
      videoSrcs: list
        .map((v) => v.currentSrc || v.src)
        .map((s) => s.split('/').pop()),
      paused: list.map((v) => v.paused),
      currentTime: list.map((v) => Number(v.currentTime.toFixed(3))),
      ready: canvases.map((c) => c.dataset.ready || '0'),
      hidden: canvases.map((c) => c.dataset.hidden || '0'),
      liveClass: root.className.includes('is-live'),
    };
  }, sceneSel);
}

async function measureFps(page, sceneSel, durationMs) {
  return withTimeout(
    page.evaluate(
      async ({ sceneSel, durationMs }) => {
        const root = document.querySelector(sceneSel);
        const video =
          root?.querySelector('video') ||
          (sceneSel === '.hero-media'
            ? document.querySelector('.hero-media video')
            : null);
        if (!video) return { fps: 0, frames: 0, mode: 'none' };
        if (video.paused || video.ended) {
          return {
            fps: 0,
            frames: 0,
            mode: 'paused',
            currentTime: video.currentTime,
            duration: video.duration || null,
          };
        }
        const clipMs = Number.isFinite(video.duration)
          ? Math.max(durationMs, Math.ceil(video.duration * 1000))
          : durationMs;
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
            const timer = setTimeout(finish, clipMs + 400);
            const cb = () => {
              frames += 1;
              if (
                performance.now() - t0 >= clipMs ||
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
            measuredMs: Math.round(performance.now() - t0),
            clipDurationS: video.duration || null,
          };
        }
        return { fps: null, frames: 0, mode: 'no-rvfc' };
      },
      { sceneSel, durationMs },
    ),
    Math.max(durationMs, 4000) + 2000,
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

/** Navigation-start → first canvas data-ready (no artificial pre-sleep). */
async function waitHeroFirstFrameFromNav(page, ms = 12000) {
  return page
    .evaluate((timeoutMs) => {
      const nav =
        performance.getEntriesByType('navigation')[0]?.startTime ?? 0;
      const t0 = performance.timeOrigin + nav;
      return new Promise((resolve) => {
        const deadline = Date.now() + timeoutMs;
        const tick = () => {
          const c = document.querySelector(
            '.hero-media canvas[data-ready="1"]',
          );
          if (c) {
            resolve({
              ok: true,
              ms: Math.round(performance.now() - nav),
              wallMs: Date.now() - t0,
            });
            return;
          }
          if (Date.now() > deadline) {
            resolve({ ok: false, ms: null });
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
    }, ms)
    .catch(() => ({ ok: false, ms: null }));
}

function trackMp4(page) {
  const counts = new Map();
  const rangeCounts = new Map();
  const cacheHeaders = [];
  const onRes = (res) => {
    const url = res.url();
    if (!/\.mp4(\?|$)/i.test(url)) return;
    const key = url.split('?')[0];
    const status = res.status();
    // Ignore cancelled/aborted (status 0) and count one successful body
    // per URL. Byte-range 206s are the same media element continuing.
    if (status === 0) return;
    // Record Cache-Control from any v4 mp4 response (incl. 206 Partial Content).
    if (/\/assets\/v4-60fps\//i.test(url) && status >= 200 && status < 300) {
      const cc = res.headers()['cache-control'] || '';
      cacheHeaders.push({
        url: url.split('/').pop(),
        cacheControl: cc,
        ok: /max-age=31536000/i.test(cc) && /immutable/i.test(cc),
        status,
      });
    }
    if (status === 206) {
      rangeCounts.set(key, (rangeCounts.get(key) || 0) + 1);
      if (!counts.has(key)) counts.set(key, 1);
      return;
    }
    if (status >= 200 && status < 300) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  };
  page.on('response', onRes);
  return {
    counts,
    stop: () => {
      page.off('response', onRes);
    },
    summary: () => {
      const byFile = {};
      let total = 0;
      let maxPerUrl = 0;
      for (const [url, n] of counts) {
        const name = url.split('/').pop();
        byFile[name] = (byFile[name] || 0) + n;
        total += n;
        maxPerUrl = Math.max(maxPerUrl, n);
      }
      return {
        byFile,
        total,
        maxPerUrl,
        rangeFollowups: Object.fromEntries(
          [...rangeCounts].map(([u, n]) => [u.split('/').pop(), n]),
        ),
      };
    },
    cacheControl: () => cacheHeaders[0] || { ok: false, reason: 'no-v4-mp4-response' },
  };
}

async function probeBookingHover(page) {
  return page.evaluate(() => {
    const hit = document.querySelector('.home-booking__scene .v37-scene__hit');
    const main = document.querySelector('.home-booking__main');
    if (!hit || !main) {
      return { ok: false, reason: 'missing-els' };
    }
    const r = hit.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) {
      return { ok: false, reason: 'hit-empty', box: r };
    }
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    const hitOnTop =
      !!top && (top === hit || hit.contains(top) || top.closest?.('.v37-scene__hit') === hit);
    const mainBlocks =
      !!top && (top === main || main.contains(top)) && !hit.contains(top);
    return {
      ok: hitOnTop && !mainBlocks,
      hitOnTop,
      mainBlocks,
      topTag: top?.tagName || null,
      topClass: top?.className || null,
      point: { x, y },
    };
  });
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

  const mp4 = trackMp4(page);
  const result = { engine: label, viewport, scenes: {} };

  // No artificial sleep before first-frame measure — time from navigation.
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.hero-media', { timeout: 12000 });

  const heroFirst = await waitHeroFirstFrameFromNav(page, 15000);
  result.heroFirstFrameMs = heroFirst.ok ? heroFirst.ms : null;
  result.heroFirstFrameOk = heroFirst.ok;
  await page.screenshot({ path: path.join(OUT, `v4-${label}-hero.png`) });
  result.scenes.hero = {
    ready: heroFirst.ok,
    stats: await sceneStats(page, '.hero-media'),
    edgeDiff: await canvasEdgeDiff(page, '.hero-media__stage'),
    fps: await measureFps(page, '.hero-media', 700),
  };
  console.error(`[${label}] hero`, result.scenes.hero.fps, result.heroFirstFrameMs);

  const gateTrig = viewport.width >= 768 ? 0.5291 : 0.4365;
  await forcePastTrigger(page, '.v37-scene--gate', gateTrig);
  await waitReady(page, '.v37-scene--gate', 12000);
  await sleep(400);
  const gateFps = await measureFps(page, '.v37-scene--gate', 600);
  await sleep(1800);
  await page.screenshot({ path: path.join(OUT, `v4-${label}-gate.png`) });
  result.scenes.gate = {
    stats: await sceneStats(page, '.v37-scene--gate'),
    edgeDiff: await canvasEdgeDiff(page, '.v37-scene--gate'),
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
    edgeDiff: await canvasEdgeDiff(page, '.v37-scene--bench'),
    fps: benchFps,
    hiddenAfterEnd: await page.evaluate(() => {
      const root = document.querySelector('.v37-scene--bench');
      if (!root) return false;
      const canvases = [...root.querySelectorAll('canvas')];
      const videos = [...root.querySelectorAll('video')];
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
    edgeDiff: await canvasEdgeDiff(page, '.v37-scene--booking'),
    fps: bookingFps,
    landingToBreathe: swap,
  };
  console.error(`[${label}] booking`, swap);

  if (viewport.width >= 768) {
    // Ensure breathe settled so hover layer can mount, then probe hit stacking.
    await sleep(800);
    result.bookingHoverHit = await probeBookingHover(page);
    console.error(`[${label}] bookingHoverHit`, result.bookingHoverHit);
  }

  mp4.stop();
  result.cacheControl = mp4.cacheControl();
  result.mp4Requests = mp4.summary();
  result.mp4Ok = result.mp4Requests.maxPerUrl <= 1;
  console.error(`[${label}] cacheControl`, result.cacheControl);
  console.error(`[${label}] mp4`, result.mp4Requests);

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
  const mp4Rm = trackMp4(page2);
  await page2.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(1800);
  // Scroll through scenes so IO would mount if RM path were broken.
  await page2.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1200);
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
    // SSR hero video must be removed under RM.
    videos += document.querySelectorAll('.hero-stacked-video').length;
    return { videos, canvases };
  });
  mp4Rm.stop();
  result.reducedMotion.mp4Requests = mp4Rm.summary();
  result.reducedMotion.mp4Ok = result.reducedMotion.mp4Requests.total === 0;
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
