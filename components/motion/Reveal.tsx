'use client';

import { useEffect } from 'react';

/**
 * CSS + IntersectionObserver fade-up. No animation library.
 * Elements marked with [data-reveal] (optional data-reveal-stagger on grids).
 */
export function RevealBoot() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add('is-revealed');
          io.unobserve(el);
        }
      },
      // Slight positive top margin so below-fold sections near the fold
      // reveal without waiting for a deep scroll, without hiding the hero
      // (hero must not use data-reveal — opacity:0 delays LCP).
      { rootMargin: '0px 0px -4% 0px', threshold: 0.08 },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
