/**
 * Boot progress + calm scroll motion evidence for owner staging feedback.
 */
import pw from '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const { chromium, webkit } = pw;
const BASE = process.env.HOME_VERIFY_URL || 'http://127.0.0.1:4010';
const OUT = '/opt/cursor/artifacts';
const CHROME = '/usr/bin/google-chrome-stable';
const SESSION_KEY = 'mg-home-boot-done-v1';

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

function gitSha() {
  try {
    return execSync('git rev-parse --short=9 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

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

async function captureBootProgress(kind, width) {
  const browser = await launch(kind);
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  // Delay GLB so the progress bar is observable mid-flight.
  await context.route('**/assets/hero/hero-butterfly.glb', async (route) => {
    await new Promise((r) => setTimeout(r, 2200));
    return route.continue();
  });
  // Also nudge first atlas JSON a bit so the bar stays mid-flight longer.
  await context.route('**/v37/**/*.json', async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    return route.continue();
  });

  const page = await context.newPage();
  // First visit: clear session so the bar shows.
  await page.addInitScript(
    ({ key, mode }) => {
      try {
        if (mode === 'clear') sessionStorage.removeItem(key);
        if (mode === 'done') sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    },
    { key: SESSION_KEY, mode: 'clear' },
  );

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('.home-boot-progress', { timeout: 8000 });
  try {
    await page.waitForFunction(
      () => {
        const bar = document.querySelector('.home-boot-progress');
        if (!bar || bar.classList.contains('is-done')) return false;
        const n = Number(bar.getAttribute('aria-valuenow') || 0);
        return n > 5 && n < 95;
      },
      { timeout: 5000 },
    );
  } catch {
    /* cache may finish quickly */
  }

  const progressMetrics = await page.evaluate(() => {
    const bar = document.querySelector('.home-boot-progress');
    const fill = document.querySelector('.home-boot-progress__bar');
    const media = document.querySelector('.hero-media');
    const h1 = document.querySelector('.hero__copy h1');
    const cs = fill ? getComputedStyle(fill) : null;
    return {
      barPresent: Boolean(bar),
      barHeight: bar?.getBoundingClientRect().height ?? null,
      fillBg: cs?.backgroundColor ?? null,
      trackBg: bar ? getComputedStyle(bar).backgroundColor : null,
      heroIs3dEarly: media?.classList.contains('is-3d') ?? null,
      h1Visible: h1
        ? getComputedStyle(h1).opacity !== '0' && h1.getBoundingClientRect().height > 0
        : false,
      ratioNow: bar?.getAttribute('aria-valuenow') ?? null,
    };
  });
  const barShot = path.join(OUT, `boot-progress-${kind}${width}.png`);
  await page.screenshot({ path: barShot, fullPage: false });

  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains('home-boot-ready') &&
      document.querySelector('.hero-media')?.classList.contains('is-3d'),
    { timeout: 25000 },
  );
  await page.waitForTimeout(450);
  const readyShot = path.join(OUT, `boot-hero-ready-${kind}${width}.png`);
  await page.screenshot({ path: readyShot, fullPage: false });

  const afterReady = await page.evaluate((key) => {
    const media = document.querySelector('.hero-media');
    const bar = document.querySelector('.home-boot-progress');
    let session = null;
    try {
      session = sessionStorage.getItem(key);
    } catch {
      session = 'blocked';
    }
    return {
      homeBootReady: document.documentElement.classList.contains('home-boot-ready'),
      heroIs3d: media?.classList.contains('is-3d') ?? false,
      barGoneOrFading:
        !bar || bar.classList.contains('is-done') || getComputedStyle(bar).opacity === '0',
      sessionValue: session,
      modeVideo: Boolean(media?.querySelector('video.hero-loop')),
    };
  }, SESSION_KEY);

  // Same session reload — seed storage via init so it survives navigation.
  await context.unroute('**/assets/hero/hero-butterfly.glb');
  await context.unroute('**/v37/**/*.json');
  await context.addInitScript(
    ({ key, mode }) => {
      try {
        if (mode === 'done') sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    },
    { key: SESSION_KEY, mode: 'done' },
  );
  await page.evaluate((key) => {
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }, SESSION_KEY);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1200);
  const secondLoad = await page.evaluate(() => {
    const bar = document.querySelector('.home-boot-progress');
    return {
      barPresent: Boolean(bar),
      homeBootReady: document.documentElement.classList.contains('home-boot-ready'),
    };
  });

  await browser.close();
  return {
    kind,
    width,
    barShot,
    readyShot,
    progressMetrics,
    afterReady,
    secondLoad,
  };
}

async function scrollSequence(kind, width, label) {
  const browser = await launch(kind);
  const page = await browser.newPage({
    viewport: { width, height: width <= 430 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  await page.addInitScript((key) => {
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
  }, SESSION_KEY);

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.addStyleTag({
    content: 'html { scroll-behavior: auto !important; }',
  });

  const maxScroll = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollHeight - window.innerHeight);
  });

  const steps = [];
  const deltas = [];
  const headerFails = [];
  let prevBoxes = null;
  const stepPx = 100;

  for (let y = 0; y <= maxScroll; y += stepPx) {
    await page.evaluate((sy) => {
      window.scrollTo({ top: sy, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = sy;
    }, y);
    await page.waitForTimeout(240);
    const landed = await page.evaluate(() => window.scrollY || window.pageYOffset || 0);
    if (Math.abs(landed - y) > 2) {
      await page.evaluate((sy) => {
        document.documentElement.scrollTop = sy;
        document.body.scrollTop = sy;
      }, y);
      await page.waitForTimeout(100);
    }

    const shot = path.join(OUT, `scroll-step-${label}-${y}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    const measured = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const hR = header?.getBoundingClientRect();
      const hCs = header ? getComputedStyle(header) : null;
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        if (el.closest('.v37-scene')) return null;
        const r = el.getBoundingClientRect();
        const t = getComputedStyle(el).transform;
        return {
          sel,
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          transform: t,
        };
      };
      return {
        headerTop: hR ? Math.round(hR.top * 10) / 10 : null,
        headerPosition: hCs?.position || null,
        boxes: {
          areasTitle: pick('.home-areas .section__title'),
          spacesTitle: pick('.home-spaces .section__title'),
          reviewsTitle: pick('.home-reviews .section__title'),
          pricingTitle: pick('.home-pricing .section__title'),
          bookingTitle: pick('.home-booking .section__title'),
          areaCard: pick('.home-area-card'),
          priceCard: pick('.home-price-card'),
        },
      };
    });

    if (measured.headerTop == null || Math.abs(measured.headerTop) > 1.5) {
      headerFails.push({
        y,
        headerTop: measured.headerTop,
        headerPosition: measured.headerPosition,
      });
    }

    const boxes = measured.boxes;
    if (prevBoxes) {
      for (const key of Object.keys(boxes)) {
        const a = prevBoxes[key];
        const b = boxes[key];
        if (!a || !b) continue;
        const expectedTopDelta = -stepPx;
        const residual = Math.abs(b.top - a.top - expectedTopDelta);
        const aOn = a.top < 900 && a.top + a.height > 0;
        const bOn = b.top < 900 && b.top + b.height > 0;
        // Non-scene elements must track scroll within ≤16px residual (no scroll-jack).
        if (aOn && bOn && residual > 16) {
          deltas.push({
            yFrom: y - stepPx,
            yTo: y,
            key,
            residual,
            topFrom: a.top,
            topTo: b.top,
            transformFrom: a.transform,
            transformTo: b.transform,
          });
        }
      }
    }
    prevBoxes = boxes;
    steps.push({ y, saved: shot, headerTop: measured.headerTop });
  }

  await browser.close();
  return {
    kind,
    width,
    label,
    maxScroll,
    stepCount: steps.length,
    violations: deltas,
    headerFails,
    headerTopAlwaysZero: headerFails.length === 0,
    steps,
  };
}

async function main() {
  ensureOut();
  const summary = {
    sha: gitSha(),
    capturedAt: new Date().toISOString(),
    boot: [],
    scroll: [],
    constants: {
      reveal_translateY_px: 10,
      reveal_duration_ms: 400,
      settle_rise_px: { '1440': 16, '390': 14 },
      atlas_frame_step: 'lerp position + opacity blend adjacent cells',
      progress_bar: 'home-boot-progress',
      hero_is3d_before_first_frame: false,
    },
  };

  summary.boot.push(await captureBootProgress('c', 390));
  summary.boot.push(await captureBootProgress('c', 1440));
  summary.scroll.push(await scrollSequence('w', 390, 'w390'));
  summary.scroll.push(await scrollSequence('c', 1440, 'c1440'));

  const allViolations = summary.scroll.flatMap((s) => s.violations);
  const headerFails = summary.scroll.flatMap((s) => s.headerFails || []);
  summary.scrollAssert = {
    maxResidualPx: allViolations.reduce((m, v) => Math.max(m, v.residual), 0),
    violationCount: allViolations.length,
    headerTopAlwaysZero: headerFails.length === 0,
    headerFailCount: headerFails.length,
    pass: allViolations.length === 0 && headerFails.length === 0,
    sample: allViolations.slice(0, 12),
    headerSample: headerFails.slice(0, 8),
  };

  const outPath = path.join(OUT, 'after-boot-scroll-summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        outPath,
        scrollAssert: summary.scrollAssert,
        boot: summary.boot.map((b) => ({
          kind: b.kind,
          width: b.width,
          progressMetrics: b.progressMetrics,
          afterReady: b.afterReady,
          secondLoad: b.secondLoad,
        })),
      },
      null,
      2,
    ),
  );
  if (!summary.scrollAssert.pass) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
