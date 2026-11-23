'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
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
import { gateStackSrc, packToV4Key } from '@/components/home/v4/assets';
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

const RAF_ID = 'v37-gate';

/**
 * Gate door — stacked-alpha MP4 scrubbed by scroll (down opens, up closes).
 * End frames are held. Video src is assigned only when near the viewport.
 */
export function GateScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<StackedAlphaVideoHandle>(null);
  const [failed, setFailed] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [near, setNear] = useState(false);
  const paintLiveRef = useRef(false);

  const key = packToV4Key(pack);
  const src = near ? gateStackSrc(key) : '';

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
      const el = settleRef.current;
      if (!el) return;
      const settle = sampleSettleFromProgress(progress);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      // Closed door must stay visible at progress 0; only the 16px rise links to scroll.
      const opacity = paintLiveRef.current ? 1 : Math.max(0.92, settle.opacity);
      el.style.transform = `translateY(${paintLiveRef.current ? ty : 0}px)`;
      el.style.opacity = String(opacity);
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
      const progress = scrollMediaProgress(metrics, TRIGGER_P[pack].gate);
      applySettle(progress);
      playerRef.current?.seekProgress(progress);
      setContinuous(RAF_ID, false);
    };

    subscribe(RAF_ID, tick, { continuous: false });
    subscribed = true;
    syncPause();

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        ensureMetrics().refresh();
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

    const onScroll = () => {
      if (!subscribed || document.hidden) return;
      markDirty(RAF_ID);
    };
    const onResize = () => {
      ensureMetrics().refresh();
      if (!subscribed || document.hidden) return;
      markDirty(RAF_ID);
    };
    const onVisibility = () => {
      syncPause();
      if (!document.hidden) markDirty(RAF_ID);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      visIO.disconnect();
      srcIO.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef]);

  useEffect(() => {
    if (near) markDirty(RAF_ID);
  }, [near]);

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
      {!failed && !reduced && near ? (
        <div ref={settleRef} className="v37-scene__settle" style={settleStyle}>
          <StackedAlphaVideo
            ref={playerRef}
            src={src}
            scrub
            progress={0}
            playing={false}
            autoPlay={false}
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
