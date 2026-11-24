/**
 * Hero boot (public/hero-boot-v4.js, async): sets the d/m stack src + stacked-alpha
 * early paint once the LCP poster has loaded and painted. Kept out of the HTML so the
 * document (and its RSC copy of inline scripts) stays inside the first TCP window.
 * Reduced-motion: the script is a no-op; CSS hides the SSR nodes.
 * GLSL must stay in sync with stackedAlphaShader.ts.
 *
 * First-visit loader: do not fetch or evaluate the boot script until the overlay
 * has handed off. Decoding the hero video and uploading its WebGL texture during
 * the overlay was a long main-thread task that inflated TBT. The FLIP end rect
 * is measured from the already-laid-out hero frame box.
 */
const BOOT_SRC = '/hero-boot-v4.js';

const GATE_JS = `(function(){function load(){if(document.getElementById('mg-hero-video-boot'))return;var s=document.createElement('script');s.id='mg-hero-video-boot';s.src=${JSON.stringify(BOOT_SRC)};s.async=true;document.head.appendChild(s);}function releasePoster(){document.documentElement.classList.remove('mg-await-hero');}function watchFrame(){function go(){if(document.querySelector('canvas.hero-early-canvas[data-ready="1"], .hero-stacked canvas[data-ready="1"]')){releasePoster();return true;}return false;}if(go())return;var mo=new MutationObserver(function(){if(go())mo.disconnect();});mo.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-ready','class']});setTimeout(function(){mo.disconnect();releasePoster();},8000);}if(document.documentElement.classList.contains('mg-loading')){window.addEventListener('mg-loader-done',function(){load();watchFrame();},{once:true});}else{load();}})();`;

export function HeroVideoBootHead() {
  return (
    <script
      id="mg-hero-boot-gate"
      dangerouslySetInnerHTML={{ __html: GATE_JS }}
    />
  );
}
