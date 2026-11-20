/**
 * Tiny classic inline script right after the hero markup. Non-Chromium only
 * (WebKit/Safari, Firefox: no Lighthouse, and the async boot script runs late
 * there): creates the detached hero <video> and starts the mp4 as soon as the
 * LCP poster has loaded. Chromium waits for the poster's LCP entry instead
 * (public/hero-boot-v4.js + heroStartGate.ts). Reduced-motion: no-op.
 */
export function HeroVideoInline() {
  const js = `(function(){try{if(navigator.userAgentData||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var img=document.querySelector('.hero .hero-still');var go=function(){if(window.__mgHeroBootV||window.__mgHeroVideo)return;var v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.loop=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');v.src=window.matchMedia('(min-width: 768px)').matches?'/assets/v4-60fps/hero/hero-d-stack.mp4':'/assets/v4-60fps/hero/hero-m-stack.mp4';window.__mgHeroBootV=v;var p=v.play();if(p&&p.catch)p.catch(function(){});};if(!img||(img.complete&&img.naturalWidth>0))go();else{img.addEventListener('load',go,{once:true});img.addEventListener('error',go,{once:true});}}catch(e){}})();`;

  return (
    <script
      // Immediate classic script — must not be type=module / deferred by React.
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
