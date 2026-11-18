'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  markDirty,
  setContinuous,
  setPaused,
  subscribe,
  unsubscribe,
} from '@/components/home/rafScheduler';
import {
  AtlasSheetBank,
  drawAtlasFrameBlend,
  effectiveCanvasDpr,
  loadJson,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  smoothstep,
} from './atlas';
import {
  createSectionMetricsCache,
  ScrollClock,
  type SectionMetricsCache,
} from './scrollClock';
import type { BookingJson, HoverJson, PackId } from './types';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type Runtime = {
  booking: BookingJson;
  hover: HoverJson | null;
  landingBank: AtlasSheetBank;
  breatheBank: AtlasSheetBank;
  hoverBank: AtlasSheetBank | null;
};

const RAF_ID = 'v37-booking';
const LANDING_START = 470;
const LANDING_END = 508;
const BREATHE_COUNT = 34;
const BREATHE_PERIOD_S = 2.2;
/** Idle breathe via dirty marks (~10fps) — never continuous forever. */
const BREATHE_DIRTY_MS = 100;
const HOVER_BLEND_S = 0.3;
const HOVER_LEAVE_HOLD_MS = 3200;
const HOVER_LEAVE_EASE_MS = 600;

const DEFAULT_PLACE: Record<PackId, { wPct: number; aspect: string }> = {
  '1440': { wPct: 20.208, aspect: '291 / 217' },
  '390': { wPct: 50, aspect: '195 / 113' },
};

function breatheIndexAt(elapsedS: number): number {
  const period = BREATHE_PERIOD_S;
  const cycle = ((elapsedS % period) + period) % period;
  const half = period / 2;
  const frames = BREATHE_COUNT;
  if (cycle <= half) {
    return Math.min(frames - 1, Math.round((cycle / half) * (frames - 1)));
  }
  const u = (cycle - half) / half;
  return Math.min(frames - 1, Math.round((1 - u) * (frames - 1)));
}

function breatheAngleDeg(index: number): number {
  return 85 - (13 * index) / Math.max(1, BREATHE_COUNT - 1);
}

function hoverTheta(tauS: number): number {
  return (
    85 -
    6 *
      smoothstep(tauS / HOVER_BLEND_S) *
      (1 - Math.cos((2 * Math.PI * tauS) / 1.6))
  );
}

function nearestAngleIndex(angles: number[], theta: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < angles.length; i += 1) {
    const d = Math.abs(angles[i] - theta);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

type HoverPhase =
  | { kind: 'idle' }
  | { kind: 'hover'; start: number; blendFromAngle: number }
  | {
      kind: 'leaveHold';
      holdUntil: number;
      fromAngle: number;
      enterStart: number;
      blendFromAngle: number;
    }
  | { kind: 'leaveEase'; start: number; fromAngle: number };

function ensureBookingSheets(rt: Runtime, walkF: number, landingDone: boolean): void {
  if (!landingDone && walkF < LANDING_END + 2) {
    const raw = walkF - LANDING_START;
    const last = rt.booking.landing.atlas.frames - 1;
    const i0 = Math.min(last, Math.max(0, Math.floor(raw)));
    const i1 = Math.min(last, Math.ceil(raw));
    void rt.landingBank.ensureCurrentAndNext(i0);
    if (i1 !== i0) void rt.landingBank.ensureCurrentAndNext(i1);
  }
  if (landingDone || walkF >= LANDING_END - 2) {
    void rt.breatheBank.ensureCurrentAndNext(0);
  }
}

export function BookingScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [placeStyle, setPlaceStyle] = useState<CSSProperties>(() => ({
    ['--v37-booking-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
    ['--v37-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
    aspectRatio: DEFAULT_PLACE[pack].aspect,
  }));
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const hoverRef = useRef<HoverPhase>({ kind: 'idle' });
  const breatheElapsedRef = useRef(0);
  const lastNowRef = useRef(0);
  const landingDoneRef = useRef(false);
  const hoverWarmedRef = useRef(false);
  const paintLiveRef = useRef(false);

  useEffect(() => {
    setPlaceStyle({
      ['--v37-booking-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
      ['--v37-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
      aspectRatio: DEFAULT_PLACE[pack].aspect,
    });
    setCanvasActive(false);
    setPaintLive(false);
    paintLiveRef.current = false;
    setFailed(false);
    runtimeRef.current = null;
    clockRef.current = null;
    landingDoneRef.current = false;
    breatheElapsedRef.current = 0;
    hoverRef.current = { kind: 'idle' };
    hoverWarmedRef.current = false;
  }, [pack]);

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let near = false;
    let visible = false;
    let warming = false;
    let assetsReady = false;
    let loadingMeta = false;
    let subscribed = false;
    let metricsCache: SectionMetricsCache | null = null;
    let breatheTimer: number | null = null;

    const resolveSection = (): HTMLElement =>
      sectionRef?.current ??
      (wrap.closest('section') as HTMLElement | null) ??
      wrap;

    const ensureMetrics = (): SectionMetricsCache => {
      if (!metricsCache) {
        metricsCache = createSectionMetricsCache(resolveSection());
      }
      return metricsCache;
    };

    const stopBreatheTimer = () => {
      if (breatheTimer != null) {
        window.clearInterval(breatheTimer);
        breatheTimer = null;
      }
    };

    const syncBreatheTimer = () => {
      const hoverBusy =
        hoverRef.current.kind === 'hover' ||
        hoverRef.current.kind === 'leaveHold' ||
        hoverRef.current.kind === 'leaveEase';
      const need =
        subscribed &&
        visible &&
        !document.hidden &&
        assetsReady &&
        landingDoneRef.current &&
        !hoverBusy;
      if (need && breatheTimer == null) {
        breatheTimer = window.setInterval(() => {
          markDirty(RAF_ID);
        }, BREATHE_DIRTY_MS);
      } else if (!need) {
        stopBreatheTimer();
      }
    };

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun = visible && !document.hidden && assetsReady;
      setPaused(RAF_ID, !shouldRun);
      if (shouldRun) markDirty(RAF_ID);
      syncBreatheTimer();
    };

    const ensureHoverMeta = async () => {
      const rt = runtimeRef.current;
      if (!rt || rt.hover) return;
      const hover = await loadJson<HoverJson>(`hover/${pack}/hover-${pack}.json`);
      if (!alive || !runtimeRef.current) return;
      runtimeRef.current.hover = hover;
      runtimeRef.current.hoverBank = new AtlasSheetBank(hover.atlas);
    };

    const warmHover = () => {
      void (async () => {
        try {
          await ensureHoverMeta();
          const rt = runtimeRef.current;
          if (!rt?.hoverBank || hoverWarmedRef.current) return;
          hoverWarmedRef.current = true;
          void rt.hoverBank.ensureCurrentAndNext(0);
        } catch {
          /* hover is optional until interaction */
        }
      })();
    };

    const currentHoverAngle = (now: number, phase: HoverPhase): number => {
      if (phase.kind === 'hover') {
        const tau = (now - phase.start) / 1000;
        let theta = hoverTheta(tau);
        if (tau < HOVER_BLEND_S) {
          const w = smoothstep(tau / HOVER_BLEND_S);
          theta = phase.blendFromAngle * (1 - w) + theta * w;
        }
        return Math.max(73, theta);
      }
      if (phase.kind === 'leaveHold') {
        const tau = (now - phase.enterStart) / 1000;
        let theta = hoverTheta(tau);
        if (tau < HOVER_BLEND_S) {
          const w = smoothstep(tau / HOVER_BLEND_S);
          theta = phase.blendFromAngle * (1 - w) + theta * w;
        }
        return Math.max(73, theta);
      }
      if (phase.kind === 'leaveEase') {
        const u = Math.min(1, (now - phase.start) / HOVER_LEAVE_EASE_MS);
        const eased = 1 - (1 - u) * (1 - u);
        return phase.fromAngle + (85 - phase.fromAngle) * eased;
      }
      return 85;
    };

    const bumpContinuousForInteraction = () => {
      if (!subscribed || !visible || document.hidden) return;
      setContinuous(RAF_ID, true);
      markDirty(RAF_ID);
    };

    const onEnter = () => {
      const rt = runtimeRef.current;
      // Hover only after landing settles into breathe — never on first paint / mid-landing.
      if (!rt || !landingDoneRef.current) return;
      warmHover();
      const phase = hoverRef.current;
      if (phase.kind === 'hover') return;
      const now = performance.now();
      const blendFrom =
        phase.kind === 'idle'
          ? breatheAngleDeg(breatheIndexAt(breatheElapsedRef.current))
          : currentHoverAngle(now, phase);
      hoverRef.current = {
        kind: 'hover',
        start: now,
        blendFromAngle: blendFrom,
      };
      bumpContinuousForInteraction();
    };

    const onLeave = () => {
      const phase = hoverRef.current;
      if (phase.kind !== 'hover') return;
      const now = performance.now();
      const fromAngle = currentHoverAngle(now, phase);
      hoverRef.current = {
        kind: 'leaveHold',
        holdUntil: now + HOVER_LEAVE_HOLD_MS,
        fromAngle,
        enterStart: phase.start,
        blendFromAngle: phase.blendFromAngle,
      };
      bumpContinuousForInteraction();
    };

    const hit = wrap.querySelector('.v37-scene__hit') ?? wrap;
    hit.addEventListener('pointerenter', onEnter);
    hit.addEventListener('pointerleave', onLeave);
    hit.addEventListener('touchstart', onEnter, { passive: true });
    hit.addEventListener('touchend', onLeave);

    const tick = (now: number) => {
      if (!alive || !visible || document.hidden) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      if (!rt || !clock || !canvas || !assetsReady) return;

      const metrics = ensureMetrics().read();
      let walkF = clock.update(now, metrics);

      if (!landingDoneRef.current && walkF >= LANDING_END) {
        landingDoneRef.current = true;
        clock.setLockFloor(LANDING_END);
        breatheElapsedRef.current = 0;
        lastNowRef.current = now;
        void rt.breatheBank.ensureCurrentAndNext(0);
        warmHover();
      }

      if (landingDoneRef.current) {
        walkF = Math.max(walkF, LANDING_END);
      }

      ensureBookingSheets(rt, walkF, landingDoneRef.current);

      const { css_w: cssW, css_h: cssH } = rt.booking.place;
      const dpr = effectiveCanvasDpr();
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) return;
      ctx.clearRect(0, 0, cssW, cssH);

      const drawBankFrame = (
        bank: AtlasSheetBank,
        atlas: BookingJson['landing']['atlas'],
        index: number,
      ) => {
        drawAtlasFrameBlend(
          ctx,
          (frameIndex) => {
            const entry = atlas.index[frameIndex];
            return entry ? bank.get(entry[0]) : null;
          },
          atlas,
          index,
          0,
          0,
          2,
        );
      };

      let phase = hoverRef.current;

      if (phase.kind === 'leaveHold' && now >= phase.holdUntil) {
        const fromAngle = currentHoverAngle(now, phase);
        phase = {
          kind: 'leaveEase',
          start: now,
          fromAngle,
        };
        hoverRef.current = phase;
      }

      if (walkF < LANDING_START) {
        // blank until landing — keep poster via !paintLive
      } else if (walkF <= LANDING_END && !landingDoneRef.current) {
        const idx = Math.min(
          rt.booking.landing.atlas.frames - 1,
          Math.max(0, walkF - LANDING_START),
        );
        drawBankFrame(rt.landingBank, rt.booking.landing.atlas, idx);
        if (!paintLiveRef.current) {
          paintLiveRef.current = true;
          setPaintLive(true);
        }
      } else {
        let useHover = false;
        let hoverIdx = 0;

        if (phase.kind === 'hover' || phase.kind === 'leaveHold') {
          if (rt.hover && rt.hoverBank) {
            const theta = currentHoverAngle(now, phase);
            hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
            useHover = true;
            void rt.hoverBank.ensureCurrentAndNext(hoverIdx);
          }
        } else if (phase.kind === 'leaveEase') {
          if (rt.hover && rt.hoverBank) {
            const u = Math.min(1, (now - phase.start) / HOVER_LEAVE_EASE_MS);
            const theta = currentHoverAngle(now, phase);
            hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
            useHover = true;
            void rt.hoverBank.ensureCurrentAndNext(hoverIdx);
            if (u >= 1) {
              hoverRef.current = { kind: 'idle' };
              breatheElapsedRef.current = 0;
              lastNowRef.current = now;
              useHover = false;
            }
          }
        }

        if (useHover && rt.hover && rt.hoverBank) {
          drawBankFrame(rt.hoverBank, rt.hover.atlas, hoverIdx);
        } else {
          if (lastNowRef.current === 0) lastNowRef.current = now;
          const dt = Math.min(
            0.1,
            Math.max(0, (now - lastNowRef.current) / 1000),
          );
          lastNowRef.current = now;
          breatheElapsedRef.current += dt;
          const bIdx = breatheIndexAt(breatheElapsedRef.current);
          void rt.breatheBank.ensureCurrentAndNext(bIdx);
          drawBankFrame(rt.breatheBank, rt.booking.breathe.atlas, bIdx);
        }
        if (!paintLiveRef.current) {
          paintLiveRef.current = true;
          setPaintLive(true);
        }
      }

      /*
       * Continuous only during landing flight + hover ease.
       * Idle breathe uses dirty marks (~10fps) via syncBreatheTimer — never forever rAF.
       */
      const hoverBusy =
        hoverRef.current.kind === 'hover' ||
        hoverRef.current.kind === 'leaveHold' ||
        hoverRef.current.kind === 'leaveEase';
      const landingInFlight =
        !landingDoneRef.current &&
        clock.wouldAdvanceWithTime(metrics) &&
        walkF >= LANDING_START;
      const continuous = landingInFlight || hoverBusy;
      setContinuous(RAF_ID, continuous);
      if (!continuous) clock.syncTime(now);
      syncBreatheTimer();
    };

    const ensureSubscribed = () => {
      if (subscribed || !alive) return;
      subscribe(RAF_ID, tick, { continuous: false });
      subscribed = true;
      syncPause();
    };

    const warmAssets = async () => {
      if (warming || assetsReady) return;
      const rt = runtimeRef.current;
      if (!rt) return;
      warming = true;
      try {
        await rt.landingBank.ensureCurrentAndNext(0);
        if (!alive) return;
        assetsReady = true;
        setCanvasActive(true);
        ensureSubscribed();
        markDirty(RAF_ID);
      } catch {
        if (alive) setFailed(true);
      } finally {
        warming = false;
      }
    };

    const loadMetaAndWarm = async () => {
      if (loadingMeta || runtimeRef.current) {
        void warmAssets();
        return;
      }
      loadingMeta = true;
      try {
        // Booking JSON only — hover deferred until near landing / pointer
        const booking = await loadJson<BookingJson>(
          `booking/${pack}/booking-${pack}.json`,
        );
        if (!alive) return;
        runtimeRef.current = {
          booking,
          hover: null,
          landingBank: new AtlasSheetBank(booking.landing.atlas),
          breatheBank: new AtlasSheetBank(booking.breathe.atlas),
          hoverBank: null,
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].booking,
          triggerWalkF: TRIGGER_WALK_F.booking,
          nearMaxScroll: true,
        });
        const { css_w, css_h, w_pct_of_viewport } = booking.place;
        setPlaceStyle({
          ['--v37-booking-w' as string]: `${w_pct_of_viewport}vw`,
          ['--v37-w' as string]: `${w_pct_of_viewport}vw`,
          aspectRatio: `${css_w} / ${css_h}`,
        });
        ensureMetrics().refresh();
        await warmAssets();
      } catch {
        if (alive) setFailed(true);
      } finally {
        loadingMeta = false;
      }
    };

    const onScrollOrResize = () => {
      ensureMetrics().refresh();
      if (subscribed && visible && !document.hidden) {
        markDirty(RAF_ID);
      }
    };

    const nearIO = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit && !near) {
          near = true;
          void loadMetaAndWarm();
        }
      },
      { rootMargin: NEAR_ROOT_MARGIN },
    );

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        ensureMetrics().refresh();
        if (!visible) {
          // Leaving the viewport cancels hover so idle settles at folded 85°.
          hoverRef.current = { kind: 'idle' };
        }
        syncPause();
        if (visible && assetsReady) markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );

    const onVisibility = () => {
      syncPause();
      if (!document.hidden && visible) markDirty(RAF_ID);
    };

    nearIO.observe(wrap);
    visIO.observe(wrap);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      stopBreatheTimer();
      nearIO.disconnect();
      visIO.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('visibilitychange', onVisibility);
      hit.removeEventListener('pointerenter', onEnter);
      hit.removeEventListener('pointerleave', onLeave);
      hit.removeEventListener('touchstart', onEnter);
      hit.removeEventListener('touchend', onLeave);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  // Poster (folded 85° + flowers) until live landing/breathe paints — never hover-first.
  const showPoster = failed || reduced || !paintLive;
  const posterSrc = `/assets/home-v3.7/booking/${pack}/booking-poster-rm-${pack}.webp`;

  return (
    <div
      ref={wrapRef}
      className="v37-scene v37-scene--booking"
      style={placeStyle}
      aria-hidden="true"
    >
      {showPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="v37-scene__poster"
          src={posterSrc}
          alt=""
          decoding="async"
          loading="lazy"
          fetchPriority="low"
        />
      ) : null}
      {canvasActive && !failed && !reduced ? (
        <canvas
          ref={canvasRef}
          className="v37-scene__canvas"
          style={showPoster ? { position: 'absolute', inset: 0, opacity: 0 } : undefined}
        />
      ) : null}
      {/* Hover hit target only — wrapper stays pointer-events: none via CSS. */}
      <span className="v37-scene__hit" />
    </div>
  );
}
