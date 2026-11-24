'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';

const CHROME_IDLE_TIMEOUT_MS = 2500;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(1200, timeoutMs));
    }
  });
}

type Props = {
  /** When true (homepage), wait for boot gate before loading chrome chunks. */
  waitForHomeBoot?: boolean;
  children?: ReactNode;
};

/**
 * Defers RevealBoot + StickyBookingBar JS until after first paint / home-boot.
 * Keeps getBoundingClientRect sweeps off the LCP critical path.
 */
export function DeferredChrome({ waitForHomeBoot = false }: Props) {
  const [mods, setMods] = useState<{
    RevealBoot: ComponentType;
    StickyBookingBar: ComponentType;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (waitForHomeBoot) {
        await whenHomeBootReady();
        if (cancelled) return;
      }
      await waitIdle(waitForHomeBoot ? CHROME_IDLE_TIMEOUT_MS : 1500);
      if (cancelled) return;
      const [reveal, sticky] = await Promise.all([
        import('@/components/motion/Reveal'),
        import('@/components/layout/StickyBookingBar'),
      ]);
      if (!cancelled) {
        setMods({
          RevealBoot: reveal.RevealBoot,
          StickyBookingBar: sticky.StickyBookingBar,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [waitForHomeBoot]);

  if (!mods) return null;
  const { RevealBoot, StickyBookingBar } = mods;
  return (
    <>
      <StickyBookingBar />
      <RevealBoot />
    </>
  );
}
