'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PROGRAM_PAGE_ORDER,
  programPageContent,
  programScreeningFlipCard,
} from '@/lib/program-pages-content';

const DELAY_CLASSES = ['mg-delay-1', 'mg-delay-2', 'mg-delay-3', 'mg-delay-4', 'mg-delay-5'];

type FlipItem = {
  key: string;
  title: string;
  highlight: string;
  back: string;
  href: string;
  delayClass: string;
};

export default function HomeProgramPagesFlipGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll('.mg-fade-in-up');
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mg-fade-in-up--active');
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 }
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const items: FlipItem[] = [
    ...PROGRAM_PAGE_ORDER.map((id, i) => {
      const p = programPageContent[id];
      return {
        key: id,
        title: p.cardTitle,
        highlight: p.cardLead,
        back: p.cardFlipBack,
        href: p.href,
        delayClass: DELAY_CLASSES[i] ?? 'mg-delay-4',
      };
    }),
    {
      key: 'screening',
      title: programScreeningFlipCard.cardTitle,
      highlight: programScreeningFlipCard.cardLead,
      back: programScreeningFlipCard.cardFlipBack,
      href: programScreeningFlipCard.href,
      delayClass: DELAY_CLASSES[4],
    },
  ];

  return (
    <div className="mg-prog-cards-band">
      <div
        ref={containerRef}
        className="mg-prog-cards-grid mg-prog-cards-grid--program-pages"
        aria-label="프로그램 상세 안내 카드"
      >
        {items.map((card) => (
          <article key={card.key} className={`mg-prog-card mg-fade-in-up ${card.delayClass}`}>
            <div className="mg-prog-card-inner">
              <div className="mg-prog-card-front">
                <h3>{card.title}</h3>
                <p className="mg-prog-highlight">{card.highlight}</p>
              </div>
              <div className="mg-prog-card-back">
                <p>{card.back}</p>
                <Link href={card.href} className="mg-prog-more">
                  자세히 보기 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
