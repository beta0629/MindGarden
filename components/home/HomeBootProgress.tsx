'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AtlasSheetBank, loadJson, loadSheet } from '@/components/home/v37/atlas';
import type { BenchJson, GateJson, PackId } from '@/components/home/v37/types';
import {
  dispatchHomeBootProgress,
  dispatchHomeBootReady,
  hasHomeBootCompleted,
  HOME_BOOT_FADE_MS,
  HOME_BOOT_TIMEOUT_MS,
} from '@/components/home/homeBoot';

/**
 * Relative weights for the bar. Ready gate waits on fonts + poster + GLB +
 * first atlases (or HOME_BOOT_TIMEOUT_MS), then reveals hero 3D.
 */
const WEIGHT = {
  fonts: 0.15,
  poster: 0.25,
  glb: 0.45,
  atlas: 0.15,
} as const;

const HERO_GLB = '/assets/hero/hero-butterfly.glb';

type Props = {
  /** When true, force-show even if session already completed (tests). */
  force?: boolean;
};

function packFromViewport(): PackId {
  if (typeof window === 'undefined') return '390';
  return window.matchMedia('(min-width: 768px)').matches ? '1440' : '390';
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function fetchWithProgress(
  url: string,
  onRatio: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const res = await fetch(url, {
      signal,
      cache: 'force-cache',
      ...({ priority: 'low' } as RequestInit),
    });
    if (!res.ok) {
      onRatio(1);
      return;
    }
    const total = Number(res.headers.get('content-length') || 0);
    if (!res.body || total <= 0) {
      await res.arrayBuffer();
      onRatio(1);
      return;
    }
    const reader = res.body.getReader();
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.length;
        onRatio(Math.min(1, received / total));
      }
    }
    onRatio(1);
  } catch {
    onRatio(1);
  }
}

function observeHeroPoster(onReady: () => void, signal?: AbortSignal): void {
  const img = document.querySelector<HTMLImageElement>('.hero-still');
  if (!img) {
    onReady();
    return;
  }
  if (img.complete && img.naturalWidth > 0) {
    onReady();
    return;
  }
  const done = () => onReady();
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
  signal?.addEventListener(
    'abort',
    () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
    },
    { once: true },
  );
}

/** Low-priority fetch opts so boot warm does not fight the LCP poster. */
const LOW_FETCH = {
  cache: 'force-cache' as RequestCache,
  ...({ priority: 'low' } as RequestInit),
};

async function warmFirstAtlases(
  pack: PackId,
  onRatio: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  let gateDone = 0;
  let benchDone = 0;
  const report = () => onRatio((gateDone + benchDone) / 2);
  const init = { ...LOW_FETCH, signal };

  const gateJob = (async () => {
    try {
      const json = await loadJson<GateJson>(
        `gate/${pack}/gate-${pack}.json`,
        init,
      );
      if (signal?.aborted) return;
      gateDone = 0.4;
      report();
      const sheet0 = json.door.body_atlas.sheets[0]?.file;
      if (sheet0) await loadSheet(sheet0, init);
      if (signal?.aborted) return;
      const body = new AtlasSheetBank(json.door.body_atlas);
      await body.ensureCurrentAndNext(0);
      gateDone = 1;
      report();
    } catch {
      gateDone = 1;
      report();
    }
  })();

  const benchJob = (async () => {
    try {
      const json = await loadJson<BenchJson>(
        `bench/${pack}/bench-${pack}.json`,
        init,
      );
      if (signal?.aborted) return;
      benchDone = 0.4;
      report();
      const first = Object.keys(json.ambient)[0];
      if (first) {
        const sheet0 = json.ambient[first].atlas.sheets[0]?.file;
        if (sheet0) await loadSheet(sheet0, init);
        if (signal?.aborted) return;
        const bank = new AtlasSheetBank(json.ambient[first].atlas);
        await bank.ensureCurrentAndNext(0);
      }
      benchDone = 1;
      report();
    } catch {
      benchDone = 1;
      report();
    }
  })();

  await Promise.all([gateJob, benchJob]);
  onRatio(1);
}

function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Thin brand-green boot bar on cream — first homepage entry per session only.
 * Observes the LCP poster (no re-fetch), then low-priority GLB + first atlases.
 * Does not block hero copy.
 */
export function HomeBootProgress({ force = false }: Props) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (pathname !== '/') return;

    const reduced = prefersReducedMotion();
    if (!force && hasHomeBootCompleted()) {
      document.documentElement.classList.add('home-boot-ready');
      dispatchHomeBootProgress(1, true);
      return;
    }

    const ac = new AbortController();
    // Defer painting the bar one frame so LCP poster can claim first paint.
    requestAnimationFrame(() => {
      if (!ac.signal.aborted) setVisible(true);
    });
    const parts = { fonts: 0, poster: 0, glb: 0, atlas: 0 };

    const publish = () => {
      const total =
        parts.fonts * WEIGHT.fonts +
        parts.poster * WEIGHT.poster +
        parts.glb * WEIGHT.glb +
        parts.atlas * WEIGHT.atlas;
      const clamped = Math.min(1, Math.max(0, total));
      setRatio(clamped);
      dispatchHomeBootProgress(clamped, false);
    };

    let timeoutId = 0;
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      window.clearTimeout(timeoutId);
      parts.fonts = 1;
      parts.poster = 1;
      parts.glb = 1;
      parts.atlas = 1;
      setRatio(1);
      dispatchHomeBootReady();
      setFading(true);
      window.setTimeout(() => {
        setVisible(false);
      }, reduced ? 0 : HOME_BOOT_FADE_MS);
    };

    timeoutId = window.setTimeout(finish, HOME_BOOT_TIMEOUT_MS);

    const run = async () => {
      if (reduced) {
        parts.fonts = 1;
        parts.poster = 1;
        parts.glb = 1;
        parts.atlas = 1;
        publish();
        finish();
        return;
      }

      await afterPaint();
      if (ac.signal.aborted || finishedRef.current) return;

      const fontsJob = (async () => {
        // Preloaded Pretendard only — full fonts.ready pulls every unicode-range
        // file at VeryHigh and delays LCP render.
        try {
          if (document.fonts?.load) {
            await Promise.race([
              Promise.all([
                document.fonts.load('600 1em Pretendard'),
                document.fonts.load('400 1em Pretendard'),
              ]),
              new Promise<void>((r) => window.setTimeout(r, 600)),
            ]);
          }
        } catch {
          /* ignore */
        }
        parts.fonts = 1;
        publish();
      })();

      const posterJob = new Promise<void>((resolve) => {
        observeHeroPoster(() => {
          parts.poster = 1;
          publish();
          resolve();
        }, ac.signal);
      });

      // LCP path first: fonts + poster (text stays visible; no GLB/atlas yet).
      await Promise.all([
        fontsJob,
        Promise.race([
          posterJob,
          new Promise<void>((r) => window.setTimeout(r, 1500)),
        ]),
      ]);
      if (ac.signal.aborted || finishedRef.current) return;

      // Commit the poster LCP paint before createImageBitmap / GLB work steals the
      // main thread (LH render-delay was ~77% of LCP under 4× CPU throttle).
      await afterPaint();
      await new Promise<void>((r) => window.setTimeout(r, 0));
      if (ac.signal.aborted || finishedRef.current) return;

      const pack = packFromViewport();

      // Network-first GLB (low priority). Atlas decode waits for idle so LCP sticks.
      const glbJob = fetchWithProgress(
        HERO_GLB,
        (r) => {
          parts.glb = r;
          publish();
        },
        ac.signal,
      ).then(() => {
        parts.glb = 1;
        publish();
      });

      const atlasJob = (async () => {
        await new Promise<void>((resolve) => {
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => resolve(), { timeout: 2000 });
          } else {
            window.setTimeout(resolve, 400);
          }
        });
        if (ac.signal.aborted || finishedRef.current) return;
        await warmFirstAtlases(
          pack,
          (r) => {
            parts.atlas = r;
            publish();
          },
          ac.signal,
        );
        parts.atlas = 1;
        publish();
      })();

      await Promise.all([glbJob, atlasJob]);
      if (!ac.signal.aborted && !finishedRef.current) {
        finish();
      }
    };

    void run();

    return () => {
      ac.abort();
      window.clearTimeout(timeoutId);
    };
  }, [pathname, force]);

  if (pathname !== '/' || !visible) return null;

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
