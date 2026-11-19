'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  dispatchHomeBootReady,
  whenHomeBootBarShown,
  whenHomeBootReady,
} from '@/components/home/homeBoot';

/** After LCP poster + boot gate — short idle before WebGL probe (not on LCP). */
const SOFTWARE_GPU_PROBE_IDLE_MS = 1200;

/** After soft-GL probe passes — idle before downloading HeroMedia. */
const HERO_MEDIA_IDLE_TIMEOUT_MS = 6000;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(2000, timeoutMs));
    }
  });
}

type MediaProps = { enhanceOnly?: boolean };

/**
 * Defers the HeroMedia client chunk (video / three.js path) until after
 * `home-boot-ready` + idle. {@link probeSoftwareGpu} also waits for a short
 * idle so WebGL context creation stays off the LCP/boot critical path; soft-GL
 * keeps the poster and never imports three. Soft-GL finish waits until the bar
 * has been shown so session-once cannot skip the first-entry bar.
 */
export function HeroMediaLazy() {
  const [Media, setMedia] = useState<ComponentType<MediaProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await whenHomeBootReady();
      if (cancelled) return;
      try {
        // Reduced-motion: poster-only — no soft-GL probe, no HeroMedia canvas/WebGL.
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          await whenHomeBootBarShown();
          if (!cancelled) dispatchHomeBootReady();
          return;
        }
        await waitIdle(SOFTWARE_GPU_PROBE_IDLE_MS);
        if (cancelled) return;
        const { probeSoftwareGpu } = await import('./v37/softwareGpu');
        if (probeSoftwareGpu()) {
          // Belt: bar must paint before hero-ready dismiss (effect order: this
          // child often runs before SiteShell's HomeBootProgress).
          await whenHomeBootBarShown();
          if (!cancelled) dispatchHomeBootReady();
          return;
        }
        if (cancelled) return;
        await waitIdle(HERO_MEDIA_IDLE_TIMEOUT_MS);
        if (cancelled) return;
        const mod = await import('./HeroMedia');
        if (!cancelled) setMedia(() => mod.HeroMedia);
      } catch {
        await whenHomeBootBarShown();
        if (!cancelled) dispatchHomeBootReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Media) return null;
  return <Media enhanceOnly />;
}
