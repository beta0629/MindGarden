'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type RefObject,
} from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';
import { startSequentialScenePreload } from '@/components/home/v4/preloadScenes';
import type { V37SceneKind } from './types';
import { useBreakpointPack } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

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

/** Idle after boot before JS-only scene chunk preload. */
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

let preloadPromise: Promise<void> | null = null;

function subscribeNoop() {
  return () => {};
}

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
 * After boot + short idle: fetch+eval scene JS chunks.
 * Soft-GL does NOT skip scenes — stacked-alpha WebGL1 decode is tiny.
 * Also kicks sequential MP4 preload (hero → gate → bench → booking).
 */
function ensureSceneChunksPreloaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    try {
      await whenHomeBootReady();
      await waitIdle(CHUNK_PRELOAD_IDLE_MS);
      void startSequentialScenePreload();
      for (const kind of SCENE_KINDS) {
        await loadSceneModule(kind);
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
      }
    } catch {
      /* preload is best-effort — mount path will import on demand */
    }
  })();
  return preloadPromise;
}

/**
 * Idle-mount scene React trees after boot (JS already preloaded).
 * Soft-GL is allowed — only decode failure keeps the poster.
 * `key={pack}` remounts the scene on breakpoint change (no pack-reset setState).
 */
function DeferredV37Scene({
  kind,
  sectionRef,
}: SceneProps & { kind: SceneKind }) {
  const pack = useBreakpointPack();
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  /** Client-only: avoid painting pack `'390'` poster on desktop before matchMedia. */
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureSceneChunksPreloaded();
        if (cancelled) return;
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
    return <Scene key={pack} sectionRef={sectionRef} />;
  }

  return (
    <div className={SCENE_CLASS[kind]} aria-hidden="true">
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
