'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  drawAtlasFrame,
  loadJson,
  loadSheet,
  preloadAtlasSheets,
  resizeCanvas,
  smoothstep,
  type DecodedImage,
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
  hover: HoverJson;
  landingSheets: DecodedImage[];
  breatheSheets: DecodedImage[];
  hoverSheets: DecodedImage[];
  poster: DecodedImage;
};

const LANDING_START = 470;
const LANDING_END = 508;
const BREATHE_COUNT = 34;
const BREATHE_PERIOD_S = 2.2;
const HOVER_BLEND_S = 0.3;
const HOVER_LEAVE_EASE_MS = 600;

async function loadBookingRuntime(pack: PackId): Promise<Runtime> {
  const [booking, hover] = await Promise.all([
    loadJson<BookingJson>(`booking/${pack}/booking-${pack}.json`),
    loadJson<HoverJson>(`hover/${pack}/hover-${pack}.json`),
  ]);
  const [landingSheets, breatheSheets, hoverSheets, poster] = await Promise.all(
    [
      preloadAtlasSheets(booking.landing.atlas),
      preloadAtlasSheets(booking.breathe.atlas),
      preloadAtlasSheets(hover.atlas),
      loadSheet(booking.poster_reduced_motion.file),
    ],
  );
  return {
    booking,
    hover,
    landingSheets,
    breatheSheets,
    hoverSheets,
    poster,
  };
}

function breatheIndexAt(elapsedS: number): number {
  // ping-pong over 2.2s across 34 frames (0..33)
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
  // 85° → 72° across breathe frames
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
  | { kind: 'leave'; start: number; fromAngle: number };

export function BookingScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFailed(false);
    runtimeRef.current = null;
    landingDoneRef.current = false;
    breatheElapsedRef.current = 0;
    hoverRef.current = { kind: 'idle' };

    loadBookingRuntime(pack)
      .then((rt) => {
        if (cancelled) return;
        runtimeRef.current = rt;
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].booking,
          triggerWalkF: TRIGGER_WALK_F.booking,
          nearMaxScroll: true,
        });
        const { css_w, css_h, w_pct_of_viewport } = rt.booking.place;
        setPlaceStyle({
          width: `${w_pct_of_viewport}vw`,
          aspectRatio: `${css_w} / ${css_h}`,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pack]);

  useEffect(() => {
    if (!ready || reduced || failed) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const onEnter = () => {
      const rt = runtimeRef.current;
      if (!rt || !landingDoneRef.current) return;
      if (hoverRef.current.kind === 'hover') return;
      const idx = breatheIndexAt(breatheElapsedRef.current);
      hoverRef.current = {
        kind: 'hover',
        start: performance.now(),
        blendFromAngle: breatheAngleDeg(idx),
      };
    };

    const onLeave = () => {
      const rt = runtimeRef.current;
      if (!rt) return;
      const phase = hoverRef.current;
      if (phase.kind !== 'hover') return;
      const tau = (performance.now() - phase.start) / 1000;
      let theta = hoverTheta(tau);
      if (tau < HOVER_BLEND_S) {
        const w = smoothstep(tau / HOVER_BLEND_S);
        theta = phase.blendFromAngle * (1 - w) + theta * w;
      }
      hoverRef.current = {
        kind: 'leave',
        start: performance.now(),
        fromAngle: theta,
      };
    };

    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('touchstart', onEnter, { passive: true });
    wrap.addEventListener('touchend', onLeave);

    let raf = 0;
    let alive = true;

    const tick = (now: number) => {
      if (!alive) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      if (!rt || !clock) {
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
      }

      // Reverse scroll after landing: keep perched (lock floor)
      if (landingDoneRef.current) {
        walkF = Math.max(walkF, LANDING_END);
      }

      const { css_w: cssW, css_h: cssH } = rt.booking.place;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, cssW, cssH);

      const drawFrame = (
        sheets: DecodedImage[],
        atlas: BookingJson['landing']['atlas'],
        index: number,
      ) => {
        const entry = atlas.index[index];
        if (!entry) return;
        const sheet = sheets[entry[0]];
        if (!sheet) return;
        drawAtlasFrame(ctx, sheet, atlas, index, 0, 0, 2);
      };

      const phase = hoverRef.current;

      if (walkF < LANDING_START) {
        // not started — nothing (or first landing frame at 0 opacity); leave blank
      } else if (walkF <= LANDING_END && !landingDoneRef.current) {
        const idx = Math.min(
          rt.booking.landing.atlas.frames - 1,
          Math.max(0, Math.round(walkF - LANDING_START)),
        );
        drawFrame(rt.landingSheets, rt.booking.landing.atlas, idx);
      } else {
        // perched: breathe or hover
        let useHover = false;
        let hoverIdx = 0;

        if (phase.kind === 'hover') {
          const tau = (now - phase.start) / 1000;
          let theta = hoverTheta(tau);
          if (tau < HOVER_BLEND_S) {
            const w = smoothstep(tau / HOVER_BLEND_S);
            theta = phase.blendFromAngle * (1 - w) + theta * w;
          }
          // map 72–73 → 73° frame per spec
          if (theta < 73) theta = 73;
          hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
          useHover = true;
        } else if (phase.kind === 'leave') {
          const u = Math.min(1, (now - phase.start) / HOVER_LEAVE_EASE_MS);
          const eased = 1 - (1 - u) * (1 - u);
          const theta = phase.fromAngle + (85 - phase.fromAngle) * eased;
          hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
          useHover = true;
          if (u >= 1) {
            hoverRef.current = { kind: 'idle' };
            breatheElapsedRef.current = 0;
            lastNowRef.current = now;
            useHover = false;
          }
        }

        if (useHover) {
          drawFrame(rt.hoverSheets, rt.hover.atlas, hoverIdx);
        } else {
          if (lastNowRef.current === 0) lastNowRef.current = now;
          const dt = Math.min(0.1, Math.max(0, (now - lastNowRef.current) / 1000));
          lastNowRef.current = now;
          breatheElapsedRef.current += dt;
          const bIdx = breatheIndexAt(breatheElapsedRef.current);
          drawFrame(rt.breatheSheets, rt.booking.breathe.atlas, bIdx);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('touchstart', onEnter);
      wrap.removeEventListener('touchend', onLeave);
    };
  }, [ready, reduced, failed, pack, sectionRef]);

  const showPoster = failed || reduced || !ready;
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
