'use client';

import Link from 'next/link';

export interface HeroSlogan {
  sub?: string;
  main?: string;
  tagline?: string;
}

interface HeroSectionProps {
  slogan?: HeroSlogan;
}

const DEFAULT_SLOGAN: Required<HeroSlogan> = {
  main: '나를 소중히 돌보고 가꾸는 시간,\n당신의 마음이 정원이 되는 곳',
  sub: '전 연령 ADHD 및 동반질환 전문 특화. 부부가족상담 전문',
  tagline: '— 마인드가든이 함께 합니다 —',
};

export default function HeroSection({ slogan }: HeroSectionProps) {
  const finalSlogan = { ...DEFAULT_SLOGAN, ...slogan };

  const openConsultation = () => {
    window.dispatchEvent(new Event('open-consultation-bottom-sheet'));
  };

  const mainLines = (finalSlogan.main ?? '').split('\n').filter(Boolean);

  return (
    <section className="hero-section hero-section--static" aria-label="메인 소개">
      <div className="hero-text">
        <div className="hero-text-inner">
          <h1 className="slogan-main">
            {mainLines.map((line, i) => (
              <span key={i} className="slogan-line">
                {line}
                {i < mainLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="slogan-sub">{finalSlogan.sub}</p>
          <p className="hero-tagline">{finalSlogan.tagline}</p>
          <div className="hero-cta-row">
            <button type="button" className="hero-btn hero-btn--primary" onClick={openConsultation}>
              상담 예약하기
            </button>
            <Link href="/#director" className="hero-btn hero-btn--secondary">
              원장님께 문의하기
            </Link>
          </div>
        </div>
      </div>

      <div className="scroll-down" aria-hidden>
        <span className="scroll-text">아래로 스크롤</span>
        <span className="scroll-chevron" />
      </div>
    </section>
  );
}
