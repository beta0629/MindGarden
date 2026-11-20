'use client';

import { useEffect, useState, type ComponentType } from 'react';
import {
  dispatchHomeBootReady,
  whenHomeBootReady,
} from '@/components/home/homeBoot';
import { startSequentialScenePreload } from '@/components/home/v4/preloadScenes';

/** Short idle after poster gate — then load hero video island (never blocks LCP). */
const HERO_MEDIA_IDLE_TIMEOUT_MS = 800;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(800, timeoutMs));
    }
  });
}

type MediaProps = { enhanceOnly?: boolean };

/**
 * Defers the HeroMedia client chunk until after the poster gate + short idle.
 * Soft-GL is fine for stacked-alpha WebGL1 — never skip the island for soft-GL.
 * Reduced-motion: poster only (no video / WebGL).
 */
export function HeroMediaLazy() {
  const [Media, setMedia] = useState<ComponentType<MediaProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await whenHomeBootReady();
      if (cancelled) return;
      try {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          dispatchHomeBootReady();
          void startSequentialScenePreload();
          return;
        }
        await waitIdle(HERO_MEDIA_IDLE_TIMEOUT_MS);
        if (cancelled) return;
        const mod = await import('./HeroMedia');
        if (!cancelled) setMedia(() => mod.HeroMedia);
      } catch {
        if (!cancelled) {
          dispatchHomeBootReady();
          void startSequentialScenePreload();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Media) return null;
  return <Media enhanceOnly />;
}
