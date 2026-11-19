'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
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
  drawCoverImage,
  effectiveCanvasDpr,
  closeSheet,
  loadJson,
  loadSheet,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  warmSheetGpu,
  type DecodedImage,
} from './atlas';
import {
  createSectionMetricsCache,
  ScrollClock,
  type SectionMetricsCache,
} from './scrollClock';
import {
  SETTLE_RISE_PX,
  settleFromWalkDelta,
  settleTranslateY,
} from './settle';
import type {
  AmbientButterfly,
  BenchJson,
  PerchShadowTrackPoint,
} from './types';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type Runtime = {
  json: BenchJson;
  body: DecodedImage | null;
  shadow: DecodedImage | null;
  perchShadow: DecodedImage | null;
  ambientBanks: Record<string, AtlasSheetBank>;
};

type Pad = { left: number; top: number; right: number; bottom: number };

type OverflowLayout = {
  scale: number;
  cssW: number;
  cssH: number;
  canvasTop: number;
};

/** Floor for body/shadow opacity during settle phase 1 — avoids a faded bench. */
const BENCH_MIN_OPACITY = 0.92;
const RAF_ID = 'v37-bench';

/**
 * Pad so the overflow canvas covers every ambient / perch track CSS box.
 * Used for canvas pixel positioning only — CSS custom properties for place/pads
 * live in globals.css media queries (not written as inline styles).
 * Exported for alpha-bbox verification.
 */
export function computePad(json: BenchJson): Pad {
  let minX = 0;
  let minY = 0;
  let maxX = json.place.css_w;
  let maxY = json.place.css_h;

  for (const key of Object.keys(json.ambient)) {
    const amb = json.ambient[key];
    for (const pt of amb.track) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x + amb.css_w);
      maxY = Math.max(maxY, pt.y + amb.css_h);
    }
  }
  for (const pt of json.perch_shadow.track) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x + json.perch_shadow.css_w);
    maxY = Math.max(maxY, pt.y + json.perch_shadow.css_h);
  }

  // Tight safety pad — large overflow + high DPR was a software-GL jam source.
  const pad = 4;
  return {
    left: Math.max(0, -minX) + pad,
    top: Math.max(0, -minY) + pad,
    right: Math.max(0, maxX - json.place.css_w) + pad,
    bottom: Math.max(0, maxY - json.place.css_h) + pad,
  };
}

type TrackSample = {
  x: number;
  y: number;
  layer: AmbientButterfly['track'][number]['layer'];
  cellA: number;
  cellB: number;
  blend: number;
};

/**
 * Lerp position between adjacent walk frames; crossfade atlas cells on the frac.
 */
function trackSample(
  track: AmbientButterfly['track'],
  walkF: number,
): TrackSample | null {
  if (track.length === 0) return null;
  // Hold the final peak pose after the track ends so high flight stays visible.
  if (walkF < track[0].f) return null;
  if (walkF >= track[track.length - 1].f) {
    const p = track[track.length - 1];
    if (!p) return null;
    return {
      x: p.x,
      y: p.y,
      layer: p.layer,
      cellA: p.cell,
      cellB: p.cell,
      blend: 0,
    };
  }
  const f = walkF - track[0].f;
  const i0 = Math.min(track.length - 1, Math.max(0, Math.floor(f)));
  const i1 = Math.min(track.length - 1, i0 + 1);
  const t = f - i0;
  const a = track[i0];
  const b = track[i1];
  if (!a) return null;
  if (!b || i0 === i1) {
    return {
      x: a.x,
      y: a.y,
      layer: a.layer,
      cellA: a.cell,
      cellB: a.cell,
      blend: 0,
    };
  }
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    layer: t < 0.5 ? a.layer : b.layer,
    cellA: a.cell,
    cellB: b.cell,
    blend: t,
  };
}

function perchSample(
  track: PerchShadowTrackPoint[],
  walkF: number,
): { x: number; y: number; opacity: number } | null {
  if (track.length === 0) return null;
  if (walkF < track[0].f || walkF > track[track.length - 1].f) return null;
  if (walkF >= track[track.length - 1].f) {
    const p = track[track.length - 1];
    return p ? { x: p.x, y: p.y, opacity: p.opacity } : null;
  }
  const f = walkF - track[0].f;
  const i0 = Math.min(track.length - 1, Math.max(0, Math.floor(f)));
  const i1 = Math.min(track.length - 1, i0 + 1);
  const t = f - i0;
  const a = track[i0];
  const b = track[i1];
  if (!a) return null;
  if (!b || i0 === i1) {
    return { x: a.x, y: a.y, opacity: a.opacity };
  }
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    opacity: a.opacity + (b.opacity - a.opacity) * t,
  };
}

function ensureAmbientForWalk(rt: Runtime, walkF: number): void {
  for (const key of Object.keys(rt.json.ambient)) {
    const amb = rt.json.ambient[key];
    const bank = rt.ambientBanks[key];
    if (!bank) continue;
    const pt = trackSample(amb.track, walkF);
    if (!pt) continue;
    void bank.ensureCurrentAndNext(pt.cellA);
    if (pt.cellB !== pt.cellA) void bank.ensureCurrentAndNext(pt.cellB);
  }
}

/** Last walk frame that still changes ambient / perch / settle visuals. */
function motionEndWalkF(json: BenchJson): number {
  let end = TRIGGER_WALK_F.bench + 48;
  for (const key of Object.keys(json.ambient)) {
    const track = json.ambient[key].track;
    if (track.length) end = Math.max(end, track[track.length - 1].f);
  }
  const perch = json.perch_shadow.track;
  if (perch.length) end = Math.max(end, perch[perch.length - 1].f);
  return end;
}

function settleBusy(walkF: number): boolean {
  const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.bench);
  return settle.opacity < 1 || settle.rise < 1;
}

/**
 * Position the overflow canvas from the displayed place box so track pads
 * stay inside `.home-reviews__scene` (no horizontal document growth).
 * Top/bottom pads are laid out via host padding — canvas origin is the
 * padding edge (top: 0), not a negative offset that parents can clip.
 * Call from ResizeObserver / pack change only — never inside the rAF tick.
 */
function layoutOverflowCanvas(
  wrap: HTMLDivElement,
  canvas: HTMLCanvasElement,
  pad: Pad,
  boxW: number,
  boxH: number,
): OverflowLayout {
  const placeW = Math.max(1, wrap.clientWidth);
  const scale = placeW / boxW;
  const padL = pad.left * scale;
  const cssW = (boxW + pad.left + pad.right) * scale;
  const cssH = (boxH + pad.top + pad.bottom) * scale;

  const padTCss = pad.top * scale;
  // When the host keeps in-flow top pad, paint from padding edge (top: 0).
  // When empty-reviews collapses that pad (padding-top: 0), shift up in px so
  // ambient overlaps the prior band. Do not use CSS calc with --bench-place-w
  // here — its `100%` resolves against the canvas containing block and under-shifts.
  const hostPadT = parseFloat(getComputedStyle(wrap).paddingTop) || 0;

  canvas.style.position = 'absolute';
  canvas.style.left = `${-padL}px`;
  canvas.style.top = hostPadT > 0.5 ? '0px' : `${-padTCss}px`;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.style.maxWidth = 'none';
  // Opacity owned by .v37-scene.is-live / dataset — avoid inline snaps.
  if (canvas.dataset.posterHidden === '1') {
    canvas.style.opacity = '0';
  } else {
    canvas.style.removeProperty('opacity');
  }

  const canvasTop = canvas.getBoundingClientRect().top;
  return { scale, cssW, cssH, canvasTop };
}

function clearStickyShift(wrap: HTMLDivElement): void {
  // Prefer transform — the CSS `translate` property is missing in some WebKit builds.
  wrap.style.translate = '';
  if (/translateY\(/.test(wrap.style.transform || '')) {
    wrap.style.transform = '';
  }
}

/**
 * Sticky translateY used to clear the header for high ambient flight, but at
 * 1280–1920 it shoved the padded canvas onto .home-reviews__grid and covered
 * card text. Prefer card∩bench = 0 over header clearance — never shift.
 */
function applyStickyHeaderClearance(wrap: HTMLDivElement): void {
  clearStickyShift(wrap);
}

export function BenchScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const runtimeRef = useRef<Runtime | null>(null);
  const padRef = useRef<Pad>({ left: 0, top: 0, right: 0, bottom: 0 });
  const clockRef = useRef<ScrollClock | null>(null);
  const paintLiveRef = useRef(false);
  /** Latest overflow layout — shared with useLayoutEffect so first canvas paint has geometry. */
  const overflowLayoutRef = useRef<OverflowLayout | null>(null);
  const layoutScrollYRef = useRef(0);

  useEffect(() => {
    setCanvasActive(false);
    setPaintLive(false);
    paintLiveRef.current = false;
    setFailed(false);
    runtimeRef.current = null;
    clockRef.current = null;
    padRef.current = { left: 0, top: 0, right: 0, bottom: 0 };
    overflowLayoutRef.current = null;
    layoutScrollYRef.current = 0;
  }, [pack]);

  /**
   * Apply overflow canvas geometry before paint whenever the canvas is active.
   * Avoids a poster→canvas frame where absolute canvas has auto/intrinsic size
   * and Chromium briefly collapses the aspect box (~73px @1440 empty-reviews).
   * Place size/pads come from CSS media queries — padRef is canvas math only.
   */
  useLayoutEffect(() => {
    if (!canvasActive || failed || reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const rt = runtimeRef.current;
    if (!wrap || !canvas || !rt) return;
    // Keep canvas invisible until first live paint — layoutOverflowCanvas reads this.
    canvas.dataset.posterHidden = paintLive ? '0' : '1';
    overflowLayoutRef.current = layoutOverflowCanvas(
      wrap,
      canvas,
      padRef.current,
      rt.json.place.css_w,
      rt.json.place.css_h,
    );
    layoutScrollYRef.current = window.scrollY || window.pageYOffset || 0;
  }, [canvasActive, failed, reduced, pack, paintLive]);

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
    let motionEnd = TRIGGER_WALK_F.bench + 48;
    /** After peaks settle — paint once then freeze until section remount / re-trigger. */
    let frozen = false;
    /** Skip clearRect+paint when quantized walk/settle key is unchanged. */
    let lastDrawKey = '';
    /** Once a full-alpha frame painted, never restart settle fade from ~0. */
    let heldOpaque = false;

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

    const refreshOverflowLayout = () => {
      const rt = runtimeRef.current;
      const canvas = canvasRef.current;
      if (!rt || !canvas || !assetsReady) return;
      overflowLayoutRef.current = layoutOverflowCanvas(
        wrap,
        canvas,
        padRef.current,
        rt.json.place.css_w,
        rt.json.place.css_h,
      );
      layoutScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    };

    /**
     * Same WebKit IO race as Booking: fast scroll can clear `visible` before the
     * first live paint while ScrollClock is already past the bench trigger.
     */
    const firstPaintMustRun = (): boolean => {
      if (!assetsReady || frozen || paintLiveRef.current) return false;
      const clock = clockRef.current;
      if (!clock) return false;
      const metrics = ensureMetrics().read();
      const triggerY = clock.triggerScrollY(metrics);
      const past = metrics.scrollY >= triggerY - 1;
      return past || clock.wouldAdvanceWithTime(metrics) || clock.isArmed();
    };

    const syncPause = () => {
      if (!subscribed) return;
      const paintOwed = firstPaintMustRun();
      const shouldRun =
        !document.hidden &&
        assetsReady &&
        !frozen &&
        (visible || paintOwed);
      setPaused(RAF_ID, !shouldRun);
      if (!shouldRun) {
        setContinuous(RAF_ID, false);
        return;
      }
      markDirty(RAF_ID);
    };

    const tick = (now: number) => {
      if (!alive || document.hidden) return;
      if (!visible && !firstPaintMustRun()) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      const pad = padRef.current;
      if (!rt || !clock || !assetsReady || !rt.body || !rt.shadow) {
        return;
      }
      // Canvas mounts after setCanvasActive commit — keep continuous while paint owed.
      if (!canvas) {
        if (firstPaintMustRun()) setContinuous(RAF_ID, true);
        return;
      }

      if (frozen) {
        setContinuous(RAF_ID, false);
        clock.syncTime(now);
        return;
      }

      const metrics = ensureMetrics().read();
      const walkF = clock.update(now, metrics);
      // Expose for peak-flight QA (walkF≈431 ≈ 3700ms after trigger @ 30fps).
      wrap.dataset.walkF = walkF.toFixed(2);
      ensureAmbientForWalk(rt, walkF);

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.bench);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      const preSettle = settle.opacity <= 0;
      const rawOpacity = preSettle ? 1 : settle.opacity;
      // Never dip to near-transparent when settle starts / reverse-scroll returns.
      const drawOpacity = Math.max(
        heldOpaque || paintLiveRef.current ? 1 : BENCH_MIN_OPACITY,
        rawOpacity,
      );
      const drawTy = preSettle ? 0 : ty;
      const drawShadowScale = preSettle ? 1 : settle.shadowScaleX;
      const rawShadowOpacity = preSettle ? 1 : settle.shadowOpacity;
      const drawShadowOpacity = Math.max(
        heldOpaque || paintLiveRef.current ? 1 : BENCH_MIN_OPACITY,
        rawShadowOpacity,
      );

      const settling = settleBusy(walkF);
      const settleKey = settling
        ? `${Math.round(drawOpacity * 1000)}:${Math.round(drawTy * 100)}:${Math.round(drawShadowScale * 1000)}:${Math.round(drawShadowOpacity * 1000)}`
        : 'done';
      const drawKey = `${Math.round(walkF * 100)}|${settleKey}`;

      const finishTick = () => {
        const motionBusy = walkF < motionEnd || settling;
        if (!motionBusy) {
          frozen = true;
          setContinuous(RAF_ID, false);
          setPaused(RAF_ID, true);
          clock.syncTime(now);
          return;
        }
        const advancing = clock.wouldAdvanceWithTime(metrics) && motionBusy;
        setContinuous(RAF_ID, advancing);
        if (!advancing) clock.syncTime(now);
      };

      if (drawKey === lastDrawKey) {
        finishTick();
        return;
      }

      // Body/shadow required — never clearRect into an empty subject.
      if (!rt.body || !rt.shadow) {
        finishTick();
        return;
      }

      if (!overflowLayoutRef.current) refreshOverflowLayout();
      const layout = overflowLayoutRef.current;
      if (!layout) return;
      const { scale, cssW, cssH } = layout;
      const ox = pad.left;
      const oy = pad.top;

      // Resolve ambient tops from cached canvas geometry (no per-frame layout reads).
      let minLocalY = Number.POSITIVE_INFINITY;
      let painted = 0;
      for (const key of Object.keys(rt.json.ambient)) {
        const amb = rt.json.ambient[key];
        const pt = trackSample(amb.track, walkF);
        if (!pt) continue;
        const entry = amb.atlas.index[pt.cellA];
        if (!entry) continue;
        const sheet = rt.ambientBanks[key]?.get(entry[0]);
        if (!sheet) continue;
        painted += 1;
        minLocalY = Math.min(minLocalY, oy + pt.y);
      }
      wrap.dataset.ambientPainted = String(painted);
      if (painted > 0 && Number.isFinite(minLocalY)) {
        clearStickyShift(wrap);
        const naturalTop =
          layout.canvasTop +
          (minLocalY / Math.max(cssH, 1)) * cssH;
        wrap.dataset.ambientTop = naturalTop.toFixed(1);
        applyStickyHeaderClearance(wrap);
      } else {
        wrap.dataset.ambientTop = '';
        clearStickyShift(wrap);
      }

      // Overflow canvas is large — cap DPR (mobile ≤1.5, software GL = 1).
      const dpr = effectiveCanvasDpr(window.devicePixelRatio || 1, {
        overflow: true,
      });
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) return;

      ctx.clearRect(0, 0, cssW, cssH);
      // Never set ctx.filter blur during flight — per-frame blur jams software GL.
      ctx.filter = 'none';
      ctx.save();
      ctx.scale(scale, scale);

      const boxW = rt.json.place.css_w;
      const boxH = rt.json.place.css_h;
      const groundY = oy + (rt.json.place.ground_y_in_box ?? boxH);

      ctx.save();
      ctx.globalAlpha = drawOpacity;
      ctx.translate(0, drawTy);
      ctx.save();
      ctx.globalAlpha *= drawShadowOpacity;
      ctx.translate(ox + boxW / 2, groundY);
      ctx.scale(drawShadowScale, 1);
      ctx.translate(-(ox + boxW / 2), -groundY);
      drawCoverImage(ctx, rt.shadow, ox, oy, boxW, boxH);
      ctx.restore();
      ctx.restore();

      drawButterflies(ctx, rt, walkF, ox, oy, 'back');

      ctx.save();
      ctx.globalAlpha = drawOpacity;
      ctx.translate(0, drawTy);
      drawCoverImage(ctx, rt.body, ox, oy, boxW, boxH);
      ctx.restore();

      const perch = perchSample(rt.json.perch_shadow.track, walkF);
      if (perch && rt.perchShadow) {
        ctx.save();
        ctx.globalAlpha = perch.opacity;
        drawCoverImage(
          ctx,
          rt.perchShadow,
          ox + perch.x,
          oy + perch.y,
          rt.json.perch_shadow.css_w,
          rt.json.perch_shadow.css_h,
        );
        ctx.restore();
      }

      drawButterflies(ctx, rt, walkF, ox, oy, 'front');
      ctx.restore();

      lastDrawKey = drawKey;
      if (drawOpacity >= 1) heldOpaque = true;

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
      }

      finishTick();
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
        const coverHint = {
          displayW: rt.json.place.css_w,
          displayH: rt.json.place.css_h,
        };
        const [body, shadow, perchShadow] = await Promise.all([
          // Single cover images — decode-resize OK (no atlas UVs).
          loadSheet(rt.json.body.file, undefined, coverHint),
          loadSheet(rt.json.shadow.file, undefined, coverHint),
          loadSheet(rt.json.perch_shadow.file.file, undefined, coverHint),
        ]);
        rt.body = body;
        rt.shadow = shadow;
        rt.perchShadow = perchShadow;
        warmSheetGpu(body);
        warmSheetGpu(shadow);
        warmSheetGpu(perchShadow);
        // Prefetch first ambient atlas fully; further banks on demand via ensureAmbientForWalk.
        {
          const firstKey = Object.keys(rt.ambientBanks)[0];
          if (firstKey) {
            await rt.ambientBanks[firstKey].ensureAll();
            // Sync GPU warm before first flight paint (WebKit drawImage upload).
            rt.ambientBanks[firstKey].warmAllGpu();
          }
        }
        if (!alive) return;
        assetsReady = true;
        // Canvas mounts this commit; useLayoutEffect lays out before paint.
        setCanvasActive(true);
        ensureSubscribed();
        markDirty(RAF_ID);
        const armWhenCanvasReady = () => {
          if (!alive || !assetsReady) return;
          if (canvasRef.current) {
            syncPause();
            markDirty(RAF_ID);
            return;
          }
          requestAnimationFrame(armWhenCanvasReady);
        };
        requestAnimationFrame(armWhenCanvasReady);
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
        const json = await loadJson<BenchJson>(`bench/${pack}/bench-${pack}.json`);
        if (!alive) return;
        const ambientBanks: Record<string, AtlasSheetBank> = {};
        for (const key of Object.keys(json.ambient)) {
          ambientBanks[key] = new AtlasSheetBank(json.ambient[key].atlas);
        }
        const pad = computePad(json);
        padRef.current = pad;
        motionEnd = motionEndWalkF(json);
        runtimeRef.current = {
          json,
          body: null,
          shadow: null,
          perchShadow: null,
          ambientBanks,
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].bench,
          triggerWalkF: TRIGGER_WALK_F.bench,
        });
        // Place/pad CSS vars owned by globals.css — padRef is canvas math only.
        lastDrawKey = '';
        heldOpaque = false;
        ensureMetrics().refresh();
        await warmAssets();
      } catch {
        if (alive) setFailed(true);
      } finally {
        loadingMeta = false;
      }
    };

    const onScroll = () => {
      // Derive canvasTop from scroll delta — no getBoundingClientRect on the scroll path.
      const prev = overflowLayoutRef.current;
      if (prev) {
        const sy = window.scrollY || window.pageYOffset || 0;
        overflowLayoutRef.current = {
          ...prev,
          canvasTop: prev.canvasTop + (layoutScrollYRef.current - sy),
        };
        layoutScrollYRef.current = sy;
      }
      if (!subscribed || document.hidden || frozen) return;
      if (!visible && !firstPaintMustRun()) return;
      if (!visible) syncPause();
      markDirty(RAF_ID);
    };

    const onResize = () => {
      ensureMetrics().refresh();
      lastDrawKey = '';
      refreshOverflowLayout();
      if (!subscribed || document.hidden || frozen) return;
      if (!visible && !firstPaintMustRun()) return;
      if (!visible) syncPause();
      markDirty(RAF_ID);
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
        if (visible) refreshOverflowLayout();
        syncPause();
        if (assetsReady && !frozen && (visible || firstPaintMustRun())) {
          markDirty(RAF_ID);
        }
      },
      { rootMargin: '0px' },
    );

    const onVisibility = () => {
      syncPause();
      if (
        !document.hidden &&
        assetsReady &&
        !frozen &&
        (visible || firstPaintMustRun())
      ) {
        markDirty(RAF_ID);
      }
    };

    const ro = new ResizeObserver(() => {
      onResize();
    });
    ro.observe(wrap);

    nearIO.observe(wrap);
    visIO.observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      nearIO.disconnect();
      visIO.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
      const rt = runtimeRef.current;
      if (rt) {
        for (const key of Object.keys(rt.ambientBanks)) {
          rt.ambientBanks[key]?.dispose();
        }
        closeSheet(rt.json.body.file);
        closeSheet(rt.json.shadow.file);
        closeSheet(rt.json.perch_shadow.file.file);
      }
      runtimeRef.current = null;
    };
  }, [pack, reduced, failed, sectionRef]);

  // Keep poster-hidden flag on the canvas DOM node so layoutOverflowCanvas can
  // sync opacity without React wiping left/top/width/height each render.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hide = failed || reduced || !paintLive;
    canvas.dataset.posterHidden = hide ? '1' : '0';
    if (canvas.style.position === 'absolute') {
      if (hide) canvas.style.opacity = '0';
      else canvas.style.removeProperty('opacity');
    }
  }, [failed, reduced, paintLive, canvasActive]);

  const showPoster = failed || reduced || !paintLive;
  const posterSrc = `/assets/home-v3.7/bench/${pack}/bench-poster-rm-${pack}.webp`;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--bench${liveClass}`}
      aria-hidden="true"
    >
      {/*
       * Always keep an in-flow poster: the overflow canvas is position:absolute,
       * so removing the poster collapses the aspect box on WebKit (empty
       * .home-reviews row shrinks when paint goes live). Opacity-only hide.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={
          showPoster
            ? 'v37-scene__poster'
            : 'v37-scene__poster v37-scene__poster--layout'
        }
        src={posterSrc}
        alt=""
        decoding="async"
        loading="lazy"
        fetchPriority="low"
      />
      {/*
       * Always mount the overflow canvas once active — zero-size until
       * useLayoutEffect / layoutOverflowCanvas applies place+pad geometry so
       * the in-flow poster spacer never collapses during mount.
       */}
      {canvasActive && !failed && !reduced ? (
        <canvas
          ref={canvasRef}
          className="v37-scene__canvas v37-scene__canvas--overflow"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: 'none',
            maxWidth: 'none',
          }}
        />
      ) : null}
    </div>
  );
}

function drawButterflies(
  ctx: CanvasRenderingContext2D,
  rt: Runtime,
  walkF: number,
  ox: number,
  oy: number,
  layer: 'front' | 'back',
): void {
  for (const key of Object.keys(rt.json.ambient)) {
    const amb = rt.json.ambient[key];
    const pt = trackSample(amb.track, walkF);
    if (!pt || pt.layer !== layer) continue;
    const bank = rt.ambientBanks[key];
    if (!bank) continue;
    const frameFloat =
      pt.cellA === pt.cellB ? pt.cellA : pt.cellA + (pt.cellB - pt.cellA) * pt.blend;
    const entry = amb.atlas.index[pt.cellA];
    if (!entry) continue;
    if (!bank.get(entry[0]) && !bank.get(amb.atlas.index[pt.cellB]?.[0] ?? -1)) {
      continue;
    }

    ctx.save();
    // front_blur baked out of the hot path — per-frame canvas blur jammed TBT.
    if (amb.mirror) {
      const cx = ox + pt.x + amb.css_w / 2;
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
    }
    drawAtlasFrameBlend(
      ctx,
      (frameIndex) => {
        const e = amb.atlas.index[frameIndex];
        return e ? bank.get(e[0]) : null;
      },
      amb.atlas,
      frameFloat,
      ox + pt.x,
      oy + pt.y,
      2,
      (frameIndex) => {
        const e = amb.atlas.index[frameIndex];
        return e ? bank.getScale(e[0]) : 1;
      },
    );
    ctx.restore();
  }
}
