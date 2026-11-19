import type { AtlasMeta } from './types';
import { assetUrl } from './types';

export type DecodedImage = ImageBitmap | HTMLImageElement;

/** Cap canvas backing-store DPR (WebKit scroll budget — was 3). */
export const MAX_CANVAS_DPR = 2;
/** Overflow / flight canvases — keep mobile + software GL cheaper. */
export const MOBILE_OVERFLOW_DPR_CAP = 1.5;
const MOBILE_TOP_MAX_WIDTH = 1023;

/** Optional decode resize — CSS display size of the full sheet (pre-DPR). */
export type SheetDecodeHint = {
  /** Full-sheet CSS width (usually sheet.w / sourceScale). */
  displayW: number;
  /** Full-sheet CSS height (usually sheet.h / sourceScale). */
  displayH: number;
};

const sheetCache = new Map<string, Promise<DecodedImage>>();
/** Resolved bitmaps keyed by absolute URL — for close/dispose. */
const sheetResolved = new Map<string, DecodedImage>();
/** Decode scale (resized/natural) keyed by absolute URL — default 1. */
const sheetScales = new Map<string, number>();

/** Serialize ImageBitmap / decode work — never stampede the main thread. */
let decodeTail: Promise<void> = Promise.resolve();

function enqueueDecode<T>(job: () => Promise<T>): Promise<T> {
  const run = decodeTail.then(job, job);
  decodeTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let softwareGpuCache: boolean | null = null;

/** Unmasked renderer strings that must keep the poster (skip three / GLB). */
const SOFTWARE_RENDERER_RE =
  /swiftshader|llvmpipe|softpipe|microsoft basic render|cpu rasterizer/i;

/**
 * Peek cached software-GPU result without creating a WebGL context.
 * `null` means not probed yet — callers must not treat that as "real GPU".
 */
export function peekSoftwareGpu(): boolean | null {
  return softwareGpuCache;
}

/**
 * Reset the software-GPU probe cache (Playwright / unit tests only).
 * Lets stubs of `getExtension` / `getParameter` run between cases.
 */
export function __resetSoftwareGpuCacheForTests(): void {
  softwareGpuCache = null;
}

/**
 * Detect SwiftShader / llvmpipe (and similar) via WEBGL_debug_renderer_info.
 * Creates a short-lived WebGL context on first call — defer until after LCP.
 * Cached for the page lifetime.
 *
 * Rules:
 * 1. No WebGL at all → software (`true`, poster).
 * 2. `WEBGL_debug_renderer_info` present → software only on renderer regex match.
 * 3. Extension missing → hardware (`false`, allow 3D; Apple/Adreno/Mali).
 * Never use `failIfMajorPerformanceCaveat` as a fast-path that skips the
 * renderer string (Chromium SwiftShader can pass that gate).
 */
export function probeSoftwareGpu(): boolean {
  if (softwareGpuCache != null) return softwareGpuCache;
  if (typeof document === 'undefined') {
    softwareGpuCache = false;
    return false;
  }
  try {
    const probe = document.createElement('canvas');
    const attrs: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    };
    const gl =
      probe.getContext('webgl', attrs) ||
      probe.getContext('experimental-webgl', attrs);
    if (!gl || typeof (gl as WebGLRenderingContext).getExtension !== 'function') {
      // No WebGL at all — treat as software / skip 3D.
      softwareGpuCache = true;
      return true;
    }
    const wgl = gl as WebGLRenderingContext;
    const info = wgl.getExtension('WEBGL_debug_renderer_info');
    if (!info) {
      // Privacy / missing unmasked renderer — allow 3D (do not force poster).
      softwareGpuCache = false;
      const lose = wgl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
      return false;
    }
    const name = String(wgl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '');
    softwareGpuCache = SOFTWARE_RENDERER_RE.test(name);
    const lose = wgl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return softwareGpuCache;
  } catch {
    softwareGpuCache = true;
    return true;
  }
}

/**
 * Cached software-GPU flag. Probes on first use — prefer calling
 * {@link probeSoftwareGpu} only after LCP / `whenHomeBootReady`.
 */
export function isSoftwareGpu(): boolean {
  return probeSoftwareGpu();
}

/** DPR for 2d scene canvases — software=1, mobile overflow ≤1.5. */
export function effectiveCanvasDpr(
  deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  opts?: { overflow?: boolean },
): number {
  if (isSoftwareGpu()) return 1;
  const mobile =
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_TOP_MAX_WIDTH;
  const cap =
    opts?.overflow && mobile ? MOBILE_OVERFLOW_DPR_CAP : MAX_CANVAS_DPR;
  return Math.min(cap, Math.max(1, deviceDpr));
}

function closeDecoded(img: DecodedImage): void {
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    try {
      img.close();
    } catch {
      /* already closed */
    }
  }
}

async function decodeViaImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

function targetDecodeSize(
  naturalW: number,
  naturalH: number,
  hint?: SheetDecodeHint,
): { w: number; h: number } | null {
  if (!hint || hint.displayW < 1 || hint.displayH < 1) return null;
  const dpr = effectiveCanvasDpr();
  const tw = Math.max(1, Math.round(hint.displayW * dpr));
  const th = Math.max(1, Math.round(hint.displayH * dpr));
  // Never upscale past source; skip resize when already near native.
  if (tw >= naturalW * 0.95 && th >= naturalH * 0.95) return null;
  return { w: Math.min(naturalW, tw), h: Math.min(naturalH, th) };
}

/** Result of decode — `scale` is resizedW/naturalW (and H); 1 when not resized. */
export type DecodedSheet = {
  image: DecodedImage;
  /** Uniform bitmap scale vs atlas/natural pixels (`resized / natural`). */
  scale: number;
};

async function decodeBlob(
  blob: Blob,
  url: string,
  hint?: SheetDecodeHint,
): Promise<DecodedSheet> {
  if (typeof createImageBitmap === 'function') {
    try {
      let full: ImageBitmap;
      try {
        full = await createImageBitmap(blob, { imageOrientation: 'none' });
      } catch {
        full = await createImageBitmap(blob);
      }
      const naturalW = full.width;
      const naturalH = full.height;
      const target = targetDecodeSize(naturalW, naturalH, hint);
      if (!target) return { image: full, scale: 1 };
      try {
        const resized = await createImageBitmap(full, {
          resizeWidth: target.w,
          resizeHeight: target.h,
          resizeQuality: 'high',
        } as ImageBitmapOptions);
        full.close();
        // Width ratio; cover images ignore scale. Atlas sheets must not resize.
        const scale = naturalW > 0 ? resized.width / naturalW : 1;
        return { image: resized, scale };
      } catch {
        return { image: full, scale: 1 };
      }
    } catch {
      /* fall through to <img> */
    }
  }
  const image = await decodeViaImageElement(url);
  return { image, scale: 1 };
}

/**
 * Decode a sheet URL once; prefers ImageBitmap when available.
 * Optional `init` (e.g. `{ priority: 'low' }` for boot warm) is used on first fetch.
 * Fetches may run in parallel; decodes are serialized (concurrency 1) for TBT.
 * Optional `hint` downscales to DPR-aware display size (cap via {@link effectiveCanvasDpr}).
 *
 * **Atlas sheets must not pass `hint`** — frame `sx,sy,frame_w,frame_h` are in
 * natural sheet pixels; resizing the whole sheet breaks UVs unless every draw
 * multiplies by the recorded scale (see {@link AtlasSheetBank} / draw helpers).
 * Single cover images (`drawCoverImage`) may pass `hint` safely.
 */
export function loadSheet(
  relativePath: string,
  init?: RequestInit,
  hint?: SheetDecodeHint,
): Promise<DecodedImage> {
  return loadSheetDecoded(relativePath, init, hint).then((d) => d.image);
}

/**
 * Like {@link loadSheet} but also returns the decode scale (`resized/natural`).
 */
export function loadSheetDecoded(
  relativePath: string,
  init?: RequestInit,
  hint?: SheetDecodeHint,
): Promise<DecodedSheet> {
  const url = assetUrl(relativePath);
  let pending = sheetCache.get(url);
  if (pending) {
    return pending.then((image) => ({
      image,
      scale: sheetScales.get(url) ?? 1,
    }));
  }

  pending = (async () => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const blob = await res.blob();
      const decoded = await enqueueDecode(() => decodeBlob(blob, url, hint));
      sheetResolved.set(url, decoded.image);
      sheetScales.set(url, decoded.scale);
      return decoded.image;
    } catch {
      const image = await enqueueDecode(() => decodeViaImageElement(url));
      sheetResolved.set(url, image);
      sheetScales.set(url, 1);
      return image;
    }
  })();

  sheetCache.set(url, pending);
  return pending.then((image) => ({
    image,
    scale: sheetScales.get(url) ?? 1,
  }));
}

/**
 * Release a cached sheet (ImageBitmap.close when applicable).
 * Accepts a relative atlas path (preferred) or absolute `/assets/...` URL.
 */
export function closeSheet(pathOrUrl: string): void {
  const url = pathOrUrl.startsWith('/assets/')
    ? pathOrUrl
    : assetUrl(pathOrUrl);
  sheetCache.delete(url);
  sheetScales.delete(url);
  const img = sheetResolved.get(url);
  if (img) {
    closeDecoded(img);
    sheetResolved.delete(url);
  }
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
 * True when every sheet needed to blend/draw `frame` is already in the bank.
 */
export function sheetsReadyForFrame(
  bank: AtlasSheetBank,
  atlas: AtlasMeta,
  frame: number,
): boolean {
  const last = atlas.index.length - 1;
  if (last < 0) return false;
  const clamped = Math.min(last, Math.max(0, frame));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(last, Math.ceil(clamped));
  for (const i of i0 === i1 ? [i0] : [i0, i1]) {
    const entry = atlas.index[i];
    if (!entry || !bank.has(entry[0])) return false;
  }
  return true;
}

/**
 * Draw once into a tiny canvas so the first visible drawImage is cheap (WebKit).
 * Prefer calling during idle after decode.
 */
export function warmSheetGpu(img: DecodedImage): void {
  if (typeof document === 'undefined') return;
  try {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 2, 2);
  } catch {
    /* ignore — warm is best-effort */
  }
}

function scheduleGpuWarm(img: DecodedImage): void {
  if (typeof window === 'undefined') return;
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => warmSheetGpu(img), { timeout: 1200 });
  } else {
    window.setTimeout(() => warmSheetGpu(img), 0);
  }
}

/**
 * Sparse atlas sheet bank — decode only requested sheet indexes (current + next).
 *
 * Atlas sheets are decoded at **natural** resolution (no createImageBitmap resize).
 * Frame UVs (`sx,sy,frame_w,frame_h`) are authored in natural sheet pixels; resizing
 * the whole sheet without scaling those rects paints empty (luma=0). Per-sheet
 * {@link getScale} stays 1 for the no-resize path; if a future path resizes, draw
 * helpers multiply source rects by that scale.
 */
export class AtlasSheetBank {
  private readonly slots: Array<DecodedImage | null | undefined>;
  /** Per-sheet bitmap scale vs atlas natural pixels (default 1). */
  private readonly scales: number[];
  private readonly inflight = new Map<number, Promise<DecodedImage>>();
  private disposed = false;

  constructor(
    private readonly atlas: AtlasMeta,
    /** Call-site compat (gate body/shadow); atlases never decode-resize. */
    _sourceScale = 2,
  ) {
    void _sourceScale;
    this.slots = new Array(atlas.sheets.length);
    this.scales = new Array(atlas.sheets.length).fill(1);
  }

  get atlasMeta(): AtlasMeta {
    return this.atlas;
  }

  get(sheetIndex: number): DecodedImage | null {
    return this.slots[sheetIndex] ?? null;
  }

  /** Bitmap scale for sheet index (`resized/natural`); 1 when full-res. */
  getScale(sheetIndex: number): number {
    return this.scales[sheetIndex] ?? 1;
  }

  has(sheetIndex: number): boolean {
    return this.slots[sheetIndex] != null;
  }

  /** Kick off decode for sheet indexes; no-op if already loaded/in-flight. */
  ensure(sheetIndexes: number[]): Promise<void> {
    if (this.disposed) return Promise.resolve();
    const jobs: Promise<DecodedImage>[] = [];
    for (const raw of sheetIndexes) {
      const i = raw;
      if (i < 0 || i >= this.atlas.sheets.length) continue;
      if (this.slots[i]) continue;
      let pending = this.inflight.get(i);
      if (!pending) {
        // Intentionally no SheetDecodeHint — keep natural pixels for atlas UVs.
        const file = this.atlas.sheets[i].file;
        pending = loadSheetDecoded(file).then(({ image, scale }) => {
          this.inflight.delete(i);
          if (this.disposed) {
            closeSheet(file);
            return image;
          }
          this.slots[i] = image;
          this.scales[i] = scale > 0 ? scale : 1;
          scheduleGpuWarm(image);
          return image;
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

  /** Wait until every sheet index is decoded (fetches parallel, decode queue = 1). */
  ensureAll(): Promise<void> {
    const all = this.atlas.sheets.map((_, i) => i);
    return this.ensure(all);
  }

  /**
   * Invoke `cb` for every currently decoded sheet (skips empty slots).
   * Used after {@link ensureAll} to sync GPU-warm before first visible paint.
   */
  forEachSheet(cb: (img: DecodedImage, sheetIndex: number) => void): void {
    for (let i = 0; i < this.slots.length; i += 1) {
      const img = this.slots[i];
      if (img) cb(img, i);
    }
  }

  /**
   * Synchronously upload every decoded sheet via {@link warmSheetGpu}.
   * Call after `ensureAll()` — idle `scheduleGpuWarm` is too late for WebKit’s
   * first visible drawImage (can spike first-pass rAF to ~60ms).
   */
  warmAllGpu(): void {
    this.forEachSheet((img) => warmSheetGpu(img));
  }

  /**
   * Release bank slots and close cached ImageBitmaps for this atlas.
   * Call from scene unmount so decoded sheets do not linger forever.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.inflight.clear();
    for (let i = 0; i < this.atlas.sheets.length; i += 1) {
      this.slots[i] = null;
      this.scales[i] = 1;
      const file = this.atlas.sheets[i]?.file;
      if (file) closeSheet(file);
    }
  }
}

/** Prefetch every sheet in a bank (alias of {@link AtlasSheetBank.ensureAll}). */
export function prefetchAllSheets(bank: AtlasSheetBank): Promise<void> {
  return bank.ensureAll();
}

/**
 * Draw one atlas cell. Source is 2x unless `sourceScale` is 1 (gate shadow).
 * Dest size in CSS px = frame_w / sourceScale.
 * `bitmapScale` multiplies source rects when the sheet was decode-resized
 * (`resized/natural`); AtlasSheetBank keeps this at 1 (full sheet).
 */
export function drawAtlasFrame(
  ctx: CanvasRenderingContext2D,
  sheet: DecodedImage,
  atlas: AtlasMeta,
  frameIndex: number,
  dx: number,
  dy: number,
  sourceScale = 2,
  bitmapScale = 1,
): void {
  const entry = atlas.index[frameIndex];
  if (!entry) return;
  const [, sx, sy] = entry;
  const bs = bitmapScale > 0 ? bitmapScale : 1;
  const dw = atlas.frame_w / sourceScale;
  const dh = atlas.frame_h / sourceScale;
  ctx.drawImage(
    sheet,
    sx * bs,
    sy * bs,
    atlas.frame_w * bs,
    atlas.frame_h * bs,
    dx,
    dy,
    dw,
    dh,
  );
}

/**
 * Sub-frame blend between adjacent atlas cells (opacity crossfade).
 * Prefer this over Math.round(walkF) hard steps.
 * Optional `getBitmapScale` supplies per-frame sheet scale (default 1).
 */
export function drawAtlasFrameBlend(
  ctx: CanvasRenderingContext2D,
  getSheet: (frameIndex: number) => DecodedImage | null,
  atlas: AtlasMeta,
  frameFloat: number,
  dx: number,
  dy: number,
  sourceScale = 2,
  getBitmapScale?: (frameIndex: number) => number,
): void {
  const last = atlas.index.length - 1;
  if (last < 0) return;
  const clamped = Math.min(last, Math.max(0, frameFloat));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(last, i0 + 1);
  const t = clamped - i0;
  const scaleOf = (fi: number) =>
    getBitmapScale ? getBitmapScale(fi) : 1;
  if (i0 === i1 || t < 0.001) {
    const sheet = getSheet(i0);
    if (sheet) {
      drawAtlasFrame(ctx, sheet, atlas, i0, dx, dy, sourceScale, scaleOf(i0));
    }
    return;
  }
  if (t > 0.999) {
    const sheet = getSheet(i1);
    if (sheet) {
      drawAtlasFrame(ctx, sheet, atlas, i1, dx, dy, sourceScale, scaleOf(i1));
    }
    return;
  }
  const sheet0 = getSheet(i0);
  const sheet1 = getSheet(i1);
  if (sheet0) {
    ctx.save();
    ctx.globalAlpha *= 1 - t;
    drawAtlasFrame(ctx, sheet0, atlas, i0, dx, dy, sourceScale, scaleOf(i0));
    ctx.restore();
  }
  if (sheet1) {
    ctx.save();
    ctx.globalAlpha *= t;
    drawAtlasFrame(ctx, sheet1, atlas, i1, dx, dy, sourceScale, scaleOf(i1));
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
 * Near-viewport rootMargin for atlas warm-up (~1.5 viewports).
 * Match DeferredScenes duplicate constant when changing.
 */
export const NEAR_ROOT_MARGIN = '150% 0px';
