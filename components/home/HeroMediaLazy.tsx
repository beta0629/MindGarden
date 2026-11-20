'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';

type MediaProps = { enhanceOnly?: boolean };

/**
 * Loads the HeroMedia client chunk immediately on mount (no boot gate / idle).
 * Soft-GL is fine for stacked-alpha WebGL1 — never skip the island for soft-GL.
 * Reduced-motion: remove SSR hero video (0 mp4), poster only.
 */
export function HeroMediaLazy() {
  const [Media, setMedia] = useState<ComponentType<MediaProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          document.querySelector('.hero-stacked-video')?.remove();
          dispatchHomeBootReady();
          return;
        }
        const mod = await import('./HeroMedia');
        if (!cancelled) setMedia(() => mod.HeroMedia);
      } catch {
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
