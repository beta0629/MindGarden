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
import { useBreakpointPack, usePrefersReducedMotion } from './useBreakpointPack';
import { V37ScenePoster } from './V37ScenePoster';

type Props = {
  sectionRef?: RefObject<HTMLElement | null>;
};

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
 * Bench — back/front butterflies play when the scene center enters the
 * viewport's focus band, ping-pong while it stays there (hold at 2.8s so
 * the end fade is never shown), and reset when the scene leaves. The
 * static body and shadow stay put; only the butterflies move. Video src
 * is assigned only when near the viewport.
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

    const enterFocus = () => {
      if (!alive || focusedRef.current) return;
      focusedRef.current = true;
      backRef.current?.play();
      frontRef.current?.play();
    };

    const leaveFocus = () => {
      if (!alive || !focusedRef.current) return;
      focusedRef.current = false;
      backRef.current?.reset();
      frontRef.current?.reset();
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

    return () => {
      alive = false;
      srcIO.disconnect();
      stopFocusIO();
      ro.disconnect();
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
    willChange: 'opacity',
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
