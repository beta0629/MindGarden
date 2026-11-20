'use client';

import {
  useEffect,
  useRef,
  useState,
  useEffectEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';
import { StackedAlphaVideo } from '@/components/home/v4/StackedAlphaVideo';
import {
  HERO_MOBILE_FRAME_TRANSFORM,
  heroStackSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
import { startSequentialScenePreload } from '@/components/home/v4/preloadScenes';
import { useBreakpointPack, usePrefersReducedMotion } from './v37/useBreakpointPack';
import { HeroPoster } from './HeroPoster';

type Props = {
  /**
   * When true, enhance an existing SSR `.hero-media` shell (poster already in DOM).
   * Used by HeroMediaLazy so the LCP poster is not owned by this client chunk.
   */
  enhanceOnly?: boolean;
};

/**
 * Hero media: SSR WebP poster → stacked-alpha H.264 loop (WebGL1).
 * Reduced-motion / autoplay reject / WebGL fail → keep poster (no console errors).
 */
export function HeroMedia({ enhanceOnly = false }: Props) {
  const pack = useBreakpointPack();
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [portalTarget, setPortalTarget] = useState<{
    panel: HTMLElement;
    stage: HTMLElement;
  } | null>(null);

  const key = packToV4Key(pack);
  const src = heroStackSrc(key);
  const isMobilePack = pack === '390';

  useEffect(() => {
    if (!enhanceOnly) return;
    const panel = document.querySelector<HTMLElement>('.hero .hero-media');
    const stage = panel?.querySelector<HTMLElement>('.hero-media__stage');
    if (panel && stage) {
      panelRef.current = panel as HTMLDivElement;
      stageRef.current = stage as HTMLDivElement;
      setPortalTarget({ panel, stage });
    }
  }, [enhanceOnly]);

  useEffect(() => {
    const root = enhanceOnly
      ? document.querySelector('.hero .hero-media')
      : panelRef.current;
    const img = root?.querySelector<HTMLImageElement>('.hero-still');
    if (img?.complete && img.naturalWidth > 0) {
      setPosterReady(true);
      return;
    }
    if (!img) {
      setPosterReady(true);
      return;
    }
    const onLoad = () => setPosterReady(true);
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onLoad, { once: true });
    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onLoad);
    };
  }, [enhanceOnly, portalTarget]);

  const finishBoot = useEffectEvent(() => {
    dispatchHomeBootReady();
    void startSequentialScenePreload();
  });

  useEffect(() => {
    if (!posterReady) return;
    if (reduced || failed) {
      finishBoot();
    }
  }, [posterReady, reduced, failed]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.classList.toggle('is-paused', paused);
    panel.classList.toggle('is-video-playing', live);
    panel.classList.toggle('is-stacked-alpha', live && !failed && !reduced);
  }, [paused, live, failed, reduced, portalTarget]);

  const togglePause = () => setPaused((v) => !v);

  const frameStyle =
    isMobilePack && !reduced
      ? {
          position: 'absolute' as const,
          inset: 0,
          width: '100%',
          height: '100%',
          transform: HERO_MOBILE_FRAME_TRANSFORM,
          transformOrigin: '50% 50%',
        }
      : {
          position: 'absolute' as const,
          inset: 0,
          width: '100%',
          height: '100%',
        };

  const stageExtras =
    !reduced && !failed ? (
      <div className="hero-stacked" style={frameStyle}>
        <StackedAlphaVideo
          src={src}
          loop
          playing={!paused}
          autoPlay
          onFirstFrame={() => {
            setLive(true);
            finishBoot();
          }}
          onUnavailable={() => {
            setFailed(true);
            setLive(false);
            finishBoot();
          }}
        />
      </div>
    ) : null;

  const controls =
    !reduced && !failed && live ? (
      <button
        type="button"
        className="hero__pause"
        aria-label={paused ? '재생' : '일시정지'}
        onClick={togglePause}
      >
        {paused ? '▶' : '❚❚'}
      </button>
    ) : null;

  if (enhanceOnly) {
    if (!portalTarget) return null;
    return (
      <>
        {createPortal(stageExtras, portalTarget.stage)}
        {createPortal(controls, portalTarget.panel)}
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`hero-media${paused ? ' is-paused' : ''}${
        live ? ' is-video-playing is-stacked-alpha' : ''
      }`}
    >
      <div className="hero-media__stage" ref={stageRef}>
        <HeroPoster />
        {stageExtras}
      </div>
      {controls}
    </div>
  );
}
