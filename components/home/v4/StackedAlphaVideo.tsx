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
  /** Pause, seek to 0, and draw the first frame. Clears ended/hold so play() can restart. */
  reset: () => void;
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
  /**
   * Fetch `src` into a Blob and assign an object URL so seeking (reset to
   * frame 0) works when the HTTP server ignores Range (Workers static assets).
   * Play-once/loop (hero, booking) leave this off and keep the plain URL.
   */
  blobSrc?: boolean;
  /**
   * If set, treat this time (seconds) as the clip end: hold-last stops here,
   * and ping-pong turns around here (bench butterflies fade out after 2.8s).
   */
  holdAt?: number;
  /**
   * While playing, ping-pong at 1x between 0 and `holdAt` (or duration):
   * native play forward, then seek-draw reverse (blob URLs are seekable).
   * Smoother than a hard restart, which would snap the last frame to 0.
   */
  pingPong?: boolean;
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
    blobSrc = false,
    holdAt,
    pingPong = false,
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
  const blobSrcRef = useRef(blobSrc);
  const holdAtRef = useRef(holdAt);
  const pingPongRef = useRef(pingPong);
  const pingPongDirRef = useRef<'fwd' | 'rev'>('fwd');
  const reverseRafRef = useRef(0);
  const seekAndDrawRef = useRef<(timeS: number) => void>(() => {});
  const syncPlayRef = useRef<() => void>(() => {});
  const stopReverseRef = useRef<() => void>(() => {});
  const playingRef = useRef(playing);
  const autoPlayRef = useRef(autoPlay);
  const onEndedRef = useRef(onEnded);
  const onFirstFrameRef = useRef(onFirstFrame);
  const onUnavailableRef = useRef(onUnavailable);
  const blobUrlRef = useRef<string | null>(null);
  const blobHttpSrcRef = useRef('');
  const fetchAbortRef = useRef<AbortController | null>(null);
  const loadSrcRef = useRef<(next: string, resetFirstFrame: boolean) => void>(
    () => {},
  );

  loopRef.current = loop;
  playOnceRef.current = playOnce;
  holdLastRef.current = holdLast;
  hideOnEndedRef.current = hideOnEnded;
  startTimeRef.current = startTime;
  blobSrcRef.current = blobSrc;
  holdAtRef.current = holdAt;
  pingPongRef.current = pingPong;
  // playing/autoPlay are synced in the prop effect so imperative play()
  // (gate/bench pass playing={false} autoPlay={false}) is not clobbered
  // on unrelated re-renders.
  onEndedRef.current = onEnded;
  onFirstFrameRef.current = onFirstFrame;
  onUnavailableRef.current = onUnavailable;

  useImperativeHandle(ref, () => ({
    seek: (timeS: number) => {
      seekAndDrawRef.current(timeS);
    },
    play: () => {
      endedRef.current = false;
      holdRef.current = false;
      pingPongDirRef.current = 'fwd';
      stopReverseRef.current();
      playingRef.current = true;
      autoPlayRef.current = true;
      syncPlayRef.current();
    },
    pause: () => {
      playingRef.current = false;
      stopReverseRef.current();
      videoRef.current?.pause();
    },
    reset: () => {
      endedRef.current = false;
      holdRef.current = false;
      pingPongDirRef.current = 'fwd';
      playingRef.current = false;
      stopReverseRef.current();
      seekAndDrawRef.current(0);
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

    /**
     * After `ended`, Chromium leaves currentTime at duration. Seeking
     * `duration - 1/60` on these single-GOP (I-frame at 0) clips rewinds to
     * t=0 instead, so later draws must not re-sample a rewound element.
     */
    const holdDeadlineS = () => {
      const d = video.duration;
      const cap = holdAtRef.current;
      if (cap != null && Number.isFinite(cap) && cap > 0) {
        if (d && Number.isFinite(d)) return Math.min(cap, d);
        return cap;
      }
      return d && Number.isFinite(d) ? d : null;
    };

    const holdFrameStillPresent = () => {
      if (!holdRef.current) return false;
      const end = holdDeadlineS();
      if (end == null) return false;
      return video.currentTime >= end - 2 / 60;
    };

    const reachedHoldAt = () => {
      if (endedRef.current || holdRef.current) return false;
      const cap = holdAtRef.current;
      if (cap == null || !Number.isFinite(cap) || cap <= 0) return false;
      const end = holdDeadlineS();
      if (end == null) return false;
      return video.currentTime >= end - 1 / 120;
    };

    const reachedPingPongEnd = () => {
      if (!pingPongRef.current) return false;
      if (pingPongDirRef.current !== 'fwd') return false;
      if (endedRef.current || holdRef.current) return false;
      const end = holdDeadlineS();
      if (end == null) return false;
      return video.currentTime >= end - 1 / 120;
    };

    const stopReverse = () => {
      if (reverseRafRef.current) {
        cancelAnimationFrame(reverseRafRef.current);
        reverseRafRef.current = 0;
      }
    };
    stopReverseRef.current = stopReverse;

    let reverseLast = 0;
    const startReverse = () => {
      if (!alive || !pingPongRef.current) return;
      pingPongDirRef.current = 'rev';
      endedRef.current = false;
      holdRef.current = false;
      video.pause();
      stopUpload();
      if (reverseRafRef.current) return;
      reverseLast = performance.now();
      // Track media time ourselves: in-flight seeks leave currentTime stale,
      // so subtracting dt from currentTime would crawl slower than 1x.
      let mediaT = video.currentTime;
      const tick = (now: number) => {
        if (
          !alive ||
          pingPongDirRef.current !== 'rev' ||
          !playingRef.current
        ) {
          reverseRafRef.current = 0;
          return;
        }
        if (!pageVisibleRef.current || !visibleRef.current) {
          reverseRafRef.current = 0;
          return;
        }
        const dt = Math.min(0.08, Math.max(0, (now - reverseLast) / 1000));
        reverseLast = now;
        mediaT = Math.max(0, mediaT - dt);
        seekAndDrawRef.current(mediaT);
        if (mediaT <= 1 / 120) {
          reverseRafRef.current = 0;
          pingPongDirRef.current = 'fwd';
          endedRef.current = false;
          holdRef.current = false;
          syncPlayRef.current();
          return;
        }
        reverseRafRef.current = requestAnimationFrame(tick);
      };
      reverseRafRef.current = requestAnimationFrame(tick);
    };

    const holdNow = () => {
      if (!alive || endedRef.current) return;
      endedRef.current = true;
      if (holdLastRef.current) {
        holdRef.current = true;
        video.pause();
        stopUpload();
        drawOnce();
      } else {
        stopUpload();
        video.pause();
      }
      onEndedRef.current?.();
    };

    const drawHoldSafe = () => {
      if (holdRef.current && !holdFrameStillPresent()) return;
      drawOnce();
    };

    const pumpRvfc = () => {
      const v = video as RvfcVideo;
      if (!v.requestVideoFrameCallback) return false;
      const tick = () => {
        if (!alive) return;
        if (shouldUpload()) {
          drawOnce();
          if (reachedPingPongEnd()) {
            startReverse();
            return;
          }
          if (reachedHoldAt()) {
            holdNow();
            return;
          }
          rvfcIdRef.current = v.requestVideoFrameCallback!(tick);
        } else {
          uploadingRef.current = false;
          rvfcIdRef.current = 0;
          if (holdRef.current) drawHoldSafe();
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
          if (reachedPingPongEnd()) {
            startReverse();
            return;
          }
          if (reachedHoldAt()) {
            holdNow();
            return;
          }
          rafIdRef.current = requestAnimationFrame(tick);
        } else {
          uploadingRef.current = false;
          rafIdRef.current = 0;
          if (holdRef.current) drawHoldSafe();
        }
      };
      uploadingRef.current = true;
      rafIdRef.current = requestAnimationFrame(tick);
    };

    const startUpload = () => {
      if (uploadingRef.current || !alive) return;
      if (!shouldUpload() && !holdFrameStillPresent()) return;
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
      if (want && pingPongRef.current && pingPongDirRef.current === 'rev') {
        startReverse();
        return;
      }
      if (want) {
        stopReverse();
        pingPongDirRef.current = 'fwd';
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
        stopReverse();
        video.pause();
        stopUpload();
        if (holdRef.current) drawHoldSafe();
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

    let seekInFlight = false;
    let pendingSeek: number | null = null;

    const seekAndDraw = (timeS: number) => {
      if (!alive) return;
      video.pause();
      stopUpload();
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const d = video.duration;
      const max = d && Number.isFinite(d) && d > 0 ? d : timeS;
      const t = timeS <= 0 ? 0 : Math.min(timeS, Math.max(0, max - 1e-4));
      if (seekInFlight) {
        pendingSeek = t;
        return;
      }
      if (Math.abs(video.currentTime - t) < 5e-4) {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) drawOnce();
        return;
      }
      seekInFlight = true;
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        seekInFlight = false;
        if (!alive) return;
        drawOnce();
        if (pendingSeek !== null) {
          const next = pendingSeek;
          pendingSeek = null;
          if (Math.abs(video.currentTime - next) >= 5e-4) {
            seekInFlight = true;
            video.addEventListener('seeked', onSeeked);
            try {
              video.currentTime = next;
            } catch {
              seekInFlight = false;
            }
            return;
          }
        }
      };
      video.addEventListener('seeked', onSeeked);
      try {
        video.currentTime = t;
      } catch {
        seekInFlight = false;
        video.removeEventListener('seeked', onSeeked);
        return;
      }
      // GOP-4 seeks on a buffered clip may apply synchronously and skip 'seeked'.
      if (
        Math.abs(video.currentTime - t) < 5e-4 &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        video.removeEventListener('seeked', onSeeked);
        seekInFlight = false;
        drawOnce();
      }
    };
    seekAndDrawRef.current = seekAndDraw;
    syncPlayRef.current = syncPlay;

    const onVideoEnded = () => {
      if (!alive) return;
      if (pingPongRef.current && playingRef.current) {
        startReverse();
        return;
      }
      if (loopRef.current && !playOnceRef.current) return;
      // Hold the last decoded frame as-is. Seeking duration-1/60 can snap
      // some clips back to t=0; holdFrameStillPresent guards later draws.
      endedRef.current = true;
      if (holdLastRef.current) {
        holdRef.current = true;
        video.pause();
        stopUpload();
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

    const abortFetch = () => {
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = null;
    };

    const revokeBlobUrl = () => {
      const url = blobUrlRef.current;
      blobUrlRef.current = null;
      blobHttpSrcRef.current = '';
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      }
    };

    const assignHttpSrc = (next: string) => {
      const abs = new URL(next, window.location.href).href;
      const current = video.currentSrc || video.src || '';
      const attr = video.getAttribute('src') || '';
      // Reuse in-flight SSR fetch — never call load() when src already matches.
      if (
        current === abs ||
        current.endsWith(next) ||
        attr === next ||
        attr.endsWith(next)
      ) {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          applyStartTime();
          syncPlay();
        }
        return;
      }
      video.src = next;
      video.load();
    };

    const assignBlobSrc = (next: string) => {
      const abs = new URL(next, window.location.href).href;
      if (
        blobHttpSrcRef.current === abs &&
        video.src.startsWith('blob:') &&
        video.readyState >= HTMLMediaElement.HAVE_METADATA
      ) {
        applyStartTime();
        syncPlay();
        return;
      }
      abortFetch();
      const ac = new AbortController();
      fetchAbortRef.current = ac;
      void (async () => {
        try {
          const res = await fetch(abs, {
            signal: ac.signal,
            credentials: 'same-origin',
          });
          if (!res.ok) throw new Error('unavailable');
          const blob = await res.blob();
          if (!alive || ac.signal.aborted || srcRef.current !== next) return;
          const media =
            blob.type.startsWith('video/')
              ? blob
              : new Blob([blob], { type: 'video/mp4' });
          const objectUrl = URL.createObjectURL(media);
          revokeBlobUrl();
          blobUrlRef.current = objectUrl;
          blobHttpSrcRef.current = abs;
          video.src = objectUrl;
          video.load();
        } catch (err) {
          if (
            !alive ||
            ac.signal.aborted ||
            (err instanceof DOMException && err.name === 'AbortError')
          ) {
            return;
          }
          revokeBlobUrl();
          if (!adopted) {
            video.removeAttribute('src');
          }
          onUnavailableRef.current?.();
        }
      })();
    };

    const loadSrc = (next: string, resetFirstFrame: boolean) => {
      endedRef.current = false;
      holdRef.current = false;
      stopUpload();
      if (!next) {
        abortFetch();
        if (!adopted) {
          video.removeAttribute('src');
          revokeBlobUrl();
        }
        return;
      }
      // Keep early-paint ready state — never blank the canvas on adopt.
      if (resetFirstFrame && !adoptedEarlyCanvas) {
        firstFrameRef.current = false;
        canvas.dataset.ready = '0';
      }
      canvas.dataset.hidden = '0';
      canvas.style.removeProperty('opacity');
      video.loop =
        loopRef.current && !playOnceRef.current && !pingPongRef.current;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      // A seekable source is required to reset to frame 0. Workers static
      // assets ignore Range (200 + no Accept-Ranges), so Chromium reports
      // seekable=[0,0] on the HTTP URL; a blob: object URL of the same bytes
      // is seekable. Play-once/loop (hero, booking) keep the plain URL.
      // Fetch uses the same URL so the HTTP cache still applies; the object
      // URL is revoked on swap/unmount.
      if (blobSrcRef.current && !adopted) {
        assignBlobSrc(next);
      } else {
        assignHttpSrc(next);
      }
    };
    loadSrcRef.current = loadSrc;

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
                stopReverse();
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
        stopReverse();
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
            if (holdRef.current) drawHoldSafe();
            else if (firstFrameRef.current) drawOnce();
          })
        : null;
    ro?.observe(wrap);

    return () => {
      alive = false;
      stopReverse();
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
      abortFetch();
      if (!adopted) {
        video.removeAttribute('src');
        try {
          video.load();
        } catch {
          /* ignore */
        }
        revokeBlobUrl();
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
    pingPongRef.current = pingPong;

    if (prev === src) {
      video.loop = loop && !playOnce && !pingPong;
      return;
    }

    // Keep last drawn pixels until the new clip's first frame (seamless swap).
    loadSrcRef.current(src, true);
  }, [src, loop, playOnce, holdLast, hideOnEnded, startTime, pingPong]);

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
