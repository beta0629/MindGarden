'use client';

import Link from 'next/link';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { homeCopy } from '@/lib/content/home';
import { HeroMedia } from './HeroMedia';

export function HeroSection() {
  return (
    <section className="container hero" data-reveal>
      <div className="hero__copy">
        <h1>{homeCopy.hero.title}</h1>
        <p className="hero__subtitle">
          {homeCopy.hero.subtitle}
          {homeCopy.hero.subtitleConfirmNeeded ? <ConfirmNeeded /> : null}
        </p>
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
