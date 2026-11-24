'use client';

import { useEffect, useState, type ComponentType } from 'react';

const MOBILE_NAV_IDLE_MS = 2500;

/**
 * Defer mobile-nav client JS until after first paint / short idle.
 * Desktop nav stays in the RSC SiteHeader with no App Router chunk.
 */
export function MobileNavLazy() {
  const [Nav, setNav] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      void import('./MobileNav').then((m) => {
        if (!cancelled) setNav(() => m.MobileNav);
      });
    };
    let idleId = 0;
    let timeoutId = 0;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: MOBILE_NAV_IDLE_MS });
    } else {
      timeoutId = window.setTimeout(start, 800);
    }
    return () => {
      cancelled = true;
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!Nav) {
    // SSR / pre-hydrate: inert toggle so layout width matches (non-functional until load).
    return (
      <button type="button" className="menu-toggle" aria-hidden="true" tabIndex={-1}>
        <span className="sr-only">메뉴</span>
        <svg
          aria-hidden="true"
          className="menu-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M4 6h12M4 10h12M4 14h12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    );
  }

  return <Nav />;
}
