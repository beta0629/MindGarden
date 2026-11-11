'use client';

import Image from 'next/image';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { homeCopy } from '@/lib/content/home';

/**
 * Hero still is the v2 design orbit frame (self-made 3D butterfly + flowers).
 * Source: v2-home design still (SOURCES.md → v1.3-home/motion/orbit/frames/o_0000.png).
 * Orbit video is not bundled in this checkout; still-only until the design motion asset is provided.
 */
export function HeroSection() {
  return (
    <section className="container hero">
      <div className="hero__copy">
        <h1>{homeCopy.hero.title}</h1>
        <p className="hero__subtitle">
          {homeCopy.hero.subtitle}
          {homeCopy.hero.subtitleConfirmNeeded ? <ConfirmNeeded /> : null}
        </p>
        <BookingCta showHint />
      </div>
      <div className="hero__media">
        <Image
          src="/images/hero-orbit-still.png"
          alt="마인드가든 3D 나비 일러스트"
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          priority
          style={{ objectFit: 'cover' }}
        />
      </div>
    </section>
  );
}
