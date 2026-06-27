/**
 * TrustBadgesGrid — 신뢰성 인증 배지 그리드 (Molecule)
 *
 * Design v2 Refine v2 W3 — Landing 페이지 하단 인증 배지.
 * 배지는 인라인 SVG 컴포넌트로 렌더 (외부 이미지 의존 회피).
 * 운영팀이 표시 라벨/배지 목록을 props로 주입.
 *
 * Pricing 페이지의 `TrustBadges` (단일 shield SVG + i18n)와는 별도 컴포넌트.
 *   - Pricing: 가로 일렬 모노톤, 단일 방패형 SVG
 *   - Landing: 그리드/인라인 SVG 4종, props 라벨 주입
 *
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * Props:
 * - heading: 섹션 헤더 텍스트 (string)
 * - badges: 표시할 배지 키 배열 (string[]) — 기본: ISO27001/SOC2/GDPR/KISA-ISMS
 * - labels: { [key]: string } — 각 배지의 시각 텍스트 라벨 (i18n 주입)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  LANDING_TRUST_BADGE_KEY_ISO27001,
  LANDING_TRUST_BADGE_KEY_SOC2,
  LANDING_TRUST_BADGE_KEY_GDPR,
  LANDING_TRUST_BADGE_KEY_KISA,
  LANDING_TRUST_BADGE_DEFAULT_ORDER,
  LANDING_TRUST_BADGE_DEFAULT_LABELS,
  LANDING_TRUST_BADGE_DEFAULT_ARIA_LABEL,
} from '../../../constants/landingPublic';
import './TrustBadgesGrid.css';

const SVG_VIEWBOX = '0 0 120 32';
const SVG_TEXT_FONT = '600 13px "Noto Sans KR", sans-serif';

/* ── 인라인 SVG 배지 ──
 *  각 배지는 currentColor 를 사용하여 다크 모드에서도 자동 대응.
 *  외부 이미지/png 의존 회피.
 */

const BadgeIso27001 = ({ label }) => (
  <svg
    viewBox={SVG_VIEWBOX}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
  >
    <g transform="translate(16, 16)" strokeWidth="1.5">
      <rect x="-9" y="-9" width="18" height="18" rx="2" />
      <rect x="-9" y="-9" width="18" height="18" rx="2" transform="rotate(45)" />
      <path d="M-3 0 L-1 3 L5 -4" />
    </g>
    <text x="36" y="21" style={{ font: SVG_TEXT_FONT }} fill="currentColor" stroke="none">
      {label}
    </text>
  </svg>
);

const BadgeSoc2 = ({ label }) => (
  <svg
    viewBox={SVG_VIEWBOX}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
  >
    <g transform="translate(16, 16)" strokeWidth="1.5">
      <path d="M0 -10 L9 -5 L9 5 L0 10 L-9 5 L-9 -5 Z" />
      <path d="M-4 0 L-1 3 L5 -3" />
    </g>
    <text x="36" y="21" style={{ font: SVG_TEXT_FONT }} fill="currentColor" stroke="none">
      {label}
    </text>
  </svg>
);

const BadgeGdpr = ({ label }) => (
  <svg
    viewBox={SVG_VIEWBOX}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
  >
    <g transform="translate(16, 16)" strokeWidth="1.5">
      <path d="M-8 -7 L0 -10 L8 -7 L8 3 C8 7 4 10 0 10 C-4 10 -8 7 -8 3 Z" />
      <circle cx="0" cy="-1" r="3" />
      <path d="M-2 5 L0 1 L2 5" />
    </g>
    <text x="36" y="21" style={{ font: SVG_TEXT_FONT }} fill="currentColor" stroke="none">
      {label}
    </text>
  </svg>
);

const BadgeKisaIsms = ({ label }) => (
  <svg
    viewBox={SVG_VIEWBOX}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
  >
    <g transform="translate(16, 16)" strokeWidth="1.5">
      <circle cx="0" cy="0" r="9" />
      <path d="M-4 1 L-1 4 L4 -3" />
      <path d="M-9 0 L-12 0 M9 0 L12 0" />
    </g>
    <text x="36" y="21" style={{ font: SVG_TEXT_FONT }} fill="currentColor" stroke="none">
      {label}
    </text>
  </svg>
);

const BADGE_COMPONENTS = {
  [LANDING_TRUST_BADGE_KEY_ISO27001]: BadgeIso27001,
  [LANDING_TRUST_BADGE_KEY_SOC2]: BadgeSoc2,
  [LANDING_TRUST_BADGE_KEY_GDPR]: BadgeGdpr,
  [LANDING_TRUST_BADGE_KEY_KISA]: BadgeKisaIsms,
};

const TrustBadgesGrid = ({
  heading = null,
  badges = LANDING_TRUST_BADGE_DEFAULT_ORDER,
  labels = LANDING_TRUST_BADGE_DEFAULT_LABELS,
  ariaLabel = LANDING_TRUST_BADGE_DEFAULT_ARIA_LABEL,
}) => {
  return (
    <section
      className="mg-v2-trust-badges-grid"
      aria-label={ariaLabel}
    >
      <div className="mg-v2-trust-badges-grid__container">
        {heading && (
          <p className="mg-v2-trust-badges-grid__heading">{heading}</p>
        )}
        <ul className="mg-v2-trust-badges-grid__list">
          {badges.map((badgeKey) => {
            const BadgeComponent = BADGE_COMPONENTS[badgeKey];
            if (!BadgeComponent) return null;
            const label = labels[badgeKey] || LANDING_TRUST_BADGE_DEFAULT_LABELS[badgeKey] || badgeKey;
            return (
              <li key={badgeKey} className="mg-v2-trust-badges-grid__item">
                <BadgeComponent label={label} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

BadgeIso27001.propTypes = { label: PropTypes.string.isRequired };
BadgeSoc2.propTypes = { label: PropTypes.string.isRequired };
BadgeGdpr.propTypes = { label: PropTypes.string.isRequired };
BadgeKisaIsms.propTypes = { label: PropTypes.string.isRequired };

TrustBadgesGrid.propTypes = {
  heading: PropTypes.node,
  badges: PropTypes.arrayOf(PropTypes.string),
  labels: PropTypes.objectOf(PropTypes.string),
  ariaLabel: PropTypes.string,
};

export default TrustBadgesGrid;
