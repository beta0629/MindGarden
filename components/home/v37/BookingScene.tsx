'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  AtlasSheetBank,
  drawAtlasFrame,
  loadJson,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  smoothstep,
} from './atlas';
import { readScrollMetrics, ScrollClock } from './scrollClock';
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

const LANDING_START = 470;
const LANDING_END = 508;
const BREATHE_COUNT = 34;
const BREATHE_PERIOD_S = 2.2;
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
    const idx = Math.min(
      rt.booking.landing.atlas.frames - 1,
      Math.max(0, Math.round(walkF - LANDING_START)),
    );
    void rt.landingBank.ensureCurrentAndNext(idx);
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
    let raf = 0;
    let loadingMeta = false;

    const stopRaf = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
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
    };

    const hit = wrap.querySelector('.v37-scene__hit') ?? wrap;
    hit.addEventListener('pointerenter', onEnter);
    hit.addEventListener('pointerleave', onLeave);
    hit.addEventListener('touchstart', onEnter, { passive: true });
    hit.addEventListener('touchend', onLeave);

    const tick = (now: number) => {
      if (!alive || !visible) {
        raf = 0;
        return;
      }
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      if (!rt || !clock || !canvas || !assetsReady) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const sectionEl =
        sectionRef?.current ??
        (wrap.closest('section') as HTMLElement | null) ??
        wrap;
      const metrics = readScrollMetrics(sectionEl);
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
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, cssW, cssH);

      const drawBankFrame = (
        bank: AtlasSheetBank,
        atlas: BookingJson['landing']['atlas'],
        index: number,
      ) => {
        const entry = atlas.index[index];
        if (!entry) return;
        const sheet = bank.get(entry[0]);
        if (!sheet) return;
        drawAtlasFrame(ctx, sheet, atlas, index, 0, 0, 2);
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
          Math.max(0, Math.round(walkF - LANDING_START)),
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

      raf = requestAnimationFrame(tick);
    };

    const startRaf = () => {
      if (!alive || !visible || !assetsReady || raf) return;
      raf = requestAnimationFrame(tick);
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
        startRaf();
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
        await warmAssets();
      } catch {
        if (alive) setFailed(true);
      } finally {
        loadingMeta = false;
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
        if (visible) {
          startRaf();
        } else {
          stopRaf();
          // Leaving the viewport cancels hover so idle settles at folded 85°.
          hoverRef.current = { kind: 'idle' };
        }
      },
      { rootMargin: '0px' },
    );

    nearIO.observe(wrap);
    visIO.observe(wrap);

    return () => {
      alive = false;
      stopRaf();
      nearIO.disconnect();
      visIO.disconnect();
      hit.removeEventListener('pointerenter', onEnter);
      hit.removeEventListener('pointerleave', onLeave);
      hit.removeEventListener('touchstart', onEnter);
      hit.removeEventListener('touchend', onLeave);
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
