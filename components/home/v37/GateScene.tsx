'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  StackedAlphaVideo,
  type StackedAlphaVideoHandle,
} from '@/components/home/v4/StackedAlphaVideo';
import { gateStackSrc, packToV4Key } from '@/components/home/v4/assets';
import { observeCenterFocus, SRC_ROOT_MARGIN } from './centerFocus';
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

/**
 * Gate door — plays forward at 60fps when the scene center enters the
 * viewport's focus band, ping-pongs while it stays there, and resets to
 * frame 0 when it leaves so the next visit can play again. Video src is
 * assigned only when near the viewport. The stacked-alpha clip is not
 * translated: only the door should move inside the video.
 */
export function GateScene({ sectionRef: _sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
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

    const enterFocus = () => {
      if (!alive || focusedRef.current) return;
      focusedRef.current = true;
      playerRef.current?.play();
    };

    const leaveFocus = () => {
      if (!alive || !focusedRef.current) return;
      focusedRef.current = false;
      playerRef.current?.reset();
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

    const stopFocusIO = observeCenterFocus(focus, {
      onEnter: () => {
        if (alive) enterFocus();
      },
      onLeave: () => {
        if (alive) leaveFocus();
      },
    });

    return () => {
      alive = false;
      srcIO.disconnect();
      stopFocusIO();
    };
  }, [pack, reduced, failed]);

  const showPoster = failed || reduced || !paintLive;
  const liveClass = paintLive && !failed && !reduced ? ' is-live' : '';

  const settleStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
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
        <div className="v37-scene__settle" style={settleStyle}>
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
