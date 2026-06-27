/**
 * LandingCTA — 하단 전환 유도 섹션 (Organism)
 *
 * Phase C-2 G3: 다크 배경 강조 + 반전 텍스트.
 * 운영팀 슬롯 props: 타이틀·서브타이틀·Primary/Secondary CTA.
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LandingCTA.css';

const LandingCTA = ({
  titleSlot = '지금 바로 차원이 다른 상담 센터 관리를 경험해보세요.',
  subtitleSlot = '14일 무료 체험으로 모든 기능을 사용해볼 수 있습니다.',
  primaryCta = { label: '무료로 시작하기', onClick: undefined },
  secondaryCta = { label: '도입 문의하기', onClick: undefined },
}) => {
  return (
    <section className="mg-v2-landing-cta" aria-label="Call to Action">
      <div className="mg-v2-landing-cta__container">
        <h2 className="mg-v2-landing-cta__title">
          {titleSlot}
        </h2>
        <p className="mg-v2-landing-cta__subtitle">
          {subtitleSlot}
        </p>
        <div className="mg-v2-landing-cta__btn-group">
          <button
            type="button"
            className="mg-v2-landing-cta__btn mg-v2-landing-cta__btn--primary"
            onClick={primaryCta.onClick}
          >
            {primaryCta.label}
          </button>
          <button
            type="button"
            className="mg-v2-landing-cta__btn mg-v2-landing-cta__btn--secondary"
            onClick={secondaryCta.onClick}
          >
            {secondaryCta.label}
          </button>
        </div>
      </div>
    </section>
  );
};

LandingCTA.propTypes = {
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
};

export default LandingCTA;
