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

const DEFAULT_PLACE: Record<PackId, { wPct: number; aspect: string }> = {
  '1440': { wPct: 28.115, aspect: '405 / 350' },
  '390': { wPct: 57.274, aspect: '223 / 193' },
};

/** True when the ambient sprite CSS box intersects the bench place box. */
function intersectsPlace(
  x: number,
  y: number,
  w: number,
  h: number,
  boxW: number,
  boxH: number,
): boolean {
  return x < boxW && y < boxH && x + w > 0 && y + h > 0;
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

      // Canvas == place box only — never expand document width via overflow canvas.
      const boxW = rt.json.place.css_w;
      const boxH = rt.json.place.css_h;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, boxW, boxH, dpr);
      if (!ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, boxW, boxH);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, boxW, boxH);
      ctx.clip();

      const ox = 0;
      const oy = 0;
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

      drawButterflies(ctx, rt, walkF, ox, oy, 'back', boxW, boxH);

      ctx.save();
      ctx.globalAlpha = drawOpacity;
      ctx.translate(0, drawTy);
      drawCoverImage(ctx, rt.body, ox, oy, boxW, boxH);
      ctx.restore();

      const perch = perchAt(rt.json.perch_shadow.track, walkF);
      if (
        perch &&
        rt.perchShadow &&
        intersectsPlace(
          perch.x,
          perch.y,
          rt.json.perch_shadow.css_w,
          rt.json.perch_shadow.css_h,
          boxW,
          boxH,
        )
      ) {
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

      drawButterflies(ctx, rt, walkF, ox, oy, 'front', boxW, boxH);
      ctx.restore();

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
          className="v37-scene__canvas"
          style={showPoster ? { position: 'absolute', inset: 0, opacity: 0 } : undefined}
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
  boxW: number,
  boxH: number,
): void {
  for (const key of Object.keys(rt.json.ambient)) {
    const amb = rt.json.ambient[key];
    const pt = trackAt(amb.track, walkF);
    if (!pt || pt.layer !== layer) continue;
    if (!intersectsPlace(pt.x, pt.y, amb.css_w, amb.css_h, boxW, boxH)) continue;
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
