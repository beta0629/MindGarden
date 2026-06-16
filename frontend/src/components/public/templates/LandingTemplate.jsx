/**
 * LandingTemplate — 랜딩 페이지 레이아웃 템플릿 (Template)
 *
 * Phase C-3 W3: PublicLayout 슬롯 안에 4종 Organism 조립.
 * Phase C-Refine: 스크롤 fade-up (IntersectionObserver, 라이브러리 없음)
 * 데이터·이벤트는 LandingPage에서 주입 (useState 없음).
 * mg-v2-* 토큰 한정, 하드코딩 0, 다크 모드 자동 지원.
 *
 * 조립 순서: LandingHero → LandingFeatures → LandingTestimonials → LandingCTA
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import PublicLayout from '../layouts/PublicLayout';
import PublicErrorBoundary from '../organisms/PublicErrorBoundary';
import LandingHero from '../organisms/LandingHero';
import LandingFeatures from '../organisms/LandingFeatures';
import LandingTestimonials from '../organisms/LandingTestimonials';
import LandingCTA from '../organisms/LandingCTA';
import './LandingTemplate.css';

const FADE_UP_CLASS = 'mg-v2-fade-up';
const FADE_UP_VISIBLE_CLASS = 'mg-v2-fade-up--visible';
const OBSERVER_THRESHOLD = 0.1;

const LandingTemplate = ({
  heroProps = {},
  featuresProps = {},
  testimonialsProps = {},
  ctaProps = {},
}) => {
  const templateRef = useRef(null);

  useEffect(() => {
    const root = templateRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const sections = root.querySelectorAll(`.${FADE_UP_CLASS}`);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(FADE_UP_VISIBLE_CLASS);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <PublicLayout>
      <div className="mg-v2-landing-template" ref={templateRef}>
        <div className={FADE_UP_CLASS}>
          <PublicErrorBoundary>
            <LandingHero {...heroProps} />
          </PublicErrorBoundary>
        </div>

        <div className={FADE_UP_CLASS}>
          <PublicErrorBoundary>
            <LandingFeatures {...featuresProps} />
          </PublicErrorBoundary>
        </div>

        <div className={FADE_UP_CLASS}>
          <PublicErrorBoundary>
            <LandingTestimonials {...testimonialsProps} />
          </PublicErrorBoundary>
        </div>

        <div className={FADE_UP_CLASS}>
          <PublicErrorBoundary>
            <LandingCTA {...ctaProps} />
          </PublicErrorBoundary>
        </div>
      </div>
    </PublicLayout>
  );
};

LandingTemplate.propTypes = {
  heroProps: PropTypes.shape({
    titleSlot: PropTypes.node,
    subtitleSlot: PropTypes.node,
    primaryCta: PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    }),
    secondaryCta: PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    }),
    heroImageSlot: PropTypes.node,
  }),
  featuresProps: PropTypes.shape({
    featuresSlot: PropTypes.array,
    columnsDesktop: PropTypes.number,
    columnsTablet: PropTypes.number,
  }),
  testimonialsProps: PropTypes.shape({
    statsSlot: PropTypes.array,
    testimonialsSlot: PropTypes.array,
    autoPlayMs: PropTypes.number,
    pauseOnHover: PropTypes.bool,
  }),
  ctaProps: PropTypes.shape({
    titleSlot: PropTypes.node,
    subtitleSlot: PropTypes.node,
    primaryCta: PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    }),
    secondaryCta: PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    }),
  }),
};

export default LandingTemplate;
