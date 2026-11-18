'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  dispatchHomeBootReady,
  whenHomeBootBarShown,
  whenHomeBootReady,
} from '@/components/home/homeBoot';

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
 * `home-boot-ready` + idle. Probes software GL immediately after the poster
 * gate so the boot bar can dismiss without waiting on idle; soft-GL keeps the
 * poster and never imports three. Soft-GL finish waits until the bar has been
 * shown so session-once cannot skip the first-entry bar.
 */
export function HeroMediaLazy() {
  const [Media, setMedia] = useState<ComponentType<MediaProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await whenHomeBootReady();
      if (cancelled) return;
      try {
        const { probeSoftwareGpu } = await import('./v37/atlas');
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
