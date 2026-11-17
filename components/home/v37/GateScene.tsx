'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  drawAtlasFrame,
  drawCoverImage,
  loadJson,
  loadSheet,
  preloadAtlasSheets,
  resizeCanvas,
  sheetIndexesForFrames,
  smoothstep,
  type DecodedImage,
} from './atlas';
import { readScrollMetrics, ScrollClock } from './scrollClock';
import {
  SETTLE_RISE_PX,
  settleFromWalkDelta,
  settleTranslateY,
} from './settle';
import type { GateJson, PackId } from './types';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type Runtime = {
  json: GateJson;
  bodySheets: DecodedImage[];
  shadowSheets: DecodedImage[];
  staticBody: DecodedImage;
  staticShadow: DecodedImage;
  poster: DecodedImage;
};

async function loadGateRuntime(pack: PackId): Promise<Runtime> {
  const json = await loadJson<GateJson>(`gate/${pack}/gate-${pack}.json`);
  const [bodySheets, shadowSheets, staticBody, staticShadow, poster] =
    await Promise.all([
      preloadAtlasSheets(json.door.body_atlas),
      preloadAtlasSheets(json.door.shadow_atlas),
      loadSheet(json.static.body.file),
      loadSheet(json.static.shadow.file),
      loadSheet(json.poster_reduced_motion.file),
    ]);
  return { json, bodySheets, shadowSheets, staticBody, staticShadow, poster };
}

function doorIndexForWalk(json: GateJson, walkF: number): {
  index: number;
  crossfade: number;
  useStatic: boolean;
} {
  const [startF, endF] = json.door.walk_frames;
  const lastIdx = json.door.body_atlas.frames - 1;

  if (walkF < startF) {
    return { index: 0, crossfade: 0, useStatic: false };
  }
  if (walkF <= endF) {
    const idx = Math.min(lastIdx, Math.max(0, Math.round(walkF - startF)));
    return { index: idx, crossfade: 0, useStatic: false };
  }
  const [, cf1] = json.static.crossfade_walk_frames;
  if (walkF <= cf1) {
    const w = smoothstep((walkF - endF) / 11);
    return { index: lastIdx, crossfade: w, useStatic: false };
  }
  return { index: lastIdx, crossfade: 1, useStatic: true };
}

export function GateScene({ sectionRef }: Props) {
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
    width: pack === '1440' ? '37.027vw' : '93.113vw',
    aspectRatio: '533 / 523',
  });
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFailed(false);
    runtimeRef.current = null;

    loadGateRuntime(pack)
      .then((rt) => {
        if (cancelled) return;
        runtimeRef.current = rt;
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].gate,
          triggerWalkF: TRIGGER_WALK_F.gate,
        });
        const { css_w, css_h, w_pct_of_viewport } = rt.json.place;
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
    if (!ready || !runtimeRef.current) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rt = runtimeRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        const atlas = rt.json.door.body_atlas;
        void preloadAtlasSheets(
          atlas,
          sheetIndexesForFrames(atlas, 0, Math.min(8, atlas.frames - 1)),
        );
      },
      { rootMargin: '200% 0px' },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready || reduced || failed) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let raf = 0;
    let alive = true;

    const paintPair = (
      ctx: CanvasRenderingContext2D,
      rt: Runtime,
      cssW: number,
      cssH: number,
      ty: number,
      settleOpacity: number,
      shadowScaleX: number,
      shadowOpacity: number,
      mode: 'atlas' | 'static',
      frameIndex: number,
      alpha: number,
    ) => {
      const bodyScale = rt.json.body_scale || 2;
      const shadowScale = rt.json.shadow_scale || 1;
      const groundY = rt.json.place.ground_y_in_box ?? cssH;

      ctx.save();
      ctx.globalAlpha = alpha * settleOpacity;
      ctx.translate(0, ty);

      ctx.save();
      ctx.globalAlpha *= shadowOpacity;
      ctx.translate(cssW / 2, groundY);
      ctx.scale(shadowScaleX, 1);
      ctx.translate(-cssW / 2, -groundY);
      if (mode === 'atlas') {
        const entry = rt.json.door.shadow_atlas.index[frameIndex];
        if (entry) {
          drawAtlasFrame(
            ctx,
            rt.shadowSheets[entry[0]],
            rt.json.door.shadow_atlas,
            frameIndex,
            0,
            0,
            shadowScale,
          );
        }
      } else {
        drawCoverImage(ctx, rt.staticShadow, 0, 0, cssW, cssH);
      }
      ctx.restore();

      if (mode === 'atlas') {
        const entry = rt.json.door.body_atlas.index[frameIndex];
        if (entry) {
          drawAtlasFrame(
            ctx,
            rt.bodySheets[entry[0]],
            rt.json.door.body_atlas,
            frameIndex,
            0,
            0,
            bodyScale,
          );
        }
      } else {
        drawCoverImage(ctx, rt.staticBody, 0, 0, cssW, cssH);
      }
      ctx.restore();
    };

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
      const walkF = clock.update(now, metrics);
      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);

      const { css_w: cssW, css_h: cssH } = rt.json.place;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) {
        raf = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, cssW, cssH);
      const door = doorIndexForWalk(rt.json, walkF);

      if (door.useStatic || door.crossfade >= 1) {
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          ty,
          settle.opacity,
          settle.shadowScaleX,
          settle.shadowOpacity,
          'static',
          0,
          1,
        );
      } else if (door.crossfade > 0) {
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          ty,
          settle.opacity,
          settle.shadowScaleX,
          settle.shadowOpacity,
          'atlas',
          door.index,
          1 - door.crossfade,
        );
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          ty,
          settle.opacity,
          settle.shadowScaleX,
          settle.shadowOpacity,
          'static',
          0,
          door.crossfade,
        );
      } else {
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          ty,
          settle.opacity,
          settle.shadowScaleX,
          settle.shadowOpacity,
          'atlas',
          door.index,
          1,
        );
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [ready, reduced, failed, pack, sectionRef]);

  const showPoster = failed || reduced || !ready;
  const posterSrc = `/assets/home-v3.7/gate/${pack}/gate-poster-rm-${pack}.webp`;

  return (
    <div
      ref={wrapRef}
      className="v37-scene v37-scene--gate"
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
