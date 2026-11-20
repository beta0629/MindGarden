/**
 * Inline poster gate — marks `home-boot-ready` when the LCP poster is loaded
 * without waiting on React hydration. No visual progress bar (removed in v4).
 * Keep this tiny: it runs as a classic script after the poster markup.
 */
export function HomeBootInline() {
  const js = `(function(){try{if(sessionStorage.getItem('mg-home-boot-done-v1')==='1'){document.documentElement.classList.add('home-boot-ready');return;}var done=false;function ready(){if(done)return;done=true;document.documentElement.classList.add('home-boot-ready');try{sessionStorage.setItem('mg-home-boot-done-v1','1');}catch(e){}try{window.dispatchEvent(new CustomEvent('mg-home-boot-ready'));}catch(e){}}var img=document.querySelector('.hero-still');if(!img){ready();return;}if(img.complete&&img.naturalWidth>0){ready();return;}img.addEventListener('load',ready,{once:true});img.addEventListener('error',ready,{once:true});setTimeout(ready,1500);}catch(e){document.documentElement.classList.add('home-boot-ready');}})();`;

  return (
    <script
      // Immediate classic script — must not be type=module / deferred by React.
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
