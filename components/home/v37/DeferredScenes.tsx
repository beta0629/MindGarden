'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type RefObject,
} from 'react';
import { whenHomeBootReady } from '@/components/home/homeBoot';
import type { PackId } from './types';
import { useBreakpointPack } from './useBreakpointPack';

/** Match atlas.NEAR_ROOT_MARGIN — keep this file free of atlas/WebGL imports. */
const NEAR_ROOT_MARGIN = '120px 0px';

type SceneProps = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type SceneKind = 'gate' | 'bench' | 'booking';

const PLACE: Record<SceneKind, Record<PackId, { wPct: number; aspect: string }>> =
  {
    gate: {
      '1440': { wPct: 37.027, aspect: '533 / 523' },
      '390': { wPct: 93.113, aspect: '363 / 356' },
    },
    bench: {
      '1440': { wPct: 28.115, aspect: '404.857 / 350.334' },
      '390': { wPct: 57.274, aspect: '223.37 / 193.288' },
    },
    booking: {
      '1440': { wPct: 20.208, aspect: '291 / 217' },
      '390': { wPct: 50, aspect: '195 / 113' },
    },
  };

/**
 * Match BenchScene DEFAULT_PAD_FRACS — deferred poster stub must reserve the
 * same place-frac / pad box or empty .home-reviews jumps when the real scene
 * mounts (WebKit ~83px @390 from missing --bench-place-frac).
 */
const BENCH_PAD_FRACS: Record<
  PackId,
  { place: number; padRRatio: number; padTOverW: number; padBOverW: number }
> = {
  // Keep in lockstep with BenchScene DEFAULT_PAD_FRACS / computePad(json).
  '1440': {
    place: 404.8573877074131 / 895.085,
    padRRatio: 346.16261229258686 / 404.8573877074131,
    padTOverW: 452.571 / 404.8573877074131,
    padBOverW: 4 / 404.8573877074131,
  },
  '390': {
    place: 223.36959321788316 / 630.839,
    padRRatio: 187.79040678211686 / 223.36959321788316,
    padTOverW: 202.662 / 223.36959321788316,
    padBOverW: 4 / 223.36959321788316,
  },
};

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

/** Idle after boot before downloading a v3.7 scene chunk (LH main-thread budget). */
const SCENE_IDLE_TIMEOUT_MS = 4000;

function waitIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      window.setTimeout(resolve, Math.min(1200, timeoutMs));
    }
  });
}

function placeStyleFor(kind: SceneKind, pack: PackId): CSSProperties {
  const place = PLACE[kind][pack];
  if (kind !== 'bench') {
    return {
      ['--v37-w' as string]: `${place.wPct}vw`,
      aspectRatio: place.aspect,
    };
  }
  const pad = BENCH_PAD_FRACS[pack];
  return {
    ['--v37-w' as string]: `${place.wPct}vw`,
    ['--bench-place-frac' as string]: String(pad.place),
    ['--bench-pad-r-ratio' as string]: String(pad.padRRatio),
    ['--bench-pad-t-over-w' as string]: String(pad.padTOverW),
    ['--bench-pad-b-over-w' as string]: String(pad.padBOverW),
    aspectRatio: place.aspect,
  };
}

/**
 * Keep layout + static poster until near-viewport AND home-boot poster gate,
 * then idle-load the real scene module so Gate/Bench/Booking JS never contends
 * with hero LCP. On software GPU (SwiftShader / llvmpipe), never import scene
 * chunks — atlas decode + canvas work would spike mid-scroll; poster stays forever.
 */
function DeferredV37Scene({
  kind,
  sectionRef,
}: SceneProps & { kind: SceneKind }) {
  const pack = useBreakpointPack();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || Scene) return;

    let cancelled = false;
    let started = false;

    const start = () => {
      if (started || cancelled) return;
      started = true;
      void (async () => {
        await whenHomeBootReady();
        if (cancelled) return;
        await waitIdle(SCENE_IDLE_TIMEOUT_MS);
        if (cancelled) return;
        try {
          // Dynamic atlas import — keep this file free of eager WebGL.
          const { probeSoftwareGpu } = await import('./atlas');
          if (probeSoftwareGpu()) return;
          if (cancelled) return;
          const mod = await LOADERS[kind]();
          if (!cancelled) setScene(() => mod.default);
        } catch {
          /* poster placeholder remains */
        }
      })();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: NEAR_ROOT_MARGIN },
    );
    io.observe(wrap);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [Scene, kind]);

  if (Scene) {
    return <Scene sectionRef={sectionRef} />;
  }

  return (
    <div
      ref={wrapRef}
      className={SCENE_CLASS[kind]}
      style={placeStyleFor(kind, pack)}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static stand-in until scene chunk loads */}
      <img
        className="v37-scene__poster"
        src={POSTER[kind](pack)}
        alt=""
        decoding="async"
        loading="lazy"
        fetchPriority="low"
      />
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
