'use client';

import {
  useEffect,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';
import type { V37SceneKind } from './types';
import { useBreakpointPack } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';
import { peekSoftwareGpu } from './softwareGpu';

type SceneProps = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type SceneKind = V37SceneKind;

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

/**
 * Soft-GL skip when {@link peekSoftwareGpu} is already `true`.
 * `null` (unprobed) → treat as hardware and premount JS (no WebGL context here).
 */
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
 * After boot + short idle: fetch+eval scene JS chunks only (no atlas, no WebGL).
 * Peek-only soft-GL gate — never {@link probeSoftwareGpu} (that stays in HeroMediaLazy).
 * Atlas fetch/decode stays behind {@link whenHomeDeferredWorkAllowed} inside scenes.
 */
function ensureSceneChunksPreloaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    try {
      await whenHomeBootReady();
      await waitIdle(CHUNK_PRELOAD_IDLE_MS);
      // Peek only — do not create a WebGL context on this path.
      if (peekSoftwareGpu() === true) {
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
 * scroll does not pay React commit longtasks. Soft-GL (peek===true) never mounts.
 * Unprobed (`null`) pretends hardware so WebKit gate scroll does not pay mount.
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
        // Re-peek: HeroMediaLazy may have probed soft-GL while we waited.
        if (softGlSkipScenes || peekSoftwareGpu() === true) {
          softGlSkipScenes = true;
          return;
        }
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
       * Layout spacer always (CSS aspect). Poster only after mount so desktop
       * uses the live pack — never SSR `'390'` → `'1440'` hop.
       * Motion URL is fixed; RM via <picture> media only — never JS src flip.
       */}
      {mounted ? (
        <V37ScenePoster
          kind={kind}
          pack={pack}
          className="v37-scene__poster"
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
