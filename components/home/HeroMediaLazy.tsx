'use client';

import { useEffect } from 'react';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';
import { HeroMedia } from './HeroMedia';
import { usePrefersReducedMotion } from './v37/useBreakpointPack';

/**
 * Eager hero enhance — HeroMedia is statically imported so WebGL lives in the
 * same client chunk that hydrates with the page (no dynamic import RTT).
 * Reduced-motion: do not remove SSR early-canvas nodes (avoids React #418);
 * CSS hides them; boot script is a no-op under RM (0 mp4 / no WebGL).
 */
export function HeroMediaLazy() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!reduced) return;
    try {
      (
        window as Window & { __mgHeroEarlyStop?: () => void }
      ).__mgHeroEarlyStop?.();
    } catch {
      /* ignore */
    }
    dispatchHomeBootReady();
  }, [reduced]);

  if (reduced) return null;
  return <HeroMedia enhanceOnly />;
}
