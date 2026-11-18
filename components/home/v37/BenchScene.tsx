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
  drawCoverImage,
  loadJson,
  loadSheet,
  MAX_CANVAS_DPR,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
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
  PackId,
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

const DEFAULT_PLACE: Record<PackId, { wPct: number; aspect: string }> = {
  '1440': { wPct: 28.115, aspect: '405 / 350' },
  '390': { wPct: 57.274, aspect: '223 / 193' },
};

const DEFAULT_PAD_FRACS: Record<
  PackId,
  { place: number; padRRatio: number; padTOverW: number; padBOverW: number }
> = {
  // Approximate until JSON loads — 1440 / 390 pack track bounds + 8px safety.
  '1440': {
    place: 404.857 / 903.085,
    padRRatio: 350.163 / 404.857,
    padTOverW: 456.571 / 404.857,
    padBOverW: 8 / 404.857,
  },
  '390': {
    place: 223.37 / 638.84,
    padRRatio: 191.79 / 223.37,
    padTOverW: 206.662 / 223.37,
    padBOverW: 8 / 223.37,
  },
};

/**
 * Pad so the overflow canvas covers every ambient / perch track CSS box.
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

  const pad = 8;
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
    if (!pt) {
      void bank.ensureCurrentAndNext(0);
      continue;
    }
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

function placeStyleFromPad(
  pack: PackId,
  wPct: number,
  aspect: string,
  pad: Pad | null,
  placeW: number,
): CSSProperties {
  const fracs = pad
    ? {
        place: placeW / (placeW + pad.left + pad.right),
        padRRatio: pad.right / placeW,
        padTOverW: pad.top / placeW,
        padBOverW: pad.bottom / placeW,
      }
    : DEFAULT_PAD_FRACS[pack];
  return {
    ['--v37-w' as string]: `${wPct}vw`,
    ['--bench-place-frac' as string]: String(fracs.place),
    ['--bench-pad-r-ratio' as string]: String(fracs.padRRatio),
    // Vertical pads reserved as content-box padding so ancestors cannot clip them.
    ['--bench-pad-t-over-w' as string]: String(fracs.padTOverW),
    ['--bench-pad-b-over-w' as string]: String(fracs.padBOverW),
    aspectRatio: aspect,
  };
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
  canvas.style.opacity = canvas.dataset.posterHidden === '1' ? '0' : '1';

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
  const [placeStyle, setPlaceStyle] = useState<CSSProperties>(() =>
    placeStyleFromPad(
      pack,
      DEFAULT_PLACE[pack].wPct,
      DEFAULT_PLACE[pack].aspect,
      null,
      pack === '1440' ? 404.857 : 223.37,
    ),
  );
  const runtimeRef = useRef<Runtime | null>(null);
  const padRef = useRef<Pad>({ left: 0, top: 0, right: 0, bottom: 0 });
  const clockRef = useRef<ScrollClock | null>(null);
  const paintLiveRef = useRef(false);

  useEffect(() => {
    setPlaceStyle(
      placeStyleFromPad(
        pack,
        DEFAULT_PLACE[pack].wPct,
        DEFAULT_PLACE[pack].aspect,
        null,
        pack === '1440' ? 404.857 : 223.37,
      ),
    );
    setCanvasActive(false);
    setPaintLive(false);
    paintLiveRef.current = false;
    setFailed(false);
    runtimeRef.current = null;
    clockRef.current = null;
    padRef.current = { left: 0, top: 0, right: 0, bottom: 0 };
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
    let overflowLayout: OverflowLayout | null = null;
    let layoutScrollY = 0;
    let motionEnd = TRIGGER_WALK_F.bench + 48;

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
      overflowLayout = layoutOverflowCanvas(
        wrap,
        canvas,
        padRef.current,
        rt.json.place.css_w,
        rt.json.place.css_h,
      );
      layoutScrollY = window.scrollY || window.pageYOffset || 0;
    };

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun = visible && !document.hidden && assetsReady;
      setPaused(RAF_ID, !shouldRun);
      if (shouldRun) markDirty(RAF_ID);
    };

    const tick = (now: number) => {
      if (!alive || !visible || document.hidden) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      const pad = padRef.current;
      if (!rt || !clock || !canvas || !assetsReady || !rt.body || !rt.shadow) {
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
      // Never dip to near-transparent when settle starts (washed-out flash).
      const drawOpacity = preSettle
        ? 1
        : Math.max(BENCH_MIN_OPACITY, settle.opacity);
      const drawTy = preSettle ? 0 : ty;
      const drawShadowScale = preSettle ? 1 : settle.shadowScaleX;
      const drawShadowOpacity = preSettle
        ? 1
        : Math.max(BENCH_MIN_OPACITY, settle.shadowOpacity);

      if (!overflowLayout) refreshOverflowLayout();
      const layout = overflowLayout;
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

      const dpr = Math.min(MAX_CANVAS_DPR, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) return;

      ctx.clearRect(0, 0, cssW, cssH);
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

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
      }

      const motionBusy = walkF < motionEnd || settleBusy(walkF);
      const advancing = clock.wouldAdvanceWithTime(metrics) && motionBusy;
      setContinuous(RAF_ID, advancing);
      if (!advancing) clock.syncTime(now);
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
        const [body, shadow, perchShadow] = await Promise.all([
          loadSheet(rt.json.body.file),
          loadSheet(rt.json.shadow.file),
          loadSheet(rt.json.perch_shadow.file.file),
        ]);
        rt.body = body;
        rt.shadow = shadow;
        rt.perchShadow = perchShadow;
        await Promise.all(
          Object.keys(rt.ambientBanks).map((key) => {
            const amb = rt.json.ambient[key];
            const last = amb.track[amb.track.length - 1];
            const peakCell = last ? last.cell : 0;
            return Promise.all([
              rt.ambientBanks[key].ensureCurrentAndNext(0),
              rt.ambientBanks[key].ensureCurrentAndNext(peakCell),
            ]);
          }),
        );
        if (!alive) return;
        assetsReady = true;
        setCanvasActive(true);
        // Canvas mounts after setState — layout on next frame.
        requestAnimationFrame(() => {
          if (!alive) return;
          refreshOverflowLayout();
          ensureSubscribed();
          markDirty(RAF_ID);
        });
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
        const { css_w, css_h, w_pct_of_viewport } = json.place;
        setPlaceStyle(
          placeStyleFromPad(
            pack,
            w_pct_of_viewport,
            `${css_w} / ${css_h}`,
            pad,
            css_w,
          ),
        );
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
      if (overflowLayout) {
        const sy = window.scrollY || window.pageYOffset || 0;
        overflowLayout = {
          ...overflowLayout,
          canvasTop: overflowLayout.canvasTop + (layoutScrollY - sy),
        };
        layoutScrollY = sy;
      }
      if (subscribed && visible && !document.hidden) {
        markDirty(RAF_ID);
      }
    };

    const onResize = () => {
      ensureMetrics().refresh();
      refreshOverflowLayout();
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
        if (visible) refreshOverflowLayout();
        syncPause();
        if (visible && assetsReady) markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );

    const onVisibility = () => {
      syncPause();
      if (!document.hidden && visible) markDirty(RAF_ID);
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
    };
  }, [pack, reduced, failed, sectionRef]);

  // Keep poster-hidden flag on the canvas DOM node so layoutOverflowCanvas can
  // set opacity without React wiping left/top/width/height each render.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hide = failed || reduced || !paintLive;
    canvas.dataset.posterHidden = hide ? '1' : '0';
    if (canvas.style.position === 'absolute') {
      canvas.style.opacity = hide ? '0' : '1';
    }
  }, [failed, reduced, paintLive, canvasActive]);

  const showPoster = failed || reduced || !paintLive;
  const posterSrc = `/assets/home-v3.7/bench/${pack}/bench-poster-rm-${pack}.webp`;

  return (
    <div
      ref={wrapRef}
      className="v37-scene v37-scene--bench"
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
          className="v37-scene__canvas v37-scene__canvas--overflow"
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
    if (amb.front_blur && layer === 'front') {
      ctx.filter = 'blur(0.6px)';
    }
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
    );
    ctx.restore();
  }
}
