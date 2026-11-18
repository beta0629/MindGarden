/**
 * Inline poster gate — marks `home-boot-ready` when the LCP poster is loaded
 * without waiting on React hydration / HomeBootProgress JS.
 * On first entry also injects `.home-boot-progress` so WebKit sees the bar
 * before hydration; React {@link HomeBootProgress} takes over and removes it.
 * Does NOT write `mg-home-boot-done-v1` (session-once is owned by the visual
 * bar after the hero decision).
 * Keep this tiny: it runs as a classic script after the poster markup.
 */
export function HomeBootInline() {
  const js = `(function(){try{if(sessionStorage.getItem('mg-home-boot-done-v1')==='1'){document.documentElement.classList.add('home-boot-ready');return;}if(!document.getElementById('mg-home-boot-progress-inline')){var wrap=document.createElement('div');wrap.id='mg-home-boot-progress-inline';wrap.className='home-boot-progress';wrap.setAttribute('role','progressbar');wrap.setAttribute('aria-valuemin','0');wrap.setAttribute('aria-valuemax','100');wrap.setAttribute('aria-valuenow','35');wrap.setAttribute('aria-label','페이지 준비 중');var bar=document.createElement('div');bar.className='home-boot-progress__bar';bar.style.transform='scaleX(0.35)';wrap.appendChild(bar);(document.body||document.documentElement).appendChild(wrap);try{window.__mgHomeBootBarShown=1;window.dispatchEvent(new CustomEvent('mg-home-boot-bar-shown'));}catch(e){}}var done=false;function ready(){if(done)return;done=true;document.documentElement.classList.add('home-boot-ready');try{window.dispatchEvent(new CustomEvent('mg-home-boot-ready'));}catch(e){}}var img=document.querySelector('.hero-still');if(!img){ready();return;}if(img.complete&&img.naturalWidth>0){ready();return;}img.addEventListener('load',ready,{once:true});img.addEventListener('error',ready,{once:true});setTimeout(ready,1500);}catch(e){document.documentElement.classList.add('home-boot-ready');}})();`;

  return (
    <script
      // Immediate classic script — must not be type=module / deferred by React.
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
