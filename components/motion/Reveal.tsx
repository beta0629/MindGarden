'use client';

import { useEffect } from 'react';

const REVEAL_ROOT_MARGIN = '160px 0px 160px 0px';
const VIEWPORT_SLACK_PX = 160;

/**
 * Progressive scroll reveal (CSS + IntersectionObserver only).
 *
 * Default CSS keeps [data-reveal] visible so SSR / no-JS / full-page captures
 * show every section. Only after JS confirms IntersectionObserver support do we
 * mark below-fold nodes as `.reveal-pending` (hidden for animation) and reveal
 * anything already in or above the viewport immediately.
 */
export function RevealBoot() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    );

    if (reduce.matches || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((el) => {
        el.classList.add('is-revealed');
        el.classList.remove('reveal-pending');
      });
      return;
    }

    const isInOrAboveViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight + VIEWPORT_SLACK_PX;
    };

    const reveal = (el: HTMLElement) => {
      el.classList.add('is-revealed');
      el.classList.remove('reveal-pending');
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          reveal(el);
          io.unobserve(el);
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN, threshold: 0 },
    );

    const syncReveal = () => {
      nodes.forEach((el) => {
        if (el.classList.contains('is-revealed')) return;
        if (!isInOrAboveViewport(el)) return;
        reveal(el);
        io.unobserve(el);
      });
    };

    // Classify synchronously before enabling hide styles so above-fold content
    // never flashes to opacity:0. Below-fold nodes are off-screen when hidden.
    nodes.forEach((el) => {
      if (isInOrAboveViewport(el)) {
        reveal(el);
        return;
      }
      el.classList.add('reveal-pending');
      io.observe(el);
    });

    document.documentElement.classList.add('reveal-js');

    // Sync pass after observe — covers layout shifts / late images / fast scroll.
    syncReveal();
    window.addEventListener('scroll', syncReveal, { passive: true });
    window.addEventListener('resize', syncReveal);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', syncReveal);
      window.removeEventListener('resize', syncReveal);
      document.documentElement.classList.remove('reveal-js');
    };
  }, []);

  return null;
}
