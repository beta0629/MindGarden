/**
 * When may the hero mp4 start? After the LCP poster has painted, so the video
 * bytes stay off the LCP/FCP critical path (Lighthouse/lantern counts every
 * request that starts before LCP). Shared with public/hero-boot-v4.js, which
 * sets `window.__mgHeroStarted` + fires `mg-hero-start` when it starts first.
 *
 * - Chromium (has navigator.userAgentData + LCP entries): the poster's LCP entry.
 * - Others (WebKit/Safari, Firefox): the poster's load event — no Lighthouse there,
 *   and waiting for paint costs ~100 ms of first-frame time on WebKit.
 * - Always resolves within 1.5 s.
 */
export function whenHeroMayStart(img: HTMLImageElement | null): Promise<void> {
  return new Promise((resolve) => {
    // Loader already covers the page; start the hero immediately so the
    // first frame (and FLIP) are not gated on the poster's LCP entry.
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('mg-loading')) {
      resolve();
      return;
    }
    const w = window as Window & { __mgHeroStarted?: number };
    let done = false;
    const cleanups: Array<() => void> = [];
    const finish = () => {
      if (done) return;
      done = true;
      cleanups.forEach((c) => c());
      resolve();
    };
    if (w.__mgHeroStarted || !img) {
      finish();
      return;
    }
    window.addEventListener('mg-hero-start', finish, { once: true });
    cleanups.push(() => window.removeEventListener('mg-hero-start', finish));
    const timer = window.setTimeout(finish, 1500);
    cleanups.push(() => window.clearTimeout(timer));

    const types =
      typeof PerformanceObserver !== 'undefined'
        ? PerformanceObserver.supportedEntryTypes
        : undefined;
    const nav = navigator as Navigator & { userAgentData?: unknown };
    if (nav.userAgentData && types?.includes('largest-contentful-paint')) {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries() as Array<
          PerformanceEntry & { element?: Element | null; url?: string }
        >) {
          if (e.element === img || (e.url && e.url === img.currentSrc)) {
            window.setTimeout(finish, 0);
            return;
          }
        }
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
      cleanups.push(() => po.disconnect());
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      finish();
      return;
    }
    const onLoad = () => finish();
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onLoad, { once: true });
    cleanups.push(() => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onLoad);
    });
  });
}
