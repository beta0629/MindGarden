'use client';

import { useEffect, useRef, useState } from 'react';
import {
  dispatchHomeBootProgress,
  hasHomeBootCompleted,
  HOME_BOOT_FADE_MS,
  HOME_BOOT_PROGRESS_EVENT,
  HOME_BOOT_READY_EVENT,
  type HomeBootProgressDetail,
} from '@/components/home/homeBoot';

/**
 * Visual-only cream/green boot bar. Ready gate is owned by HomeBootInline
 * (classic script) so this chunk can load after LCP without blocking.
 */
export function HomeBootProgress({ force = false }: { force?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;

    if (!force && hasHomeBootCompleted()) {
      return;
    }

    const ac = new AbortController();
    requestAnimationFrame(() => {
      if (!ac.signal.aborted) setVisible(true);
    });

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<HomeBootProgressDetail>).detail;
      if (!detail) return;
      setRatio(detail.ratio);
      if (detail.done) {
        finishedRef.current = true;
        setFading(true);
        window.setTimeout(() => setVisible(false), HOME_BOOT_FADE_MS);
      }
    };

    const onReady = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setRatio(1);
      setFading(true);
      window.setTimeout(() => setVisible(false), HOME_BOOT_FADE_MS);
    };

    // If inline script already finished before this chunk loaded, fade immediately.
    if (document.documentElement.classList.contains('home-boot-ready')) {
      onReady();
    } else {
      // Approximate progress while waiting for the inline gate.
      setRatio(0.35);
      dispatchHomeBootProgress(0.35, false);
      window.addEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);
      window.addEventListener(HOME_BOOT_READY_EVENT, onReady);
    }

    return () => {
      ac.abort();
      window.removeEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);
      window.removeEventListener(HOME_BOOT_READY_EVENT, onReady);
    };
  }, [force]);

  if (!visible) return null;

  const pct = Math.round(ratio * 1000) / 10;

  return (
    <div
      className={`home-boot-progress${fading ? ' is-done' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label="페이지 준비 중"
    >
      <div
        className="home-boot-progress__bar"
        style={{ transform: `scaleX(${Math.min(1, Math.max(0, ratio))})` }}
      />
    </div>
  );
}
