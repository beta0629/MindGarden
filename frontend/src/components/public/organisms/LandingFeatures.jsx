/**
 * LandingFeatures — 핵심 기능 소개 카드 그리드 (Organism)
 *
 * Design v2 Refine v2 W3 SPEC §3.4 — 3열 Feature Grid.
 *  - 카드 디자인은 `FeatureCard` molecule 사용
 *  - 카드 배열은 운영팀 슬롯(featuresSlot)으로 주입
 *  - PC 3열 / 태블릿 2열 / 모바일 1열 (CSS 반응형)
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import FeatureCard from '../molecules/FeatureCard';
import './LandingFeatures.css';

const ARIA_LABEL_FEATURES = 'Features';

const DEFAULT_COLUMNS_DESKTOP = 3;
const DEFAULT_COLUMNS_TABLET = 2;

const DEFAULT_FEATURES = [
  {
    key: 'isolation',
    icon: null,
    title: '멀티 테넌트 격리',
    description: '테넌트별 데이터·권한·도메인을 완벽 분리',
  },
  {
    key: 'workflow',
    icon: null,
    title: '자동화 워크플로우',
    description: '반복 업무를 코드 없이 자동화',
  },
  {
    key: 'analytics',
    icon: null,
    title: '실시간 운영 분석',
    description: '비즈니스 지표를 한눈에 추적',
  },
];

const LandingFeatures = ({
  featuresSlot = DEFAULT_FEATURES,
  columnsDesktop = DEFAULT_COLUMNS_DESKTOP,
  columnsTablet = DEFAULT_COLUMNS_TABLET,
  ariaLabel = ARIA_LABEL_FEATURES,
}) => {
  const gridStyle = {
    '--mg-v2-landing-features-cols-desktop': columnsDesktop,
    '--mg-v2-landing-features-cols-tablet': columnsTablet,
  };

  return (
    <section className="mg-v2-landing-features" aria-label={ariaLabel}>
      <div className="mg-v2-landing-features__inner">
        <div className="mg-v2-landing-features__grid" style={gridStyle}>
          {featuresSlot.map((feature, idx) => (
            <FeatureCard
              key={feature.key || feature.title || idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              testId={feature.testId}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

LandingFeatures.propTypes = {
  featuresSlot: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      icon: PropTypes.node,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      testId: PropTypes.string,
    })
  ),
  columnsDesktop: PropTypes.number,
  columnsTablet: PropTypes.number,
  ariaLabel: PropTypes.string,
};

export default LandingFeatures;
