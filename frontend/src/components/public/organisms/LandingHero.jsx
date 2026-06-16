/**
 * LandingHero — 랜딩 Hero 섹션 (Organism)
 *
 * Phase C-2 G3: 좌우 Split (데스크탑) → 상하 Stack (모바일)
 * 모든 텍스트·이미지는 운영팀 슬롯 props로 주입.
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LandingHero.css';

const LandingHero = ({
  titleSlot = '마음을 돌보는 가장 안정적인 공간',
  subtitleSlot = '상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션',
  primaryCta = { label: '무료로 시작하기', onClick: undefined },
  secondaryCta = { label: '요금제 보기', onClick: undefined },
  heroImageSlot = null,
}) => {
  return (
    <section className="mg-v2-landing-hero" aria-label="Hero">
      <div className="mg-v2-landing-hero__content">
        <h1 className="mg-v2-landing-hero__title">
          {titleSlot}
        </h1>
        <p className="mg-v2-landing-hero__subtitle">
          {subtitleSlot}
        </p>
        <div className="mg-v2-landing-hero__cta-group">
          <button
            type="button"
            className="mg-v2-landing-hero__cta mg-v2-landing-hero__cta--primary"
            onClick={primaryCta.onClick}
          >
            {primaryCta.label}
          </button>
          <button
            type="button"
            className="mg-v2-landing-hero__cta mg-v2-landing-hero__cta--secondary"
            onClick={secondaryCta.onClick}
          >
            {secondaryCta.label}
          </button>
        </div>
      </div>
      <div className="mg-v2-landing-hero__media">
        {heroImageSlot ? (
          typeof heroImageSlot === 'string' ? (
            <img
              className="mg-v2-landing-hero__image"
              src={heroImageSlot}
              alt="Core Solution 대시보드"
            />
          ) : (
            heroImageSlot
          )
        ) : (
          <div
            className="mg-v2-landing-hero__image"
            role="img"
            aria-label="Hero placeholder"
          />
        )}
      </div>
    </section>
  );
};

LandingHero.propTypes = {
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
};

export default LandingHero;
