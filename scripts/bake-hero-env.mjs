#!/usr/bin/env node
/**
 * Offline-bake RoomEnvironment → public/assets/hero/hero-env-room.exr
 *
 * Playwright Chromium + three.js CubeCamera capture (near 0.1 / far 100),
 * equirect HalfFloat EXR. Runtime loads via EXRLoader + PMREMGenerator.fromEquirectangular
 * (never fromScene).
 *
 * Usage:
 *   node scripts/bake-hero-env.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'assets', 'hero', 'hero-env-room.exr');
const HTML = path.join(ROOT, 'scripts', '_bake-hero-env.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/' || rel === '') rel = '/scripts/_bake-hero-env.html';
      const filePath = path.join(ROOT, rel.replace(/^\//, ''));
      if (
        !filePath.startsWith(ROOT) ||
        !fs.existsSync(filePath) ||
        fs.statSync(filePath).isDirectory()
      ) {
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

async function main() {
  if (!fs.existsSync(HTML)) {
    throw new Error(`Missing ${HTML}`);
  }
  await fsp.mkdir(path.dirname(OUT), { recursive: true });

  const { server, port } = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  let browser;
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
    const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
    page.on('console', (msg) => {
      console.log(`[bake] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.error('[bake pageerror]', err);
    });

    await page.goto(`${baseUrl}/scripts/_bake-hero-env.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await page.waitForFunction(
      () => window.__bakeReady === true || window.__bakeError,
      null,
      { timeout: 180000 },
    );
    const err = await page.evaluate(() => window.__bakeError || null);
    if (err) throw new Error(`Bake failed: ${err}`);
    const meta = await page.evaluate(() => window.__bakeMeta);
    const b64 = await page.evaluate(() => window.__bakeExrB64);
    if (!b64) throw new Error('Bake produced empty EXR payload');

    const buf = Buffer.from(b64, 'base64');
    await fsp.writeFile(OUT, buf);
    console.log(
      `wrote ${path.relative(ROOT, OUT)} (${buf.length} B)`,
      meta,
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
