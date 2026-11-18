'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useEffectEvent,
  type SyntheticEvent,
} from 'react';

const SLOW_CONNECTION_TYPES = ['slow-2g', '2g'];
/** Orbit video starts only after the page has settled (LCP + load) — fallback path. */
const VIDEO_IDLE_TIMEOUT_MS = 3500;
const DESKTOP_VIDEO_QUERY = '(min-width: 1024px)';
const HERO_VIDEO_SOURCES = {
  mobile: [
    { src: '/assets/hero/hero-orbit-loop.mp4', type: 'video/mp4' },
    { src: '/assets/hero/hero-orbit-loop.webm', type: 'video/webm' },
  ],
  desktop: [
    { src: '/assets/hero/hero-orbit-loop.desktop.mp4', type: 'video/mp4' },
    { src: '/assets/hero/hero-orbit-loop.desktop.webm', type: 'video/webm' },
  ],
} as const;
/** If no frame has played this long after load()+play(), show the tap-to-play fallback. */
const VIDEO_START_TIMEOUT_MS = 4000;
const HERO_POSTER_SIZES = '(max-width: 1023px) 100vw, 60vw';

/**
 * Hero media panel: poster LCP → live three.js WingFold (default) →
 * vivid orbit video / still as fallback (reduced-motion, saveData, WebGL failure).
 */
export function HeroMedia() {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  /** play() was rejected (iOS Low Power Mode / autoplay policy): show a tap-to-play control. */
  const [needsGesture, setNeedsGesture] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  /** First video frame is on screen; until then the poster stays visible (no black frame). */
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [inView, setInView] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  /** Desired capability from viewport/motion prefs (still | video | 3d). */
  const [mode, setMode] = useState<'still' | 'video' | '3d'>('still');
  /** WebGL/GLB mount failed — prefer vivid orbit video over a washed still. */
  const [threeFailed, setThreeFailed] = useState(false);
  /** Video mounts only after idle so it never races the LCP poster. */
  const [videoAllowed, setVideoAllowed] = useState(false);

  const resolveMode = useCallback((): 'still' | 'video' | '3d' => {
    if (typeof window === 'undefined') return 'still';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'still';
    }
    if (
      'connection' in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
    ) {
      return 'still';
    }
    const effectiveType = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection?.effectiveType;
    // Keep poster on very constrained links; 3g is fine for a ~200KB Draco GLB.
    if (effectiveType && SLOW_CONNECTION_TYPES.includes(effectiveType)) {
      return 'still';
    }
    if (threeFailed) {
      return 'video';
    }
    // Live GLB is the default on every viewport (NEXT_PUBLIC_HERO_3D=1 no longer required).
    return '3d';
  }, [threeFailed]);

  const syncMode = useEffectEvent(() => {
    setMode(resolveMode());
    setIsDesktop(window.matchMedia(DESKTOP_VIDEO_QUERY).matches);
  });

  useEffect(() => {
    syncMode();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia(DESKTOP_VIDEO_QUERY);
    const onChange = () => syncMode();
    reduce.addEventListener('change', onChange);
    wide.addEventListener('change', onChange);
    return () => {
      reduce.removeEventListener('change', onChange);
      wide.removeEventListener('change', onChange);
    };
  }, [threeFailed]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(panel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const img =
      panelRef.current?.querySelector<HTMLImageElement>('.hero-still');
    if (img?.complete) {
      setPosterReady(true);
    }
  }, []);

  // Defer orbit video until the load event + idle — fallback path only.
  useEffect(() => {
    if (mode !== 'video' || !posterReady) {
      setVideoAllowed(false);
      return;
    }
    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    const enable = () => {
      if (!cancelled) setVideoAllowed(true);
    };
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(enable, {
          timeout: VIDEO_IDLE_TIMEOUT_MS,
        });
      } else {
        timeoutId = window.setTimeout(enable, VIDEO_IDLE_TIMEOUT_MS);
      }
    };
    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [mode, posterReady]);

  const showVideo = mode === 'video' && videoAllowed;

  /** Late-mounted <video><source> can stay at readyState 0 / networkState NO_SOURCE in WebKit until load(). */
  const ensureLoaded = useCallback((video: HTMLVideoElement) => {
    if (
      video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
      !video.currentSrc
    ) {
      video.load();
    }
  }, []);

  const tryPlay = useCallback(async (video: HTMLVideoElement) => {
    // React only sets the muted *property*; iOS Safari autoplay needs the attribute too.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    try {
      await video.play();
      setNeedsGesture(false);
    } catch (err) {
      // AbortError = play() interrupted by pause()/load(); not an autoplay block.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNeedsGesture(true);
    }
  }, []);

  // Sources change with the viewport (mount / isDesktop): force the browser to pick one.
  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video) return;
    const sources = HERO_VIDEO_SOURCES[isDesktop ? 'desktop' : 'mobile'];
    const playable = sources.some(
      (source) => video.canPlayType(source.type) !== '',
    );
    if (!playable) {
      // e.g. Linux WebKit without H.264/VP9: never leave a silent still.
      setNeedsGesture(true);
      return;
    }
    video.load();
  }, [showVideo, isDesktop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video) {
      setNeedsGesture(false);
      setVideoPlaying(false);
      return;
    }
    if (paused || !inView) {
      video.pause();
      return;
    }
    void tryPlay(video);
    const watchdog = window.setTimeout(() => {
      const progressing =
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !video.paused &&
        video.currentTime > 0;
      if (!progressing) setNeedsGesture(true);
    }, VIDEO_START_TIMEOUT_MS);
    return () => {
      window.clearTimeout(watchdog);
      // The <video> unmounts with React; pausing is enough and keeps <source> children intact.
      video.pause();
    };
  }, [showVideo, paused, inView, isDesktop, tryPlay]);

  /** Source errors don't bubble: when the last candidate fails, no source is playable. */
  const handleSourceError = (event: SyntheticEvent<HTMLSourceElement>) => {
    if (event.currentTarget.nextElementSibling === null) setNeedsGesture(true);
  };

  const handleGesturePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setPaused(false);
    ensureLoaded(video);
    void tryPlay(video);
  };

  useEffect(() => {
    if (mode !== '3d' || !posterReady) return;
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;

    const ac = new AbortController();
    let cleanup: (() => void) | undefined;
    let idleId = 0;
    let timeoutId = 0;

    const start = () => {
      void (async () => {
        try {
          const { mountHero3D } = await import('./mountHero3D');
          if (ac.signal.aborted) return;
          cleanup = await mountHero3D({
            panel,
            canvas,
            signal: ac.signal,
          });
          if (ac.signal.aborted) {
            cleanup?.();
            return;
          }
          // is-3d is added asynchronously after the first painted frame + boot gate.
          // A successful mount must not be treated as failure while that reveal is pending.
        } catch (err) {
          console.error('[hero-3d] mount failed', err);
          if (!ac.signal.aborted) setThreeFailed(true);
        }
      })();
    };

    // Let the LCP poster paint; boot progress may already be warming the GLB.
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(start, 1200);
    }

    return () => {
      ac.abort();
      cleanup?.();
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [mode, posterReady]);

  const togglePause = () => {
    setPaused((v) => !v);
    if (mode === '3d') {
      const panel = panelRef.current;
      if (!panel) return;
      if (!paused) {
        panel.classList.add('is-paused');
      } else {
        panel.classList.remove('is-paused');
      }
    }
  };

  return (
    <div
      ref={panelRef}
      className={`hero-media${paused ? ' is-paused' : ''}${
        videoPlaying ? ' is-video-playing' : ''
      }`}
    >
      <div className="hero-media__stage">
        <picture>
          <source
            type="image/avif"
            srcSet="/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w"
            sizes={HERO_POSTER_SIZES}
          />
          <source
            type="image/webp"
            srcSet="/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w"
            sizes={HERO_POSTER_SIZES}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before three.js / video */}
          <img
            className="hero-still"
            src="/assets/hero/hero-poster-1080.webp"
            alt=""
            width={1620}
            height={940}
            decoding="sync"
            fetchPriority="high"
            onLoad={() => setPosterReady(true)}
          />
        </picture>

        {showVideo ? (
          <video
            key={isDesktop ? 'desktop' : 'mobile'}
            ref={videoRef}
            className="hero-loop"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/hero/hero-poster-1080.webp"
            aria-hidden="true"
            onError={() => setNeedsGesture(true)}
            onPlaying={() => {
              setNeedsGesture(false);
              setVideoPlaying(true);
            }}
          >
            {HERO_VIDEO_SOURCES[isDesktop ? 'desktop' : 'mobile'].map(
              (source) => (
                <source
                  key={source.src}
                  src={source.src}
                  type={source.type}
                  onError={handleSourceError}
                />
              ),
            )}
          </video>
        ) : null}

        <canvas ref={canvasRef} className="hero-3d" aria-hidden="true" />
      </div>

      {showVideo && needsGesture ? (
        <button
          type="button"
          className="hero__play"
          aria-label="영상 재생"
          onClick={handleGesturePlay}
        >
          <span aria-hidden="true">▶</span>
        </button>
      ) : null}

      {mode !== 'still' && (mode === '3d' || showVideo) && !needsGesture ? (
        <button
          type="button"
          className="hero__pause"
          aria-label={paused ? '재생' : '일시정지'}
          onClick={togglePause}
        >
          {paused ? '▶' : '❚❚'}
        </button>
      ) : null}
    </div>
  );
}
