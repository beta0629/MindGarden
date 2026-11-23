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
import {
  StackedAlphaVideo,
  type StackedAlphaVideoHandle,
} from '@/components/home/v4/StackedAlphaVideo';
import {
  BENCH_HOLD_PROGRESS,
  BENCH_OVERFLOW,
  benchBackSrc,
  benchBodySrc,
  benchFrontSrc,
  benchShadowSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
import {
  createSectionMetricsCache,
  type SectionMetricsCache,
} from './scrollClock';
import {
  SETTLE_RISE_PX,
  sampleSettleFromProgress,
  settleTranslateY,
} from './settle';
import { TRIGGER_P } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';
import { SCRUB_SRC_ROOT_MARGIN, scrollMediaProgress } from './scrubProgress';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

const RAF_ID = 'v37-bench';

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
 * Bench — static body/shadow settle on rAF/scroll; back/front stacked-alpha
 * videos scrubbed by scroll (fly in and settle, reverse on scroll up, never hide).
 */
export function BenchScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<StackedAlphaVideoHandle>(null);
  const frontRef = useRef<StackedAlphaVideoHandle>(null);
  const [failed, setFailed] = useState(false);
  const paintLive = !failed && !reduced;
  const [near, setNear] = useState(false);
  const [overflow, setOverflow] = useState<OverflowBox | null>(null);
  const [placeBox, setPlaceBox] = useState<PlaceBox | null>(null);
  const paintLiveRef = useRef(paintLive);

  useEffect(() => {
    paintLiveRef.current = paintLive;
  }, [paintLive]);

  const key = packToV4Key(pack);
  const backSrc = near ? benchBackSrc(key) : '';
  const frontSrc = near ? benchFrontSrc(key) : '';

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced || failed) return;
    const id = requestAnimationFrame(() => {
      const boxes = layoutBoxes(wrap, pack);
      setOverflow(boxes.overflow);
      setPlaceBox(boxes.place);
    });
    return () => cancelAnimationFrame(id);
  }, [pack, reduced, failed, paintLive]);

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let visible = false;
    let subscribed = false;
    let metricsCache: SectionMetricsCache | null = null;

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

    const applySettle = (progress: number) => {
      const settle = sampleSettleFromProgress(progress);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      // Chair stays visible; rise/shadow follow scroll and reverse on the way up.
      const opacity = 1;
      const y = ty;
      const shadow = wrap.querySelector<HTMLElement>('.v37-bench__shadow');
      if (shadow) {
        shadow.style.transform = `translateY(${y}px) scaleX(${settle.shadowScaleX})`;
        shadow.style.opacity = String(Math.max(0.92, settle.shadowOpacity));
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
      const shouldRun = !document.hidden && (visible || !paintLiveRef.current);
      setPaused(RAF_ID, !shouldRun);
      setContinuous(RAF_ID, false);
      if (shouldRun) markDirty(RAF_ID);
    };

    const tick = () => {
      if (!alive || document.hidden) return;
      const metrics = ensureMetrics().read();
      const progress = scrollMediaProgress(metrics, TRIGGER_P[pack].bench);
      applySettle(progress);
      // Hold the last opaque frame (skip the end fade to empty).
      const mediaProgress = progress * BENCH_HOLD_PROGRESS;
      backRef.current?.seekProgress(mediaProgress);
      frontRef.current?.seekProgress(mediaProgress);
      setContinuous(RAF_ID, false);
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
        markDirty(RAF_ID);
      },
      { rootMargin: '0px' },
    );
    visIO.observe(wrap);

    const srcIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          srcIO.disconnect();
        }
      },
      { rootMargin: SCRUB_SRC_ROOT_MARGIN },
    );
    srcIO.observe(wrap);

    const ro = new ResizeObserver(() => {
      const boxes = layoutBoxes(wrap, pack);
      setOverflow(boxes.overflow);
      setPlaceBox(boxes.place);
      ensureMetrics().refresh();
      if (!subscribed || document.hidden) return;
      markDirty(RAF_ID);
    });
    ro.observe(wrap);

    const onScroll = () => {
      if (!subscribed || document.hidden) return;
      markDirty(RAF_ID);
    };
    const onVisibility = () => {
      syncPause();
      if (!document.hidden) markDirty(RAF_ID);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      visIO.disconnect();
      srcIO.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  useEffect(() => {
    if (near) markDirty(RAF_ID);
  }, [near]);

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
          {near && overflow ? (
            <StackedAlphaVideo
              ref={backRef}
              src={backSrc}
              scrub
              progress={0}
              playing={false}
              autoPlay={false}
              style={{ ...overflowStyle, zIndex: 2 }}
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
          {near && overflow ? (
            <StackedAlphaVideo
              ref={frontRef}
              src={frontSrc}
              scrub
              progress={0}
              playing={false}
              autoPlay={false}
              style={{ ...overflowStyle, zIndex: 4 }}
              onUnavailable={() => setFailed(true)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
