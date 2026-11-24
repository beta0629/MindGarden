/**
 * Verify gate/bench/booking mount without height jumps, and 0 rAF after idle.
 * Chromium with Apple M1 stub + WebKit @ 390/768/1280/1440.
 */
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const URL = process.env.TARGET_URL || 'http://127.0.0.1:4011/';
const OUT = '/opt/cursor/artifacts/scene-mount-idle-verify.json';
const RENDERER = 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1)';

function sha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function installM1Stub(page) {
  return page.addInitScript((renderer) => {
    try {
      sessionStorage.removeItem('mg-home-boot-done-v1');
    } catch {}
    const patch = (proto) => {
      const origExt = proto.getExtension;
      const origParam = proto.getParameter;
      proto.getExtension = function (name) {
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 0x9245,
            UNMASKED_RENDERER_WEBGL: 0x9246,
          };
        }
        return origExt.apply(this, arguments);
      };
      proto.getParameter = function (pname) {
        if (pname === 0x9246 || pname === 37446) return renderer;
        return origParam.apply(this, arguments);
      };
    };
    patch(WebGLRenderingContext.prototype);
    if (typeof WebGL2RenderingContext !== 'undefined') {
      patch(WebGL2RenderingContext.prototype);
    }

    const origRaf = window.requestAnimationFrame.bind(window);
    window.__mgRaf = { schedules: 0, fires: 0, idleFires: 0 };
    window.requestAnimationFrame = (cb) => {
      window.__mgRaf.schedules += 1;
      return origRaf((t) => {
        window.__mgRaf.fires += 1;
        if (window.__mgRaf.idleWatch) window.__mgRaf.idleFires += 1;
        return cb(t);
      });
    };
  }, RENDERER);
}

async function measure(browserType, name, viewport, useM1Stub) {
  const launchOpts =
    name === 'chromium'
      ? {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader',
            '--enable-unsafe-swiftshader',
          ],
        }
      : { headless: true };
  const browser = await browserType.launch(launchOpts);
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: viewport.width <= 430 ? 2 : 1,
  });
  if (useM1Stub) await installM1Stub(page);
  else {
    await page.addInitScript(() => {
      try {
        sessionStorage.removeItem('mg-home-boot-done-v1');
      } catch {}
      const origRaf = window.requestAnimationFrame.bind(window);
      window.__mgRaf = { schedules: 0, fires: 0, idleFires: 0 };
      window.requestAnimationFrame = (cb) => {
        window.__mgRaf.schedules += 1;
        return origRaf((t) => {
          window.__mgRaf.fires += 1;
          if (window.__mgRaf.idleWatch) window.__mgRaf.idleFires += 1;
          return cb(t);
        });
      };
    });
  }

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1500);

  const sectionHeights = {
    reviews: [],
    spaces: [], // gate
    booking: [],
    scrollHeight: [],
  };

  const sample = async (label) => {
    const s = await page.evaluate(() => {
      const h = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect().height : null;
      };
      return {
        scrollHeight: document.documentElement.scrollHeight,
        reviews: h('.home-reviews'),
        spaces: h('.home-spaces'),
        booking: h('.home-booking'),
        gateCanvas: !!document.querySelector('.v37-scene--gate canvas'),
        benchCanvas: !!document.querySelector('.v37-scene--bench canvas'),
        bookingCanvas: !!document.querySelector('.v37-scene--booking canvas'),
      };
    });
    sectionHeights.reviews.push(s.reviews);
    sectionHeights.spaces.push(s.spaces);
    sectionHeights.booking.push(s.booking);
    sectionHeights.scrollHeight.push(s.scrollHeight);
    return { label, ...s };
  };

  const samples = [];
  samples.push(await sample('load'));

  // Step scroll through page, denser around likely section offsets
  const maxY = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    ),
  );
  for (let y = 0; y <= maxY + 100; y += 120) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
    samples.push(await sample(`y=${y}`));
  }

  // Explicitly bring each scene into view and sample during mount window
  for (const sel of ['.home-spaces', '.home-reviews', '.home-booking']) {
    await page.evaluate((s) => {
      document.querySelector(s)?.scrollIntoView({ block: 'center' });
    }, sel);
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(120);
      samples.push(await sample(`${sel}-t${i}`));
    }
  }

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await page.waitForTimeout(400);
  samples.push(await sample('bottom'));

  // True idle: hold 30s with no input so one-shot flights (landing / wing)
  // finish, then count rAF for 5s — must be 0 when nothing changes.
  await page.waitForTimeout(30000);
  const beforeIdle = await page.evaluate(() => {
    const g = globalThis.__mgRafScheduler;
    const entries = [];
    if (g?.entries) {
      for (const [id, e] of g.entries.entries()) {
        entries.push({
          id,
          continuous: !!e.continuous,
          dirty: !!e.dirty,
          paused: !!e.paused,
        });
      }
    }
    return { rafId: g?.rafId ?? 0, entries };
  });
  await page.evaluate(() => {
    window.__mgRaf.idleFires = 0;
    window.__mgRaf.idleWatch = true;
  });
  await page.waitForTimeout(5000);
  const idleSnap = await page.evaluate(() => {
    window.__mgRaf.idleWatch = false;
    const g = globalThis.__mgRafScheduler;
    const entries = [];
    if (g?.entries) {
      for (const [id, e] of g.entries.entries()) {
        entries.push({
          id,
          continuous: !!e.continuous,
          dirty: !!e.dirty,
          paused: !!e.paused,
        });
      }
    }
    return {
      idleFires: window.__mgRaf.idleFires,
      schedules: window.__mgRaf.schedules,
      fires: window.__mgRaf.fires,
      canvases: document.querySelectorAll('canvas').length,
      rafId: g?.rafId ?? 0,
      entries,
    };
  });
  const idle = { ...idleSnap, beforeIdle };

  const sh = sectionHeights.scrollHeight.filter((n) => n != null);
  const minH = Math.min(...sh);
  const maxH = Math.max(...sh);
  let maxJump = 0;
  for (let i = 1; i < sh.length; i++) {
    maxJump = Math.max(maxJump, Math.abs(sh[i] - sh[i - 1]));
  }
  const sectionDip = (arr) => {
    const a = arr.filter((n) => n != null);
    if (!a.length) return 0;
    return Math.max(...a) - Math.min(...a);
  };

  const pass =
    maxH - minH <= 2 &&
    maxJump <= 16 &&
    sectionDip(sectionHeights.reviews) <= 16 &&
    sectionDip(sectionHeights.spaces) <= 16 &&
    sectionDip(sectionHeights.booking) <= 16 &&
    idle.idleFires === 0;

  await browser.close();
  return {
    browser: name,
    viewport,
    m1Stub: useM1Stub,
    pass,
    scrollHeight: { min: minH, max: maxH, delta: maxH - minH, maxJump },
    sectionDip: {
      reviews: sectionDip(sectionHeights.reviews),
      spaces: sectionDip(sectionHeights.spaces),
      booking: sectionDip(sectionHeights.booking),
    },
    idleFires5s: idle.idleFires,
    canvases: idle.canvases,
    subscribersAfter30s: idle.beforeIdle,
    subscribersDuringIdleWatch: {
      rafId: idle.rafId,
      entries: idle.entries,
    },
    final: samples[samples.length - 1],
  };
}

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const results = [];
for (const vp of viewports) {
  results.push(await measure(chromium, 'chromium', vp, true));
  results.push(await measure(webkit, 'webkit', vp, false));
}

const report = { sha: sha(), results, pass: results.every((r) => r.pass) };
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
