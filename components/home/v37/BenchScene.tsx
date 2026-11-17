'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  AtlasSheetBank,
  drawAtlasFrame,
  drawCoverImage,
  loadJson,
  loadSheet,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  type DecodedImage,
} from './atlas';
import { readScrollMetrics, ScrollClock } from './scrollClock';
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

const DEFAULT_PLACE: Record<PackId, { wPct: number; aspect: string }> = {
  '1440': { wPct: 28.115, aspect: '405 / 350' },
  '390': { wPct: 57.274, aspect: '223 / 193' },
};

function computePad(json: BenchJson): Pad {
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

function trackAt(
  track: AmbientButterfly['track'],
  walkF: number,
): AmbientButterfly['track'][number] | null {
  if (track.length === 0) return null;
  if (walkF < track[0].f || walkF > track[track.length - 1].f) return null;
  const idx = Math.round(walkF - track[0].f);
  return track[Math.min(track.length - 1, Math.max(0, idx))] ?? null;
}

function perchAt(
  track: PerchShadowTrackPoint[],
  walkF: number,
): PerchShadowTrackPoint | null {
  if (track.length === 0) return null;
  if (walkF < track[0].f || walkF > track[track.length - 1].f) return null;
  const idx = Math.round(walkF - track[0].f);
  return track[Math.min(track.length - 1, Math.max(0, idx))] ?? null;
}

function ensureAmbientForWalk(rt: Runtime, walkF: number): void {
  for (const key of Object.keys(rt.json.ambient)) {
    const amb = rt.json.ambient[key];
    const bank = rt.ambientBanks[key];
    if (!bank) continue;
    const pt = trackAt(amb.track, walkF);
    const cell = pt ? pt.cell : 0;
    void bank.ensureCurrentAndNext(cell);
  }
}

export function BenchScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [placeStyle, setPlaceStyle] = useState<CSSProperties>(() => ({
    ['--v37-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
    aspectRatio: DEFAULT_PLACE[pack].aspect,
  }));
  const runtimeRef = useRef<Runtime | null>(null);
  const padRef = useRef<Pad>({ left: 0, top: 0, right: 0, bottom: 0 });
  const clockRef = useRef<ScrollClock | null>(null);
  const paintLiveRef = useRef(false);

  useEffect(() => {
    setPlaceStyle({
      ['--v37-w' as string]: `${DEFAULT_PLACE[pack].wPct}vw`,
      aspectRatio: DEFAULT_PLACE[pack].aspect,
    });
    setCanvasActive(false);
    setPaintLive(false);
    paintLiveRef.current = false;
    setFailed(false);
    runtimeRef.current = null;
    clockRef.current = null;
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

    const tick = (now: number) => {
      if (!alive || !visible) {
        raf = 0;
        return;
      }
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      const pad = padRef.current;
      if (!rt || !clock || !canvas || !assetsReady || !rt.body || !rt.shadow) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const sectionEl =
        sectionRef?.current ??
        (wrap.closest('section') as HTMLElement | null) ??
        wrap;
      const metrics = readScrollMetrics(sectionEl);
      const walkF = clock.update(now, metrics);
      ensureAmbientForWalk(rt, walkF);

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.bench);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      const preSettle = settle.opacity <= 0;
      const drawOpacity = preSettle ? 1 : settle.opacity;
      const drawTy = preSettle ? 0 : ty;
      const drawShadowScale = preSettle ? 1 : settle.shadowScaleX;
      const drawShadowOpacity = preSettle ? 1 : settle.shadowOpacity;

      const boxW = rt.json.place.css_w;
      const boxH = rt.json.place.css_h;
      const cssW = boxW + pad.left + pad.right;
      const cssH = boxH + pad.top + pad.bottom;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, cssW, cssH);

      const ox = pad.left;
      const oy = pad.top;
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

      const perch = perchAt(rt.json.perch_shadow.track, walkF);
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

      canvas.style.left = `${-pad.left}px`;
      canvas.style.top = `${-pad.top}px`;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
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
        const [body, shadow, perchShadow] = await Promise.all([
          loadSheet(rt.json.body.file),
          loadSheet(rt.json.shadow.file),
          loadSheet(rt.json.perch_shadow.file.file),
        ]);
        rt.body = body;
        rt.shadow = shadow;
        rt.perchShadow = perchShadow;
        await Promise.all(
          Object.keys(rt.ambientBanks).map((key) =>
            rt.ambientBanks[key].ensureCurrentAndNext(0),
          ),
        );
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
        const json = await loadJson<BenchJson>(`bench/${pack}/bench-${pack}.json`);
        if (!alive) return;
        const ambientBanks: Record<string, AtlasSheetBank> = {};
        for (const key of Object.keys(json.ambient)) {
          ambientBanks[key] = new AtlasSheetBank(json.ambient[key].atlas);
        }
        runtimeRef.current = {
          json,
          body: null,
          shadow: null,
          perchShadow: null,
          ambientBanks,
        };
        padRef.current = computePad(json);
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].bench,
          triggerWalkF: TRIGGER_WALK_F.bench,
        });
        const { css_w, css_h, w_pct_of_viewport } = json.place;
        setPlaceStyle({
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
    };
  }, [pack, reduced, failed, sectionRef]);

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
          fetchPriority="low"
        />
      ) : null}
      {canvasActive && !failed && !reduced ? (
        <canvas
          ref={canvasRef}
          className="v37-scene__canvas v37-scene__canvas--overflow"
          style={showPoster ? { opacity: 0 } : undefined}
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
    const pt = trackAt(amb.track, walkF);
    if (!pt || pt.layer !== layer) continue;
    const bank = rt.ambientBanks[key];
    if (!bank) continue;
    const entry = amb.atlas.index[pt.cell];
    if (!entry) continue;
    const sheet = bank.get(entry[0]);
    if (!sheet) continue;

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
    drawAtlasFrame(ctx, sheet, amb.atlas, pt.cell, ox + pt.x, oy + pt.y, 2);
    ctx.restore();
  }
}
