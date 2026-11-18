'use client';

import { useEffect, useState, type ComponentType } from 'react';

/** Visual boot bar only — ready gate is HomeBootInline (no React). */
const BOOT_BAR_IDLE_MS = 2000;

export function HomeBootProgressLazy() {
  const [Bar, setBar] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;
    let cancelled = false;
    const start = () => {
      void import('./HomeBootProgress').then((m) => {
        if (!cancelled) setBar(() => m.HomeBootProgress);
      });
    };
    let idleId = 0;
    let timeoutId = 0;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: BOOT_BAR_IDLE_MS });
    } else {
      timeoutId = window.setTimeout(start, 600);
    }
    return () => {
      cancelled = true;
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!Bar) return null;
  return <Bar />;
}
