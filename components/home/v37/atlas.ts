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
  /**
   * Authored natural pixel size (atlas `sheets[i].w/h` or AssetFileMeta).
   * When set, decode uses a **single** createImageBitmap(blob, {resize…}) and
   * never materializes a full-res bitmap (Chromium longtask spike).
   */
  naturalW?: number;
  naturalH?: number;
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

/**
 * Hard cap on decoded sheet edge. Gate shadow atlases are ~3800px; transferring
 * a full-res ImageBitmap from the decode Worker still longtasks the UI (~80ms+).
 * Draw paths already multiply UVs by {@link AtlasSheetBank.getScale}.
 */
const MAX_SHEET_DECODE_EDGE = 2048;

function targetDecodeSize(
  naturalW: number,
  naturalH: number,
  hint?: SheetDecodeHint,
): { w: number; h: number } | null {
  if (!hint || hint.displayW < 1 || hint.displayH < 1) return null;
  if (naturalW < 1 || naturalH < 1) return null;
  const dpr = effectiveCanvasDpr();
  let tw = Math.max(1, Math.round(hint.displayW * dpr));
  let th = Math.max(1, Math.round(hint.displayH * dpr));
  const edge = Math.max(tw, th);
  if (edge > MAX_SHEET_DECODE_EDGE) {
    const s = MAX_SHEET_DECODE_EDGE / edge;
    tw = Math.max(1, Math.round(tw * s));
    th = Math.max(1, Math.round(th * s));
  }
  tw = Math.min(naturalW, tw);
  th = Math.min(naturalH, th);
  // Skip resize only when already near native AND under the transfer cap.
  if (
    tw >= naturalW * 0.95 &&
    th >= naturalH * 0.95 &&
    Math.max(naturalW, naturalH) <= MAX_SHEET_DECODE_EDGE
  ) {
    return null;
  }
  // Always resize when capped or smaller than natural — avoids full-res transfer.
  if (tw >= naturalW * 0.95 && th >= naturalH * 0.95) {
    return {
      w: Math.min(naturalW, MAX_SHEET_DECODE_EDGE),
      h: Math.min(
        naturalH,
        Math.max(
          1,
          Math.round(
            (Math.min(naturalW, MAX_SHEET_DECODE_EDGE) / naturalW) * naturalH,
          ),
        ),
      ),
    };
  }
  return { w: tw, h: th };
}

/**
 * Target bitmap size from hint + authored natural dims (no decode required).
 * Returns null when resize should be skipped (missing meta / near-native).
 */
export function targetDecodeSizeFromHint(
  hint?: SheetDecodeHint,
): { w: number; h: number; naturalW: number; naturalH: number } | null {
  if (!hint) return null;
  const naturalW = hint.naturalW ?? 0;
  const naturalH = hint.naturalH ?? 0;
  const target = targetDecodeSize(naturalW, naturalH, hint);
  if (!target) return null;
  return { ...target, naturalW, naturalH };
}

/** Result of decode — `scale` is resizedW/naturalW (and H); 1 when not resized. */
export type DecodedSheet = {
  image: DecodedImage;
  /** Uniform bitmap scale vs atlas/natural pixels (`resized / natural`). */
  scale: number;
};

/**
 * CSS display size for a full atlas sheet given authored sourceScale
 * (gate body=2, shadow=1, booking/bench usually 2).
 * Includes naturalW/H so decode can single-pass resize from the blob.
 */
export function sheetDisplaySize(
  sheetW: number,
  sheetH: number,
  sourceScale: number,
): SheetDecodeHint {
  const s = sourceScale > 0 ? sourceScale : 1;
  return {
    displayW: sheetW / s,
    displayH: sheetH / s,
    naturalW: sheetW,
    naturalH: sheetH,
  };
}

/** CSS size of one atlas cell (dest of {@link drawAtlasFrame}). */
export function frameDisplaySize(
  atlas: AtlasMeta,
  sourceScale: number,
): { cssW: number; cssH: number } {
  const s = sourceScale > 0 ? sourceScale : 1;
  return {
    cssW: atlas.frame_w / s,
    cssH: atlas.frame_h / s,
  };
}

async function createBitmapFromBlob(
  blob: Blob,
  opts?: ImageBitmapOptions,
): Promise<ImageBitmap> {
  if (opts) {
    try {
      return await createImageBitmap(blob, {
        imageOrientation: 'none',
        ...opts,
      });
    } catch {
      return await createImageBitmap(blob, opts);
    }
  }
  try {
    return await createImageBitmap(blob, { imageOrientation: 'none' });
  } catch {
    return await createImageBitmap(blob);
  }
}

/**
 * Chromium: WebP createImageBitmap AND large res.blob()/arrayBuffer() both
 * produce main-thread longtasks (~80–160ms). Fetch + decode entirely in a
 * Worker; only the ImageBitmap is transferred back to the UI thread.
 */
const DECODE_WORKER_SOURCE = `
self.onmessage = async (ev) => {
  const { id, url, buffer, resizeWidth, resizeHeight, naturalW } = ev.data;
  try {
    let blob;
    if (url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      blob = await res.blob();
    } else {
      blob = new Blob([buffer]);
    }
    const hasResize = resizeWidth > 0 && resizeHeight > 0;
    let bmp;
    if (hasResize) {
      try {
        bmp = await createImageBitmap(blob, {
          imageOrientation: 'none',
          resizeWidth,
          resizeHeight,
          resizeQuality: 'high',
        });
      } catch (e1) {
        try {
          bmp = await createImageBitmap(blob, {
            resizeWidth,
            resizeHeight,
            resizeQuality: 'high',
          });
        } catch (e2) {
          bmp = await createImageBitmap(blob);
        }
      }
    } else {
      try {
        bmp = await createImageBitmap(blob, { imageOrientation: 'none' });
      } catch (e3) {
        bmp = await createImageBitmap(blob);
      }
    }
    const scale = naturalW > 0 ? bmp.width / naturalW : 1;
    self.postMessage({ id, ok: true, bitmap: bmp, scale }, [bmp]);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
};
`;

type WorkerDecodeResult =
  | { ok: true; bitmap: ImageBitmap; scale: number }
  | { ok: false; error: string };

let decodeWorker: Worker | null | undefined;
let decodeWorkerReqId = 0;
const decodeWorkerWaiters = new Map<
  number,
  {
    resolve: (v: WorkerDecodeResult) => void;
  }
>();

function getDecodeWorker(): Worker | null {
  if (decodeWorker !== undefined) return decodeWorker;
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    decodeWorker = null;
    return null;
  }
  try {
    const blob = new Blob([DECODE_WORKER_SOURCE], {
      type: 'application/javascript',
    });
    const url = URL.createObjectURL(blob);
    const w = new Worker(url);
    URL.revokeObjectURL(url);
    w.onmessage = (ev: MessageEvent) => {
      const data = ev.data as {
        id: number;
        ok: boolean;
        bitmap?: ImageBitmap;
        scale?: number;
        error?: string;
      };
      const waiter = decodeWorkerWaiters.get(data.id);
      if (!waiter) return;
      decodeWorkerWaiters.delete(data.id);
      if (data.ok && data.bitmap) {
        waiter.resolve({
          ok: true,
          bitmap: data.bitmap,
          scale: data.scale ?? 1,
        });
      } else {
        waiter.resolve({ ok: false, error: data.error || 'decode failed' });
      }
    };
    w.onerror = () => {
      /* next call will fall back to main-thread */
      try {
        w.terminate();
      } catch {
        /* ignore */
      }
      decodeWorker = null;
    };
    decodeWorker = w;
    return w;
  } catch {
    decodeWorker = null;
    return null;
  }
}

function decodeInWorker(
  planned: { w: number; h: number; naturalW: number; naturalH: number } | null,
  opts: { url?: string; buffer?: ArrayBuffer },
): Promise<WorkerDecodeResult> {
  const w = getDecodeWorker();
  if (!w) return Promise.resolve({ ok: false, error: 'no-worker' });
  const id = (decodeWorkerReqId += 1);
  return new Promise((resolve) => {
    decodeWorkerWaiters.set(id, { resolve });
    const payload: Record<string, unknown> = {
      id,
      resizeWidth: planned?.w ?? 0,
      resizeHeight: planned?.h ?? 0,
      naturalW: planned?.naturalW ?? 0,
    };
    if (opts.url) {
      payload.url = opts.url;
      w.postMessage(payload);
      return;
    }
    if (opts.buffer) {
      payload.buffer = opts.buffer;
      w.postMessage(payload, [opts.buffer]);
      return;
    }
    decodeWorkerWaiters.delete(id);
    resolve({ ok: false, error: 'no-url-or-buffer' });
  });
}

async function decodeBlobOnMain(
  blob: Blob,
  hint?: SheetDecodeHint,
): Promise<DecodedSheet> {
  const planned = targetDecodeSizeFromHint(hint);
  if (planned) {
    try {
      const resized = await createBitmapFromBlob(blob, {
        resizeWidth: planned.w,
        resizeHeight: planned.h,
        resizeQuality: 'high',
      } as ImageBitmapOptions);
      const scale =
        planned.naturalW > 0 ? resized.width / planned.naturalW : 1;
      return { image: resized, scale: scale > 0 ? scale : 1 };
    } catch {
      /* fall through */
    }
  }

  const full = await createBitmapFromBlob(blob);
  const naturalW = full.width;
  const naturalH = full.height;
  const target = targetDecodeSize(naturalW, naturalH, hint);
  if (!target) return { image: full, scale: 1 };
  // Yield so full-decode and resize are separate tasks when worker unavailable.
  await new Promise<void>((r) => {
    if (typeof window !== 'undefined') window.setTimeout(r, 0);
    else r();
  });
  try {
    const resized = await createImageBitmap(full, {
      resizeWidth: target.w,
      resizeHeight: target.h,
      resizeQuality: 'high',
    } as ImageBitmapOptions);
    full.close();
    const scale = naturalW > 0 ? resized.width / naturalW : 1;
    return { image: resized, scale };
  } catch {
    return { image: full, scale: 1 };
  }
}

/**
 * Prefer worker fetch+decode (no main-thread blob/arrayBuffer).
 * Falls back to main-thread fetch only when the Worker path fails.
 */
async function decodeSheetUrl(
  url: string,
  hint?: SheetDecodeHint,
): Promise<DecodedSheet> {
  const planned = targetDecodeSizeFromHint(hint);
  if (typeof createImageBitmap === 'function' && typeof window !== 'undefined') {
    if (getDecodeWorker()) {
      await new Promise<void>((r) => {
        window.setTimeout(r, 0);
      });
      // Absolute URL — blob-worker fetch must not rely on relative resolution.
      const absUrl = new URL(url, window.location.href).href;
      const result = await decodeInWorker(planned, { url: absUrl });
      if (result.ok) {
        return {
          image: result.bitmap,
          scale: result.scale > 0 ? result.scale : 1,
        };
      }
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      // Yield before materializing bytes on the UI thread (fallback only).
      await new Promise<void>((r) => {
        window.setTimeout(r, 0);
      });
      const blob = await res.blob();
      await new Promise<void>((r) => {
        window.setTimeout(r, 0);
      });
      return await decodeBlobOnMain(blob, hint);
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
 * Atlas sheets **may** pass `hint` (via {@link AtlasSheetBank}) — draw paths must
 * multiply source UVs by the recorded scale ({@link AtlasSheetBank.getScale} /
 * `bitmapScale`). Cover images (`drawCoverImage`) may also pass `hint`.
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
      // Custom init (e.g. priority) still fetches on main — rare boot path.
      if (init) {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        await new Promise<void>((r) => {
          if (typeof window !== 'undefined') window.setTimeout(r, 0);
          else r();
        });
        const blob = await res.blob();
        const decoded = await enqueueDecode(() =>
          decodeBlobOnMain(blob, hint).catch(async () => {
            const image = await decodeViaImageElement(url);
            return { image, scale: 1 };
          }),
        );
        sheetResolved.set(url, decoded.image);
        sheetScales.set(url, decoded.scale);
        return decoded.image;
      }
      // Default: worker fetch+decode — keeps blob/arrayBuffer off the UI thread.
      const decoded = await enqueueDecode(() => decodeSheetUrl(url, hint));
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
 * Upload a sheet into the GPU decode cache at the **real CSS draw scale**.
 * Prefer a representative frame dest (`frame_w/sourceScale` × `frame_h/sourceScale`)
 * or the full-sheet display size. Avoids the old 2×2 warm that never matched
 * Chromium’s later half-scale raster (re-decode spikes).
 */
export function warmSheetGpu(
  img: DecodedImage,
  cssW?: number,
  cssH?: number,
): void {
  if (typeof document === 'undefined') return;
  try {
    const dpr = effectiveCanvasDpr();
    const wCss = cssW != null && cssW > 0 ? cssW : 2;
    const hCss = cssH != null && cssH > 0 ? cssH : 2;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(wCss * dpr));
    c.height = Math.max(1, Math.round(hCss * dpr));
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, c.width, c.height);
  } catch {
    /* ignore — warm is best-effort */
  }
}

/** One GPU-warm job per task — WebKit has no rIC; sync warmAll blocks 9–32ms. */
const warmQueue: Array<() => void> = [];
let warmPumpScheduled = false;
/** Dedupe: same DecodedImage must not enqueue two warm jobs back-to-back. */
const warmQueued = new WeakSet<object>();

/** Gap between warm jobs so scroll/engagement tasks are not chained 0ms apart. */
const WARM_PUMP_GAP_MS = 32;

function scheduleWarmPump(): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(
      () => {
        pumpWarmQueue();
      },
      { timeout: WARM_PUMP_GAP_MS },
    );
  } else {
    window.setTimeout(pumpWarmQueue, WARM_PUMP_GAP_MS);
  }
}

function pumpWarmQueue(): void {
  const job = warmQueue.shift();
  if (job) {
    try {
      job();
    } catch {
      /* ignore */
    }
  }
  if (warmQueue.length > 0) {
    scheduleWarmPump();
  } else {
    warmPumpScheduled = false;
  }
}

/**
 * Enqueue a single-sheet GPU warm (never runs synchronously on the caller stack).
 * Chunks one sheet per idle/timeout task — safe at NEAR margin while offscreen.
 * Duplicate schedules for the same image are ignored.
 */
export function scheduleGpuWarm(
  img: DecodedImage,
  cssW?: number,
  cssH?: number,
): void {
  if (typeof window === 'undefined') return;
  if (img && typeof img === 'object') {
    if (warmQueued.has(img as object)) return;
    warmQueued.add(img as object);
  }
  warmQueue.push(() => warmSheetGpu(img, cssW, cssH));
  if (warmPumpScheduled) return;
  warmPumpScheduled = true;
  scheduleWarmPump();
}

/**
 * Sparse atlas sheet bank — decode only requested sheet indexes (current + next).
 *
 * Sheets decode at DPR-aware **draw scale** via {@link SheetDecodeHint}
 * (`sheet.w/sourceScale` × `sheet.h/sourceScale`). Draw helpers multiply
 * authored UVs by {@link getScale}. Cap resident sheets with
 * {@link releaseExcept} so Chromium does not evict + re-decode mid-play.
 */
export class AtlasSheetBank {
  private readonly slots: Array<DecodedImage | null | undefined>;
  /** Per-sheet bitmap scale vs atlas natural pixels (default 1). */
  private readonly scales: number[];
  private readonly inflight = new Map<number, Promise<DecodedImage>>();
  private disposed = false;
  /** After first {@link releaseExcept}, only these indexes may stay resident. */
  private retain: Set<number> | null = null;
  private readonly sourceScale: number;
  private readonly frameCss: { cssW: number; cssH: number };

  constructor(
    private readonly atlas: AtlasMeta,
    /** Authored atlas pixel scale (gate body=2, shadow=1, booking/bench=2). */
    sourceScale = 2,
  ) {
    this.sourceScale = sourceScale > 0 ? sourceScale : 1;
    this.frameCss = frameDisplaySize(atlas, this.sourceScale);
    this.slots = new Array(atlas.sheets.length);
    this.scales = new Array(atlas.sheets.length).fill(1);
  }

  get atlasMeta(): AtlasMeta {
    return this.atlas;
  }

  getSourceScale(): number {
    return this.sourceScale;
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

  /** Sheet indexes currently held in slots. */
  residentIndexes(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.slots.length; i += 1) {
      if (this.slots[i]) out.push(i);
    }
    return out;
  }

  /** Kick off decode for sheet indexes; no-op if already loaded/in-flight. */
  ensure(sheetIndexes: number[]): Promise<void> {
    if (this.disposed) return Promise.resolve();
    // Expand retain so in-flight decodes for newly requested indexes are kept
    // until a later {@link releaseExcept} tightens the cap.
    if (this.retain) {
      for (const raw of sheetIndexes) this.retain.add(raw);
    }
    const jobs: Promise<DecodedImage>[] = [];
    for (const raw of sheetIndexes) {
      const i = raw;
      if (i < 0 || i >= this.atlas.sheets.length) continue;
      if (this.slots[i]) continue;
      let pending = this.inflight.get(i);
      if (!pending) {
        const meta = this.atlas.sheets[i];
        const file = meta.file;
        const hint = sheetDisplaySize(meta.w, meta.h, this.sourceScale);
        pending = loadSheetDecoded(file, undefined, hint).then(
          ({ image, scale }) => {
            this.inflight.delete(i);
            if (this.disposed) {
              closeSheet(file);
              return image;
            }
            // releaseExcept may have dropped this index while decode was in flight.
            if (this.retain && !this.retain.has(i)) {
              closeSheet(file);
              return image;
            }
            this.slots[i] = image;
            this.scales[i] = scale > 0 ? scale : 1;
            // Chunked warm at frame dest size — never sync on the ensure caller.
            scheduleGpuWarm(
              image,
              this.frameCss.cssW,
              this.frameCss.cssH,
            );
            return image;
          },
        );
        this.inflight.set(i, pending);
      }
      jobs.push(pending);
    }
    return jobs.length === 0
      ? Promise.resolve()
      : Promise.all(jobs).then(() => undefined);
  }

  /** Ensure sheets covering frame range [from, to]. */
  ensureFrames(from: number, to: number): Promise<void> {
    return this.ensure(sheetIndexesForFrames(this.atlas, from, to));
  }

  /** Sheet indexes for `frameIndex` and the next distinct sheet. */
  currentAndNextIndexes(frameIndex: number): number[] {
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
    return [...wanted];
  }

  /**
   * Ensure sheet for `frameIndex` and the next distinct sheet, then release
   * every other resident slot (cap = current + next).
   */
  ensureCurrentAndNext(frameIndex: number): Promise<void> {
    const wanted = this.currentAndNextIndexes(frameIndex);
    return this.ensure(wanted).then(() => {
      this.releaseExcept(wanted);
    });
  }

  /**
   * Prefetch first-play sheets only (frame 0 current+next) — not every sheet.
   * Does not release; caller may hold landing+breathe banks separately.
   */
  ensureFirstPlayWindow(): Promise<void> {
    return this.ensure(this.currentAndNextIndexes(0));
  }

  /** Wait until every sheet index is decoded (fetches parallel, decode queue = 1). */
  ensureAll(): Promise<void> {
    const all = this.atlas.sheets.map((_, i) => i);
    return this.ensure(all);
  }

  /**
   * Null slots + {@link closeSheet} for indexes not in `keep`.
   * Static cover images live outside the bank and are unaffected.
   * In-flight decodes for dropped indexes are discarded on resolve.
   */
  releaseExcept(indexes: number[]): void {
    if (this.disposed) return;
    const keep = new Set(indexes);
    this.retain = keep;
    for (let i = 0; i < this.slots.length; i += 1) {
      if (keep.has(i)) continue;
      if (!this.slots[i] && !this.inflight.has(i)) continue;
      this.slots[i] = null;
      this.scales[i] = 1;
      this.inflight.delete(i);
      const file = this.atlas.sheets[i]?.file;
      if (file) closeSheet(file);
    }
  }

  /**
   * Invoke `cb` for every currently decoded sheet (skips empty slots).
   */
  forEachSheet(cb: (img: DecodedImage, sheetIndex: number) => void): void {
    for (let i = 0; i < this.slots.length; i += 1) {
      const img = this.slots[i];
      if (img) cb(img, i);
    }
  }

  /**
   * Warm one resident sheet at frame draw scale (sync). Prefer
   * {@link warmResidentGpuChunked} off the visible critical path.
   */
  warmSheetGpuAt(sheetIndex: number): void {
    const img = this.slots[sheetIndex];
    if (!img) return;
    warmSheetGpu(img, this.frameCss.cssW, this.frameCss.cssH);
  }

  /**
   * Chunk-warm every resident sheet — one sheet per task (setTimeout 0).
   * Call at NEAR margin while still offscreen; never sync warmAll on reveal.
   */
  warmResidentGpuChunked(): void {
    this.forEachSheet((img) => {
      scheduleGpuWarm(img, this.frameCss.cssW, this.frameCss.cssH);
    });
  }

  /**
   * @deprecated Prefer {@link warmResidentGpuChunked}. Sync warm of all
   * resident sheets — only for tests.
   */
  warmAllGpu(): void {
    this.forEachSheet((img) =>
      warmSheetGpu(img, this.frameCss.cssW, this.frameCss.cssH),
    );
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
 * (`resized/natural`); pass {@link AtlasSheetBank.getScale}.
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

/**
 * Rasterize atlas frame 0 into a data-URL poster matching the first motion
 * canvas frame (motion users). Reduced-motion / software-GL keep RM posters.
 */
export function captureAtlasFramePoster(
  bank: AtlasSheetBank,
  atlas: AtlasMeta,
  frameIndex = 0,
  sourceScale = 2,
): string | null {
  if (typeof document === 'undefined') return null;
  const entry = atlas.index[frameIndex];
  if (!entry) return null;
  const sheet = bank.get(entry[0]);
  if (!sheet) return null;
  const bs = bank.getScale(entry[0]);
  const { cssW, cssH } = frameDisplaySize(atlas, sourceScale);
  const dpr = effectiveCanvasDpr();
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(cssW * dpr));
    c.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAtlasFrame(ctx, sheet, atlas, frameIndex, 0, 0, sourceScale, bs);
    return c.toDataURL('image/webp', 0.92);
  } catch {
    return null;
  }
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
