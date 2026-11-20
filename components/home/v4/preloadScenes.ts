import { whenHomeBootReady } from '@/components/home/homeBoot';
import {
  benchBackSrc,
  benchFrontSrc,
  bookingBreatheSrc,
  bookingHoverSrc,
  bookingLandingSrc,
  gateStackSrc,
  heroStackSrc,
  v4KeyFromViewport,
  type V4Key,
} from './assets';

const IDLE_MS = 1200;

let preloadStarted = false;
let preloadPromise: Promise<void> | null = null;
let cachedKey: V4Key | null = null;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(1200, timeoutMs));
    }
  });
}

/**
 * Prefetch one MP4 into the HTTP cache (and warm the media element pipeline).
 * Resolves on `canplaythrough` / error / timeout — never throws.
 */
function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* ignore */
      }
      video.remove();
      resolve();
    };
    const timer = window.setTimeout(finish, 20000);
    video.addEventListener('canplaythrough', () => {
      window.clearTimeout(timer);
      finish();
    });
    video.addEventListener('error', () => {
      window.clearTimeout(timer);
      finish();
    });
    // Hidden warm element.
    video.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-99px;top:-99px';
    document.body.appendChild(video);
    video.src = src;
    video.load();
  });
}

function sceneUrls(key: V4Key): string[] {
  return [
    heroStackSrc(key),
    gateStackSrc(key),
    benchBackSrc(key),
    benchFrontSrc(key),
    bookingLandingSrc(key),
    bookingBreatheSrc(key),
    // Hover is desktop-only; still cheap to warm on mobile for pack flips.
    bookingHoverSrc(key),
  ];
}

/**
 * After first paint / boot gate + idle: sequentially preload scene videos
 * (hero → gate → bench → booking) for the current breakpoint. Never blocks LCP.
 * Does not wait for user input.
 */
export function startSequentialScenePreload(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (preloadPromise) return preloadPromise;
  preloadStarted = true;
  preloadPromise = (async () => {
    try {
      await whenHomeBootReady();
      await waitIdle(IDLE_MS);
      const key = v4KeyFromViewport();
      cachedKey = key;
      const urls = sceneUrls(key);
      for (const url of urls) {
        // Sequential — one decode pipeline warm at a time.
        await preloadVideo(url);
        // Yield between scenes so scroll/input stay responsive.
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
      }
    } catch {
      /* best-effort */
    }
  })();
  return preloadPromise;
}

/** True after {@link startSequentialScenePreload} has been kicked. */
export function hasScenePreloadStarted(): boolean {
  return preloadStarted;
}

export function getPreloadedV4Key(): V4Key | null {
  return cachedKey;
}
