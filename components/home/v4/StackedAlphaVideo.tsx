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
  /**
   * Adopt an existing SSR / DOM &lt;video&gt; (e.g. `.hero-stacked-video`) so the
   * mp4 fetch started from HTML is reused — never create a second request.
   */
  adoptSelector?: string;
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
    adoptSelector,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    const wrap = wrapRef.current;
    if (!wrap) return;

    let canvas = canvasRef.current;
    if (!canvas) return;

    let video = videoRef.current;
    let adopted = false;
    let adoptedEarlyCanvas = false;
    if (adoptSelector) {
      // Detached decode <video> created by public/hero-boot-v4.js (never in the DOM,
      // so it can't become an LCP candidate). Create it here if the boot script
      // has not run yet; the boot script then bails out.
      const w = window as Window & {
        __mgHeroVideo?: HTMLVideoElement;
        __mgHeroBootV?: HTMLVideoElement;
        __mgHeroAdopted?: boolean;
      };
      // From here React owns the paint loop; the boot script must not start its own.
      w.__mgHeroAdopted = true;
      let found: Element | null | undefined =
        w.__mgHeroVideo ??
        w.__mgHeroBootV ??
        document.querySelector(adoptSelector);
      if (!(found instanceof HTMLVideoElement)) {
        found = document.createElement('video');
        w.__mgHeroVideo = found as HTMLVideoElement;
      }
      video = found as HTMLVideoElement;
      videoRef.current = video;
      adopted = true;
      // Prefer classic early-paint canvas in place (do not move DOM — avoids #418).
      const early = document.querySelector('canvas.hero-early-canvas');
      if (early instanceof HTMLCanvasElement) {
        try {
          (
            window as Window & { __mgHeroEarlyStop?: () => void }
          ).__mgHeroEarlyStop?.();
        } catch {
          /* ignore */
        }
        // Hide the React-owned canvas; keep drawing on the SSR early canvas.
        canvas.style.display = 'none';
        canvas = early;
        canvasRef.current = early;
        adoptedEarlyCanvas = true;
        wrap.style.opacity = '1';
        if (early.dataset.ready === '1') {
          firstFrameRef.current = true;
        }
      }
    }
    if (!video) {
      onUnavailableRef.current?.();
      return;
    }

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
      // Keep early-paint ready state — never blank the canvas on adopt.
      if (resetFirstFrame && !adoptedEarlyCanvas) {
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
      const abs = new URL(next, window.location.href).href;
      const current = video.currentSrc || video.src || '';
      const attr = video.getAttribute('src') || '';
      // Reuse in-flight SSR fetch — never call load() when src already matches.
      if (
        current === abs ||
        (next && current.endsWith(next)) ||
        attr === next ||
        (next && attr.endsWith(next))
      ) {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          applyStartTime();
          syncPlay();
        }
        // else the loadedmetadata listener attached below will sync.
      } else {
        video.src = next;
        video.load();
      }
    };

    srcRef.current = src;
    loadSrc(src, true);

    // Early canvas already painted — notify parent without waiting another frame.
    if (adoptedEarlyCanvas && firstFrameRef.current) {
      canvas.dataset.ready = '1';
      onFirstFrameRef.current?.();
    }

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

    // Stall watchdog: WebKit (GStreamer) can report "playing" while currentTime
    // stops advancing right after start, with the file fully buffered. A
    // pause()+play() kick restarts the pipeline. Cheap: one check per 300 ms.
    let lastT = -1;
    let lastMove = performance.now();
    const stallTimer = window.setInterval(() => {
      if (
        !alive ||
        video.paused ||
        video.ended ||
        endedRef.current ||
        holdRef.current ||
        !visibleRef.current ||
        !pageVisibleRef.current
      ) {
        lastMove = performance.now();
        return;
      }
      const t = video.currentTime;
      if (t !== lastT) {
        lastT = t;
        lastMove = performance.now();
        return;
      }
      // Only kick when data is buffered ahead (a real network wait is not a stall).
      let ahead = false;
      const b = video.buffered;
      for (let i = 0; i < b.length; i++) {
        if (b.start(i) <= t && b.end(i) > t + 0.2) ahead = true;
      }
      if (ahead && performance.now() - lastMove > 450) {
        lastMove = performance.now();
        video.pause();
        void video.play().catch(() => {
          /* poster stays via onUnavailable on the main play path */
        });
      }
    }, 300);

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
      window.clearInterval(stallTimer);
      document.removeEventListener('visibilitychange', onVis);
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('ended', onVideoEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('playing', startUpload);
      video.pause();
      // Adopted SSR video stays in the DOM for remount; do not strip its src.
      if (!adopted) {
        video.removeAttribute('src');
        try {
          video.load();
        } catch {
          /* ignore */
        }
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
      {!adoptSelector ? (
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
      ) : null}
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
