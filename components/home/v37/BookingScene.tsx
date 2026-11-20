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
import {
  BOOKING_HOVER_FADE_MS,
  BOOKING_POSTER_START_S,
  bookingBreatheSrc,
  bookingHoverSrc,
  bookingLandingSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
import {
  createSectionMetricsCache,
  ScrollClock,
  type SectionMetricsCache,
} from './scrollClock';
import { TRIGGER_P, TRIGGER_WALK_F } from './types';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

const RAF_ID = 'v37-booking';

type Phase = 'landing' | 'breathe';

/**
 * Booking butterfly — landing once → breathe loop (same canvas).
 * Desktop hover: 300ms opacity crossfade to hover loop.
 */
export function BookingScene({ sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<ScrollClock | null>(null);
  const [failed, setFailed] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>('landing');
  const [landingDone, setLandingDone] = useState(false);
  const [hoverOn, setHoverOn] = useState(false);
  const paintLiveRef = useRef(false);
  const landingDoneRef = useRef(false);
  const startedRef = useRef(false);

  const key = packToV4Key(pack);
  const landingSrc = bookingLandingSrc(key);
  const breatheSrc = bookingBreatheSrc(key);
  const hoverSrc = bookingHoverSrc(key);
  const isDesktop = pack === '1440';
  const mainSrc = phase === 'landing' ? landingSrc : breatheSrc;

  useEffect(() => {
    setFailed(false);
    setPaintLive(false);
    setPlaying(false);
    setPhase('landing');
    setLandingDone(false);
    setHoverOn(false);
    paintLiveRef.current = false;
    landingDoneRef.current = false;
    startedRef.current = false;
    clockRef.current = null;
  }, [pack]);

  // Preload breathe (+ hover on desktop) before landing ends.
  useEffect(() => {
    if (reduced || failed) return;
    const warm = (src: string) => {
      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'auto';
      v.playsInline = true;
      v.src = src;
      v.load();
      const cleanup = () => {
        v.removeAttribute('src');
        try {
          v.load();
        } catch {
          /* ignore */
        }
      };
      v.addEventListener('canplaythrough', cleanup, { once: true });
      v.addEventListener('error', cleanup, { once: true });
    };
    warm(breatheSrc);
    if (isDesktop) warm(hoverSrc);
  }, [breatheSrc, hoverSrc, isDesktop, reduced, failed]);

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let alive = true;
    let visible = false;
    let subscribed = false;
    let metricsCache: SectionMetricsCache | null = null;

    clockRef.current = new ScrollClock({
      triggerP: TRIGGER_P[pack].booking,
      triggerWalkF: TRIGGER_WALK_F.booking,
      nearMaxScroll: true,
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

    const landingMustRun = (): boolean => {
      if (landingDoneRef.current) return false;
      const clock = clockRef.current;
      if (!clock) return false;
      const metrics = ensureMetrics().read();
      const triggerY = clock.triggerScrollY(metrics);
      const past =
        metrics.scrollY >= triggerY - 1 ||
        metrics.scrollY >= metrics.maxScroll - 2;
      return past || clock.wouldAdvanceWithTime(metrics);
    };

    const syncPause = () => {
      if (!subscribed) return;
      const shouldRun =
        !document.hidden &&
        (landingMustRun() ||
          !paintLiveRef.current ||
          (visible && !landingDoneRef.current));
      setPaused(RAF_ID, !shouldRun);
      if (!shouldRun) {
        setContinuous(RAF_ID, false);
        return;
      }
      markDirty(RAF_ID);
    };

    const tick = (now: number) => {
      if (!alive || document.hidden) return;
      if (!visible && !landingMustRun() && paintLiveRef.current) return;
      const clock = clockRef.current;
      if (!clock) return;
      const metrics = ensureMetrics().read();
      clock.update(now, metrics);

      if (landingMustRun() && !startedRef.current) {
        startedRef.current = true;
        setPlaying(true);
      }

      const continuous = !landingDoneRef.current || !paintLiveRef.current;
      setContinuous(RAF_ID, continuous);
      if (!continuous) {
        clock.syncTime(now);
        setPaused(RAF_ID, true);
      }
    };

    subscribe(RAF_ID, tick, { continuous: false });
    subscribed = true;
    syncPause();

    const onEnter = () => {
      if (!isDesktop || !landingDoneRef.current) return;
      setHoverOn(true);
    };
    const onLeave = () => {
      setHoverOn(false);
    };
    const hit = wrap.querySelector('.v37-scene__hit') ?? wrap;
    hit.addEventListener('pointerenter', onEnter);
    hit.addEventListener('pointerleave', onLeave);

    const visIO = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        ensureMetrics().refresh();
        if (!visible) setHoverOn(false);
        syncPause();
        if (!landingDoneRef.current || !paintLiveRef.current) {
          markDirty(RAF_ID);
        }
      },
      { rootMargin: '0px' },
    );
    visIO.observe(wrap);

    const onScroll = () => {
      if (!subscribed || document.hidden) return;
      if (!landingDoneRef.current || !paintLiveRef.current) {
        syncPause();
        markDirty(RAF_ID);
      }
    };
    const onResize = () => {
      ensureMetrics().refresh();
    };
    const onVisibility = () => {
      syncPause();
      if (
        !document.hidden &&
        (!landingDoneRef.current || !paintLiveRef.current)
      ) {
        markDirty(RAF_ID);
      }
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
      hit.removeEventListener('pointerenter', onEnter);
      hit.removeEventListener('pointerleave', onLeave);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed, sectionRef, isDesktop]);

  const videoBoxStyle: CSSProperties =
    pack === '1440'
      ? {
          position: 'absolute',
          left: 0,
          top: `${(-8 / 217) * 100}%`,
          width: '100%',
          height: `${(225 / 217) * 100}%`,
          inset: 'auto',
        }
      : {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        };

  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--booking${liveClass}`}
      aria-hidden="true"
    >
      <V37ScenePoster
        kind="booking"
        pack={pack}
        className={
          showPoster
            ? 'v37-scene__poster'
            : 'v37-scene__poster v37-scene__poster--layout'
        }
      />
      {!failed && !reduced ? (
        <>
          <StackedAlphaVideo
            src={mainSrc}
            playOnce={phase === 'landing'}
            loop={phase === 'breathe'}
            playing={playing && !(isDesktop && hoverOn)}
            autoPlay
            startTime={phase === 'landing' ? BOOKING_POSTER_START_S : 0}
            style={videoBoxStyle}
            onFirstFrame={() => {
              paintLiveRef.current = true;
              setPaintLive(true);
            }}
            onEnded={() => {
              if (phase !== 'landing') return;
              landingDoneRef.current = true;
              setLandingDone(true);
              setPhase('breathe');
            }}
            onUnavailable={() => setFailed(true)}
          />
          {isDesktop && landingDone ? (
            <StackedAlphaVideo
              src={hoverSrc}
              loop
              playing={hoverOn}
              autoPlay
              opacity={hoverOn ? 1 : 0}
              style={{
                ...videoBoxStyle,
                transition: `opacity ${BOOKING_HOVER_FADE_MS}ms ease`,
                zIndex: 2,
              }}
              onUnavailable={() => {
                /* hover optional — keep breathe */
              }}
            />
          ) : null}
        </>
      ) : null}
      <span className="v37-scene__hit" />
    </div>
  );
}
