'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  type CSSProperties,
} from 'react';
import {
  createStackedAlphaGl,
  drawStackedAlphaFrame,
  type StackedAlphaGl,
} from './stackedAlphaShader';

export type StackedAlphaVideoHandle = {
  seek: (timeS: number) => void;
  play: () => void;
  pause: () => void;
  getVideo: () => HTMLVideoElement | null;
};

export type StackedAlphaVideoProps = {
  src: string;
  loop?: boolean;
  playOnce?: boolean;
  holdLast?: boolean;
  hideOnEnded?: boolean;
  autoPlay?: boolean;
  playing?: boolean;
  startTime?: number;
  onEnded?: () => void;
  onFirstFrame?: () => void;
  onUnavailable?: () => void;
  className?: string;
  style?: CSSProperties;
  opacity?: number;
};

type RvfcVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, meta: unknown) => void,
  ) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

/**
 * Shared stacked-alpha H.264 player: hidden &lt;video&gt; → WebGL1 texture → canvas.
 * Canvas fills the CSS box (object-fit: fill). Poster / fade owned by the parent.
 * Src swaps keep the same WebGL canvas so landing→breathe has no visible jump.
 */
export const StackedAlphaVideo = forwardRef<
  StackedAlphaVideoHandle,
  StackedAlphaVideoProps
>(function StackedAlphaVideo(
  {
    src,
    loop = false,
    playOnce = false,
    holdLast = false,
    hideOnEnded = false,
    autoPlay = true,
    playing = true,
    startTime = 0,
    onEnded,
    onFirstFrame,
    onUnavailable,
    className,
    style,
    opacity = 1,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glRef = useRef<StackedAlphaGl | null>(null);
  const firstFrameRef = useRef(false);
  const endedRef = useRef(false);
  const holdRef = useRef(false);
  const visibleRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const uploadingRef = useRef(false);
  const rvfcIdRef = useRef(0);
  const rafIdRef = useRef(0);
  const srcRef = useRef(src);
  const loopRef = useRef(loop);
  const playOnceRef = useRef(playOnce);
  const holdLastRef = useRef(holdLast);
  const hideOnEndedRef = useRef(hideOnEnded);
  const startTimeRef = useRef(startTime);
  const playingRef = useRef(playing);
  const autoPlayRef = useRef(autoPlay);
  const onEndedRef = useRef(onEnded);
  const onFirstFrameRef = useRef(onFirstFrame);
  const onUnavailableRef = useRef(onUnavailable);

  loopRef.current = loop;
  playOnceRef.current = playOnce;
  holdLastRef.current = holdLast;
  hideOnEndedRef.current = hideOnEnded;
  startTimeRef.current = startTime;
  playingRef.current = playing;
  autoPlayRef.current = autoPlay;
  onEndedRef.current = onEnded;
  onFirstFrameRef.current = onFirstFrame;
  onUnavailableRef.current = onUnavailable;

  useImperativeHandle(ref, () => ({
    seek: (timeS: number) => {
      const v = videoRef.current;
      if (!v) return;
      try {
        v.currentTime = timeS;
      } catch {
        /* ignore */
      }
    },
    play: () => {
      playingRef.current = true;
      const v = videoRef.current;
      if (!v) return;
      v.muted = true;
      void v.play().catch(() => {
        onUnavailableRef.current?.();
      });
    },
    pause: () => {
      playingRef.current = false;
      videoRef.current?.pause();
    },
    getVideo: () => videoRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !video || !wrap) return;

    let alive = true;
    const api = createStackedAlphaGl(canvas);
    if (!api) {
      onUnavailableRef.current?.();
      return;
    }
    glRef.current = api;

    const readSize = () => {
      const w = wrap.clientWidth || canvas.clientWidth;
      const h = wrap.clientHeight || canvas.clientHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    };

    const drawOnce = () => {
      if (!alive || !glRef.current) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const { w, h } = readSize();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      try {
        drawStackedAlphaFrame(glRef.current, video, w, h, dpr);
      } catch {
        onUnavailableRef.current?.();
        stopUpload();
        return;
      }
      if (!firstFrameRef.current) {
        firstFrameRef.current = true;
        canvas.dataset.ready = '1';
        canvas.style.removeProperty('opacity');
        if (canvas.dataset.hidden === '1') {
          canvas.dataset.hidden = '0';
        }
        onFirstFrameRef.current?.();
      }
    };

    const stopUpload = () => {
      uploadingRef.current = false;
      const v = video as RvfcVideo;
      if (rvfcIdRef.current && v.cancelVideoFrameCallback) {
        try {
          v.cancelVideoFrameCallback(rvfcIdRef.current);
        } catch {
          /* ignore */
        }
      }
      rvfcIdRef.current = 0;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };

    const shouldUpload = () =>
      alive &&
      pageVisibleRef.current &&
      visibleRef.current &&
      !endedRef.current &&
      !holdRef.current &&
      !video.paused &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

    const pumpRvfc = () => {
      const v = video as RvfcVideo;
      if (!v.requestVideoFrameCallback) return false;
      const tick = () => {
        if (!alive) return;
        if (shouldUpload()) {
          drawOnce();
          rvfcIdRef.current = v.requestVideoFrameCallback!(tick);
        } else {
          uploadingRef.current = false;
          rvfcIdRef.current = 0;
          if (holdRef.current) drawOnce();
        }
      };
      uploadingRef.current = true;
      rvfcIdRef.current = v.requestVideoFrameCallback(tick);
      return true;
    };

    const pumpRaf = () => {
      const tick = () => {
        if (!alive) return;
        if (shouldUpload()) {
          drawOnce();
          rafIdRef.current = requestAnimationFrame(tick);
        } else {
          uploadingRef.current = false;
          rafIdRef.current = 0;
          if (holdRef.current) drawOnce();
        }
      };
      uploadingRef.current = true;
      rafIdRef.current = requestAnimationFrame(tick);
    };

    const startUpload = () => {
      if (uploadingRef.current || !alive) return;
      if (!shouldUpload() && !holdRef.current) return;
      if (!pumpRvfc()) pumpRaf();
    };

    const syncPlay = () => {
      if (!alive) return;
      const want =
        autoPlayRef.current &&
        playingRef.current &&
        pageVisibleRef.current &&
        visibleRef.current &&
        !endedRef.current;
      if (want) {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        const p = video.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (alive) startUpload();
          }).catch((err: unknown) => {
            if (
              err instanceof DOMException &&
              (err.name === 'NotAllowedError' ||
                err.name === 'NotSupportedError')
            ) {
              onUnavailableRef.current?.();
            }
          });
        } else {
          startUpload();
        }
      } else {
        video.pause();
        stopUpload();
        if (holdRef.current) drawOnce();
      }
    };

    const applyStartTime = () => {
      const t = startTimeRef.current;
      if (t > 0) {
        try {
          video.currentTime = t;
        } catch {
          /* ignore */
        }
      }
    };

    const onVideoEnded = () => {
      if (!alive) return;
      if (loopRef.current && !playOnceRef.current) return;
      endedRef.current = true;
      if (holdLastRef.current) {
        holdRef.current = true;
        try {
          if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = Math.max(0, video.duration - 1 / 60);
          }
        } catch {
          /* ignore */
        }
        video.pause();
        drawOnce();
      } else if (hideOnEndedRef.current) {
        stopUpload();
        video.pause();
        canvas.style.opacity = '0';
        canvas.dataset.hidden = '1';
      } else {
        stopUpload();
        video.pause();
      }
      onEndedRef.current?.();
    };

    const onLoadedMeta = () => {
      if (!alive) return;
      applyStartTime();
      syncPlay();
    };

    const onError = () => {
      if (!alive) return;
      onUnavailableRef.current?.();
      stopUpload();
    };

    const loadSrc = (next: string, resetFirstFrame: boolean) => {
      endedRef.current = false;
      holdRef.current = false;
      stopUpload();
      if (resetFirstFrame) {
        firstFrameRef.current = false;
        canvas.dataset.ready = '0';
      }
      canvas.dataset.hidden = '0';
      canvas.style.removeProperty('opacity');
      video.loop = loopRef.current && !playOnceRef.current;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      if (video.src !== new URL(next, window.location.href).href) {
        video.src = next;
        video.load();
      } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        applyStartTime();
        syncPlay();
      }
    };

    srcRef.current = src;
    loadSrc(src, true);

    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('ended', onVideoEnded);
    video.addEventListener('error', onError);
    video.addEventListener('playing', startUpload);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              visibleRef.current = entries.some((e) => e.isIntersecting);
              if (visibleRef.current) syncPlay();
              else {
                video.pause();
                stopUpload();
              }
            },
            { rootMargin: '0px', threshold: 0.01 },
          )
        : null;
    io?.observe(wrap);

    const onVis = () => {
      pageVisibleRef.current = !document.hidden;
      if (pageVisibleRef.current) syncPlay();
      else {
        video.pause();
        stopUpload();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (firstFrameRef.current || holdRef.current) drawOnce();
          })
        : null;
    ro?.observe(wrap);

    return () => {
      alive = false;
      stopUpload();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('ended', onVideoEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('playing', startUpload);
      video.pause();
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* ignore */
      }
      glRef.current?.lose();
      glRef.current = null;
    };
    // Mount-once: WebGL context + IO/visibility wiring. Src swaps are handled
    // by the following effect so landing→breathe keeps the same canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional empty deps
  }, []);

  // Src / loop mode changes — keep WebGL context; swap the media element only.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !glRef.current) {
      srcRef.current = src;
      return;
    }
    const prev = srcRef.current;
    srcRef.current = src;
    loopRef.current = loop;
    playOnceRef.current = playOnce;
    holdLastRef.current = holdLast;
    hideOnEndedRef.current = hideOnEnded;
    startTimeRef.current = startTime;

    if (prev === src) {
      video.loop = loop && !playOnce;
      return;
    }

    endedRef.current = false;
    holdRef.current = false;
    // Keep last drawn pixels until the new clip's first frame (seamless swap).
    video.loop = loop && !playOnce;
    video.muted = true;
    video.src = src;
    video.load();
  }, [src, loop, playOnce, holdLast, hideOnEnded, startTime]);

  useEffect(() => {
    playingRef.current = playing;
    autoPlayRef.current = autoPlay;
    const video = videoRef.current;
    if (!video || endedRef.current || holdRef.current) return;
    const want =
      autoPlay && playing && pageVisibleRef.current && visibleRef.current;
    if (want) {
      video.muted = true;
      void video.play().catch(() => {
        /* parent keeps poster via onUnavailable from main play path */
      });
    } else {
      video.pause();
    }
  }, [playing, autoPlay]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="v37-scene__canvas"
        data-ready="0"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});
