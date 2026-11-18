'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';

/** After LCP poster + boot gate — then idle before downloading HeroMedia. */
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
 * `home-boot-ready` + idle. Skips entirely on software GL so LH / SwiftShader
 * never imports three or creates a heavy WebGL context during the audit window.
 */
export function HeroMediaLazy() {
  const [Media, setMedia] = useState<ComponentType<MediaProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await whenHomeBootReady();
      if (cancelled) return;
      await waitIdle(HERO_MEDIA_IDLE_TIMEOUT_MS);
      if (cancelled) return;
      try {
        const { probeSoftwareGpu } = await import('./v37/atlas');
        if (probeSoftwareGpu()) return;
        if (cancelled) return;
        const mod = await import('./HeroMedia');
        if (!cancelled) setMedia(() => mod.HeroMedia);
      } catch {
        /* poster-only fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Media) return null;
  return <Media enhanceOnly />;
}
