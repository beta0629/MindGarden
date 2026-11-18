'use client';

import Link from 'next/link';
import { BookingCta } from '@/components/ui/BookingCta';
import { homeCopy } from '@/lib/content/home';
import { HeroMedia } from './HeroMedia';

/**
 * Above-the-fold: no data-reveal (reveal boot must not touch LCP media).
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
          <Link className="text-link hero__secondary" href={homeCopy.hero.secondaryHref}>
            {homeCopy.hero.secondaryCta}
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
      <HeroMedia />
    </section>
  );
}
