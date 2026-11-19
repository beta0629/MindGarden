#!/usr/bin/env node
/**
 * Build-time static motion posters for home v3.7 scenes (gate / booking / bench).
 *
 * Extracts atlas frame 0 (or body+shadow covers for bench) into
 * `*-poster-motion-{pack}.webp`. Reduced-motion / software-GL keep the
 * existing `*-poster-rm-*` assets — this script does not touch them.
 *
 * Usage: node scripts/generate-v37-motion-posters.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSET_ROOT = path.join(ROOT, 'public', 'assets', 'home-v3.7');
const PACKS = ['390', '1440'];
const WEBP_QUALITY = 92;

/**
 * @param {string} relFile atlas sheet path relative to home-v3.7 (e.g. gate/390/…)
 */
function assetPath(relFile) {
  return path.join(ASSET_ROOT, relFile.replace(/^\//, ''));
}

/**
 * Extract one atlas cell `[sheet, sx, sy]` at source frame pixels.
 * @param {{ sheets: Array<{ file: string }>, frame_w: number, frame_h: number, index: number[][] }} atlas
 * @param {number} frameIndex
 */
async function extractAtlasFrame(atlas, frameIndex = 0) {
  const entry = atlas.index[frameIndex];
  if (!entry) {
    throw new Error(`Missing atlas index for frame ${frameIndex}`);
  }
  const [sheetIdx, sx, sy] = entry;
  const sheet = atlas.sheets[sheetIdx];
  if (!sheet?.file) {
    throw new Error(`Missing atlas sheet ${sheetIdx}`);
  }
  const fw = atlas.frame_w;
  const fh = atlas.frame_h;
  const { data, info } = await sharp(assetPath(sheet.file))
    .extract({ left: sx, top: sy, width: fw, height: fh })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info, frameIndex };
}

/**
 * First landing atlas frame whose subject is fully opaque (max alpha ≥ 255).
 * Frames 0–4 fade in (maxA 0→254); empirically index 5 reaches maxA 255 on
 * both 390 and 1440 packs. Keep in sync with BOOKING_MOTION_HOLD_FRAME.
 * Threshold is 255 (not 250) so we do not stop on near-opaque frame 4.
 * @param {{ sheets: Array<{ file: string }>, frame_w: number, frame_h: number, index: number[][] }} atlas
 * @param {number} [minMaxA=255]
 */
async function extractFirstFullyOpaqueAtlasFrame(atlas, minMaxA = 255) {
  const n = atlas.index.length;
  for (let i = 0; i < n; i += 1) {
    const frame = await extractAtlasFrame(atlas, i);
    const { data } = frame;
    let maxA = 0;
    for (let p = 3; p < data.length; p += 4) {
      if (data[p] > maxA) maxA = data[p];
      if (maxA >= minMaxA) break;
    }
    if (maxA >= minMaxA) {
      console.log(`  first fully-opaque atlas frame index=${i} (maxA=${maxA})`);
      return frame;
    }
  }
  throw new Error(`No atlas frame with maxA ≥ ${minMaxA}`);
}

/**
 * @param {string} outPath
 * @param {Buffer} rgba
 * @param {number} width
 * @param {number} height
 */
async function writeWebp(outPath, rgba, width, height) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
    .toFile(outPath);
  const stat = await fs.stat(outPath);
  console.log(`  wrote ${path.relative(ROOT, outPath)} (${width}×${height}, ${stat.size} B)`);
}

/**
 * Gate: shadow frame 0 under body frame 0, output at body source pixels.
 * @param {string} pack
 */
async function generateGate(pack) {
  const jsonPath = path.join(ASSET_ROOT, 'gate', pack, `gate-${pack}.json`);
  const json = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const bodyAtlas = json.door.body_atlas;
  const shadowAtlas = json.door.shadow_atlas;
  const body = await extractAtlasFrame(bodyAtlas, 0);
  const { width, height } = body.info;

  let base = Buffer.alloc(width * height * 4, 0);
  if (shadowAtlas?.index?.[0]) {
    const shadow = await extractAtlasFrame(shadowAtlas, 0);
    const resized = await sharp(shadow.data, {
      raw: {
        width: shadow.info.width,
        height: shadow.info.height,
        channels: 4,
      },
    })
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer();
    base = resized;
  }

  const composited = await sharp(base, {
    raw: { width, height, channels: 4 },
  })
    .composite([
      {
        input: body.data,
        raw: { width, height, channels: 4 },
        blend: 'over',
      },
    ])
    .ensureAlpha()
    .raw()
    .toBuffer();

  const out = path.join(
    ASSET_ROOT,
    'gate',
    pack,
    `gate-poster-motion-${pack}.webp`,
  );
  await writeWebp(out, composited, width, height);
}

/**
 * Booking: first fully-opaque landing atlas frame (maxA === 255; usually index 5).
 * Must stay in sync with BookingScene BOOKING_MOTION_HOLD_FRAME.
 * @param {string} pack
 */
async function generateBooking(pack) {
  const jsonPath = path.join(
    ASSET_ROOT,
    'booking',
    pack,
    `booking-${pack}.json`,
  );
  const json = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const atlas = json.landing.atlas;
  const frame = await extractFirstFullyOpaqueAtlasFrame(atlas, 255);
  let maxA = 0;
  for (let p = 3; p < frame.data.length; p += 4) {
    if (frame.data[p] > maxA) maxA = frame.data[p];
  }
  console.log(`  booking ${pack}: hold frame=${frame.frameIndex} maxA=${maxA}`);
  const out = path.join(
    ASSET_ROOT,
    'booking',
    pack,
    `booking-poster-motion-${pack}.webp`,
  );
  await writeWebp(out, frame.data, frame.info.width, frame.info.height);
}

/**
 * Bench: body cover over shadow cover (first paint), not ambient alone.
 * @param {string} pack
 */
async function generateBench(pack) {
  const jsonPath = path.join(ASSET_ROOT, 'bench', pack, `bench-${pack}.json`);
  const json = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const shadowFile = assetPath(json.shadow.file);
  const bodyFile = assetPath(json.body.file);
  const shadowMeta = await sharp(shadowFile).metadata();
  const bodyMeta = await sharp(bodyFile).metadata();
  const width = Math.max(shadowMeta.width || 0, bodyMeta.width || 0);
  const height = Math.max(shadowMeta.height || 0, bodyMeta.height || 0);
  if (!width || !height) {
    throw new Error(`bench ${pack}: missing body/shadow dimensions`);
  }

  const shadowRgba = await sharp(shadowFile)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const bodyRgba = await sharp(bodyFile)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const composited = await sharp(shadowRgba, {
    raw: { width, height, channels: 4 },
  })
    .composite([
      {
        input: bodyRgba,
        raw: { width, height, channels: 4 },
        blend: 'over',
      },
    ])
    .ensureAlpha()
    .raw()
    .toBuffer();

  const out = path.join(
    ASSET_ROOT,
    'bench',
    pack,
    `bench-poster-motion-${pack}.webp`,
  );
  await writeWebp(out, composited, width, height);
}

async function main() {
  console.log('Generating v3.7 motion posters…');
  for (const pack of PACKS) {
    console.log(`pack ${pack}`);
    await generateGate(pack);
    await generateBooking(pack);
    await generateBench(pack);
  }
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
