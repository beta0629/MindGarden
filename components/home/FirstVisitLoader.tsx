'use client';

import { useEffect } from 'react';
import {
  SCENES_READY_STORAGE_KEY,
  preloadSceneVideos,
  sceneCacheSignature,
} from '@/components/home/v4/sceneCache';
import {
  LOADER_CLASS,
  LOADER_EASE_ENTER,
  LOADER_FLIP_MS,
  LOADER_ID,
  LOADER_MARK_FADE_MS,
  LOADER_MAX_MS,
  LOADER_MIN_MS,
  LOADER_MOTION_CLASS,
  LOADER_REDUCED_FADE_MS,
  LOADER_REVEAL_CLASS,
  holdHeroPlayback,
  isHeroFirstFramePainted,
  measureHeroButterflyRect,
  prefersReducedMotion,
  releaseHeroPlayback,
  watchHeroFirstFrame,
} from '@/components/home/v4/firstVisitLoader';

type WindowWithLoader = Window & {
  __mgHoldHero?: boolean;
  __mgLoaderPauseObs?: MutationObserver;
};

function setProgress(root: HTMLElement, percent: number) {
  const n = Math.max(0, Math.min(100, Math.round(percent)));
  root.style.setProperty('--p', String(n));
  const bar = root.querySelector('[role="progressbar"]');
  bar?.setAttribute('aria-valuenow', String(n));
  const pct = root.querySelector('.pct');
  if (pct) pct.textContent = `${n}%`;
  const live = root.querySelector('[aria-live]');
  if (!live) return;
  const step = n < 50 ? 0 : n < 100 ? 50 : 100;
  const text = `불러오는 중 ${step}%`;
  if (live.textContent !== text) live.textContent = text;
}

function inertPage(overlay: HTMLElement): HTMLElement[] {
  const inerted: HTMLElement[] = [];
  for (const node of document.body.children) {
    if (!(node instanceof HTMLElement) || node === overlay || node.id === LOADER_ID) {
      continue;
    }
    if (!node.inert) {
      node.inert = true;
      inerted.push(node);
    }
  }
  return inerted;
}

function runFlip(root: HTMLElement, mark: HTMLElement): Promise<void> {
  const start = mark.getBoundingClientRect();
  const end = measureHeroButterflyRect();
  root.classList.add('is-flip');
  window.setTimeout(() => {
    document.documentElement.classList.add(LOADER_REVEAL_CLASS);
  }, LOADER_FLIP_MS - LOADER_MARK_FADE_MS);

  if (!end || start.width < 1) {
    root.classList.add('is-out');
    return new Promise((resolve) => window.setTimeout(resolve, LOADER_FLIP_MS));
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const scale = end.width / start.width;
  mark.style.transformOrigin = '0 0';
  const move = mark.animate(
    [
      { transform: 'none' },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
    ],
    {
      duration: LOADER_FLIP_MS,
      easing: LOADER_EASE_ENTER,
      fill: 'forwards',
    },
  );
  const fade = mark.animate(
    [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: (LOADER_FLIP_MS - LOADER_MARK_FADE_MS) / LOADER_FLIP_MS },
      { opacity: 0, offset: 1 },
    ],
    { duration: LOADER_FLIP_MS, easing: 'linear', fill: 'forwards' },
  );
  root.classList.add('is-out');
  return Promise.all([move.finished, fade.finished]).then(() => undefined);
}

function markScenesReady() {
  try {
    localStorage.setItem(SCENES_READY_STORAGE_KEY, sceneCacheSignature());
  } catch {
    /* private mode */
  }
}

/**
 * Drives the first-visit overlay injected by FirstVisitLoaderInline:
 * real-byte progress, min 1.2s / max 8s, FLIP handoff, then teardown.
 */
export function FirstVisitLoader() {
  useEffect(() => {
    const root = document.getElementById(LOADER_ID);
    if (!root) return;

    const reduced = prefersReducedMotion();
    const started = performance.now();
    let scenesDone = false;
    let heroReady = isHeroFirstFramePainted();
    let closed = false;
    let minTimer = 0;
    const w = window as WindowWithLoader;

    document.documentElement.classList.add(LOADER_CLASS);
    if (!reduced) document.documentElement.classList.add(LOADER_MOTION_CLASS);
    w.__mgHoldHero = true;
    // Pause only after the first frame is on the canvas; pausing earlier
    // would prevent that frame from ever painting.
    if (heroReady) holdHeroPlayback();
    const inerted = inertPage(root);
    setProgress(root, 0);

    const reportProgress = (bytePct: number, allReady: boolean) => {
      if (allReady) setProgress(root, 100);
      else setProgress(root, Math.min(99, Math.round(Math.max(0, bytePct) * 99)));
    };

    const tryClose = (timedOut = false) => {
      if (closed) return;
      if (!timedOut && !(scenesDone && heroReady)) return;
      const elapsed = performance.now() - started;
      if (!timedOut && elapsed < LOADER_MIN_MS) {
        window.clearTimeout(minTimer);
        minTimer = window.setTimeout(() => tryClose(false), LOADER_MIN_MS - elapsed);
        return;
      }
      closed = true;
      window.clearTimeout(maxTimer);
      window.clearTimeout(minTimer);
      if (scenesDone && heroReady) setProgress(root, 100);

      const finish = () => {
        markScenesReady();
        w.__mgLoaderPauseObs?.disconnect();
        document.documentElement.classList.remove(
          LOADER_CLASS,
          LOADER_MOTION_CLASS,
          LOADER_REVEAL_CLASS,
        );
        for (const el of inerted) el.inert = false;
        document.getElementById('mg-load-css')?.remove();
        root.remove();
        releaseHeroPlayback();
      };

      if (reduced || (timedOut && !heroReady)) {
        root.classList.add('is-out-rm');
        window.setTimeout(finish, LOADER_REDUCED_FADE_MS);
        return;
      }
      const mark = root.querySelector<HTMLElement>('.m');
      if (!mark) {
        root.classList.add('is-out');
        window.setTimeout(finish, LOADER_FLIP_MS);
        return;
      }
      void runFlip(root, mark).then(finish);
    };

    const stopWatch = watchHeroFirstFrame(() => {
      heroReady = true;
      holdHeroPlayback();
      if (scenesDone) reportProgress(1, true);
      tryClose(false);
    });

    void preloadSceneVideos((progress) => {
      const bytePct =
        progress.totalBytes && progress.totalBytes > 0
          ? progress.loadedBytes / progress.totalBytes
          : progress.itemsTotal > 0
            ? progress.itemsDone / progress.itemsTotal
            : 0;
      reportProgress(bytePct, scenesDone && heroReady);
    })
      .then(() => {
        scenesDone = true;
        reportProgress(1, heroReady);
        tryClose(false);
      })
      .catch(() => {
        scenesDone = true;
        tryClose(false);
      });

    const maxTimer = window.setTimeout(() => tryClose(true), LOADER_MAX_MS);

    return () => {
      window.clearTimeout(maxTimer);
      window.clearTimeout(minTimer);
      stopWatch();
      if (!closed) {
        // Unmount mid-load (client nav): don't leave the page inert.
        for (const el of inerted) el.inert = false;
      }
    };
  }, []);

  return null;
}
