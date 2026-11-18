/**
 * Verify every ambient butterfly atlas frame's alpha bbox stays inside the
 * padded bench canvas for all track points (1440 + 390 packs).
 *
 * Usage:
 *   node scripts/verify-bench-butterfly-bounds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSET_ROOT = path.join(ROOT, 'public/assets/home-v3.7');
const PACKS = ['1440', '390'];
const SOURCE_SCALE = 2;
const SAFETY_PAD = 8;

function computePad(json) {
  let minX = 0;
  let minY = 0;
  let maxX = json.place.css_w;
  let maxY = json.place.css_h;

  for (const key of Object.keys(json.ambient)) {
    const amb = json.ambient[key];
    for (const pt of amb.track) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x + amb.css_w);
      maxY = Math.max(maxY, pt.y + amb.css_h);
    }
  }
  for (const pt of json.perch_shadow.track) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x + json.perch_shadow.css_w);
    maxY = Math.max(maxY, pt.y + json.perch_shadow.css_h);
  }

  return {
    left: Math.max(0, -minX) + SAFETY_PAD,
    top: Math.max(0, -minY) + SAFETY_PAD,
    right: Math.max(0, maxX - json.place.css_w) + SAFETY_PAD,
    bottom: Math.max(0, maxY - json.place.css_h) + SAFETY_PAD,
  };
}

/** Alpha bounding box in source sheet pixels for one atlas cell. */
function alphaBBox(rgba, sheetW, sheetH, sx, sy, fw, fh) {
  let minX = fw;
  let minY = fh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < fh; y += 1) {
    const row = ((sy + y) * sheetW + sx) * 4;
    for (let x = 0; x < fw; x += 1) {
      const a = rgba[row + x * 4 + 3];
      if (a > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    return { empty: true, minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { empty: false, minX, minY, maxX, maxY };
}

async function loadSheetRgba(relFile) {
  const abs = path.join(ASSET_ROOT, relFile);
  const image = sharp(abs, { unlimited: true });
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    rgba: data,
    width: info.width,
    height: info.height,
    file: relFile,
  };
}

async function verifyPack(packId) {
  const jsonPath = path.join(
    ASSET_ROOT,
    'bench',
    packId,
    `bench-${packId}.json`,
  );
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const pad = computePad(json);
  const canvas = {
    x: 0,
    y: 0,
    w: json.place.css_w + pad.left + pad.right,
    h: json.place.css_h + pad.top + pad.bottom,
  };
  const ox = pad.left;
  const oy = pad.top;

  const failures = [];
  let checks = 0;
  let ambients = 0;

  for (const key of Object.keys(json.ambient)) {
    ambients += 1;
    const amb = json.ambient[key];
    const atlas = amb.atlas;
    const sheets = await Promise.all(
      atlas.sheets.map((s) => loadSheetRgba(s.file)),
    );
    const cellBBoxes = new Map();

    for (let cell = 0; cell < atlas.index.length; cell += 1) {
      const entry = atlas.index[cell];
      if (!entry) continue;
      const [sheetIdx, sx, sy] = entry;
      const sheet = sheets[sheetIdx];
      if (!sheet) {
        failures.push({
          pack: packId,
          ambient: key,
          cell,
          reason: `missing sheet ${sheetIdx}`,
        });
        continue;
      }
      cellBBoxes.set(
        cell,
        alphaBBox(
          sheet.rgba,
          sheet.width,
          sheet.height,
          sx,
          sy,
          atlas.frame_w,
          atlas.frame_h,
        ),
      );
    }

    for (const pt of amb.track) {
      const bbox = cellBBoxes.get(pt.cell);
      if (!bbox) {
        failures.push({
          pack: packId,
          ambient: key,
          cell: pt.cell,
          f: pt.f,
          reason: 'missing cell bbox',
        });
        continue;
      }
      if (bbox.empty) {
        checks += 1;
        continue;
      }

      // Source alpha → CSS px (drawAtlasFrame sourceScale=2)
      let cssMinX = bbox.minX / SOURCE_SCALE;
      let cssMaxX = (bbox.maxX + 1) / SOURCE_SCALE;
      const cssMinY = bbox.minY / SOURCE_SCALE;
      const cssMaxY = (bbox.maxY + 1) / SOURCE_SCALE;
      const cssW = atlas.frame_w / SOURCE_SCALE;
      const cssH = atlas.frame_h / SOURCE_SCALE;

      if (amb.mirror) {
        const left = cssW - cssMaxX;
        const right = cssW - cssMinX;
        cssMinX = left;
        cssMaxX = right;
      }

      // Drawn destination size follows amb.css_* (matches frame/2 in packs)
      const scaleX = amb.css_w / cssW;
      const scaleY = amb.css_h / cssH;
      const dest = {
        left: ox + pt.x + cssMinX * scaleX,
        top: oy + pt.y + cssMinY * scaleY,
        right: ox + pt.x + cssMaxX * scaleX,
        bottom: oy + pt.y + cssMaxY * scaleY,
      };

      checks += 1;
      const cutCanvas =
        dest.left < canvas.x - 0.01 ||
        dest.top < canvas.y - 0.01 ||
        dest.right > canvas.x + canvas.w + 0.01 ||
        dest.bottom > canvas.y + canvas.h + 0.01;

      // Scene host clip edge ≡ padded canvas after CSS fit (place-frac).
      const cutScene = cutCanvas;

      if (cutCanvas || cutScene) {
        failures.push({
          pack: packId,
          ambient: key,
          cell: pt.cell,
          f: pt.f,
          layer: pt.layer,
          dest,
          canvas,
          cutCanvas,
          cutScene,
        });
      }
    }
  }

  return {
    pack: packId,
    ambients,
    checks,
    failures,
    pad,
    canvas,
    place: { w: json.place.css_w, h: json.place.css_h },
  };
}

async function main() {
  const results = [];
  for (const pack of PACKS) {
    results.push(await verifyPack(pack));
  }

  const failCount = results.reduce((n, r) => n + r.failures.length, 0);
  const checkCount = results.reduce((n, r) => n + r.checks, 0);
  const summary = {
    ok: failCount === 0,
    checks: checkCount,
    failures: failCount,
    packs: results.map((r) => ({
      pack: r.pack,
      ambients: r.ambients,
      checks: r.checks,
      failures: r.failures.length,
      pad: r.pad,
      canvas: r.canvas,
      place: r.place,
      sampleFailures: r.failures.slice(0, 5),
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) {
    console.error(
      `verify-bench-butterfly-bounds: ${failCount} cut(s) across ${checkCount} checks`,
    );
    process.exit(1);
  }
  console.log(
    `verify-bench-butterfly-bounds: OK — ${checkCount} track placements inside padded canvas`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
