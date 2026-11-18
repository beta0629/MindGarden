'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useEffectEvent,
} from 'react';

const SLOW_CONNECTION_TYPES = ['slow-2g', '2g', '3g'];
/** Mobile orbit video starts only after the page has settled (LCP + load). */
const VIDEO_IDLE_TIMEOUT_MS = 3500;

/**
 * Hero media panel per v1.3-home/web/IMPLEMENTATION.md:
 * poster LCP → (idle) mobile/tablet orbit video → desktop three.js WingFold + tilt.
 */
export function HeroMedia() {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  /** play() was rejected (iOS Low Power Mode / autoplay policy): show a tap-to-play control. */
  const [needsGesture, setNeedsGesture] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  /** Desired capability from viewport/motion prefs (still | video | 3d). */
  const [mode, setMode] = useState<'still' | 'video' | '3d'>('still');
  /** Mobile/tablet video mounts only after idle so it never races the LCP poster. */
  const [videoAllowed, setVideoAllowed] = useState(false);

  const resolveMode = useCallback(() => {
    if (typeof window === 'undefined') return 'still' as const;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'still' as const;
    }
    if (
      'connection' in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
    ) {
      return 'still' as const;
    }
    if (
      window.matchMedia(
        '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
      ).matches
    ) {
      return '3d' as const;
    }
    // Orbit video is ~0.5MB — keep the poster on constrained connections.
    const effectiveType = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection?.effectiveType;
    if (effectiveType && SLOW_CONNECTION_TYPES.includes(effectiveType)) {
      return 'still' as const;
    }
    return 'video' as const;
  }, []);

  const syncMode = useEffectEvent(() => {
    setMode(resolveMode());
  });

  useEffect(() => {
    syncMode();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia(
      '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
    );
    const onChange = () => syncMode();
    reduce.addEventListener('change', onChange);
    desktop.addEventListener('change', onChange);
    return () => {
      reduce.removeEventListener('change', onChange);
      desktop.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    const img = panelRef.current?.querySelector<HTMLImageElement>('.hero-still');
    if (img?.complete) {
      setPosterReady(true);
    }
  }, []);

  // Defer orbit video until the load event + idle — keeps LCP and first load on the poster.
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

  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video) {
      setNeedsGesture(false);
      return;
    }
    if (paused) {
      video.pause();
      return;
    }
    void tryPlay(video);
    return () => {
      // The <video> unmounts with React; pausing is enough and keeps <source> children intact.
      video.pause();
    };
  }, [showVideo, paused, tryPlay]);

  const handleGesturePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setPaused(false);
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
        } catch (err) {
          console.error('[hero-3d] mount failed', err);
        }
      })();
    };

    // Let the LCP poster paint before pulling three.js / GLB.
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(start, 800);
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
      className={`hero-media${paused ? ' is-paused' : ''}`}
    >
      <picture>
        <source
          type="image/avif"
          srcSet="/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w"
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 50vw"
        />
        <source
          type="image/webp"
          srcSet="/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w"
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 50vw"
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
          ref={videoRef}
          className="hero-loop"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/hero/hero-poster-1080.webp"
          aria-hidden="true"
          onPlaying={() => setNeedsGesture(false)}
        >
          <source src="/assets/hero/hero-orbit-loop.mp4" type="video/mp4" />
          <source
            src="/assets/hero/hero-orbit-loop.webm"
            type="video/webm"
          />
        </video>
      ) : null}

      <canvas ref={canvasRef} className="hero-3d" aria-hidden="true" />

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
