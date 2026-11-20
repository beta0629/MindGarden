'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  markDirty,
  setContinuous,
  setPaused,
  subscribe,
  unsubscribe,
} from '@/components/home/rafScheduler';
import { StackedAlphaVideo } from '@/components/home/v4/StackedAlphaVideo';
import { gateStackSrc, packToV4Key } from '@/components/home/v4/assets';
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
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

const RAF_ID = 'v37-gate';
const GATE_MIN_OPACITY = 0.92;

/**
 * Gate door — stacked-alpha MP4 play-once at scroll trigger, settle via CSS.
 * No reverse on scroll-up (accepted). Soft-GL is fine for this tiny WebGL1 decode.
 */
export function GateScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const [failed, setFailed] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const paintLiveRef = useRef(false);
  const heldOpaqueRef = useRef(false);
  const motionDoneRef = useRef(false);
  const startedRef = useRef(false);

  const key = packToV4Key(pack);
  const src = gateStackSrc(key);

  // Pack changes remount this component via DeferredScenes `key={pack}`.

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let visible = false;
    let subscribed = false;
    let metricsCache: SectionMetricsCache | null = null;

    clockRef.current = new ScrollClock({
      triggerP: TRIGGER_P[pack].gate,
      triggerWalkF: TRIGGER_WALK_F.gate,
    });

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

    const applySettle = (walkF: number) => {
      const el = settleRef.current;
      if (!el) return;
      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      const pre = settle.opacity <= 0 && !paintLiveRef.current;
      const rawOpacity = pre ? 1 : settle.opacity;
      const opacity = Math.max(
        heldOpaqueRef.current || paintLiveRef.current ? 1 : GATE_MIN_OPACITY,
        rawOpacity,
      );
      const y = pre ? 0 : ty;
      el.style.transform = `translateY(${y}px)`;
      el.style.opacity = String(opacity);
      if (opacity >= 1) heldOpaqueRef.current = true;
    };

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun =
        !document.hidden &&
        !motionDoneRef.current &&
        (visible || !paintLiveRef.current);
      setPaused(RAF_ID, !shouldRun);
      if (!shouldRun) {
        setContinuous(RAF_ID, false);
        return;
      }
      markDirty(RAF_ID);
    };

    const tick = (now: number) => {
      if (!alive || document.hidden) return;
      const clock = clockRef.current;
      if (!clock) return;
      const metrics = ensureMetrics().read();
      const walkF = clock.update(now, metrics);
      applySettle(walkF);

      const pastTrigger =
        metrics.scrollY >= clock.triggerScrollY(metrics) - 1 ||
        clock.isArmed();
      if (pastTrigger && !startedRef.current) {
        startedRef.current = true;
        setPlaying(true);
      }

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.gate);
      const settleBusy = settle.opacity < 1 || settle.rise < 1;
      // No reverse unwind for the door video — settle may still finish.
      const advancing = clock.wouldAdvanceWithTime(metrics) && settleBusy;
      if (!settleBusy && paintLiveRef.current) {
        motionDoneRef.current = true;
        setContinuous(RAF_ID, false);
        setPaused(RAF_ID, true);
        clock.syncTime(now);
        return;
      }
      setContinuous(RAF_ID, advancing);
      if (!advancing) clock.syncTime(now);
    };

    subscribe(RAF_ID, tick, { continuous: false });
    subscribed = true;
    syncPause();

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        ensureMetrics().refresh();
        syncPause();
        if (!motionDoneRef.current) markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );
    visIO.observe(wrap);

    const onScroll = () => {
      if (!subscribed || document.hidden || motionDoneRef.current) return;
      markDirty(RAF_ID);
    };
    const onResize = () => {
      ensureMetrics().refresh();
      if (!subscribed || document.hidden || motionDoneRef.current) return;
      markDirty(RAF_ID);
    };
    const onVisibility = () => {
      syncPause();
      if (!document.hidden && !motionDoneRef.current) markDirty(RAF_ID);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      visIO.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  const settleStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transformOrigin: '50% 100%',
    willChange: 'transform, opacity',
  };

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--gate${liveClass}`}
      aria-hidden="true"
    >
      <V37ScenePoster
        kind="gate"
        pack={pack}
        className={
          showPoster
            ? 'v37-scene__poster'
            : 'v37-scene__poster v37-scene__poster--layout'
        }
      />
      {!failed && !reduced ? (
        <div ref={settleRef} className="v37-scene__settle" style={settleStyle}>
          <StackedAlphaVideo
            src={src}
            playOnce
            holdLast
            playing={playing}
            autoPlay
            onFirstFrame={() => {
              paintLiveRef.current = true;
              setPaintLive(true);
            }}
            onUnavailable={() => setFailed(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
