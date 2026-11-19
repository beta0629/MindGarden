/** Reduced-motion oval LCP set — media query only (no JS swap). */
const RM_AVIF =
  '/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w';
const RM_WEBP =
  '/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w';
const RM_SIZES = '(max-width: 1023px) 100vw, 60vw';

/**
 * Static LCP poster — safe in Server Components. Keep markup discoverable
 * without waiting on HeroMedia client hydration / three.js.
 *
 * Default = build-time first GL frame per breakpoint (motion). Soft-GL keeps
 * these URLs (no oval swap). Reduced-motion selects the old posters via media.
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
        type="image/avif"
        srcSet="/assets/hero/hero-poster-motion-390.avif"
      />
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet="/assets/hero/hero-poster-motion-390.webp"
      />
      <source
        media="(max-width: 1023px)"
        type="image/avif"
        srcSet="/assets/hero/hero-poster-motion-768.avif"
      />
      <source
        media="(max-width: 1023px)"
        type="image/webp"
        srcSet="/assets/hero/hero-poster-motion-768.webp"
      />
      <source
        type="image/avif"
        srcSet="/assets/hero/hero-poster-motion-1440.avif"
      />
      <source
        type="image/webp"
        srcSet="/assets/hero/hero-poster-motion-1440.webp"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before three.js / video */}
      <img
        className="hero-still"
        src="/assets/hero/hero-poster-motion-1440.webp"
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
