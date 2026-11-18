'use client';

import { useEffect, useState, type ComponentType } from 'react';

/**
 * Visual boot bar — load immediately on first homepage entry.
 * Do not idle-defer: poster gate can finish ≤1.5s and a late bar never appears.
 * Ready/session gate remains HomeBootInline (poster) + HeroMedia (hero decision).
 */
export function HomeBootProgressLazy() {
  const [Bar, setBar] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;
    let cancelled = false;
    void import('./HomeBootProgress').then((m) => {
      if (!cancelled) setBar(() => m.HomeBootProgress);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Bar) return null;
  return <Bar />;
}
