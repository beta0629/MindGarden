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
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
