/**
 * LandingFeatures — 핵심 기능 소개 카드 그리드 (Organism)
 *
 * Phase C-2 G3: 카드 배열을 운영팀 슬롯으로 주입.
 * PC 3열 / 태블릿 2열 / 모바일 1열.
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LandingFeatures.css';

const DEFAULT_FEATURES = [
  {
    icon: '📅',
    title: '스마트 예약 관리',
    description: '노쇼를 방지하는 자동 알림과 캘린더 연동',
  },
  {
    icon: '🔒',
    title: '안전한 상담 기록',
    description: '종단간 암호화로 보호되는 내담자 차트',
  },
  {
    icon: '💰',
    title: '자동 정산 시스템',
    description: '복잡한 수기 정산을 클릭 한 번으로',
  },
];

const LandingFeatures = ({
  featuresSlot = DEFAULT_FEATURES,
  columnsDesktop = 3,
  columnsTablet = 2,
}) => {
  const gridStyle = {
    '--landing-features-cols-desktop': columnsDesktop,
    '--landing-features-cols-tablet': columnsTablet,
  };

  return (
    <section className="mg-v2-landing-features" aria-label="Features">
      <div className="mg-v2-landing-features__grid" style={gridStyle}>
        {featuresSlot.map((feature, idx) => (
          <article
            key={idx}
            className="mg-v2-landing-features__card"
          >
            <div className="mg-v2-landing-features__card-icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="mg-v2-landing-features__card-title">
              {feature.title}
            </h3>
            <p className="mg-v2-landing-features__card-desc">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

LandingFeatures.propTypes = {
  featuresSlot: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  columnsDesktop: PropTypes.number,
  columnsTablet: PropTypes.number,
};

export default LandingFeatures;
