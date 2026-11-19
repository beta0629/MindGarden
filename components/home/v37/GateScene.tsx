'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
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
  loadJson,
  loadSheet,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  smoothstep,
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

const RAF_ID = 'v37-gate';

function doorIndexForWalk(json: GateJson, walkF: number): {
  /** Fractional atlas frame for sub-frame blend. */
  frame: number;
  crossfade: number;
  useStatic: boolean;
} {
  const [startF, endF] = json.door.walk_frames;
  const lastIdx = json.door.body_atlas.frames - 1;

  if (walkF < startF) {
    return { frame: 0, crossfade: 0, useStatic: false };
  }
  if (walkF <= endF) {
    const raw = walkF - startF;
    const frame = Math.min(lastIdx, Math.max(0, raw));
    return { frame, crossfade: 0, useStatic: false };
  }
  const [, cf1] = json.static.crossfade_walk_frames;
  if (walkF <= cf1) {
    const w = smoothstep((walkF - endF) / 11);
    return { frame: lastIdx, crossfade: w, useStatic: false };
  }
  return { frame: lastIdx, crossfade: 1, useStatic: true };
}

function settleBusy(walkF: number): boolean {
  const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
  return settle.opacity < 1 || settle.rise < 1;
}

function doorBusy(json: GateJson, walkF: number): boolean {
  const door = doorIndexForWalk(json, walkF);
  return !(door.useStatic || door.crossfade >= 1);
}

async function ensureGateForWalk(rt: Runtime, walkF: number): Promise<void> {
  const door = doorIndexForWalk(rt.json, walkF);
  const i0 = Math.floor(door.frame);
  const i1 = Math.min(
    rt.json.door.body_atlas.frames - 1,
    Math.ceil(door.frame),
  );
  const jobs: Promise<void>[] = [
    rt.bodyBank.ensureCurrentAndNext(i0),
    rt.shadowBank.ensureCurrentAndNext(i0),
  ];
  if (i1 !== i0) {
    jobs.push(
      rt.bodyBank.ensureCurrentAndNext(i1),
      rt.shadowBank.ensureCurrentAndNext(i1),
    );
  }
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
  const [canvasActive, setCanvasActive] = useState(false);
  /** Keep poster until settle paints so layout never shows a blank hole */
  const [paintLive, setPaintLive] = useState(false);
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const paintLiveRef = useRef(false);

  useEffect(() => {
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
    let loadingMeta = false;
    let metricsCache: SectionMetricsCache | null = null;
    let subscribed = false;
    /** Skip clearRect+paint when quantized door/settle key is unchanged. */
    let lastDrawKey = '';

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

    let motionComplete = false;

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun =
        visible && !document.hidden && assetsReady && !motionComplete;
      setPaused(RAF_ID, !shouldRun);
      if (!shouldRun) {
        setContinuous(RAF_ID, false);
        return;
      }
      markDirty(RAF_ID);
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
      frameFloat: number,
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
        drawAtlasFrameBlend(
          ctx,
          (frameIndex) => {
            const entry = rt.json.door.shadow_atlas.index[frameIndex];
            return entry ? rt.shadowBank.get(entry[0]) : null;
          },
          rt.json.door.shadow_atlas,
          frameFloat,
          0,
          0,
          shadowScale,
        );
      } else if (rt.staticShadow) {
        drawCoverImage(ctx, rt.staticShadow, 0, 0, cssW, cssH);
      }
      ctx.restore();

      if (mode === 'atlas') {
        drawAtlasFrameBlend(
          ctx,
          (frameIndex) => {
            const entry = rt.json.door.body_atlas.index[frameIndex];
            return entry ? rt.bodyBank.get(entry[0]) : null;
          },
          rt.json.door.body_atlas,
          frameFloat,
          0,
          0,
          bodyScale,
        );
      } else if (rt.staticBody) {
        drawCoverImage(ctx, rt.staticBody, 0, 0, cssW, cssH);
      }
      ctx.restore();
    };

    const finishTick = (
      now: number,
      clock: ScrollClock,
      metrics: ReturnType<SectionMetricsCache['read']>,
      walkF: number,
      rt: Runtime,
    ) => {
      const busy = settleBusy(walkF) || doorBusy(rt.json, walkF);
      const advancing = clock.wouldAdvanceWithTime(metrics) && busy;
      if (!busy) {
        motionComplete = true;
        setContinuous(RAF_ID, false);
        setPaused(RAF_ID, true);
        clock.syncTime(now);
        return;
      }
      setContinuous(RAF_ID, advancing);
      if (!advancing) {
        clock.syncTime(now);
      }
    };

    const tick = (now: number) => {
      if (!alive || !visible || document.hidden) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      if (!rt || !clock || !canvas || !assetsReady) return;

      const metrics = ensureMetrics().read();
      const walkF = clock.update(now, metrics);
      void ensureGateForWalk(rt, walkF);

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      const preSettle = settle.opacity <= 0;
      const drawOpacity = preSettle ? 1 : settle.opacity;
      const drawTy = preSettle ? 0 : ty;
      const drawShadowScale = preSettle ? 1 : settle.shadowScaleX;
      const drawShadowOpacity = preSettle ? 1 : settle.shadowOpacity;
      const door = doorIndexForWalk(rt.json, walkF);
      const settling = settleBusy(walkF);

      const doorKey = door.useStatic
        ? 'static'
        : `${Math.round(door.frame * 100)}:${Math.round(door.crossfade * 100)}`;
      const settleKey = settling
        ? `${Math.round(drawOpacity * 1000)}:${Math.round(drawTy * 100)}:${Math.round(drawShadowScale * 1000)}:${Math.round(drawShadowOpacity * 1000)}`
        : 'done';
      const drawKey = `${doorKey}|${settleKey}`;

      if (drawKey === lastDrawKey) {
        finishTick(now, clock, metrics, walkF, rt);
        return;
      }
      lastDrawKey = drawKey;

      const { css_w: cssW, css_h: cssH } = rt.json.place;
      const dpr = effectiveCanvasDpr();
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) return;

      ctx.clearRect(0, 0, cssW, cssH);

      if (door.useStatic || door.crossfade >= 1) {
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          drawTy,
          drawOpacity,
          drawShadowScale,
          drawShadowOpacity,
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
          drawTy,
          drawOpacity,
          drawShadowScale,
          drawShadowOpacity,
          'atlas',
          door.frame,
          1 - door.crossfade,
        );
        paintPair(
          ctx,
          rt,
          cssW,
          cssH,
          drawTy,
          drawOpacity,
          drawShadowScale,
          drawShadowOpacity,
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
          drawTy,
          drawOpacity,
          drawShadowScale,
          drawShadowOpacity,
          'atlas',
          door.frame,
          1,
        );
      }

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
      }

      finishTick(now, clock, metrics, walkF, rt);
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
        await Promise.all([
          rt.bodyBank.ensureCurrentAndNext(0),
          rt.shadowBank.ensureCurrentAndNext(0),
        ]);
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
        const json = await loadJson<GateJson>(`gate/${pack}/gate-${pack}.json`);
        if (!alive) return;
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
        // Place width/aspect owned by CSS media queries — pack only for assets.
        lastDrawKey = '';
        ensureMetrics().refresh();
        await warmAssets();
      } catch {
        if (alive) setFailed(true);
      } finally {
        loadingMeta = false;
      }
    };

    const onScroll = () => {
      // scrollY-only via ensureMetrics().read() — no getBoundingClientRect.
      if (subscribed && visible && !document.hidden && !motionComplete) {
        markDirty(RAF_ID);
      }
    };

    const onResize = () => {
      ensureMetrics().refresh();
      lastDrawKey = '';
      if (subscribed && visible && !document.hidden && !motionComplete) {
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
        syncPause();
        if (visible && assetsReady && !motionComplete) markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );

    const onVisibility = () => {
      syncPause();
      if (!document.hidden && visible && !motionComplete) markDirty(RAF_ID);
    };

    nearIO.observe(wrap);
    visIO.observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      nearIO.disconnect();
      visIO.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  const showPoster = failed || reduced || !paintLive;
  const posterSrc = `/assets/home-v3.7/gate/${pack}/gate-poster-rm-${pack}.webp`;

  return (
    <div
      ref={wrapRef}
      className="v37-scene v37-scene--gate"
      aria-hidden="true"
    >
      {/*
       * Keep an in-flow poster spacer for the full lifetime of the scene so
       * canvas mount / first paint cannot collapse the aspect box.
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
      {canvasActive && !failed && !reduced ? (
        <canvas
          ref={canvasRef}
          className="v37-scene__canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: showPoster ? 0 : 1,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}
