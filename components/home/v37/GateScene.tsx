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
import { FOCUS_ROOT_MARGIN, SRC_ROOT_MARGIN } from './centerFocus';
import {
  SETTLE_RISE_PX,
  sampleSettle,
  settleTranslateY,
} from './settle';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

const RAF_ID = 'v37-gate';

/**
 * Gate door — plays forward at 60fps when the scene center enters the
 * viewport's focus band, holds the last (open) frame, and resets to frame 0
 * when it leaves so the next visit can play again. Video src is assigned
 * only when near the viewport.
 */
export function GateScene({ sectionRef: _sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<StackedAlphaVideoHandle>(null);
  const [failed, setFailed] = useState(false);
  const [paintLive, setPaintLive] = useState(false);
  const [near, setNear] = useState(false);
  const paintLiveRef = useRef(false);
  const focusedRef = useRef(false);

  const key = packToV4Key(pack);
  const src = near ? gateStackSrc(key) : '';

  useEffect(() => {
    if (reduced || failed) return;
    const wrap = wrapRef.current;
    const focus = focusRef.current;
    if (!wrap || !focus) return;

    let alive = true;
    let subscribed = false;

    const applySettle = (elapsedMs: number) => {
      const el = settleRef.current;
      if (!el) return;
      const settle = sampleSettle(elapsedMs);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
      // Closed door stays visible; only the 16px rise plays on focus.
      const opacity = paintLiveRef.current ? 1 : Math.max(0.92, settle.opacity);
      el.style.transform = `translateY(${paintLiveRef.current ? ty : 0}px)`;
      el.style.opacity = String(opacity);
    };

    const tick = () => {
      if (!alive || document.hidden || !focusedRef.current) {
        setContinuous(RAF_ID, false);
        return;
      }
      const t = playerRef.current?.getVideo()?.currentTime ?? 0;
      applySettle(t * 1000);
      setContinuous(RAF_ID, true);
    };

    subscribe(RAF_ID, tick, { continuous: false });
    subscribed = true;
    setPaused(RAF_ID, document.hidden);

    const enterFocus = () => {
      if (!alive || focusedRef.current) return;
      focusedRef.current = true;
      applySettle(0);
      playerRef.current?.play();
      setPaused(RAF_ID, document.hidden);
      setContinuous(RAF_ID, true);
      markDirty(RAF_ID);
    };

    const leaveFocus = () => {
      if (!alive || !focusedRef.current) return;
      focusedRef.current = false;
      applySettle(-1);
      playerRef.current?.reset();
      setContinuous(RAF_ID, false);
      setPaused(RAF_ID, true);
    };

    const srcIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          srcIO.disconnect();
        }
      },
      { rootMargin: SRC_ROOT_MARGIN },
    );
    srcIO.observe(wrap);

    const focusIO = new IntersectionObserver(
      (entries) => {
        if (!alive) return;
        if (entries.some((e) => e.isIntersecting)) enterFocus();
        else leaveFocus();
      },
      { rootMargin: FOCUS_ROOT_MARGIN, threshold: 0 },
    );
    focusIO.observe(focus);

    const onVisibility = () => {
      if (!subscribed) return;
      setPaused(RAF_ID, document.hidden || !focusedRef.current);
      if (!document.hidden && focusedRef.current) markDirty(RAF_ID);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      srcIO.disconnect();
      focusIO.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed]);

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
      <div
        ref={focusRef}
        className="v37-scene__focus"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />
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
            blobSrc
            pingPong
            playing={false}
            autoPlay={false}
            onFirstFrame={() => {
              paintLiveRef.current = true;
              setPaintLive(true);
              if (focusedRef.current) playerRef.current?.play();
            }}
            onUnavailable={() => setFailed(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
