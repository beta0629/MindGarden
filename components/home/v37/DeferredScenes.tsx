'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type RefObject,
} from 'react';
import type { V37SceneKind } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
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

/** Start decoding when the scene is within ~1.5 viewports (one fetch per file). */
const NEAR_VIEWPORT_ROOT_MARGIN = '150% 0px';

/** Cached dynamic imports — filled when a scene nears the viewport. */
const moduleCache = new Map<
  SceneKind,
  Promise<{ default: ComponentType<SceneProps> }>
>();

function subscribeNoop() {
  return () => {};
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
 * Mount scene React trees when near the viewport (IO rootMargin ~150%).
 * Scene JS loads at ~150%. Gate/bench assign mp4 src only at 25% rootMargin
 * (scroll-scrub clips); booking still preloads when its module mounts.
 * Reduced-motion: poster only (never mount video players / never fetch mp4).
 * `key={pack}` remounts the scene on breakpoint change (no pack-reset setState).
 */
function DeferredV37Scene({
  kind,
  sectionRef,
}: SceneProps & { kind: SceneKind }) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [near, setNear] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);
  /** Client-only: avoid painting pack `'390'` poster on desktop before matchMedia. */
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (reduced) return;
    const el = placeholderRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Defer setState — sync updates inside effects trip lint (and match scene pattern).
      const t = window.setTimeout(() => setNear(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: NEAR_VIEWPORT_ROOT_MARGIN, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [kind, reduced]);

  useEffect(() => {
    if (!near || reduced) return;
    let cancelled = false;
    void (async () => {
      try {
        const mod = await loadSceneModule(kind);
        if (!cancelled) setScene(() => mod.default);
      } catch {
        /* poster placeholder remains */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [near, kind, reduced]);

  if (Scene && !reduced) {
    return <Scene key={pack} sectionRef={sectionRef} />;
  }

  return (
    <div
      ref={placeholderRef}
      className={SCENE_CLASS[kind]}
      aria-hidden="true"
    >
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
