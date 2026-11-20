'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {
  markDirty,
  setContinuous,
  setPaused,
  subscribe,
  unsubscribe,
} from '@/components/home/rafScheduler';
import { StackedAlphaVideo } from '@/components/home/v4/StackedAlphaVideo';
import {
  BENCH_OVERFLOW,
  benchBackSrc,
  benchBodySrc,
  benchFrontSrc,
  benchShadowSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
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

const RAF_ID = 'v37-bench';
const BENCH_MIN_OPACITY = 0.92;

type OverflowBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PlaceBox = {
  top: number;
  height: number;
};

function layoutBoxes(
  wrap: HTMLDivElement,
  pack: '1440' | '390',
): { overflow: OverflowBox; place: PlaceBox } {
  const meta = BENCH_OVERFLOW[pack];
  const placeW = Math.max(1, wrap.clientWidth);
  const scale = placeW / meta.placeW;
  const padL = meta.padL * scale;
  const padT = meta.padT * scale;
  const cssW = meta.overflowW * scale;
  const cssH = meta.overflowH * scale;
  const hostPadT = parseFloat(getComputedStyle(wrap).paddingTop) || 0;
  const hostPadB = parseFloat(getComputedStyle(wrap).paddingBottom) || 0;
  // Absolute children are relative to the padding edge — offset imgs into the content box.
  const placeTop = hostPadT;
  const placeHeight = Math.max(1, wrap.clientHeight - hostPadT - hostPadB);
  return {
    overflow: {
      left: -padL,
      top: hostPadT > 0.5 ? 0 : -padT,
      width: cssW,
      height: cssH,
    },
    place: { top: placeTop, height: placeHeight },
  };
}

/**
 * Bench — static body/shadow settle; back/front stacked-alpha videos outside settle.
 * Both videos start together 0.567s after trigger, play once, then hide.
 * Do NOT mirror B1 — orientation is baked into the video.
 */
export function BenchScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const [failed, setFailed] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videosDone, setVideosDone] = useState(false);
  const [overflow, setOverflow] = useState<OverflowBox | null>(null);
  const [placeBox, setPlaceBox] = useState<PlaceBox | null>(null);
  const paintLiveRef = useRef(false);
  const heldOpaqueRef = useRef(false);
  const frozenRef = useRef(false);
  const videoStartedRef = useRef(false);
  const videosEndedRef = useRef(0);

  const key = packToV4Key(pack);

  useEffect(() => {
    setFailed(false);
    setPaintLive(false);
    setVideoPlaying(false);
    setVideosDone(false);
    setOverflow(null);
    setPlaceBox(null);
    paintLiveRef.current = false;
    heldOpaqueRef.current = false;
    frozenRef.current = false;
    videoStartedRef.current = false;
    videosEndedRef.current = 0;
    clockRef.current = null;
  }, [pack]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced || failed) return;
    const boxes = layoutBoxes(wrap, pack);
    setOverflow(boxes.overflow);
    setPlaceBox(boxes.place);
  }, [pack, reduced, failed, paintLive]);

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let visible = false;
    let subscribed = false;
    let metricsCache: SectionMetricsCache | null = null;

    clockRef.current = new ScrollClock({
      triggerP: TRIGGER_P[pack].bench,
      triggerWalkF: TRIGGER_WALK_F.bench,
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
      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.bench);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      const pre = settle.opacity <= 0 && !paintLiveRef.current;
      const rawOpacity = pre ? 1 : settle.opacity;
      const opacity = Math.max(
        heldOpaqueRef.current || paintLiveRef.current ? 1 : BENCH_MIN_OPACITY,
        rawOpacity,
      );
      const y = pre ? 0 : ty;
      if (opacity >= 1) heldOpaqueRef.current = true;
      const shadow = wrap.querySelector<HTMLElement>('.v37-bench__shadow');
      if (shadow) {
        const sx = pre ? 1 : settle.shadowScaleX;
        const so = Math.max(
          heldOpaqueRef.current || paintLiveRef.current ? 1 : BENCH_MIN_OPACITY,
          pre ? 1 : settle.shadowOpacity,
        );
        shadow.style.transform = `translateY(${y}px) scaleX(${sx})`;
        shadow.style.opacity = String(so);
        shadow.style.transformOrigin = '50% 100%';
      }
      const body = wrap.querySelector<HTMLElement>('.v37-bench__body');
      if (body) {
        body.style.transform = `translateY(${y}px)`;
        body.style.opacity = String(opacity);
      }
    };

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun =
        !document.hidden &&
        !frozenRef.current &&
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
      if (frozenRef.current) {
        setContinuous(RAF_ID, false);
        clock.syncTime(now);
        return;
      }

      const metrics = ensureMetrics().read();
      const walkF = clock.update(now, metrics);
      applySettle(walkF);

      // f320 trigger → f337 video start (= 0.5667s @ 30fps walk clock).
      if (!videoStartedRef.current && walkF >= TRIGGER_WALK_F.bench + 17) {
        videoStartedRef.current = true;
        setVideoPlaying(true);
      }

      const settle = settleFromWalkDelta(walkF - TRIGGER_WALK_F.bench);
      const settleBusy = settle.opacity < 1 || settle.rise < 1;
      const videoBusy = videoStartedRef.current && videosEndedRef.current < 2;
      const motionBusy = settleBusy || videoBusy || !paintLiveRef.current;
      if (!motionBusy) {
        frozenRef.current = true;
        setContinuous(RAF_ID, false);
        setPaused(RAF_ID, true);
        clock.syncTime(now);
        return;
      }
      const advancing = clock.wouldAdvanceWithTime(metrics) || videoBusy;
      setContinuous(RAF_ID, advancing && motionBusy);
      if (!advancing) clock.syncTime(now);
    };

    subscribe(RAF_ID, tick, { continuous: false });
    subscribed = true;
    syncPause();

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        ensureMetrics().refresh();
        if (visible) {
          const boxes = layoutBoxes(wrap, pack);
          setOverflow(boxes.overflow);
          setPlaceBox(boxes.place);
        }
        syncPause();
        if (!frozenRef.current) markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );
    visIO.observe(wrap);

    const ro = new ResizeObserver(() => {
      const boxes = layoutBoxes(wrap, pack);
      setOverflow(boxes.overflow);
      setPlaceBox(boxes.place);
      ensureMetrics().refresh();
      if (!subscribed || document.hidden || frozenRef.current) return;
      markDirty(RAF_ID);
    });
    ro.observe(wrap);

    const onScroll = () => {
      if (!subscribed || document.hidden || frozenRef.current) return;
      markDirty(RAF_ID);
    };
    const onVisibility = () => {
      syncPause();
      if (!document.hidden && !frozenRef.current) markDirty(RAF_ID);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // Show body/shadow immediately (layout stills).
    paintLiveRef.current = true;
    setPaintLive(true);

    return () => {
      alive = false;
      visIO.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  const overflowStyle: CSSProperties | undefined = overflow
    ? {
        position: 'absolute',
        left: overflow.left,
        top: overflow.top,
        width: overflow.width,
        height: overflow.height,
        maxWidth: 'none',
        inset: 'auto',
      }
    : undefined;

  const imgBase: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: placeBox?.top ?? 0,
    width: '100%',
    height: placeBox?.height ?? '100%',
    objectFit: 'fill',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  };

  const onVideoEnded = () => {
    videosEndedRef.current += 1;
    if (videosEndedRef.current >= 2) {
      setVideosDone(true);
      setVideoPlaying(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--bench${liveClass}`}
      aria-hidden="true"
    >
      <V37ScenePoster
        kind="bench"
        pack={pack}
        className={
          showPoster
            ? 'v37-scene__poster'
            : 'v37-scene__poster v37-scene__poster--layout'
        }
      />
      {!failed && !reduced ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="v37-bench__shadow"
            src={benchShadowSrc(pack)}
            alt=""
            decoding="async"
            style={{ ...imgBase, zIndex: 1 }}
          />
          {!videosDone && overflow ? (
            <StackedAlphaVideo
              src={benchBackSrc(key)}
              playOnce
              hideOnEnded
              playing={videoPlaying}
              autoPlay
              style={{ ...overflowStyle, zIndex: 2 }}
              onEnded={onVideoEnded}
              onUnavailable={() => setFailed(true)}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="v37-bench__body"
            src={benchBodySrc(pack)}
            alt=""
            decoding="async"
            style={{ ...imgBase, zIndex: 3 }}
          />
          {!videosDone && overflow ? (
            <StackedAlphaVideo
              src={benchFrontSrc(key)}
              playOnce
              hideOnEnded
              playing={videoPlaying}
              autoPlay
              style={{ ...overflowStyle, zIndex: 4 }}
              onEnded={onVideoEnded}
              onUnavailable={() => setFailed(true)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
