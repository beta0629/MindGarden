'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { dispatchHomeBootReady } from '@/components/home/homeBoot';
import { StackedAlphaVideo } from '@/components/home/v4/StackedAlphaVideo';
import {
  HERO_MOBILE_FRAME_TRANSFORM,
  heroStackSrc,
  packToV4Key,
} from '@/components/home/v4/assets';
import { whenHeroMayStart } from '@/components/home/v4/heroStartGate';
import { useBreakpointPack, usePrefersReducedMotion } from './v37/useBreakpointPack';
import { HeroPoster } from './HeroPoster';

/** Detached hero video started by public/hero-boot-v4.js — adopt to avoid a second fetch. */
export const HERO_STACKED_VIDEO_SELECTOR = '.hero-stacked-video';

type Props = {
  /**
   * When true, enhance an existing SSR `.hero-media` shell (poster already in DOM).
   * Used by HeroMediaLazy so the LCP poster is not owned by this client chunk.
   */
  enhanceOnly?: boolean;
};

type PortalTarget = {
  panel: HTMLElement;
  stage: HTMLElement;
};

function subscribeNoop() {
  return () => {};
}

function readHeroPortal(): PortalTarget | null {
  if (typeof document === 'undefined') return null;
  const panel = document.querySelector<HTMLElement>('.hero .hero-media');
  const stage = panel?.querySelector<HTMLElement>('.hero-media__stage');
  if (panel && stage) return { panel, stage };
  return null;
}

function finishBoot() {
  dispatchHomeBootReady();
}

/**
 * Hero media: SSR WebP poster → stacked-alpha H.264 loop (WebGL1).
 * Adopts the SSR `.hero-stacked-video` element (fetch already in flight).
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
  /** Mount the player only after the LCP poster has painted (see heroStartGate). */
  const [mayStart, setMayStart] = useState(false);
  /** Client snapshot — avoids setState-in-effect for the enhanceOnly portal. */
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const key = packToV4Key(pack);
  const src = heroStackSrc(key);
  const isMobilePack = pack === '390';

  const portalTarget =
    enhanceOnly && isClient ? readHeroPortal() : null;

  useEffect(() => {
    let cancelled = false;
    const img = document.querySelector<HTMLImageElement>('.hero .hero-still');
    void whenHeroMayStart(img).then(() => {
      if (!cancelled) setMayStart(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = enhanceOnly
      ? document.querySelector('.hero .hero-media')
      : panelRef.current;
    const img = root?.querySelector<HTMLImageElement>('.hero-still');
    if (img?.complete && img.naturalWidth > 0) {
      // Defer so we do not setState synchronously inside the effect body.
      const t = window.setTimeout(() => setPosterReady(true), 0);
      return () => window.clearTimeout(t);
    }
    if (!img) {
      const t = window.setTimeout(() => setPosterReady(true), 0);
      return () => window.clearTimeout(t);
    }
    const onLoad = () => setPosterReady(true);
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onLoad, { once: true });
    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onLoad);
    };
  }, [enhanceOnly, isClient]);

  useEffect(() => {
    if (!posterReady) return;
    if (reduced || failed || live) {
      finishBoot();
    }
  }, [posterReady, reduced, failed, live]);

  useEffect(() => {
    const panel = enhanceOnly
      ? document.querySelector<HTMLElement>('.hero .hero-media')
      : panelRef.current;
    if (!panel) return;
    panel.classList.toggle('is-paused', paused);
    panel.classList.toggle('is-video-playing', live);
    panel.classList.toggle('is-stacked-alpha', live && !failed && !reduced);
  }, [paused, live, failed, reduced, enhanceOnly, isClient]);

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
    !reduced && !failed && mayStart ? (
      <div className="hero-stacked" style={frameStyle}>
        <StackedAlphaVideo
          src={src}
          loop
          playing={!paused}
          autoPlay
          adoptSelector={HERO_STACKED_VIDEO_SELECTOR}
          onFirstFrame={() => {
            setLive(true);
          }}
          onUnavailable={() => {
            setFailed(true);
            setLive(false);
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
