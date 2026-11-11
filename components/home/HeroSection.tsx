'use client';

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
        <BookingCta showHint />
      </div>
      <HeroMedia />
    </section>
  );
}
