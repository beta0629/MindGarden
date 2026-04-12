'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const CARDS: {
  title: string;
  highlight: string;
  back: string;
  href: string;
  delayClass: string;
}[] = [
  {
    title: 'ADHD & 동반질환 특화',
    highlight: '아동 · 청소년 · 성인',
    back: '단순한 진단이나 약물 권유를 넘어, 주의력 결핍이나 충동성에 수반되는 중독·틱·트라우마까지 삶의 전반을 아우르는 통합 케어를 제공합니다.',
    href: '/programs/adhd',
    delayClass: 'mg-delay-1',
  },
  {
    title: '부부·가족 & 애착 회복',
    highlight: '가족 구성원 통합 치유',
    back: '단절된 대화, 피할 수 없는 갈등, 이혼 위기 상황은 물론 재결합 가정의 복잡한 역동까지. 맞춤형 시스템으로 끊어진 애착의 연결고리를 회복합니다.',
    href: '/counseling/counseling-areas',
    delayClass: 'mg-delay-2',
  },
  {
    title: '아동·청소년 행동 중재',
    highlight: '사회성 훈련 및 행동 수정',
    back: '등교 거부, 학교 폭력 징후, 은둔형 외톨이 등 아이들의 SOS 신호를 정확히 포착하고, 현실에서 바로 적용할 수 있는 구체적인 사회성 훈련을 실시합니다.',
    href: '/counseling/child-adolescent-adhd',
    delayClass: 'mg-delay-3',
  },
  {
    title: '부모 코칭 & 대화법',
    highlight: '건강한 양육 체계 수립',
    back: '아이를 사랑하지만 방법을 몰라 힘든 부모님들을 위해, 감정코칭의 정석과 발달 단계에 꼭 맞는 대화법, 그리고 훈육의 경계선을 명확하게 세워드립니다.',
    href: '/programs/treatment',
    delayClass: 'mg-delay-4',
  },
];

export default function MindgardenProgramsFlipGrid() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.mg-fade-in-up');
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

  return (
    <section id="programs" className="mg-prog-section" aria-labelledby="mg-prog-heading">
      <div className="mg-prog-container">
        <header className="mg-prog-header mg-fade-in-up">
          <h2 id="mg-prog-heading" className="mg-prog-title">
            마음의 뿌리를 단단하게,
            <br />
            증상 너머의 사람을 봅니다
          </h2>
          <p className="mg-prog-subtitle">마인드가든만의 문제 해결 중심 전문 통합 상담 프로그램</p>
        </header>

        <div className="mg-prog-cards-grid">
          {CARDS.map((card) => (
            <article key={card.href} className={`mg-prog-card mg-fade-in-up ${card.delayClass}`}>
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
    </section>
  );
}
