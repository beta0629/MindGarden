const HERO_POSTER_SIZES = '(max-width: 1023px) 100vw, 60vw';

const MOTION_AVIF =
  '/assets/hero/hero-poster-motion-640.avif 640w, /assets/hero/hero-poster-motion-1080.avif 1080w, /assets/hero/hero-poster-motion-1620.avif 1620w';
const MOTION_WEBP =
  '/assets/hero/hero-poster-motion-640.webp 640w, /assets/hero/hero-poster-motion-1080.webp 1080w, /assets/hero/hero-poster-motion-1620.webp 1620w';

/** Legacy oval LCP set — reduced-motion only (no JS swap). */
const RM_AVIF =
  '/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w';
const RM_WEBP =
  '/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w';

/**
 * Static LCP poster — safe in Server Components. Keep markup discoverable
 * without waiting on HeroMedia client hydration / three.js.
 *
 * Default = build-time first GL frame (motion). Soft-GL keeps these URLs
 * (no oval swap). Reduced-motion selects the old posters via media queries.
 */
export function HeroPoster() {
  return (
    <picture>
      <source
        media="(prefers-reduced-motion: reduce)"
        type="image/avif"
        srcSet={RM_AVIF}
        sizes={HERO_POSTER_SIZES}
      />
      <source
        media="(prefers-reduced-motion: reduce)"
        type="image/webp"
        srcSet={RM_WEBP}
        sizes={HERO_POSTER_SIZES}
      />
      <source type="image/avif" srcSet={MOTION_AVIF} sizes={HERO_POSTER_SIZES} />
      <source type="image/webp" srcSet={MOTION_WEBP} sizes={HERO_POSTER_SIZES} />
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before three.js / video */}
      <img
        className="hero-still"
        src="/assets/hero/hero-poster-motion-1080.webp"
        alt=""
        width={1620}
        height={940}
        sizes={HERO_POSTER_SIZES}
        decoding="async"
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}
