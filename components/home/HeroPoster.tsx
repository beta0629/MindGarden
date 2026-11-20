import { heroPosterSrc } from '@/components/home/v4/assets';

/** Reduced-motion oval LCP set — media query only (no JS swap). */
const RM_AVIF =
  '/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w';
const RM_WEBP =
  '/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w';
const RM_SIZES = '(max-width: 1023px) 100vw, 60vw';

/**
 * Static LCP poster — safe in Server Components.
 * Motion: v4-60fps decoded frame 0 (d ≥768 / m &lt;768).
 * Reduced-motion: existing oval RM posters via media.
 */
export function HeroPoster() {
  return (
    <picture>
      <source
        media="(prefers-reduced-motion: reduce)"
        type="image/avif"
        srcSet={RM_AVIF}
        sizes={RM_SIZES}
      />
      <source
        media="(prefers-reduced-motion: reduce)"
        type="image/webp"
        srcSet={RM_WEBP}
        sizes={RM_SIZES}
      />
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet={heroPosterSrc('m')}
      />
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={heroPosterSrc('d')}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before video */}
      <img
        className="hero-still"
        src={heroPosterSrc('d')}
        alt=""
        width={810}
        height={470}
        decoding="async"
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}
