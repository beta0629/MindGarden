'use client';

import { useEffect, useRef, useState } from 'react';
import {
  dispatchHomeBootProgress,
  hasHomeBootCompleted,
  HOME_BOOT_BAR_TIMEOUT_MS,
  HOME_BOOT_FADE_MS,
  HOME_BOOT_MIN_VISIBLE_MS,
  HOME_BOOT_PROGRESS_EVENT,
  markHomeBootCompleted,
  type HomeBootProgressDetail,
} from '@/components/home/homeBoot';

/**
 * Visual-only cream/green boot bar.
 * Poster gate (`home-boot-ready`) unblocks deferred work but must NOT dismiss
 * this bar — wait for hero progress `done` (GLB / soft-GL / mount fail).
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

    const startedAt = performance.now();
    const ac = new AbortController();
    let minTimer = 0;
    let fadeTimer = 0;
    let safetyTimer = 0;

    requestAnimationFrame(() => {
      if (!ac.signal.aborted) setVisible(true);
    });

    const finish = () => {
      if (finishedRef.current || ac.signal.aborted) return;
      finishedRef.current = true;
      markHomeBootCompleted();
      const wait = Math.max(
        0,
        HOME_BOOT_MIN_VISIBLE_MS - (performance.now() - startedAt),
      );
      minTimer = window.setTimeout(() => {
        if (ac.signal.aborted) return;
        setRatio(1);
        setFading(true);
        fadeTimer = window.setTimeout(() => {
          if (!ac.signal.aborted) setVisible(false);
        }, HOME_BOOT_FADE_MS);
      }, wait);
    };

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<HomeBootProgressDetail>).detail;
      if (!detail) return;
      setRatio(detail.ratio);
      if (detail.done) finish();
    };

    // Approximate progress while waiting for the hero decision — never treat
    // the poster `home-boot-ready` class/event as bar-complete (flash/miss bug).
    setRatio(0.35);
    dispatchHomeBootProgress(0.35, false);
    window.addEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);
    safetyTimer = window.setTimeout(finish, HOME_BOOT_BAR_TIMEOUT_MS);

    return () => {
      ac.abort();
      window.removeEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);
      window.clearTimeout(minTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(safetyTimer);
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
