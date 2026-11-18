import type { AtlasMeta } from './types';
import { assetUrl } from './types';

export type DecodedImage = ImageBitmap | HTMLImageElement;

/** Cap canvas backing-store DPR (sharp on DPR 3 phones without unbounded memory). */
export const MAX_CANVAS_DPR = 3;

const sheetCache = new Map<string, Promise<DecodedImage>>();

async function decodeViaImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Decode a sheet URL once; prefers ImageBitmap when available.
 * Optional `init` (e.g. `{ priority: 'low' }` for boot warm) is used on first fetch.
 */
export function loadSheet(
  relativePath: string,
  init?: RequestInit,
): Promise<DecodedImage> {
  const url = assetUrl(relativePath);
  let pending = sheetCache.get(url);
  if (pending) return pending;

  pending = (async () => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const blob = await res.blob();
      if (typeof createImageBitmap === 'function') {
        return await createImageBitmap(blob);
      }
      return await decodeViaImageElement(url);
    } catch {
      return decodeViaImageElement(url);
    }
  })();

  sheetCache.set(url, pending);
  return pending;
}

export async function loadJson<T>(
  relativePath: string,
  init?: RequestInit,
): Promise<T> {
  const url = assetUrl(relativePath);
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Unique sheet indices referenced by frame range [from, to] inclusive. */
export function sheetIndexesForFrames(
  atlas: AtlasMeta,
  from: number,
  to: number,
): number[] {
  const out = new Set<number>();
  const lo = Math.max(0, Math.floor(from));
  const hi = Math.min(atlas.index.length - 1, Math.ceil(to));
  for (let i = lo; i <= hi; i += 1) {
    const entry = atlas.index[i];
    if (entry) out.add(entry[0]);
  }
  return [...out];
}

/**
 * Sparse atlas sheet bank — decode only requested sheet indexes (current + next).
 */
export class AtlasSheetBank {
  private readonly slots: Array<DecodedImage | null | undefined>;
  private readonly inflight = new Map<number, Promise<DecodedImage>>();

  constructor(private readonly atlas: AtlasMeta) {
    this.slots = new Array(atlas.sheets.length);
  }

  get atlasMeta(): AtlasMeta {
    return this.atlas;
  }

  get(sheetIndex: number): DecodedImage | null {
    return this.slots[sheetIndex] ?? null;
  }

  has(sheetIndex: number): boolean {
    return this.slots[sheetIndex] != null;
  }

  /** Kick off decode for sheet indexes; no-op if already loaded/in-flight. */
  ensure(sheetIndexes: number[]): Promise<void> {
    const jobs: Promise<DecodedImage>[] = [];
    for (const raw of sheetIndexes) {
      const i = raw;
      if (i < 0 || i >= this.atlas.sheets.length) continue;
      if (this.slots[i]) continue;
      let pending = this.inflight.get(i);
      if (!pending) {
        pending = loadSheet(this.atlas.sheets[i].file).then((img) => {
          this.slots[i] = img;
          this.inflight.delete(i);
          return img;
        });
        this.inflight.set(i, pending);
      }
      jobs.push(pending);
    }
    return jobs.length === 0 ? Promise.resolve() : Promise.all(jobs).then(() => undefined);
  }

  /** Ensure sheets covering frame range [from, to]. */
  ensureFrames(from: number, to: number): Promise<void> {
    return this.ensure(sheetIndexesForFrames(this.atlas, from, to));
  }

  /**
   * Ensure sheet for `frameIndex` and the next distinct sheet (spec: current + next).
   */
  ensureCurrentAndNext(frameIndex: number): Promise<void> {
    const idx = Math.min(
      this.atlas.index.length - 1,
      Math.max(0, Math.round(frameIndex)),
    );
    const wanted = new Set<number>();
    const cur = this.atlas.index[idx];
    if (cur) wanted.add(cur[0]);
    for (let i = idx + 1; i < this.atlas.index.length; i += 1) {
      const entry = this.atlas.index[i];
      if (!entry) continue;
      if (!wanted.has(entry[0])) {
        wanted.add(entry[0]);
        break;
      }
    }
    return this.ensure([...wanted]);
  }
}

/**
 * Draw one atlas cell. Source is 2x unless `sourceScale` is 1 (gate shadow).
 * Dest size in CSS px = frame_w / sourceScale.
 */
export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  sheet: DecodedImage,
  atlas: AtlasMeta,
  frameIndex: number,
  dx: number,
  dy: number,
  sourceScale = 2,
): void {
  const entry = atlas.index[frameIndex];
  if (!entry) return;
  const [, sx, sy] = entry;
  const dw = atlas.frame_w / sourceScale;
  const dh = atlas.frame_h / sourceScale;
  ctx.drawImage(
    sheet,
    sx,
    sy,
    atlas.frame_w,
    atlas.frame_h,
    dx,
    dy,
    dw,
    dh,
  );
}

/**
 * Sub-frame blend between adjacent atlas cells (opacity crossfade).
 * Prefer this over Math.round(walkF) hard steps.
 */
export function drawAtlasFrameBlend(
  ctx: CanvasRenderingContext2D,
  getSheet: (frameIndex: number) => DecodedImage | null,
  atlas: AtlasMeta,
  frameFloat: number,
  dx: number,
  dy: number,
  sourceScale = 2,
): void {
  const last = atlas.index.length - 1;
  if (last < 0) return;
  const clamped = Math.min(last, Math.max(0, frameFloat));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(last, i0 + 1);
  const t = clamped - i0;
  if (i0 === i1 || t < 0.001) {
    const sheet = getSheet(i0);
    if (sheet) drawAtlasFrame(ctx, sheet, atlas, i0, dx, dy, sourceScale);
    return;
  }
  if (t > 0.999) {
    const sheet = getSheet(i1);
    if (sheet) drawAtlasFrame(ctx, sheet, atlas, i1, dx, dy, sourceScale);
    return;
  }
  const sheet0 = getSheet(i0);
  const sheet1 = getSheet(i1);
  if (sheet0) {
    ctx.save();
    ctx.globalAlpha *= 1 - t;
    drawAtlasFrame(ctx, sheet0, atlas, i0, dx, dy, sourceScale);
    ctx.restore();
  }
  if (sheet1) {
    ctx.save();
    ctx.globalAlpha *= t;
    drawAtlasFrame(ctx, sheet1, atlas, i1, dx, dy, sourceScale);
    ctx.restore();
  }
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: DecodedImage,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  dpr: number,
): CanvasRenderingContext2D | null {
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Near-viewport rootMargin for atlas warm-up.
 * Keep modest so Gate/Bench/Booking do not compete with hero LCP on first paint
 * (150% previously warmed Gate while the hero was still the only visible section).
 */
export const NEAR_ROOT_MARGIN = '200px 0px';
