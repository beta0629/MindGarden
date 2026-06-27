/**
 * LandingFeatureIcons — Landing Feature Card 전용 인라인 SVG 아이콘 (Atoms)
 *
 * Design v2 Refine v2 W3 — `currentColor` 기반으로 부모의 color 토큰을 따른다.
 * 외부 이미지 의존을 피하고 다크 모드/색상 토큰 전환에 자동 대응.
 *
 * 3종:
 *  - IconMultiTenant: 멀티 테넌트 격리
 *  - IconWorkflow: 자동화 워크플로우
 *  - IconAnalytics: 실시간 운영 분석
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';

const ICON_VIEWBOX = '0 0 48 48';
const ICON_STROKE_WIDTH = 2;

const baseSvgProps = (label) => ({
  viewBox: ICON_VIEWBOX,
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: ICON_STROKE_WIDTH,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  role: 'img',
  'aria-label': label,
});

export const IconMultiTenant = ({ ariaLabel = 'Multi-tenant isolation' }) => (
  <svg {...baseSvgProps(ariaLabel)}>
    <path d="M 8 20 L 24 12 L 40 20 L 24 28 Z" fill="currentColor" fillOpacity="0.08" />
    <path d="M 8 28 L 24 36 L 40 28" />
    <path d="M 8 36 L 24 44 L 40 36" />
    <circle cx="24" cy="20" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    <circle cx="32" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>
);

IconMultiTenant.propTypes = {
  ariaLabel: PropTypes.string,
};

export const IconWorkflow = ({ ariaLabel = 'Automation workflow' }) => (
  <svg {...baseSvgProps(ariaLabel)}>
    <path
      d="M 24 8 A 16 16 0 0 1 40 24 A 16 16 0 0 1 24 40 A 16 16 0 0 1 8 24 A 16 16 0 0 1 12 13"
      strokeDasharray="6 4"
    />
    <path d="M 40 20 L 40 24 L 36 24" />
    <path d="M 28 40 L 24 40 L 24 36" />
    <path d="M 8 28 L 8 24 L 12 24" />
    <path d="M 16 9 L 12 13 L 16 17" />
    <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity="0.1" />
    <circle cx="24" cy="24" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

IconWorkflow.propTypes = {
  ariaLabel: PropTypes.string,
};

export const IconAnalytics = ({ ariaLabel = 'Realtime analytics' }) => (
  <svg {...baseSvgProps(ariaLabel)}>
    <path d="M 8 12 H 40 M 8 20 H 40 M 8 28 H 40" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
    <path d="M 8 8 V 40 H 40" />
    <rect x="12" y="24" width="6" height="16" rx="1" fill="currentColor" fillOpacity="0.08" />
    <rect x="22" y="16" width="6" height="24" rx="1" fill="currentColor" fillOpacity="0.1" />
    <rect x="32" y="28" width="6" height="12" rx="1" fill="currentColor" fillOpacity="0.08" />
    <path d="M 15 22 L 25 14 L 35 26" />
    <circle cx="15" cy="22" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="25" cy="14" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="35" cy="26" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

IconAnalytics.propTypes = {
  ariaLabel: PropTypes.string,
};

export const FEATURE_ICON_KEY_ISOLATION = 'isolation';
export const FEATURE_ICON_KEY_WORKFLOW = 'workflow';
export const FEATURE_ICON_KEY_ANALYTICS = 'analytics';

export const FEATURE_ICON_MAP = {
  [FEATURE_ICON_KEY_ISOLATION]: IconMultiTenant,
  [FEATURE_ICON_KEY_WORKFLOW]: IconWorkflow,
  [FEATURE_ICON_KEY_ANALYTICS]: IconAnalytics,
};
