'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  dispatchHomeBootProgress,
  hasHomeBootCompleted,
  isHomeBootHeroDecided,
  markHomeBootCompleted,
  notifyHomeBootBarShown,
  HOME_BOOT_BAR_TIMEOUT_MS,
  HOME_BOOT_EASE_CEILING,
  HOME_BOOT_FADE_MS,
  HOME_BOOT_MIN_VISIBLE_MS,
  HOME_BOOT_PROGRESS_EVENT,
  type HomeBootProgressDetail,
} from '@/components/home/homeBoot';

/** Matches inline boot bar (`HomeBootInline`) until React takeover. */
const HOME_BOOT_START_RATIO = 0.35;

/**
 * Read live scaleX from a CSS transform matrix (interpolated during transition).
 */
function readScaleX(el: HTMLElement): number | null {
  const raw = getComputedStyle(el).transform;
  if (!raw || raw === 'none') return null;
  if (raw.startsWith('matrix3d(')) {
    const a = Number(raw.slice(9, -1).split(',')[0]);
    return Number.isFinite(a) ? a : null;
  }
  if (raw.startsWith('matrix(')) {
    const a = Number(raw.slice(7, -1).split(',')[0]);
    return Number.isFinite(a) ? a : null;
  }
  return null;
}

/**
 * Visual-only cream/green boot bar.
 * Poster gate (`home-boot-ready`) unblocks deferred work but must NOT dismiss
 * this bar — wait for hero progress `done` (GLB / soft-GL / mount fail).
 * Session-once skip is applied only after this bar has been shown + finished.
 * Wait-phase motion is CSS `transform` on `.home-boot-progress__bar` (compositor)
 * toward {@link HOME_BOOT_EASE_CEILING}; JS only syncs aria and snaps to complete.
 */
export function HomeBootProgress({ force = false }: { force?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [fading, setFading] = useState(false);
  const [barEasing, setBarEasing] = useState(false);
  const [barComplete, setBarComplete] = useState(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef(0);
  const ratioRef = useRef(0);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Paint before paint when possible so soft-GL (child useEffect) cannot
  // finish the session before the bar ever appears.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;
    if (!force && hasHomeBootCompleted()) {
      document.getElementById('mg-home-boot-progress-inline')?.remove();
      return;
    }
    startedAtRef.current = performance.now();
    setVisible(true);
    notifyHomeBootBarShown();
    document.getElementById('mg-home-boot-progress-inline')?.remove();
  }, [force]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') return;

    if (!force && hasHomeBootCompleted()) {
      return;
    }

    if (!startedAtRef.current) {
      startedAtRef.current = performance.now();
    }

    const ac = new AbortController();
    let minTimer = 0;
    let fadeTimer = 0;
    let safetyTimer = 0;
    let ariaTimer = 0;
    let startEaseTimer = 0;

    const stopAriaSync = () => {
      if (ariaTimer) {
        window.clearTimeout(ariaTimer);
        ariaTimer = 0;
      }
    };

    const applyRatio = (next: number) => {
      // Never decrease — progress events / aria sync only move forward.
      const clamped = Math.min(1, Math.max(ratioRef.current, next));
      if (clamped === ratioRef.current) return;
      ratioRef.current = clamped;
      setRatio(clamped);
    };

    const finish = () => {
      if (finishedRef.current || ac.signal.aborted) return;
      finishedRef.current = true;
      stopAriaSync();
      if (startEaseTimer) {
        window.clearTimeout(startEaseTimer);
        startEaseTimer = 0;
      }
      setBarComplete(true);
      applyRatio(1);
      markHomeBootCompleted();
      const wait = Math.max(
        0,
        HOME_BOOT_MIN_VISIBLE_MS - (performance.now() - startedAtRef.current),
      );
      minTimer = window.setTimeout(() => {
        if (ac.signal.aborted) return;
        setFading(true);
        fadeTimer = window.setTimeout(() => {
          if (!ac.signal.aborted) setVisible(false);
        }, HOME_BOOT_FADE_MS);
      }, wait);
    };

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<HomeBootProgressDetail>).detail;
      if (!detail) return;
      applyRatio(detail.ratio);
      if (detail.done) finish();
    };

    // Timeout chain — never a native rAF competing with rafScheduler (peak=2).
    const tickAria = () => {
      if (finishedRef.current || ac.signal.aborted) return;
      const el = barRef.current;
      if (el) {
        const scale = readScaleX(el);
        if (scale != null) {
          // Cap at ease ceiling until finish() snaps to 1.
          applyRatio(Math.min(HOME_BOOT_EASE_CEILING, Math.max(0, scale)));
        }
      }
      ariaTimer = window.setTimeout(tickAria, 100);
    };

    // Approximate progress while waiting for the hero decision — never treat
    // the poster `home-boot-ready` class/event as bar-complete (flash/miss bug).
    setVisible(true);
    notifyHomeBootBarShown();
    // Start from current (inline ~0.35) — CSS default; do not reset backwards.
    applyRatio(HOME_BOOT_START_RATIO);
    dispatchHomeBootProgress(Math.max(HOME_BOOT_START_RATIO, ratioRef.current), false);
    window.addEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);

    // Paint start scale, then add is-easing so CSS transitions 0.35 → ceiling.
    startEaseTimer = window.setTimeout(() => {
      startEaseTimer = 0;
      if (finishedRef.current || ac.signal.aborted) return;
      setBarEasing(true);
      ariaTimer = window.setTimeout(tickAria, 100);
    }, 0);

    safetyTimer = window.setTimeout(finish, HOME_BOOT_BAR_TIMEOUT_MS);

    // Soft-GL / fail may have dispatched before this listener attached.
    if (isHomeBootHeroDecided()) {
      finish();
    }

    return () => {
      ac.abort();
      stopAriaSync();
      if (startEaseTimer) window.clearTimeout(startEaseTimer);
      window.removeEventListener(HOME_BOOT_PROGRESS_EVENT, onProgress);
      window.clearTimeout(minTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [force]);

  if (!visible) return null;

  const pct = Math.round(ratio * 1000) / 10;
  const barClass = [
    'home-boot-progress__bar',
    barEasing ? 'is-easing' : '',
    barComplete ? 'is-complete' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`home-boot-progress${fading ? ' is-done' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label="페이지 준비 중"
    >
      <div ref={barRef} className={barClass} />
    </div>
  );
}
