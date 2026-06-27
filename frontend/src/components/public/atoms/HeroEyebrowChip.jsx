/**
 * HeroEyebrowChip — Landing Hero 상단 알림/태그 칩 (Atom)
 *
 * Design v2 Refine v2 SPEC §3.2 / §9 — 둥근 Pill 형태로 "Multi-Tenant SaaS Platform"
 * 같은 상단 카피를 표시. 미세한 펄스 애니메이션을 CSS로 처리.
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * Props:
 * - children: 칩 내부 텍스트(노드)
 * - icon: 좌측 아이콘 노드(선택)
 * - ariaLabel: aria-label 오버라이드(선택, 기본은 children 텍스트)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import './HeroEyebrowChip.css';

const HeroEyebrowChip = ({ children, icon = null, ariaLabel = null }) => {
  return (
    <span
      className="mg-v2-hero-eyebrow-chip"
      role="status"
      aria-label={ariaLabel || undefined}
    >
      {icon && (
        <span className="mg-v2-hero-eyebrow-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="mg-v2-hero-eyebrow-chip__label">{children}</span>
    </span>
  );
};

HeroEyebrowChip.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  ariaLabel: PropTypes.string,
};

export default HeroEyebrowChip;
