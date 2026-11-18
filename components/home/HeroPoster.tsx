const HERO_POSTER_SIZES = '(max-width: 1023px) 100vw, 60vw';

/**
 * Static LCP poster — safe in Server Components. Keep markup discoverable
 * without waiting on HeroMedia client hydration / three.js.
 */
export function HeroPoster() {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w"
        sizes={HERO_POSTER_SIZES}
      />
      <source
        type="image/webp"
        srcSet="/assets/hero/hero-poster-640.webp 640w, /assets/hero/hero-poster-1080.webp 1080w, /assets/hero/hero-poster.webp 1620w"
        sizes={HERO_POSTER_SIZES}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP poster must paint before three.js / video */}
      <img
        className="hero-still"
        src="/assets/hero/hero-poster-1080.webp"
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
