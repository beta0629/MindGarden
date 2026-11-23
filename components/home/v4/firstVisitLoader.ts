/** First-visit loading screen — tokens and timings from loading-v1 SPEC. */

export const LOADER_ID = 'mg-load';
export const LOADER_MIN_MS = 1200;
export const LOADER_MAX_MS = 8000;
export const LOADER_FLIP_MS = 600;
export const LOADER_MARK_FADE_MS = 200;
export const LOADER_REDUCED_FADE_MS = 100;
export const LOADER_DONE_EVENT = 'mg-loader-done';
export const LOADER_CLASS = 'mg-loading';
export const LOADER_MOTION_CLASS = 'mg-motion';
export const LOADER_REVEAL_CLASS = 'mg-hero-reveal';
export const LOADER_EASE_ENTER = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Butterfly body + wings (not the flower field) in the hero first-frame
 * poster, normalized to the painted frame box. Measured from
 * hero-m-poster.webp / hero-d-poster.webp (decode of stack frame 0).
 */
export const HERO_BUTTERFLY_NORM = {
  x: 0.355,
  y: 0.28,
  w: 0.391,
  h: 0.326,
} as const;

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isLoaderActive(): boolean {
  return document.documentElement.classList.contains(LOADER_CLASS);
}

/** Live painted hero frame (early canvas or adopted stacked player). */
export function heroFrameElement(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.hero-stacked') ??
    document.querySelector<HTMLElement>('.hero-early-root')
  );
}

export function isHeroFirstFramePainted(): boolean {
  return Boolean(
    document.querySelector(
      '.hero-early-canvas[data-ready="1"], .hero-stacked canvas[data-ready="1"]',
    ),
  );
}

/**
 * Viewport box of the hero butterfly in the currently painted first frame.
 * Uses the live frame's getBoundingClientRect (includes the 390 framing
 * transform) mapped through {@link HERO_BUTTERFLY_NORM}.
 */
export function measureHeroButterflyRect(): DOMRect | null {
  const frame = heroFrameElement();
  if (!frame) return null;
  const r = frame.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const { x, y, w, h } = HERO_BUTTERFLY_NORM;
  return new DOMRect(
    r.left + r.width * x,
    r.top + r.height * y,
    r.width * w,
    r.height * h,
  );
}

export function watchHeroFirstFrame(onReady: () => void): () => void {
  if (isHeroFirstFramePainted()) {
    onReady();
    return () => {};
  }
  let done = false;
  const fire = () => {
    if (done || !isHeroFirstFramePainted()) return;
    done = true;
    cleanup();
    onReady();
  };
  const obs = new MutationObserver(fire);
  obs.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-ready'],
    childList: true,
  });
  window.addEventListener('mg-hero-first-frame', fire);
  const cleanup = () => {
    obs.disconnect();
    window.removeEventListener('mg-hero-first-frame', fire);
  };
  return cleanup;
}

export function heroVideo(): HTMLVideoElement | null {
  const w = window as Window & {
    __mgHeroVideo?: HTMLVideoElement;
    __mgHeroBootV?: HTMLVideoElement;
  };
  return w.__mgHeroVideo ?? w.__mgHeroBootV ?? null;
}

export function holdHeroPlayback(): void {
  const w = window as Window & { __mgHoldHero?: boolean };
  w.__mgHoldHero = true;
  try {
    heroVideo()?.pause();
  } catch {
    /* ignore */
  }
}

export function releaseHeroPlayback(): void {
  const w = window as Window & { __mgHoldHero?: boolean };
  w.__mgHoldHero = false;
  const video = heroVideo();
  const play = video?.play();
  if (play && typeof play.catch === 'function') play.catch(() => {});
  window.dispatchEvent(new Event(LOADER_DONE_EVENT));
}
