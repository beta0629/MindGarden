'use client';

import {
  useEffect,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';
import type { PackId } from './types';
import { useBreakpointPack } from './useBreakpointPack';

type SceneProps = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type SceneKind = 'gate' | 'bench' | 'booking';

const POSTER: Record<SceneKind, (pack: PackId) => string> = {
  gate: (pack) => `/assets/home-v3.7/gate/${pack}/gate-poster-rm-${pack}.webp`,
  bench: (pack) =>
    `/assets/home-v3.7/bench/${pack}/bench-poster-rm-${pack}.webp`,
  booking: (pack) =>
    `/assets/home-v3.7/booking/${pack}/booking-poster-rm-${pack}.webp`,
};

const SCENE_CLASS: Record<SceneKind, string> = {
  gate: 'v37-scene v37-scene--gate',
  bench: 'v37-scene v37-scene--bench',
  booking: 'v37-scene v37-scene--booking',
};

const LOADERS: Record<
  SceneKind,
  () => Promise<{ default: ComponentType<SceneProps> }>
> = {
  gate: () =>
    import('./GateScene').then((m) => ({ default: m.GateScene })),
  bench: () =>
    import('./BenchScene').then((m) => ({ default: m.BenchScene })),
  booking: () =>
    import('./BookingScene').then((m) => ({ default: m.BookingScene })),
};

/** Idle after boot before JS-only scene chunk preload (no atlas fetch/decode). */
const CHUNK_PRELOAD_IDLE_MS = 1200;

/** Stagger React mounts during idle so three commits are not one longtask. */
const MOUNT_STAGGER_MS: Record<SceneKind, number> = {
  gate: 0,
  bench: 48,
  booking: 96,
};

const SCENE_KINDS: SceneKind[] = ['gate', 'bench', 'booking'];

/** Cached dynamic imports — filled by idle preload after boot. */
const moduleCache = new Map<
  SceneKind,
  Promise<{ default: ComponentType<SceneProps> }>
>();

let softGlSkipScenes: boolean | null = null;
let preloadPromise: Promise<void> | null = null;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(1200, timeoutMs));
    }
  });
}

function loadSceneModule(
  kind: SceneKind,
): Promise<{ default: ComponentType<SceneProps> }> {
  let pending = moduleCache.get(kind);
  if (!pending) {
    pending = LOADERS[kind]();
    moduleCache.set(kind, pending);
  }
  return pending;
}

/**
 * After boot + short idle: fetch+eval scene JS chunks only (no atlas).
 * Soft-GL skips preload — canvases never mount.
 * Atlas fetch/decode stays behind {@link whenHomeDeferredWorkAllowed} inside
 * Gate/Booking/Bench (not here).
 */
function ensureSceneChunksPreloaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    try {
      await whenHomeBootReady();
      await waitIdle(CHUNK_PRELOAD_IDLE_MS);
      const { probeSoftwareGpu } = await import('./atlas');
      if (probeSoftwareGpu()) {
        softGlSkipScenes = true;
        return;
      }
      softGlSkipScenes = false;
      // Stagger chunk eval so one longtask does not absorb all three modules.
      for (const kind of SCENE_KINDS) {
        await loadSceneModule(kind);
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
      }
    } catch {
      softGlSkipScenes = softGlSkipScenes ?? false;
      /* preload is best-effort — mount path will import on demand */
    }
  })();
  return preloadPromise;
}

/**
 * Idle-mount scene React trees after boot (JS already preloaded) so first
 * scroll does not pay React commit longtasks. Soft-GL never mounts.
 * Atlas/network/decode remains engagement-gated inside each scene.
 *
 * Place size / aspect / bench pads come from CSS media queries only (globals.css).
 * Pack is used solely for poster atlas paths — gated to client mount so desktop
 * never flashes the SSR/hydration `'390'` pack.
 */
function DeferredV37Scene({
  kind,
  sectionRef,
}: SceneProps & { kind: SceneKind }) {
  const pack = useBreakpointPack();
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  /** Client-only: avoid painting pack `'390'` poster on desktop before matchMedia. */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureSceneChunksPreloaded();
        if (cancelled) return;
        if (softGlSkipScenes) return;
        const mod = await loadSceneModule(kind);
        const stagger = MOUNT_STAGGER_MS[kind] || 0;
        if (stagger > 0) {
          await new Promise<void>((r) => {
            window.setTimeout(r, stagger);
          });
        }
        if (!cancelled) setScene(() => mod.default);
      } catch {
        /* poster placeholder remains */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (Scene) {
    return <Scene sectionRef={sectionRef} />;
  }

  return (
    <div className={SCENE_CLASS[kind]} aria-hidden="true">
      {/*
       * Layout spacer always (CSS aspect). Poster `src` only after mount so
       * desktop uses the live pack — never SSR `'390'` → `'1440'` hop.
       */}
      {mounted ? (
        // eslint-disable-next-line @next/next/no-img-element -- static stand-in until scene chunk loads
        <img
          className="v37-scene__poster"
          src={POSTER[kind](pack)}
          alt=""
          decoding="async"
          loading="lazy"
          fetchPriority="low"
        />
      ) : (
        <div className="v37-scene__poster" />
      )}
    </div>
  );
}

export function GateScene(props: SceneProps) {
  return <DeferredV37Scene kind="gate" {...props} />;
}

export function BenchScene(props: SceneProps) {
  return <DeferredV37Scene kind="bench" {...props} />;
}

export function BookingScene(props: SceneProps) {
  return <DeferredV37Scene kind="booking" {...props} />;
}
