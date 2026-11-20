/**
 * Hero boot (public/hero-boot-v4.js, async): sets the d/m stack src + stacked-alpha
 * early paint once the LCP poster has loaded and painted. Kept out of the HTML so the
 * document (and its RSC copy of inline scripts) stays inside the first TCP window.
 * Reduced-motion: the script is a no-op; CSS hides the SSR nodes.
 * GLSL must stay in sync with stackedAlphaShader.ts.
 */
export function HeroVideoBootHead() {
  return <script id="mg-hero-video-boot" src="/hero-boot-v4.js" async />;
}
