import {
  SCENES_READY_STORAGE_KEY,
  sceneCacheSignature,
} from '@/components/home/v4/sceneCache';

/**
 * Head script: on `/` only, if the scene cache flag is missing or stale,
 * inject the sand loader before first paint so the page does not flash.
 * Progress, FLIP, and teardown are owned by FirstVisitLoader.
 */
const LOADER_CSS = `#mg-load{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:max(24px,env(safe-area-inset-top,0px)) max(24px,env(safe-area-inset-right,0px)) max(24px,env(safe-area-inset-bottom,0px)) max(24px,env(safe-area-inset-left,0px));font-family:"Apple SD Gothic Neo","Noto Sans CJK KR","Malgun Gothic","Apple Gothic",sans-serif;-webkit-font-smoothing:antialiased}
#mg-load .bg{position:absolute;inset:0;background:#EAE2D2;z-index:-1}
#mg-load .c{display:flex;flex-direction:column;align-items:center;width:min(100%,20em);transform:translateY(-24px)}
#mg-load .m{width:85.24px;height:64px}
#mg-load .m svg{width:100%;height:100%;overflow:visible;display:block}
#mg-load .t{margin-top:24px;color:#4A5261;font-weight:400;font-size:16px;line-height:26px;letter-spacing:0;word-break:keep-all;text-align:center}
@media(min-width:1440px){#mg-load .t{font-size:17px;line-height:28px}}
#mg-load .b{margin-top:32px;width:160px;height:8px;position:relative}
@media(min-width:768px){#mg-load .b{width:200px}}
#mg-load .bt{position:absolute;inset:0;border:1px solid #857B69;border-radius:999px;pointer-events:none}
#mg-load .bf{position:absolute;left:1px;top:1px;bottom:1px;width:calc((100% - 2px)*var(--p,0)/100);background:#2F5B45;border-radius:999px;transition:width .4s cubic-bezier(.2,0,0,1);pointer-events:none}
#mg-load .pct{display:none;margin-top:8px;color:#5E6572;font-weight:400;font-size:14px;line-height:22px;font-variant-numeric:tabular-nums;letter-spacing:0}
#mg-load .wl,#mg-load .wr{transform-box:fill-box}
#mg-load .wl{transform-origin:100% 62%}
#mg-load .wr{transform-origin:0 62%}
#mg-load.is-in .wl{animation:mgwl .6s cubic-bezier(.22,1,.36,1) 1 both}
#mg-load.is-in .wr{animation:mgwr .6s cubic-bezier(.22,1,.36,1) 1 both}
@keyframes mgwl{0%{transform:rotate(0)}40%{transform:rotate(8deg)}100%{transform:rotate(0)}}
@keyframes mgwr{0%{transform:rotate(0)}40%{transform:rotate(-8deg)}100%{transform:rotate(0)}}
#mg-load.is-flip .t,#mg-load.is-flip .b,#mg-load.is-flip .pct{opacity:0;transition:opacity .2s cubic-bezier(.4,0,1,1)}
#mg-load.is-out .bg{opacity:0;transition:opacity .6s cubic-bezier(.4,0,1,1)}
#mg-load.is-out-rm .bg,#mg-load.is-out-rm .c{opacity:0;transition:opacity .1s linear}
#mg-load .vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
html.mg-loading{overflow:hidden}
html.mg-loading.mg-motion:not(.mg-hero-reveal) .hero-early-canvas,
html.mg-loading.mg-motion:not(.mg-hero-reveal) .hero-stacked{opacity:0}
html.mg-hero-reveal .hero-early-canvas,
html.mg-hero-reveal .hero-stacked{opacity:1;transition:opacity .2s linear}
@media(prefers-reduced-motion:reduce){#mg-load .wl,#mg-load .wr{animation:none!important}#mg-load .bf{transition:none}#mg-load .pct{display:block}}`;

const LOADER_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="32.679 229.599 538.172 404.056" fill="none" role="img" aria-hidden="true"><defs><linearGradient id="mg-load-g0" x1="0.11213" y1="0.26592" x2="0.9784" y2="0.65928"><stop offset="0" stop-color="#ffd900"/><stop offset="0.27" stop-color="#fac119"/><stop offset="1" stop-color="#ef845c"/></linearGradient><linearGradient id="mg-load-g1" x1="0.10958" y1="0.6656" x2="0.93338" y2="0.26738"><stop offset="0" stop-color="#f39737"/><stop offset="0.68" stop-color="#ed705d"/><stop offset="1" stop-color="#e95377"/></linearGradient><linearGradient id="mg-load-g2" x1="0.10105" y1="0.6284" x2="0.95112" y2="0.21361"><stop offset="0" stop-color="#00b1a9"/><stop offset="1" stop-color="#70529f"/></linearGradient><linearGradient id="mg-load-g3" x1="0.15732" y1="0.31123" x2="0.9936" y2="0.71551"><stop offset="0" stop-color="#70529f"/><stop offset="0.02" stop-color="#6d569f"/><stop offset="0.16" stop-color="#5f70a5"/><stop offset="0.28" stop-color="#5680a8"/><stop offset="0.38" stop-color="#5386aa"/><stop offset="0.99" stop-color="#00b1a9"/></linearGradient><linearGradient id="mg-load-g4" x1="0.00033" y1="0.50005" x2="1" y2="0.50005"><stop offset="0" stop-color="#ef845c"/><stop offset="0.21" stop-color="#ef8757"/><stop offset="0.42" stop-color="#f1924b"/><stop offset="0.63" stop-color="#f5a537"/><stop offset="0.83" stop-color="#fabf1b"/><stop offset="1" stop-color="#ffd900"/></linearGradient><linearGradient id="mg-load-g5" x1="0.00031" y1="0.50001" x2="0.99998" y2="0.50001"><stop offset="0" stop-color="#00b1a9"/><stop offset="0.23" stop-color="#2c8ba5"/><stop offset="0.46" stop-color="#516ca1"/><stop offset="0.64" stop-color="#67599f"/><stop offset="0.76" stop-color="#70529f"/></linearGradient></defs><g class="mark"><g class="wl"><path fill="url(#mg-load-g0)" d="m296 449.46s4.38-138.68-152.93-202.82c-17.53-7.66-40.56-19.73-83.33-13.15c-15.35 3.28-27.42 16.45-24.68 31.24c0.27 4.38 1.64 20 18.09 43.31c16.45 23.3 18.36 36.72 20.02 52.07c1.64 15.35-4.67 78.39 114.3 96.75c0 0 110.37 14.81 87.71 107.03c13.62-27.4 23.24-64.74 20.81-114.44l0 0.02z"/><path fill="url(#mg-load-g1)" d="m187.46 456.88s-50.99 25.86-54.65 54.36c-3.66 28.5 4.03 38.36 16.08 53.71c12.07 15.35 18.63 22.29 24.11 49.33c3.28 16.45 21.56 21.56 40.94 13.89c11.59-4.59 40.9-23.35 61.23-64.26c22.64-92.22-87.71-107.03-87.71-107.03z"/><path fill="url(#mg-load-g4)" d="m246.3 271.13c33.63 23.76 49.14 82.77 49.14 82.77c-5.67-64.14-45.13-99.59-53.36-104.33c-8.22-4.76-12.98 2.02-12.98 2.02c-5.48 12.42 14.81 18.09 17.18 19.55l0.02 0z"/></g><g class="wr"><path fill="url(#mg-load-g2)" d="m307.55 449.46s-4.38-138.68 152.93-202.82c17.53-7.66 40.56-19.73 83.31-13.15c15.35 3.28 27.42 16.45 24.68 31.24c-0.27 4.38-1.64 20-18.09 43.31c-16.45 23.3-18.36 36.72-20 52.07c-1.64 15.35 4.65 78.39-114.3 96.75c0 0-110.35 14.81-87.71 107.03c-13.62-27.4-23.24-64.74-20.81-114.44l0 0.02z"/><path fill="url(#mg-load-g3)" d="m416.1 456.88s50.99 25.86 54.65 54.36c3.66 28.5-4.03 38.36-16.08 53.71c-12.07 15.35-18.63 22.29-24.11 49.33c-3.3 16.45-21.56 21.56-40.94 13.89c-11.61-4.59-40.9-23.35-61.23-64.26c-22.64-92.22 87.71-107.03 87.71-107.03z"/><path fill="url(#mg-load-g5)" d="m357.25 271.13c2.37-1.45 22.66-7.12 17.18-19.55c0 0-4.76-6.75-12.98-2.02c-8.22 4.76-47.69 40.19-53.36 104.33c0 0 15.54-59.03 49.16-82.77z"/></g></g></svg>`;

const LOADER_HTML = `<div class="bg" aria-hidden="true"></div><div class="c"><div class="m">${LOADER_MARK}</div><p class="t" id="mg-load-copy">잠시만요, 정원을 열고 있어요</p><div class="b"><div class="bt" aria-hidden="true"></div><div class="bf" aria-hidden="true"></div><div class="vh" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-labelledby="mg-load-copy"></div></div><p class="pct" aria-hidden="true">0%</p></div><div class="vh" aria-live="polite" aria-atomic="true"></div>`;

export function FirstVisitLoaderInline() {
  const sig = sceneCacheSignature();
  const js = `(function(){try{var p=location.pathname;if(p!=='/'&&p!=='')return;var key=${JSON.stringify(SCENES_READY_STORAGE_KEY)};var sig=${JSON.stringify(sig)};try{if(localStorage.getItem(key)===sig)return;}catch(e){}var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var html=document.documentElement;html.classList.add('mg-loading');if(!reduced)html.classList.add('mg-motion');window.__mgHoldHero=true;if(document.getElementById('mg-load'))return;var css=document.createElement('style');css.id='mg-load-css';css.textContent=${JSON.stringify(LOADER_CSS)};var el=document.createElement('div');el.id='mg-load';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','페이지를 불러오는 중');el.innerHTML=${JSON.stringify(LOADER_HTML)};if(!reduced)el.classList.add('is-in');html.appendChild(css);html.appendChild(el);var mo=new MutationObserver(function(){if(!html.classList.contains('mg-loading'))return;var v=window.__mgHeroVideo||window.__mgHeroBootV;var c=document.querySelector('canvas.hero-early-canvas[data-ready="1"],.hero-stacked canvas[data-ready="1"]');if(v&&c){try{v.pause();}catch(e){}}});mo.observe(html,{subtree:true,attributes:true,attributeFilter:['data-ready'],childList:true});window.__mgLoaderPauseObs=mo;}catch(e){}})();`;

  return (
    <script
      // Classic head script — must run before first paint on `/`.
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
