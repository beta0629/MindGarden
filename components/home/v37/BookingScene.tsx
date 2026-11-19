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
  effectiveCanvasDpr,
  loadJson,
  NEAR_ROOT_MARGIN,
  resizeCanvas,
  sheetsReadyForFrame,
  smoothstep,
} from './atlas';
import {
  createSectionMetricsCache,
  ScrollClock,
  type SectionMetricsCache,
} from './scrollClock';
import type { BookingJson, HoverJson } from './types';
import {
  BOOKING_MOTION_HOLD_FRAME,
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
  booking: BookingJson;
  hover: HoverJson | null;
  landingBank: AtlasSheetBank;
  breatheBank: AtlasSheetBank;
  hoverBank: AtlasSheetBank | null;
};

const RAF_ID = 'v37-booking';
const LANDING_START = 470;
const LANDING_END = 508;
const BREATHE_COUNT = 34;
const BREATHE_PERIOD_S = 2.2;
const HOVER_BLEND_S = 0.3;
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
    // Floor at hold frame — early landing cells are transparent / fade-in only.
    const raw = Math.max(BOOKING_MOTION_HOLD_FRAME, walkF - LANDING_START);
    const last = rt.booking.landing.atlas.frames - 1;
    const i0 = Math.min(last, Math.max(0, Math.floor(raw)));
    const i1 = Math.min(last, Math.ceil(raw));
    void rt.landingBank.ensureCurrentAndNext(i0);
    if (i1 !== i0) void rt.landingBank.ensureCurrentAndNext(i1);
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
  const [canvasActive, setCanvasActive] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const runtimeRef = useRef<Runtime | null>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const hoverRef = useRef<HoverPhase>({ kind: 'idle' });
  const breatheElapsedRef = useRef(0);
  const lastNowRef = useRef(0);
  const landingDoneRef = useRef(false);
  const hoverWarmedRef = useRef(false);
  const paintLiveRef = useRef(false);

  useEffect(() => {
    setCanvasActive(false);
    setPaintLive(false);
    paintLiveRef.current = false;
    setFailed(false);
    runtimeRef.current = null;
    clockRef.current = null;
    landingDoneRef.current = false;
    breatheElapsedRef.current = 0;
    hoverRef.current = { kind: 'idle' };
    hoverWarmedRef.current = false;
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
    /** Skip clearRect+paint when quantized landing/breathe/hover key unchanged. */
    let lastDrawKey = '';
    /**
     * Hold first opaque landing frame during canvas fade-in (matches static
     * motion poster — atlas index {@link BOOKING_MOTION_HOLD_FRAME}, not 0).
     */
    let holdMotionFrame = true;
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

    const hoverBusyPhase = (phase: HoverPhase): boolean =>
      phase.kind === 'hover' ||
      phase.kind === 'leaveHold' ||
      phase.kind === 'leaveEase';

    /**
     * WebKit IO race: instant / nearMaxScroll to page end can flip IntersectionObserver
     * `visible=false` before ScrollClock arms and landing paints. Chromium often keeps
     * a few "visible" ticks past the trigger; WebKit 390 consistently loses the race
     * (canvas stays 300×150, never is-live). Landing + first live paint must still run.
     */
    const landingMustRun = (): boolean => {
      if (!assetsReady || landingDoneRef.current) return false;
      const clock = clockRef.current;
      if (!clock) return false;
      const metrics = ensureMetrics().read();
      const triggerY = clock.triggerScrollY(metrics);
      // past covers pre-arm jump-to-bottom; wouldAdvance covers armed forward/reverse.
      const past =
        metrics.scrollY >= triggerY - 1 ||
        metrics.scrollY >= metrics.maxScroll - 2;
      return past || clock.wouldAdvanceWithTime(metrics);
    };

    const firstPaintOwed = (): boolean => {
      if (paintLiveRef.current) return false;
      return landingMustRun() || Boolean(clockRef.current?.isArmed());
    };

    const syncPause = () => {
      if (!subscribed) return;
      const hoverBusy = hoverBusyPhase(hoverRef.current);
      const landingPending = !landingDoneRef.current;
      const mustLand = landingMustRun();
      const paintOwed = firstPaintOwed();
      // Offscreen idle freeze still applies after landing+paintLive — only carve
      // the exception while landing / first live paint / fade hold is owed.
      const shouldRun =
        !document.hidden &&
        assetsReady &&
        (mustLand ||
          paintOwed ||
          holdMotionFrame ||
          (visible && (landingPending || hoverBusy)));
      setPaused(RAF_ID, !shouldRun);
      if (!shouldRun) {
        setContinuous(RAF_ID, false);
        return;
      }
      markDirty(RAF_ID);
    };

    const ensureHoverMeta = async () => {
      const rt = runtimeRef.current;
      if (!rt || rt.hover) return;
      const hover = await loadJson<HoverJson>(`hover/${pack}/hover-${pack}.json`);
      if (!alive || !runtimeRef.current) return;
      runtimeRef.current.hover = hover;
      runtimeRef.current.hoverBank = new AtlasSheetBank(hover.atlas);
    };

    const warmHover = () => {
      void (async () => {
        try {
          await ensureHoverMeta();
          const rt = runtimeRef.current;
          if (!rt?.hoverBank || hoverWarmedRef.current) return;
          hoverWarmedRef.current = true;
          void rt.hoverBank.ensureCurrentAndNext(0);
        } catch {
          /* hover is optional until interaction */
        }
      })();
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

    const bumpContinuousForInteraction = () => {
      if (!subscribed || !visible || document.hidden) return;
      // Resume from idle freeze so hover breathe/wing runs again.
      setPaused(RAF_ID, false);
      setContinuous(RAF_ID, true);
      markDirty(RAF_ID);
    };

    const onEnter = () => {
      const rt = runtimeRef.current;
      // Hover only after landing settles into breathe — never on first paint / mid-landing.
      if (!rt || !landingDoneRef.current) return;
      warmHover();
      const phase = hoverRef.current;
      if (phase.kind === 'hover') return;
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
      lastDrawKey = '';
      bumpContinuousForInteraction();
    };

    const onLeave = () => {
      const phase = hoverRef.current;
      if (phase.kind !== 'hover') return;
      const now = performance.now();
      const fromAngle = currentHoverAngle(now, phase);
      hoverRef.current = {
        kind: 'leaveHold',
        holdUntil: now + HOVER_LEAVE_HOLD_MS,
        fromAngle,
        enterStart: phase.start,
        blendFromAngle: phase.blendFromAngle,
      };
      lastDrawKey = '';
      bumpContinuousForInteraction();
    };

    const hit = wrap.querySelector('.v37-scene__hit') ?? wrap;
    hit.addEventListener('pointerenter', onEnter);
    hit.addEventListener('pointerleave', onLeave);
    hit.addEventListener('touchstart', onEnter, { passive: true });
    hit.addEventListener('touchend', onLeave);

    const finishTick = (
      now: number,
      clock: ScrollClock,
      metrics: ReturnType<SectionMetricsCache['read']>,
      walkF: number,
    ) => {
      const hoverBusy = hoverBusyPhase(hoverRef.current);
      // Arm continuous ticks at ScrollClock's booking trigger (468), not LANDING_START
      // (470). A first tick can leave walkF in [468, 470); requiring >= 470 then drops
      // continuous → no further ticks → paintMode stays blank (seen on WebKit 390).
      const landingInFlight =
        !landingDoneRef.current &&
        clock.wouldAdvanceWithTime(metrics) &&
        walkF >= TRIGGER_WALK_F.booking - 0.5;
      // Keep continuous through first live paint + poster fade hold (frame 0).
      const continuous =
        landingInFlight || hoverBusy || firstPaintOwed() || holdMotionFrame;
      setContinuous(RAF_ID, continuous);
      if (!continuous) {
        clock.syncTime(now);
        // Idle freeze only after landing + first live paint (no forever breathe rAF).
        if (
          landingDoneRef.current &&
          paintLiveRef.current &&
          !hoverBusy &&
          !holdMotionFrame
        ) {
          setPaused(RAF_ID, true);
        }
      }
    };

    const tick = (now: number) => {
      if (!alive || document.hidden) return;
      // Do not early-return on !visible while landing / first live paint is owed
      // (WebKit IO can clear visible before the booking trigger paints).
      if (!visible && !landingMustRun() && !firstPaintOwed()) return;
      const rt = runtimeRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      if (!rt || !clock || !assetsReady) return;
      // setCanvasActive commits the <canvas> on the next React paint — if we
      // subscribed immediately, ticks can run before canvasRef is set. Keep
      // continuous while landing is owed so offscreen WebKit does not stall
      // forever on a single dirty pulse (no IO re-dirty when already offscreen).
      if (!canvas) {
        if (landingMustRun() || firstPaintOwed()) {
          setContinuous(RAF_ID, true);
        }
        return;
      }

      const metrics = ensureMetrics().read();
      let walkF = clock.update(now, metrics);

      if (!landingDoneRef.current && walkF >= LANDING_END) {
        landingDoneRef.current = true;
        clock.setLockFloor(LANDING_END);
        breatheElapsedRef.current = 0;
        lastNowRef.current = now;
        void rt.breatheBank.ensureCurrentAndNext(0);
        warmHover();
      }

      if (landingDoneRef.current) {
        walkF = Math.max(walkF, LANDING_END);
      }

      ensureBookingSheets(rt, walkF, landingDoneRef.current);

      let phase = hoverRef.current;

      if (phase.kind === 'leaveHold' && now >= phase.holdUntil) {
        const fromAngle = currentHoverAngle(now, phase);
        phase = {
          kind: 'leaveEase',
          start: now,
          fromAngle,
        };
        hoverRef.current = phase;
      }

      let drawKey = 'blank';
      let paintMode: 'blank' | 'landing' | 'hover' | 'breathe' = 'blank';
      let landingIdx = 0;
      let hoverIdx = 0;
      let bIdx = 0;

      if (holdMotionFrame && (walkF >= LANDING_START || landingMustRun())) {
        // Match static motion poster while canvas fades in (fully opaque frame).
        landingIdx = BOOKING_MOTION_HOLD_FRAME;
        drawKey = `landing:${BOOKING_MOTION_HOLD_FRAME}:hold`;
        paintMode = 'landing';
      } else if (walkF < LANDING_START) {
        drawKey = 'blank';
        paintMode = 'blank';
      } else if (walkF <= LANDING_END && !landingDoneRef.current) {
        // Continue from hold index after fade — never rewind to transparent cells.
        landingIdx = Math.min(
          rt.booking.landing.atlas.frames - 1,
          Math.max(BOOKING_MOTION_HOLD_FRAME, walkF - LANDING_START),
        );
        drawKey = `landing:${Math.round(landingIdx * 100)}`;
        paintMode = 'landing';
      } else {
        let useHover = false;

        if (phase.kind === 'hover' || phase.kind === 'leaveHold') {
          if (rt.hover && rt.hoverBank) {
            const theta = currentHoverAngle(now, phase);
            hoverIdx = nearestAngleIndex(rt.hover.angles_deg, theta);
            useHover = true;
            void rt.hoverBank.ensureCurrentAndNext(hoverIdx);
          }
        } else if (phase.kind === 'leaveEase') {
          if (rt.hover && rt.hoverBank) {
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
        }

        if (useHover && rt.hover && rt.hoverBank) {
          drawKey = `hover:${phase.kind}:${hoverIdx}`;
          paintMode = 'hover';
        } else {
          if (lastNowRef.current === 0) lastNowRef.current = now;
          const dt = Math.min(
            0.1,
            Math.max(0, (now - lastNowRef.current) / 1000),
          );
          lastNowRef.current = now;
          breatheElapsedRef.current += dt;
          bIdx = breatheIndexAt(breatheElapsedRef.current);
          void rt.breatheBank.ensureCurrentAndNext(bIdx);
          drawKey = `breathe:${bIdx}`;
          paintMode = 'breathe';
        }
      }

      if (drawKey === lastDrawKey) {
        finishTick(now, clock, metrics, walkF);
        return;
      }

      if (paintMode === 'blank') {
        lastDrawKey = drawKey;
        finishTick(now, clock, metrics, walkF);
        return;
      }

      // Never blank-draw: missing breathe/landing sheet must not clear + stick key.
      let sheetsReady = false;
      if (paintMode === 'landing') {
        sheetsReady = sheetsReadyForFrame(
          rt.landingBank,
          rt.booking.landing.atlas,
          landingIdx,
        );
        if (!sheetsReady) {
          void rt.landingBank.ensureCurrentAndNext(Math.floor(landingIdx)).then(() => {
            if (alive) markDirty(RAF_ID);
          });
        }
      } else if (paintMode === 'hover' && rt.hover && rt.hoverBank) {
        sheetsReady = sheetsReadyForFrame(rt.hoverBank, rt.hover.atlas, hoverIdx);
        if (!sheetsReady) {
          void rt.hoverBank.ensureCurrentAndNext(hoverIdx).then(() => {
            if (alive) markDirty(RAF_ID);
          });
        }
      } else if (paintMode === 'breathe') {
        sheetsReady = sheetsReadyForFrame(
          rt.breatheBank,
          rt.booking.breathe.atlas,
          bIdx,
        );
        if (!sheetsReady) {
          void rt.breatheBank.ensureCurrentAndNext(bIdx).then(() => {
            if (alive) markDirty(RAF_ID);
          });
        }
      }

      if (!sheetsReady) {
        finishTick(now, clock, metrics, walkF);
        return;
      }

      const { css_w: cssW, css_h: cssH } = rt.booking.place;
      const dpr = effectiveCanvasDpr();
      const ctx = resizeCanvas(canvas, cssW, cssH, dpr);
      if (!ctx) return;
      ctx.clearRect(0, 0, cssW, cssH);

      const drawBankFrame = (
        bank: AtlasSheetBank,
        atlas: BookingJson['landing']['atlas'],
        index: number,
      ) => {
        drawAtlasFrameBlend(
          ctx,
          (frameIndex) => {
            const entry = atlas.index[frameIndex];
            return entry ? bank.get(entry[0]) : null;
          },
          atlas,
          index,
          0,
          0,
          2,
          (frameIndex) => {
            const entry = atlas.index[frameIndex];
            return entry ? bank.getScale(entry[0]) : 1;
          },
        );
      };

      if (paintMode === 'landing') {
        drawBankFrame(rt.landingBank, rt.booking.landing.atlas, landingIdx);
      } else if (paintMode === 'hover' && rt.hover && rt.hoverBank) {
        drawBankFrame(rt.hoverBank, rt.hover.atlas, hoverIdx);
      } else if (paintMode === 'breathe') {
        drawBankFrame(rt.breatheBank, rt.booking.breathe.atlas, bIdx);
      }

      lastDrawKey = drawKey;

      if (!paintLiveRef.current) {
        paintLiveRef.current = true;
        setPaintLive(true);
        if (fadeHoldTimer != null) window.clearTimeout(fadeHoldTimer);
        fadeHoldTimer = window.setTimeout(() => {
          fadeHoldTimer = null;
          if (!alive) return;
          holdMotionFrame = false;
          lastDrawKey = '';
          markDirty(RAF_ID);
        }, V37_CANVAS_FADE_MS);
      }

      /*
       * Continuous only during landing flight + hover ease.
       * Idle after landing: freeze on the last breathe frame — no forever
       * interval / dirty marks (was BREATHE_DIRTY_MS → ~10 rAF/sec).
       */
      finishTick(now, clock, metrics, walkF);
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
        if (peekSoftwareGpu() === true) return;
        await whenHomeDeferredWorkAllowed();
        if (!alive) return;
        if (peekSoftwareGpu() === true) return;
        // First-play window from hold frame — yield between banks for WebKit scroll.
        await rt.landingBank.ensureCurrentAndNext(BOOKING_MOTION_HOLD_FRAME);
        if (!alive) return;
        await new Promise<void>((r) => {
          window.setTimeout(r, 0);
        });
        await rt.breatheBank.ensureFirstPlayWindow();
        if (!alive) return;
        // ensureCurrentAndNext already scheduleGpuWarm'd sheets — no second warm pass.
        rt.landingBank.releaseExcept(
          rt.landingBank.currentAndNextIndexes(BOOKING_MOTION_HOLD_FRAME),
        );
        rt.breatheBank.releaseExcept(rt.breatheBank.currentAndNextIndexes(0));
        assetsReady = true;
        setCanvasActive(true);
        ensureSubscribed();
        markDirty(RAF_ID);
        // Canvas ref attaches after commit — timeout, not a second native rAF.
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
        // Booking JSON only — hover deferred until near landing / pointer
        const booking = await loadJson<BookingJson>(
          `booking/${pack}/booking-${pack}.json`,
        );
        if (!alive) return;
        runtimeRef.current = {
          booking,
          hover: null,
          landingBank: new AtlasSheetBank(booking.landing.atlas),
          breatheBank: new AtlasSheetBank(booking.breathe.atlas),
          hoverBank: null,
        };
        clockRef.current = new ScrollClock({
          triggerP: TRIGGER_P[pack].booking,
          triggerWalkF: TRIGGER_WALK_F.booking,
          nearMaxScroll: true,
        });
        // Place width/aspect owned by CSS media queries — pack only for assets.
        lastDrawKey = '';
        holdMotionFrame = true;
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
      if (!subscribed || document.hidden) return;
      // Jump-to-bottom must dirty even when IO already says !visible so continuous arms.
      const landingPending =
        !landingDoneRef.current || !paintLiveRef.current || holdMotionFrame;
      if (!visible && !landingPending) return;
      if (
        landingPending ||
        hoverBusyPhase(hoverRef.current)
      ) {
        // Unpause if scroll crossed trigger while wrap is already offscreen.
        if (!visible && landingPending) syncPause();
        markDirty(RAF_ID);
      }
    };

    const onResize = () => {
      ensureMetrics().refresh();
      lastDrawKey = '';
      if (!subscribed || document.hidden) return;
      const landingPending =
        !landingDoneRef.current || !paintLiveRef.current;
      if (!visible && !landingPending) return;
      if (
        landingPending ||
        hoverBusyPhase(hoverRef.current)
      ) {
        if (!visible && landingPending) syncPause();
        markDirty(RAF_ID);
      }
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
        if (!visible) {
          // Leaving the viewport cancels hover so idle settles at folded 85°.
          hoverRef.current = { kind: 'idle' };
        }
        syncPause();
        const landingPending =
          !landingDoneRef.current || !paintLiveRef.current;
        if (
          assetsReady &&
          (landingPending ||
            (visible && hoverBusyPhase(hoverRef.current)))
        ) {
          markDirty(RAF_ID);
        }
      },
      { rootMargin: '0px' },
    );

    const onVisibility = () => {
      syncPause();
      const landingPending =
        !landingDoneRef.current || !paintLiveRef.current;
      if (
        !document.hidden &&
        assetsReady &&
        (landingPending ||
          (visible && hoverBusyPhase(hoverRef.current)))
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
      hit.removeEventListener('pointerenter', onEnter);
      hit.removeEventListener('pointerleave', onLeave);
      hit.removeEventListener('touchstart', onEnter);
      hit.removeEventListener('touchend', onLeave);
      if (subscribed) unsubscribe(RAF_ID);
      const rt = runtimeRef.current;
      if (rt) {
        rt.landingBank.dispose();
        rt.breatheBank.dispose();
        rt.hoverBank?.dispose();
      }
      runtimeRef.current = null;
    };
  }, [pack, reduced, failed, sectionRef]);

  // Motion src fixed on img; RM via <picture> media only — never JS src flip.
  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--booking${liveClass}`}
      aria-hidden="true"
    >
      {/*
       * Keep an in-flow poster spacer so canvas mount cannot collapse aspect.
       * Opacity-only hide after first live paint (same pattern as Bench/Gate).
       */}
      <V37ScenePoster
        kind="booking"
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
      {/* Hover hit target only — wrapper stays pointer-events: none via CSS. */}
      <span className="v37-scene__hit" />
    </div>
  );
}
