'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  AtlasSheetBank,
  drawAtlasFrame,
  drawCoverImage,
  loadJson,
  loadSheet,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  smoothstep,
  type DecodedImage,
} from './atlas';
import { readScrollMetrics, ScrollClock } from './scrollClock';
import {
  SETTLE_RISE_PX,
  settleFromWalkDelta,
  settleTranslateY,
} from './settle';
import type { GateJson } from './types';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

type Runtime = {
  json: GateJson;
  bodyBank: AtlasSheetBank;
  shadowBank: AtlasSheetBank;
  staticBody: DecodedImage | null;
  staticShadow: DecodedImage | null;
};

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

async function ensureGateForWalk(rt: Runtime, walkF: number): Promise<void> {
  const door = doorIndexForWalk(rt.json, walkF);
  const jobs: Promise<void>[] = [
    rt.bodyBank.ensureCurrentAndNext(door.index),
    rt.shadowBank.ensureCurrentAndNext(door.index),
  ];
  if (door.crossfade > 0 || door.useStatic) {
    if (!rt.staticBody) {
      jobs.push(
        loadSheet(rt.json.static.body.file).then((img) => {
          rt.staticBody = img;
        }),
      );
    }
    if (!rt.staticShadow) {
      jobs.push(
        loadSheet(rt.json.static.shadow.file).then((img) => {
          rt.staticShadow = img;
        }),
      );
    }
  }
  await Promise.all(jobs);
}

export function GateScene({ sectionRef }: Props) {
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
    width: pack === '1440' ? '37.027vw' : '93.113vw',
    aspectRatio: '533 / 523',
  });
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);

  // Mount: JSON only (poster is <img>)
  useEffect(() => {
    let cancelled = false;
    setMetaReady(false);
    setCanvasActive(false);
    setFailed(false);
    runtimeRef.current = null;

    loadJson<GateJson>(`gate/${pack}/gate-${pack}.json`)
      .then((json) => {
        if (cancelled) return;
        runtimeRef.current = {
          json,
          bodyBank: new AtlasSheetBank(json.door.body_atlas),
          shadowBank: new AtlasSheetBank(json.door.shadow_atlas),
          staticBody: null,
          staticShadow: null,
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].gate,
          triggerWalkF: TRIGGER_WALK_F.gate,
        });
        const { css_w, css_h, w_pct_of_viewport } = json.place;
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

  // Near-viewport decode + visible rAF
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
        const sheet = entry ? rt.shadowBank.get(entry[0]) : null;
        if (sheet) {
          drawAtlasFrame(
            ctx,
            sheet,
            rt.json.door.shadow_atlas,
            frameIndex,
            0,
            0,
            shadowScale,
          );
        }
      } else if (rt.staticShadow) {
        drawCoverImage(ctx, rt.staticShadow, 0, 0, cssW, cssH);
      }
      ctx.restore();

      if (mode === 'atlas') {
        const entry = rt.json.door.body_atlas.index[frameIndex];
        const sheet = entry ? rt.bodyBank.get(entry[0]) : null;
        if (sheet) {
          drawAtlasFrame(
            ctx,
            sheet,
            rt.json.door.body_atlas,
            frameIndex,
            0,
            0,
            bodyScale,
          );
        }
      } else if (rt.staticBody) {
        drawCoverImage(ctx, rt.staticBody, 0, 0, cssW, cssH);
      }
      ctx.restore();
    };

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
      const walkF = clock.update(now, metrics);
      void ensureGateForWalk(rt, walkF);

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
        await Promise.all([
          rt.bodyBank.ensureCurrentAndNext(0),
          rt.shadowBank.ensureCurrentAndNext(0),
        ]);
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
  }, [metaReady, reduced, failed, pack, sectionRef]);

  const showPoster = failed || reduced || !canvasActive;
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
