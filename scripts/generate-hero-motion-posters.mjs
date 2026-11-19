#!/usr/bin/env node
/**
 * First-frame hero motion posters (WingFold t=0, locked poster cam, baked env).
 *
 * Offline Playwright + _hero-motion-poster-render.html at each breakpoint
 * stage (390 / 768 / 1440) with mobile top-pack ≤1023 and devicePixelRatio 2.
 *
 * Writes WebP (+ AVIF) under public/assets/hero/hero-poster-motion-{bp}.{webp,avif}
 * at 2× backing-store resolution (CSS panel × dpr).
 *
 * Usage:
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
/** Capture at 2× for sharpness (matches mountHero3D max DPR). */
const CAPTURE_DPR = 2;

/**
 * Stage CSS box ≈ live `.hero-media` (integer CSS px).
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
  '.exr': 'image/x-exr',
  '.hdr': 'image/vnd.radiance',
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
    deviceScaleFactor: CAPTURE_DPR,
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
    dpr: String(CAPTURE_DPR),
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

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  const envPath = path.join(OUT_DIR, 'hero-env-room.exr');
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Missing ${envPath} — run: node scripts/bake-hero-env.mjs`,
    );
  }

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
    console.log(`Static server ${baseUrl} (dpr=${CAPTURE_DPR})`);
    for (const bp of BREAKPOINTS) {
      console.log(
        `breakpoint ${bp.name} (panelW=${bp.panelW}, mobile=${bp.mobile}, dpr=${CAPTURE_DPR})`,
      );
      await renderBreakpoint(browser, baseUrl, bp);
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
