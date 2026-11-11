'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useEffectEvent,
} from 'react';

/**
 * Hero media panel per v1.3-home/web/IMPLEMENTATION.md:
 * poster LCP → mobile/tablet orbit video → desktop three.js WingFold + tilt.
 */
export function HeroMedia() {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [mode, setMode] = useState<'still' | 'video' | '3d'>('still');

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
    const video = videoRef.current;
    if (!video) return;

    if (mode !== 'video' || paused) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  }, [mode, paused]);

  useEffect(() => {
    if (mode !== 'still') return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach((s) => s.remove());
    video.load();
  }, [mode]);

  useEffect(() => {
    const img = panelRef.current?.querySelector<HTMLImageElement>('.hero-still');
    if (img?.complete) {
      setPosterReady(true);
    }
  }, []);

  useEffect(() => {
    if (mode !== '3d' || !posterReady) return;
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;

    const ac = new AbortController();
    let cleanup: (() => void) | undefined;

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

    return () => {
      ac.abort();
      cleanup?.();
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
      className={`hero-media${mode === '3d' ? '' : ''}${paused ? ' is-paused' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before three.js */}
      <img
        className="hero-still"
        src="/assets/hero/hero-poster.webp"
        srcSet="/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w"
        sizes="(max-width: 1023px) 100vw, 50vw"
        alt=""
        width={1620}
        height={940}
        decoding="async"
        fetchPriority="high"
        onLoad={() => setPosterReady(true)}
      />

      {mode === 'video' ? (
        <video
          ref={videoRef}
          className="hero-loop"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/hero/hero-poster.webp"
          aria-hidden="true"
        >
          <source
            src="/assets/hero/hero-orbit-loop.webm"
            type="video/webm"
          />
          <source src="/assets/hero/hero-orbit-loop.mp4" type="video/mp4" />
        </video>
      ) : null}

      <canvas ref={canvasRef} className="hero-3d" aria-hidden="true" />

      {mode !== 'still' ? (
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
