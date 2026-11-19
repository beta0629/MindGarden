#!/usr/bin/env node
/**
 * Offline first-frame hero motion posters (WingFold t=0, locked poster cam).
 *
 * Renders via Playwright Chromium (--use-gl=swiftshader) + three.js, matching
 * mountHero3D.ts: POSTER_CAM / POSTER_LOOK_AT / FOV 30 / dolly-fit / transparent.
 * Writes WebP (+ AVIF) under public/assets/hero/hero-poster-motion-{w}.{webp,avif}.
 *
 * Usage: node scripts/generate-hero-motion-posters.mjs
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
const SIZES = [640, 1080, 1620];
/** Match hero stage aspect (81/47) used in mountHero3D. */
const ASPECT = 81 / 47;
const WEBP_QUALITY = 90;
const AVIF_QUALITY = 55;

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

async function writePosterFromPng(pngBuf, width) {
  const height = Math.round(width / ASPECT);
  const base = path.join(OUT_DIR, `hero-poster-motion-${width}`);
  const resized = sharp(pngBuf).resize(width, height, { fit: 'fill' }).ensureAlpha();
  await resized.clone().webp({ quality: WEBP_QUALITY, alphaQuality: 100 }).toFile(`${base}.webp`);
  await resized.clone().avif({ quality: AVIF_QUALITY }).toFile(`${base}.avif`);
  const webpStat = await fsp.stat(`${base}.webp`);
  const avifStat = await fsp.stat(`${base}.avif`);
  console.log(
    `  wrote ${path.relative(ROOT, `${base}.webp`)} (${width}×${height}, ${webpStat.size} B)`,
  );
  console.log(
    `  wrote ${path.relative(ROOT, `${base}.avif`)} (${width}×${height}, ${avifStat.size} B)`,
  );
}

async function main() {
  const renderHtml = path.join(ROOT, 'scripts', '_hero-motion-poster-render.html');
  if (!fs.existsSync(renderHtml)) {
    throw new Error(`Missing ${renderHtml}`);
  }
  await fsp.mkdir(OUT_DIR, { recursive: true });

  const { server, port } = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Static server ${baseUrl}`);

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
      ],
    });

    // Render once at max size; sharp downscales for smaller posters.
    const renderW = 1620;
    const renderH = Math.round(renderW / ASPECT);
    const page = await browser.newPage({
      viewport: { width: renderW, height: renderH },
      deviceScaleFactor: 1,
    });

    page.on('console', (msg) => {
      console.log(`  [page] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.error('  [pageerror]', err);
    });

    await page.goto(`${baseUrl}/scripts/_hero-motion-poster-render.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    await page.waitForFunction(
      () => window.__heroPosterReady === true || window.__heroPosterError,
      null,
      { timeout: 180000 },
    );
    const err = await page.evaluate(() => window.__heroPosterError || null);
    if (err) throw new Error(`Hero render failed: ${err}`);

    const canvas = page.locator('#hero-canvas');
    const pngBuf = await canvas.screenshot({ type: 'png', omitBackground: true });

    for (const w of SIZES) {
      await writePosterFromPng(pngBuf, w);
    }
    console.log('done');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
