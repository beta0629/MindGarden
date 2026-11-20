/**
 * Classic inline script — picks hero d/m stack src on `.hero-stacked-video`.
 * Under prefers-reduced-motion: reduce, remove the video immediately (0 mp4).
 * HeroMediaLazy still cleans up after hydrate as backup.
 */
export function HeroVideoInline() {
  const js = `(function(){try{var v=document.querySelector('.hero-stacked-video');if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){if(v)v.remove();document.querySelectorAll('.hero-early-canvas,.hero-early-root').forEach(function(el){el.remove();});return;}if(!v)return;var src=window.matchMedia('(min-width: 768px)').matches?'/assets/v4-60fps/hero/hero-d-stack.mp4':'/assets/v4-60fps/hero/hero-m-stack.mp4';v.muted=true;v.defaultMuted=true;v.playsInline=true;v.autoplay=true;v.loop=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('autoplay','');v.setAttribute('loop','');if((v.currentSrc||v.getAttribute('src')||'').indexOf(src)===-1){v.src=src;}var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}})();`;

  return (
    <script
      // Immediate classic script — must not be type=module / deferred by React.
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
