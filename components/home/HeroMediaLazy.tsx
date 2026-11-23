'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';
import {
  LOADER_DONE_EVENT,
  isLoaderActive,
} from '@/components/home/v4/firstVisitLoader';
import { usePrefersReducedMotion } from './v37/useBreakpointPack';

type HeroMediaComponent = ComponentType<{ enhanceOnly?: boolean }>;

/**
 * Defer the WebGL hero player until the first-visit loader has handed off.
 * The early-boot script paints the first frame under the overlay (for FLIP);
 * mounting StackedAlphaVideo earlier was a long main-thread task that delayed LCP.
 * Reduced-motion: do not remove SSR early-canvas nodes (avoids React #418);
 * CSS hides them; boot script is a no-op under RM (0 mp4 / no WebGL).
 */
export function HeroMediaLazy() {
  const reduced = usePrefersReducedMotion();
  const [Media, setMedia] = useState<HeroMediaComponent | null>(null);

  useEffect(() => {
    if (reduced) {
      try {
        (window as Window & { __mgHeroEarlyStop?: () => void }).__mgHeroEarlyStop?.();
      } catch {
        /* ignore */
      }
      dispatchHomeBootReady();
      return;
    }

    let cancelled = false;
    const load = () => {
      void import('./HeroMedia').then((mod) => {
        if (!cancelled) setMedia(() => mod.HeroMedia);
      });
    };

    window.addEventListener(LOADER_DONE_EVENT, load, { once: true });
    if (!isLoaderActive()) {
      window.removeEventListener(LOADER_DONE_EVENT, load);
      load();
    }
    return () => {
      cancelled = true;
      window.removeEventListener(LOADER_DONE_EVENT, load);
    };
  }, [reduced]);

  if (reduced || !Media) return null;
  return <Media enhanceOnly />;
}
