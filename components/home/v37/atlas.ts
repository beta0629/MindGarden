import type { AtlasMeta } from './types';
import { assetUrl } from './types';

export type DecodedImage = ImageBitmap | HTMLImageElement;

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
 */
export function loadSheet(relativePath: string): Promise<DecodedImage> {
  const url = assetUrl(relativePath);
  let pending = sheetCache.get(url);
  if (pending) return pending;

  pending = (async () => {
    try {
      const res = await fetch(url);
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

export async function loadJson<T>(relativePath: string): Promise<T> {
  const url = assetUrl(relativePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export async function preloadAtlasSheets(
  atlas: AtlasMeta,
  sheetIndexes?: number[],
): Promise<DecodedImage[]> {
  const wanted =
    sheetIndexes && sheetIndexes.length > 0
      ? [...new Set(sheetIndexes)]
      : atlas.sheets.map((_, i) => i);
  return Promise.all(wanted.map((i) => loadSheet(atlas.sheets[i].file)));
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
