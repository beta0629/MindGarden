'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MindgardenProgramsFlipGrid from '@/components/about/MindgardenProgramsFlipGrid';

/* Unsplash 일부 ID는 만료·차단될 수 있어 200 응답 확인된 URL만 사용 */
const HERO_BG =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=2000';
/** 로컬 생성 이미지 — 센터 외관·정원 톤(화이트·그린), JPEG로 용량 축소(서버 이미지 최적화 안정화) */
const IDENTITY_IMG = '/assets/images/mg-identity-exterior.jpg';
/** 대표원장 실사 (카페 촬영 원본을 중앙·오프셋 크롭) */
const DIRECTOR_IMG = '/images/director-portrait.png';
const PHILOSOPHY_IMG =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000';

export type MindgardenLandingSectionsProps = {
  /** false면 상단 히어로(전면 이미지)를 숨기고, 메인 기존 HeroSection 바로 아래에 붙일 때 사용 */
  showHero?: boolean;
};

export default function MindgardenLandingSections({ showHero = true }: MindgardenLandingSectionsProps) {
  useEffect(() => {
    const nodes = document.querySelectorAll('.mg-landing-fade');
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mg-landing-fade--active');
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.12 }
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showHero]);

  return (
    <section
      className={`mg-landing${showHero ? '' : ' mg-landing--no-hero'}`}
      aria-label="마인드가든 센터 소개"
    >
      {/* 1. Hero (전문특화 페이지 단독 / 메인에서는 기존 히어로 사용 시 생략) */}
      {showHero ? (
      <header className="mg-hero-section" aria-label="마인드가든 소개 히어로">
        <div className="mg-hero-bg">
          <Image
            src={HERO_BG}
            alt=""
            fill
            priority
            className="mg-hero-bg-img"
            sizes="100vw"
          />
          <div className="mg-hero-gradient" aria-hidden />
        </div>
        <div className="mg-hero-inner mg-landing-fade">
          <div className="mg-landing-container">
            <h1 className="mg-hero-title">
              <span className="mg-hero-line">나를 소중히 돌보고 가꾸는 시간,</span>
              <br />
              <span className="mg-hero-line">당신의 마음이 정원이 되는 곳</span>
            </h1>
            <p className="mg-hero-lead">
              전 연령 ADHD 및 동반질환 전문 특화. 부부·가족 상담 전문
              <span className="mg-hero-tagline">— 마인드가든이 함께 합니다 —</span>
            </p>
            <div className="mg-hero-actions">
              <Link href="/location" className="mg-btn mg-btn--primary">
                오시는 길
              </Link>
              <Link href="#director" className="mg-btn mg-btn--secondary">
                원장 소개
              </Link>
            </div>
          </div>
        </div>
        <div className="mg-hero-scroll" aria-hidden>
          <span>아래로 스크롤</span>
          <div className="mg-hero-scroll-line" />
        </div>
      </header>
      ) : null}

      {/* 2. Identity */}
      <section id="about" className="mg-identity-section">
        <div className="mg-landing-container">
          <div className="mg-identity-grid">
          <figure className="mg-identity-visual mg-landing-fade">
            <Image
              src={IDENTITY_IMG}
              alt="밝은 심리상담센터 건물 외관과 앞마당 녹지"
              width={1000}
              height={750}
              className="mg-identity-img"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </figure>
          <div className="mg-identity-copy mg-landing-fade mg-landing-delay-2">
            <h2 className="mg-identity-title">
              &quot;단 한 번의 광고 없이,
              <br />
              오직 상담의 질로만 증명해왔습니다.&quot;
            </h2>
            <ul className="mg-identity-list">
              <li>
                <p>
                  <strong>현직 심리상담사가</strong> 상담을 받으러 오는 곳
                </p>
              </li>
              <li>
                <p>
                  지인의 지인에게 <strong>가장 먼저, 그리고 자신 있게 추천</strong>하는 곳
                </p>
              </li>
              <li>
                <p>
                  전국 주요 도시에서 찾아오는 <strong>ADHD·트라우마 심층 통합 솔루션</strong>
                </p>
              </li>
            </ul>
          </div>
          </div>
        </div>
      </section>

      {/* 3. Programs (flip cards) */}
      <MindgardenProgramsFlipGrid />

      {/* 4. Director */}
      <section id="director" className="mg-director-section">
        <div className="mg-landing-container">
          <div className="mg-director-grid">
          <figure className="mg-director-visual mg-landing-fade">
            <div className="mg-director-frame">
              <Image
                src={DIRECTOR_IMG}
                alt="대표원장"
                width={620}
                height={780}
                className="mg-director-img"
                sizes="(max-width: 900px) 100vw, 45vw"
              />
              <div className="mg-director-decor" aria-hidden />
            </div>
          </figure>
          <div className="mg-director-copy mg-landing-fade mg-landing-delay-2">
            <h2 className="mg-director-quote">
              &quot;15년, 수많은 마음의 숲을 지나오며 깨달은 것은
              <br />
              결국 &apos;회복의 힘&apos;은 내담자 안에 있다는 사실입니다.&quot;
            </h2>
            <div className="mg-director-resume">
              <h3 className="mg-director-resume-title">대표원장</h3>
              <ul className="mg-director-resume-list">
                <li>현) 마인드가든 심리상담센터 대표원장</li>
                <li>전) 해양경찰·소방 공무원 전문상담사 등 공공 재난·트라우마 현장 경험</li>
                <li>전) 심리연구소 소장, 유명 프랜차이즈 수석 상담사</li>
                <li>교육학 학사 / 상담학 석사 / 가족상담 박사과정(일부 수료)</li>
                <li>1급 전문상담사 자격 및 다수 슈퍼비전·교육 경력</li>
              </ul>
            </div>
            <blockquote className="mg-director-blockquote">
              &quot;어두운 터널을 지나고 계신가요? 당신이 길을 잃지 않도록, 든든하고 안전한 안내자가
              되어드리겠습니다.&quot;
            </blockquote>
            <p className="mg-director-more">
              <Link href="/counselors">상담사 프로필 자세히 보기 →</Link>
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* 5. Philosophy & space */}
      <section id="philosophy" className="mg-philosophy-section">
        <div className="mg-landing-container">
          <div className="mg-philosophy-grid">
          <div className="mg-philosophy-stack">
            <article className="mg-phi-card mg-landing-fade">
              <p className="mg-phi-label">완벽한 비밀 보장과 프라이버시</p>
              <h2 className="mg-phi-heading">
                국가 바우처를
                <br />
                받지 않는 이유
              </h2>
              <p className="mg-phi-body">
                상담 기록이 어딘가에 남는 것을 원치 않는 내담자분들의 마음을 잘 알고 있습니다.
                마인드가든은 어떠한 외부 시스템과도 기록을 연동하지 않습니다. 오직 당신의 삶과
                프라이버시를 온전하게 지켜드리기 위해, 타협 없는 철저한 보안 원칙을 고수합니다.
              </p>
            </article>
            <article className="mg-phi-card mg-landing-fade mg-landing-delay-2">
              <p className="mg-phi-label">공간 철학</p>
              <h2 className="mg-phi-heading">
                자연의 숨결이 닿은
                <br />
                평온한 상담 공간
              </h2>
              <p className="mg-phi-body">
                문을 여는 순간 느껴지는 따뜻한 조명과 흔들림 없이 견고한 공간, 생명력을 뜻하는
                식물까지. 조명 하나, 가구 하나에도 당신만을 위한 안전하고 편안한 공간이 준비되어
                있습니다.
              </p>
            </article>
          </div>
          <figure className="mg-philosophy-visual mg-landing-fade mg-landing-delay-3">
            <Image
              src={PHILOSOPHY_IMG}
              alt="편안한 라운지와 식물이 있는 공간"
              width={1000}
              height={1200}
              className="mg-philosophy-img"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </figure>
          </div>
        </div>
      </section>
    </section>
  );
}
