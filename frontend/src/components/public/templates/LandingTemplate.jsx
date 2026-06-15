/**
 * LandingTemplate — 랜딩 페이지 레이아웃 템플릿 (Template)
 *
 * Phase C-3 W3: PublicLayout 슬롯 안에 4종 Organism 조립.
 * 데이터·이벤트는 LandingPage에서 주입 (useState 없음).
 * mg-v2-* 토큰 한정, 하드코딩 0, 다크 모드 자동 지원.
 *
 * 조립 순서: LandingHero → LandingFeatures → LandingTestimonials → LandingCTA
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import PublicLayout from '../layouts/PublicLayout';
import PublicErrorBoundary from '../organisms/PublicErrorBoundary';
import LandingHero from '../organisms/LandingHero';
import LandingFeatures from '../organisms/LandingFeatures';
import LandingTestimonials from '../organisms/LandingTestimonials';
import LandingCTA from '../organisms/LandingCTA';
import './LandingTemplate.css';

const LandingTemplate = ({
  heroProps = {},
  featuresProps = {},
  testimonialsProps = {},
  ctaProps = {},
}) => {
  return (
    <PublicLayout>
      <div className="mg-v2-landing-template">
        <PublicErrorBoundary>
          <LandingHero {...heroProps} />
        </PublicErrorBoundary>

        <PublicErrorBoundary>
          <LandingFeatures {...featuresProps} />
        </PublicErrorBoundary>

        <PublicErrorBoundary>
          <LandingTestimonials {...testimonialsProps} />
        </PublicErrorBoundary>

        <PublicErrorBoundary>
          <LandingCTA {...ctaProps} />
        </PublicErrorBoundary>
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
