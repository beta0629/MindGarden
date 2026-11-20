import { BookingCta } from '@/components/ui/BookingCta';
import { homeCopy } from '@/lib/content/home';
import { HomeBootInline } from './HomeBootInline';
import { HeroPoster } from './HeroPoster';
import { HeroMediaLazy } from './HeroMediaLazy';
import { HeroVideoInline } from './HeroVideoInline';

/**
 * Above-the-fold: no data-reveal (reveal boot must not touch LCP media).
 * Poster + empty hero video are RSC HTML (src left unset so static HTML is
 * breakpoint-safe). Classic script sets d/m src via matchMedia before React;
 * StackedAlphaVideo adopts that element (one logical fetch when coalesced).
 * Plain &lt;a&gt; for secondary CTA — avoids App Router client on LCP path.
 */
export function HeroSection() {
  return (
    <section className="container hero">
      <div className="hero__copy">
        <h1>
          마음이 쉬어 가는
          <br />
          정원 같은 상담센터
        </h1>
        <p className="hero__subtitle">{homeCopy.hero.subtitle}</p>
        <div className="hero__actions">
          <BookingCta label={homeCopy.hero.primaryCta} />
          <a className="text-link hero__secondary" href={homeCopy.hero.secondaryHref}>
            {homeCopy.hero.secondaryCta}
            <span aria-hidden="true"> →</span>
          </a>
        </div>
      </div>
      <div className="hero-media">
        <div className="hero-media__stage">
          <HeroPoster />
          {/* Empty SSR video — script sets d/m src; adopt avoids a second element. */}
          <video
            className="hero-stacked-video"
            muted
            playsInline
            preload="auto"
            autoPlay
            loop
            tabIndex={-1}
            aria-hidden="true"
            suppressHydrationWarning
          />
        </div>
        <HeroVideoInline />
        <HeroMediaLazy />
      </div>
      {/* After poster markup so the classic script can find `.hero-still`. */}
      <HomeBootInline />
    </section>
  );
}
