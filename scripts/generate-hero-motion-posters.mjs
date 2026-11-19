#!/usr/bin/env node
/**
 * First-frame hero motion posters (WingFold t=0, locked poster cam).
 *
 * Preferred: TARGET_URL=http://127.0.0.1:4011/ captures the live hold frame
 * from mountHero3D (exact cam fit + lights-only before deferred PMREM).
 *
 * Fallback: offline Playwright + _hero-motion-poster-render.html at each
 * breakpoint stage (390 / 768 / 1440) with mobile top-pack ≤1023.
 *
 * Writes WebP (+ AVIF) under public/assets/hero/hero-poster-motion-{bp}.{webp,avif}.
 *
 * Usage:
 *   TARGET_URL=http://127.0.0.1:4011/ node scripts/generate-hero-motion-posters.mjs
 *   node scripts/generate-hero-motion-posters.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'hero');
/** Match hero stage aspect (81/47) used in mountHero3D / globals.css. */
const ASPECT = 81 / 47;
const WEBP_QUALITY = 92;
/** Higher AVIF quality so LCP still ≈ live GL hold frame (pixel-diff gate). */
const AVIF_QUALITY = 72;

/**
 * Per-breakpoint stage sizes (CSS panel box at that viewport width).
 * Mobile/tablet = full-bleed width; desktop = 50.625rem (810px) panel.
 */
/**
 * Stage CSS box ≈ live `.hero-media` backing store (integer CSS px).
 * 768 uses 445 (not round(768×47/81)=446) to match live clientHeight.
 */
const BREAKPOINTS = [
  { name: '390', vw: 390, vh: 844, panelW: 390, panelH: 226, mobile: true },
  { name: '768', vw: 768, vh: 1024, panelW: 768, panelH: 445, mobile: true },
  { name: '1440', vw: 1440, vh: 900, panelW: 810, panelH: 470, mobile: false },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.css': 'text/css; charset=utf-8',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/' || rel === '') rel = '/scripts/_hero-motion-poster-render.html';
      const filePath = path.join(ROOT, rel.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function writePosterFromRgba(rgba, name, width, height) {
  const base = path.join(OUT_DIR, `hero-poster-motion-${name}`);
  const raw = sharp(Buffer.from(rgba), {
    raw: { width, height, channels: 4 },
  }).ensureAlpha();
  await raw.clone().webp({ quality: WEBP_QUALITY, alphaQuality: 100 }).toFile(`${base}.webp`);
  await raw.clone().avif({ quality: AVIF_QUALITY }).toFile(`${base}.avif`);
  const webpStat = await fsp.stat(`${base}.webp`);
  const avifStat = await fsp.stat(`${base}.avif`);
  console.log(
    `  wrote ${path.relative(ROOT, `${base}.webp`)} (${width}×${height}, ${webpStat.size} B)`,
  );
  console.log(
    `  wrote ${path.relative(ROOT, `${base}.avif`)} (${width}×${height}, ${avifStat.size} B)`,
  );
}

async function renderBreakpoint(browser, baseUrl, bp) {
  const panelH = bp.panelH || Math.round(bp.panelW / ASPECT);
  const page = await browser.newPage({
    viewport: { width: bp.panelW, height: panelH },
    deviceScaleFactor: 1,
  });

  page.on('console', (msg) => {
    console.log(`  [page ${bp.name}] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`  [pageerror ${bp.name}]`, err);
  });

  const qs = new URLSearchParams({
    vw: String(bp.vw),
    vh: String(bp.vh),
    panelW: String(bp.panelW),
    panelH: String(panelH),
    mobile: bp.mobile ? '1' : '0',
  });
  await page.goto(
    `${baseUrl}/scripts/_hero-motion-poster-render.html?${qs}`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    },
  );

  await page.waitForFunction(
    () => window.__heroPosterReady === true || window.__heroPosterError,
    null,
    { timeout: 180000 },
  );
  const err = await page.evaluate(() => window.__heroPosterError || null);
  if (err) throw new Error(`Hero render ${bp.name} failed: ${err}`);
  const meta = await page.evaluate(() => window.__heroPosterMeta || null);
  console.log(`  meta ${bp.name}:`, meta);

  // Readback via 2d drawImage — same path as live verify (avoids screenshot color shift).
  const readback = await page.evaluate(() => {
    const canvas = document.getElementById('hero-canvas');
    const w = canvas.width;
    const h = canvas.height;
    const c2 = document.createElement('canvas');
    c2.width = w;
    c2.height = h;
    const ctx = c2.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    return { w, h, data: Array.from(img.data) };
  });
  await writePosterFromRgba(readback.data, bp.name, readback.w, readback.h);
  await page.close();
}

const LIVE_VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

/**
 * Capture hold-frame posters from a running Next server (preferred).
 * @param {import('playwright').Browser} browser
 * @param {string} targetUrl
 */
async function captureFromLive(browser, targetUrl) {
  for (const vp of LIVE_VIEWPORTS) {
    console.log(`live capture ${vp.name} @ ${vp.width}`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    await page.addInitScript(() => {
      try {
        sessionStorage.removeItem('mg-home-boot-done-v1');
        sessionStorage.setItem('mg-soft-gpu-v1', '0');
      } catch {
        /* ignore */
      }
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContextPatched(
        type,
        attrs,
      ) {
        if (String(type).includes('webgl')) {
          attrs = Object.assign({}, attrs || {}, {
            preserveDrawingBuffer: true,
          });
        }
        return orig.call(this, type, attrs);
      };
    });
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('.hero-media');
        const canvas = panel?.querySelector('canvas.hero-3d');
        return !!(
          panel &&
          canvas &&
          canvas.width > 0 &&
          panel.classList.contains('is-3d') &&
          !panel.classList.contains('is-3d-poster-out')
        );
      },
      null,
      { timeout: 180000 },
    );
    const readback = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.hero-3d');
      const w = canvas.width;
      const h = canvas.height;
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      c2.getContext('2d').drawImage(canvas, 0, 0);
      return {
        w,
        h,
        data: Array.from(c2.getContext('2d').getImageData(0, 0, w, h).data),
        fit: document.querySelector('.hero-media')?.dataset?.heroFit || null,
      };
    });
    console.log(`  fit ${vp.name}:`, readback.fit);
    await writePosterFromRgba(readback.data, vp.name, readback.w, readback.h);
    await page.close();
  }
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  const targetUrl = process.env.TARGET_URL || '';

  let browser;
  let server = null;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=angle',
        '--use-angle=swiftshader-webgl',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
      ],
    });

    if (targetUrl) {
      console.log(`Live capture from ${targetUrl}`);
      await captureFromLive(browser, targetUrl);
    } else {
      const renderHtml = path.join(
        ROOT,
        'scripts',
        '_hero-motion-poster-render.html',
      );
      if (!fs.existsSync(renderHtml)) {
        throw new Error(`Missing ${renderHtml}`);
      }
      const started = await startStaticServer();
      server = started.server;
      const baseUrl = `http://127.0.0.1:${started.port}`;
      console.log(`Static server ${baseUrl}`);
      for (const bp of BREAKPOINTS) {
        console.log(
          `breakpoint ${bp.name} (panelW=${bp.panelW}, mobile=${bp.mobile})`,
        );
        await renderBreakpoint(browser, baseUrl, bp);
      }
    }
    console.log('done');
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
