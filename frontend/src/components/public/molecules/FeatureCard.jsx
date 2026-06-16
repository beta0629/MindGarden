/**
 * FeatureCard — Landing Feature Grid 카드 (Molecule)
 *
 * Design v2 Refine v2 SPEC §3.4 — 아이콘 + 타이틀 + 설명글.
 * 운영팀이 i18n으로 주입한 타이틀/설명을 받아 렌더. 아이콘은 노드 슬롯
 * (보통 SVG 컴포넌트 또는 emoji)로 주입.
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * Props:
 * - icon: 아이콘 노드 (SVG/이미지/emoji)
 * - title: 카드 타이틀 (string)
 * - description: 카드 설명 (string)
 * - testId: data-testid 오버라이드(선택)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import './FeatureCard.css';

const FeatureCard = ({ icon, title, description, testId = null }) => {
  return (
    <article
      className="mg-v2-feature-card"
      data-testid={testId || undefined}
    >
      <div className="mg-v2-feature-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mg-v2-feature-card__title">{title}</h3>
      <p className="mg-v2-feature-card__desc">{description}</p>
    </article>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  testId: PropTypes.string,
};

export default FeatureCard;
