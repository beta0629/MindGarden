'use client';

import { useEffect } from 'react';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';
import { HeroMedia } from './HeroMedia';
import { usePrefersReducedMotion } from './v37/useBreakpointPack';

/**
 * Eager hero enhance — HeroMedia is statically imported so WebGL lives in the
 * same client chunk that hydrates with the page (no dynamic import RTT).
 * Reduced-motion: strip SSR video + early canvas (0 mp4 / no WebGL).
 */
export function HeroMediaLazy() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!reduced) return;
    document.querySelector('.hero-stacked-video')?.remove();
    document.querySelector('.hero-early-canvas')?.remove();
    document.querySelector('.hero-early-root')?.remove();
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
