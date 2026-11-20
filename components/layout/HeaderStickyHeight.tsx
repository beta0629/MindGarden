'use client';

import { useEffect } from 'react';

/**
 * Publishes sticky header height to `--header-sticky-h` for scroll-padding.
 * Tiny client island — keeps SiteHeader itself a Server Component.
 */
export function HeaderStickyHeight() {
  useEffect(() => {
    const el = document.getElementById('site-header');
    if (!el) return;
    const publish = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      const cur = getComputedStyle(document.documentElement)
        .getPropertyValue('--header-sticky-h')
        .trim();
      const curPx = cur.endsWith('px') ? Number.parseFloat(cur) : Number.NaN;
      if (Number.isFinite(curPx) && Math.abs(curPx - h) < 1) return;
      document.documentElement.style.setProperty('--header-sticky-h', `${h}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener('resize', publish);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', publish);
    };
  }, []);

  return null;
}
