import {
  benchBackSrc,
  benchFrontSrc,
  bookingBreatheSrc,
  bookingHoverSrc,
  bookingLandingSrc,
  gateStackSrc,
  v4KeyFromViewport,
  type V4Key,
} from '@/components/home/v4/assets';

/** Cache Storage bucket. Bump when the cache format itself changes. */
export const SCENE_CACHE_PREFIX = 'mg-scenes-';
export const SCENE_CACHE_NAME = 'mg-scenes-v1';
/** localStorage flag: last signed scene URL set. The loader skips when it matches. */
export const SCENES_READY_STORAGE_KEY = 'mg-scenes-ready-v1';

export type ScenePreloadProgress = {
  loadedBytes: number;
  totalBytes: number | null;
  itemsDone: number;
  itemsTotal: number;
};

export type ScenePreloadOptions = {
  pack?: V4Key;
  signal?: AbortSignal;
};

/**
 * URLs for the current (or given) viewport pack. Keys include any `?v=`
 * so a new asset version is a new cache entry.
 */
export function sceneVideoUrls(pack: V4Key = v4KeyFromViewport()): string[] {
  const urls = [
    gateStackSrc(pack),
    benchBackSrc(pack),
    benchFrontSrc(pack),
    bookingLandingSrc(pack),
    bookingBreatheSrc(pack),
  ];
  if (pack === 'd') urls.push(bookingHoverSrc(pack));
  return urls;
}

/**
 * Stable id of every pack's scene URLs (includes `?v=`). When an asset
 * version changes, the first-visit loader shows again.
 */
export function sceneCacheSignature(): string {
  return [...new Set([...sceneVideoUrls('m'), ...sceneVideoUrls('d')])].join('|');
}

function absUrl(url: string): string {
  return new URL(url, window.location.href).href;
}

let openPromise: Promise<Cache | null> | null = null;

/**
 * Open the scene Cache Storage bucket, deleting stale `mg-scenes-*` caches.
 * Returns null when Cache Storage is missing or throws (e.g. some private modes).
 */
export function openSceneCache(): Promise<Cache | null> {
  if (!openPromise) openPromise = openSceneCacheOnce();
  return openPromise;
}

async function openSceneCacheOnce(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith(SCENE_CACHE_PREFIX) && n !== SCENE_CACHE_NAME)
        .map((n) => caches.delete(n)),
    );
    const cache = await caches.open(SCENE_CACHE_NAME);
    try {
      const live = new Set(
        [...sceneVideoUrls('m'), ...sceneVideoUrls('d')].map(absUrl),
      );
      const stored = await cache.keys();
      await Promise.all(
        stored.filter((req) => !live.has(req.url)).map((req) => cache.delete(req)),
      );
    } catch {
      /* prune is best-effort */
    }
    return cache;
  } catch {
    return null;
  }
}

function videoBlob(blob: Blob): Blob {
  return blob.type.startsWith('video/')
    ? blob
    : new Blob([blob], { type: 'video/mp4' });
}

async function readBlobWithProgress(
  res: Response,
  onBytes?: (loaded: number, total: number | null) => void,
): Promise<Blob> {
  const headerLen = Number(res.headers.get('content-length'));
  const total = Number.isFinite(headerLen) && headerLen > 0 ? headerLen : null;
  const type = res.headers.get('content-type') || 'video/mp4';
  if (!onBytes || !res.body) {
    const blob = videoBlob(await res.blob());
    onBytes?.(blob.size, blob.size);
    return blob;
  }
  const reader = res.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const copy = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    chunks.push(copy);
    loaded += value.byteLength;
    onBytes(loaded, total);
  }
  const blob = videoBlob(new Blob(chunks, { type }));
  onBytes(blob.size, blob.size);
  return blob;
}

/**
 * Resolve a scene mp4 as a Blob: Cache Storage hit first, otherwise fetch,
 * store (best-effort), and return. Falls back to a plain fetch when the
 * cache is unavailable.
 */
export async function fetchSceneVideoBlob(
  url: string,
  opts?: { signal?: AbortSignal; onBytes?: (loaded: number, total: number | null) => void },
): Promise<Blob> {
  const abs = absUrl(url);
  const cache = await openSceneCache();
  if (cache) {
    try {
      const hit = await cache.match(abs);
      if (hit) {
        const blob = videoBlob(await hit.blob());
        opts?.onBytes?.(blob.size, blob.size);
        return blob;
      }
    } catch {
      /* private-mode / corrupt entry — fall through to network */
    }
  }

  const res = await fetch(abs, {
    signal: opts?.signal,
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('unavailable');
  const blob = await readBlobWithProgress(res, opts?.onBytes);
  if (cache) {
    try {
      await cache.put(
        abs,
        new Response(blob, {
          headers: {
            'Content-Type': blob.type || 'video/mp4',
            'Content-Length': String(blob.size),
          },
        }),
      );
    } catch {
      /* quota or private mode — playback still has the blob */
    }
  }
  return blob;
}

/**
 * Prefetch every scene video for the current (or given) pack into Cache
 * Storage. Reports aggregate byte progress for a future loading screen.
 * Does not build or show any UI.
 */
export async function preloadSceneVideos(
  onProgress?: (progress: ScenePreloadProgress) => void,
  opts?: ScenePreloadOptions,
): Promise<void> {
  const pack = opts?.pack ?? v4KeyFromViewport();
  const urls = sceneVideoUrls(pack).map(absUrl);
  const itemsTotal = urls.length;
  const loadedByItem = new Array<number>(itemsTotal).fill(0);
  const totalByItem = new Array<number | null>(itemsTotal).fill(null);
  let itemsDone = 0;

  const report = () => {
    const loadedBytes = loadedByItem.reduce((a, b) => a + b, 0);
    const known = totalByItem.every((n): n is number => n != null && n > 0);
    const totalBytes = known ? totalByItem.reduce((a, n) => a + n, 0) : null;
    onProgress?.({
      loadedBytes,
      totalBytes,
      itemsDone,
      itemsTotal,
    });
  };

  report();
  await Promise.all(
    urls.map(async (url, i) => {
      const blob = await fetchSceneVideoBlob(url, {
        signal: opts?.signal,
        onBytes: (loaded, total) => {
          loadedByItem[i] = loaded;
          if (total != null) totalByItem[i] = total;
          report();
        },
      });
      loadedByItem[i] = blob.size;
      totalByItem[i] = blob.size;
      itemsDone += 1;
      report();
    }),
  );
}
