'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  noteHomeDeferredEngagement,
  whenHomeDeferredWorkAllowed,
} from '@/components/home/homeBoot';
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
  closeSheet,
  sheetsReadyForFrame,
  smoothstep,
  scheduleGpuWarm,
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
import {
  TRIGGER_P,
  TRIGGER_WALK_F,
  V37_CANVAS_FADE_MS,
} from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';
import { peekSoftwareGpu } from './softwareGpu';

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
/** Floor once a full-alpha frame has painted — never restart settle from ~0. */
const GATE_MIN_OPACITY = 0.92;

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

function gateFrameReady(rt: Runtime, door: ReturnType<typeof doorIndexForWalk>): boolean {
  if (door.useStatic || door.crossfade >= 1) {
    return !!(rt.staticBody && rt.staticShadow);
  }
  const bodyOk = sheetsReadyForFrame(
    rt.bodyBank,
    rt.json.door.body_atlas,
    door.frame,
  );
  const shadowOk = sheetsReadyForFrame(
    rt.shadowBank,
    rt.json.door.shadow_atlas,
    door.frame,
  );
  if (!bodyOk || !shadowOk) return false;
  if (door.crossfade > 0) {
    return !!(rt.staticBody && rt.staticShadow);
  }
  return true;
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
    const placeW = rt.json.place.css_w;
    const placeH = rt.json.place.css_h;
    if (!rt.staticBody) {
      const bodyMeta = rt.json.static.body;
      const coverHint = {
        displayW: placeW,
        displayH: placeH,
        naturalW: bodyMeta.w,
        naturalH: bodyMeta.h,
      };
      jobs.push(
        // Single cover images — decode-resize OK (no atlas UVs).
        loadSheet(bodyMeta.file, undefined, coverHint).then((img) => {
          rt.staticBody = img;
          scheduleGpuWarm(img, placeW, placeH);
        }),
      );
    }
    if (!rt.staticShadow) {
      const shadowMeta = rt.json.static.shadow;
      const coverHint = {
        displayW: placeW,
        displayH: placeH,
        naturalW: shadowMeta.w,
        naturalH: shadowMeta.h,
      };
      jobs.push(
        loadSheet(shadowMeta.file, undefined, coverHint).then((img) => {
          rt.staticShadow = img;
          scheduleGpuWarm(img, placeW, placeH);
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
    /** Once a full-alpha frame painted, never fade settle back through ~0. */
    let heldOpaque = false;
    /**
     * Hold atlas frame 0 while the canvas opacity fade-in matches the static
     * motion poster (no runtime toDataURL). Cleared after V37_CANVAS_FADE_MS.
     */
    let holdFrame0 = true;
    let fadeHoldTimer: number | null = null;

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

    /**
     * Same WebKit IO race as Booking: fast scroll can clear `visible` before the
     * first live paint while ScrollClock is already past the gate trigger.
     */
    const firstPaintMustRun = (): boolean => {
      if (!assetsReady || motionComplete || paintLiveRef.current) return false;
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
        (!motionComplete || holdFrame0) &&
        (visible || paintOwed || holdFrame0);
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
          (frameIndex) => {
            const entry = rt.json.door.shadow_atlas.index[frameIndex];
            return entry ? rt.shadowBank.getScale(entry[0]) : 1;
          },
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
          (frameIndex) => {
            const entry = rt.json.door.body_atlas.index[frameIndex];
            return entry ? rt.bodyBank.getScale(entry[0]) : 1;
          },
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
      // Stay busy while holding frame 0 through the canvas fade-in.
      const busy =
        holdFrame0 || settleBusy(walkF) || doorBusy(rt.json, walkF);
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
      if (!alive || document.hidden) return;
      // Offscreen after first paint: do not early-return while leaving
      // continuous=true (jump-to-bottom left the pump spinning forever).
      if (!visible && !firstPaintMustRun() && !holdFrame0) {
        setContinuous(RAF_ID, false);
        setPaused(RAF_ID, true);
        return;
      }
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      if (!rt || !clock || !assetsReady) return;

      const metrics = ensureMetrics().read();
      const walkF = clock.update(now, metrics);
      // During fade hold, keep sheet 0 warm (matches static motion poster).
      void ensureGateForWalk(
        rt,
        holdFrame0 ? TRIGGER_WALK_F.gate : walkF,
      );

      // Canvas mounts after setCanvasActive commit — advance settle/door even
      // without a canvas so continuous cannot stick forever while paint is owed.
      if (!canvas) {
        finishTick(now, clock, metrics, walkF, rt);
        if (firstPaintMustRun() && !motionComplete) {
          setContinuous(RAF_ID, true);
          markDirty(RAF_ID);
        }
        return;
      }

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      // During poster→canvas fade, lock pose to frame 0 (matches static poster).
      const preSettle = holdFrame0 || settle.opacity <= 0;
      const rawOpacity = preSettle ? 1 : settle.opacity;
      // Keep prior full-alpha pose — reverse scroll / settle phase1 must not flash.
      const drawOpacity = Math.max(
        heldOpaque || paintLiveRef.current ? 1 : GATE_MIN_OPACITY,
        rawOpacity,
      );
      const drawTy = preSettle ? 0 : ty;
      const drawShadowScale = preSettle ? 1 : settle.shadowScaleX;
      const rawShadowOpacity = preSettle ? 1 : settle.shadowOpacity;
      const drawShadowOpacity = Math.max(
        heldOpaque || paintLiveRef.current ? 1 : GATE_MIN_OPACITY,
        rawShadowOpacity,
      );
      const door = holdFrame0
        ? { frame: 0, crossfade: 0, useStatic: false }
        : doorIndexForWalk(rt.json, walkF);
      const settling = !holdFrame0 && settleBusy(walkF);

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

      // Never blank-draw: missing sheets → keep prior pixels + poster, retry.
      if (!gateFrameReady(rt, door)) {
        void ensureGateForWalk(rt, walkF).then(() => {
          if (alive) markDirty(RAF_ID);
        });
        finishTick(now, clock, metrics, walkF, rt);
        return;
      }

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

      lastDrawKey = drawKey;
      if (drawOpacity >= 1) heldOpaque = true;

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
        if (fadeHoldTimer != null) window.clearTimeout(fadeHoldTimer);
        fadeHoldTimer = window.setTimeout(() => {
          fadeHoldTimer = null;
          if (!alive) return;
          holdFrame0 = false;
          lastDrawKey = '';
          markDirty(RAF_ID);
        }, V37_CANVAS_FADE_MS);
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
        // Soft-GL (probed elsewhere): keep motion poster — no canvas / decode.
        if (peekSoftwareGpu() === true) return;
        // Defer decode/warm out of the LCP/boot window.
        await whenHomeDeferredWorkAllowed();
        if (!alive) return;
        if (peekSoftwareGpu() === true) return;
        const placeW = rt.json.place.css_w;
        const placeH = rt.json.place.css_h;
        const bodyMeta = rt.json.static.body;
        const shadowMeta = rt.json.static.shadow;
        // First-play only — worker decode + yield between banks (WebKit scroll TBT).
        await rt.bodyBank.ensureFirstPlayWindow();
        if (!alive) return;
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
        await rt.shadowBank.ensureFirstPlayWindow();
        if (!alive) return;
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
        await Promise.all([
          loadSheet(bodyMeta.file, undefined, {
            displayW: placeW,
            displayH: placeH,
            naturalW: bodyMeta.w,
            naturalH: bodyMeta.h,
          }).then((img) => {
            rt.staticBody = img;
            scheduleGpuWarm(img, placeW, placeH);
          }),
          loadSheet(shadowMeta.file, undefined, {
            displayW: placeW,
            displayH: placeH,
            naturalW: shadowMeta.w,
            naturalH: shadowMeta.h,
          }).then((img) => {
            rt.staticShadow = img;
            scheduleGpuWarm(img, placeW, placeH);
          }),
        ]);
        if (!alive) return;
        // Cap resident = current+next after first-play prefetch.
        // ensureFirstPlayWindow already scheduleGpuWarm'd sheets — no second warm pass.
        rt.bodyBank.releaseExcept(rt.bodyBank.currentAndNextIndexes(0));
        rt.shadowBank.releaseExcept(rt.shadowBank.currentAndNextIndexes(0));
        assetsReady = true;
        setCanvasActive(true);
        ensureSubscribed();
        markDirty(RAF_ID);
        // Canvas ref attaches after commit — use timeout, not a second rAF.
        const armWhenCanvasReady = () => {
          if (!alive || !assetsReady) return;
          if (canvasRef.current) {
            syncPause();
            markDirty(RAF_ID);
            return;
          }
          window.setTimeout(armWhenCanvasReady, 0);
        };
        window.setTimeout(armWhenCanvasReady, 0);
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
        await whenHomeDeferredWorkAllowed();
        if (!alive) return;
        const json = await loadJson<GateJson>(`gate/${pack}/gate-${pack}.json`);
        if (!alive) return;
        runtimeRef.current = {
          json,
          bodyBank: new AtlasSheetBank(json.door.body_atlas, json.body_scale || 2),
          shadowBank: new AtlasSheetBank(
            json.door.shadow_atlas,
            json.shadow_scale || 1,
          ),
          staticBody: null,
          staticShadow: null,
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].gate,
          triggerWalkF: TRIGGER_WALK_F.gate,
        });
        // Place width/aspect owned by CSS media queries — pack only for assets.
        lastDrawKey = '';
        heldOpaque = false;
        holdFrame0 = true;
        ensureMetrics().refresh();
        await warmAssets();
      } catch {
        if (alive) setFailed(true);
      } finally {
        loadingMeta = false;
      }
    };

    const onScroll = () => {
      noteHomeDeferredEngagement();
      // scrollY-only via ensureMetrics().read() — no getBoundingClientRect.
      if (!subscribed || document.hidden || motionComplete) return;
      if (!visible && !firstPaintMustRun()) return;
      if (!visible) syncPause();
      markDirty(RAF_ID);
    };

    const onResize = () => {
      ensureMetrics().refresh();
      lastDrawKey = '';
      if (!subscribed || document.hidden || motionComplete) return;
      if (!visible && !firstPaintMustRun()) return;
      if (!visible) syncPause();
      markDirty(RAF_ID);
    };

    const nearIO = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit && !near) {
          near = true;
          // Near alone is not engagement — warmAssets awaits deferred gate.
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
        if (
          assetsReady &&
          !motionComplete &&
          (visible || firstPaintMustRun())
        ) {
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
        !motionComplete &&
        (visible || firstPaintMustRun())
      ) {
        markDirty(RAF_ID);
      }
    };

    nearIO.observe(wrap);
    visIO.observe(wrap);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      if (fadeHoldTimer != null) window.clearTimeout(fadeHoldTimer);
      nearIO.disconnect();
      visIO.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
      const rt = runtimeRef.current;
      if (rt) {
        rt.bodyBank.dispose();
        rt.shadowBank.dispose();
        closeSheet(rt.json.static.body.file);
        closeSheet(rt.json.static.shadow.file);
        rt.staticBody = null;
        rt.staticShadow = null;
      }
      runtimeRef.current = null;
    };
  }, [pack, reduced, failed, sectionRef]);

  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--gate${liveClass}`}
      aria-hidden="true"
    >
      {/*
       * Keep an in-flow poster spacer for the full lifetime of the scene so
       * canvas mount / first paint cannot collapse the aspect box.
       * Motion src is fixed; RM via <picture> media only — never JS src flip.
       */}
      <V37ScenePoster
        kind="gate"
        pack={pack}
        className={
          showPoster
            ? 'v37-scene__poster'
            : 'v37-scene__poster v37-scene__poster--layout'
        }
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
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}
