'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  AtlasSheetBank,
  drawAtlasFrame,
  loadJson,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  smoothstep,
} from './atlas';
import { readScrollMetrics, ScrollClock } from './scrollClock';
import type { BookingJson, HoverJson } from './types';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type Runtime = {
  booking: BookingJson;
  hover: HoverJson;
  landingBank: AtlasSheetBank;
  breatheBank: AtlasSheetBank;
  hoverBank: AtlasSheetBank;
};

const LANDING_START = 470;
const LANDING_END = 508;
const BREATHE_COUNT = 34;
const BREATHE_PERIOD_S = 2.2;
const HOVER_BLEND_S = 0.3;
/** Spec §5: after pointer leave, hold 3.2s then ease to 85° over 600ms */
const HOVER_LEAVE_HOLD_MS = 3200;
const HOVER_LEAVE_EASE_MS = 600;

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
  const [metaReady, setMetaReady] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [placeStyle, setPlaceStyle] = useState<{
    width: string;
    aspectRatio: string;
  }>({
    width: pack === '1440' ? '20.208vw' : '50vw',
    aspectRatio: '291 / 217',
  });
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const hoverRef = useRef<HoverPhase>({ kind: 'idle' });
  const breatheElapsedRef = useRef(0);
  const lastNowRef = useRef(0);
  const landingDoneRef = useRef(false);
  const hoverWarmedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setMetaReady(false);
    setCanvasActive(false);
    setFailed(false);
    runtimeRef.current = null;
    landingDoneRef.current = false;
    breatheElapsedRef.current = 0;
    hoverRef.current = { kind: 'idle' };
    hoverWarmedRef.current = false;

    Promise.all([
      loadJson<BookingJson>(`booking/${pack}/booking-${pack}.json`),
      loadJson<HoverJson>(`hover/${pack}/hover-${pack}.json`),
    ])
      .then(([booking, hover]) => {
        if (cancelled) return;
        runtimeRef.current = {
          booking,
          hover,
          landingBank: new AtlasSheetBank(booking.landing.atlas),
          breatheBank: new AtlasSheetBank(booking.breathe.atlas),
          hoverBank: new AtlasSheetBank(hover.atlas),
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].booking,
          triggerWalkF: TRIGGER_WALK_F.booking,
          nearMaxScroll: true,
        });
        const { css_w, css_h, w_pct_of_viewport } = booking.place;
        setPlaceStyle({
          width: `${w_pct_of_viewport}vw`,
          aspectRatio: `${css_w} / ${css_h}`,
        });
        setMetaReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pack]);

  useEffect(() => {
    if (!metaReady || reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let near = false;
    let visible = false;
    let warming = false;
    let assetsReady = false;
    let raf = 0;

    const stopRaf = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const warmHover = () => {
      const rt = runtimeRef.current;
      if (!rt || hoverWarmedRef.current) return;
      hoverWarmedRef.current = true;
      void rt.hoverBank.ensureCurrentAndNext(0);
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
        // Continue hover formula until hold ends (preview leave at 3.2s)
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
      if (!rt || !landingDoneRef.current) return;
      warmHover();
      const phase = hoverRef.current;
      if (phase.kind === 'hover') return;
      // Re-enter during hold/ease → resume hover from current angle
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
      // Spec §5: wait 3.2s after leave, then ease 600ms to 85°
      hoverRef.current = {
        kind: 'leaveHold',
        holdUntil: now + HOVER_LEAVE_HOLD_MS,
        fromAngle,
        enterStart: phase.start,
        blendFromAngle: phase.blendFromAngle,
      };
    };

    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('touchstart', onEnter, { passive: true });
    wrap.addEventListener('touchend', onLeave);

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
        // Near booking → warm hover atlas (also on first pointer enter)
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

      // Advance leaveHold → leaveEase after 3.2s
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
        // blank until landing
      } else if (walkF <= LANDING_END && !landingDoneRef.current) {
        const idx = Math.min(
          rt.booking.landing.atlas.frames - 1,
          Math.max(0, Math.round(walkF - LANDING_START)),
        );
        drawBankFrame(rt.landingBank, rt.booking.landing.atlas, idx);
      } else {
        let useHover = false;
        let hoverIdx = 0;

        if (phase.kind === 'hover' || phase.kind === 'leaveHold') {
          const theta = currentHoverAngle(now, phase);
          hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
          useHover = true;
          void rt.hoverBank.ensureCurrentAndNext(hoverIdx);
        } else if (phase.kind === 'leaveEase') {
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

        if (useHover) {
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
      }

      raf = requestAnimationFrame(tick);
    };

    const startRaf = () => {
      if (!alive || !visible || !assetsReady || raf) return;
      raf = requestAnimationFrame(tick);
    };

    const warmInitial = async () => {
      if (warming || assetsReady) return;
      warming = true;
      const rt = runtimeRef.current;
      if (!rt) return;
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

    const nearIO = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit && !near) {
          near = true;
          void warmInitial();
          // Optional: warm hover when booking section is near
          warmHover();
        }
      },
      { rootMargin: NEAR_ROOT_MARGIN },
    );

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) startRaf();
        else stopRaf();
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
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('touchstart', onEnter);
      wrap.removeEventListener('touchend', onLeave);
    };
  }, [metaReady, reduced, failed, pack, sectionRef]);

  const showPoster = failed || reduced || !canvasActive;
  const posterSrc = `/assets/home-v3.7/booking/${pack}/booking-poster-rm-${pack}.webp`;

  return (
    <div
      ref={wrapRef}
      className="v37-scene v37-scene--booking"
      style={{
        width: placeStyle.width,
        maxWidth: '100%',
        aspectRatio: placeStyle.aspectRatio,
      }}
      aria-hidden="true"
    >
      {showPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="v37-scene__poster"
          src={posterSrc}
          alt=""
          decoding="async"
        />
      ) : (
        <canvas ref={canvasRef} className="v37-scene__canvas" />
      )}
    </div>
  );
}
