'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { homeCopy } from '@/lib/content/home';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playing) return;
    void video.play().catch(() => undefined);
  }, [playing]);

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
          src="/images/hero-butterfly.webp"
          alt="마인드가든 나비 일러스트"
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          priority
          style={{ objectFit: 'cover' }}
        />
        {playing && !reduceMotion ? (
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            aria-label="마인드가든 나비 모션"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
        ) : null}
        {!reduceMotion ? (
          <button
            type="button"
            className="hero__pause"
            aria-label={playing ? '모션 일시정지' : '모션 재생'}
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
