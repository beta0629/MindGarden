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
  BENCH_HOLD_S,
  BENCH_OVERFLOW,
  benchBackSrc,
  benchBodySrc,
  benchFrontSrc,
  benchShadowSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
import { observeCenterFocus, SRC_ROOT_MARGIN } from './centerFocus';
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
 * Bench — chair/shadow settle on rAF when the scene center enters the
 * viewport's focus band; back/front butterflies play forward, hold the last
 * opaque frame, and reset when the scene leaves so the next visit can play
 * again. Video src is assigned only when near the viewport.
 */
export function BenchScene({ sectionRef: _sectionRef }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<StackedAlphaVideoHandle>(null);
  const frontRef = useRef<StackedAlphaVideoHandle>(null);
  const [failed, setFailed] = useState(false);
  const paintLive = !failed && !reduced;
  const [near, setNear] = useState(false);
  const [overflow, setOverflow] = useState<OverflowBox | null>(null);
  const [placeBox, setPlaceBox] = useState<PlaceBox | null>(null);
  const paintLiveRef = useRef(paintLive);
  const focusedRef = useRef(false);

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
    const focus = focusRef.current;
    if (!wrap || !focus) return;

    let alive = true;
    let subscribed = false;

    const applySettle = (elapsedMs: number) => {
      const settle = sampleSettle(elapsedMs);
      const risePx = SETTLE_RISE_PX[pack];
      const ty = settleTranslateY(settle.rise, risePx);
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
        body.style.opacity = '1';
      }
    };

    const tick = () => {
      if (!alive || document.hidden || !focusedRef.current) {
        setContinuous(RAF_ID, false);
        return;
      }
      const t = backRef.current?.getVideo()?.currentTime ?? 0;
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
      backRef.current?.play();
      frontRef.current?.play();
      setPaused(RAF_ID, document.hidden);
      setContinuous(RAF_ID, true);
      markDirty(RAF_ID);
    };

    const leaveFocus = () => {
      if (!alive || !focusedRef.current) return;
      focusedRef.current = false;
      applySettle(-1);
      backRef.current?.reset();
      frontRef.current?.reset();
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

    const stopFocusIO = observeCenterFocus(focus, {
      onEnter: () => {
        if (alive) enterFocus();
      },
      onLeave: () => {
        if (alive) leaveFocus();
      },
    });

    const ro = new ResizeObserver(() => {
      const boxes = layoutBoxes(wrap, pack);
      setOverflow(boxes.overflow);
      setPlaceBox(boxes.place);
    });
    ro.observe(wrap);

    const onVisibility = () => {
      if (!subscribed) return;
      setPaused(RAF_ID, document.hidden || !focusedRef.current);
      if (!document.hidden && focusedRef.current) markDirty(RAF_ID);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      srcIO.disconnect();
      stopFocusIO();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (subscribed) unsubscribe(RAF_ID);
    };
  }, [pack, reduced, failed]);

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

  const playIfFocused = () => {
    if (focusedRef.current) {
      backRef.current?.play();
      frontRef.current?.play();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`v37-scene v37-scene--bench${liveClass}`}
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
              blobSrc
              pingPong
              holdAt={BENCH_HOLD_S}
              playing={false}
              autoPlay={false}
              style={{ ...overflowStyle, zIndex: 2 }}
              onFirstFrame={playIfFocused}
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
              blobSrc
              pingPong
              holdAt={BENCH_HOLD_S}
              playing={false}
              autoPlay={false}
              style={{ ...overflowStyle, zIndex: 4 }}
              onFirstFrame={playIfFocused}
              onUnavailable={() => setFailed(true)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
