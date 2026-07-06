/**
 * PricingPlanIcon — 요금제 카드 상단 일러스트 (Atom)
 *
 * Spec §3.3:
 *   - Starter: 단일 큐브 노드 + 연결선
 *   - Pro: 3노드 네트워크 연결
 *   - Enterprise: 클라우드 + 데이터센터
 *
 * 모든 색상은 currentColor 사용 → 카드 variant 별 색상 토큰 상속.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PRICING_PLAN_ICON } from '../../../constants/pricing';
import './PricingPlanIcon.css';

/* ================================================================
   INTERNAL — Variant SVGs
   ================================================================ */

/** Starter — 단일 큐브 노드 + 연결선 */
function StarterIcon() {
  return (
    <svg
      className="mg-v2-pricing-plan-icon__svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="22" y="22" width="20" height="20" rx="3" />
      <path d="M32 12 V22" />
      <circle cx="32" cy="10" r="3" fill="currentColor" />
      <path d="M44 32 H54" />
      <circle cx="56" cy="32" r="3" fill="currentColor" />
      <path d="M20 32 H10" />
      <circle cx="8" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

/** Pro — 3노드 네트워크 연결 */
function ProIcon() {
  return (
    <svg
      className="mg-v2-pricing-plan-icon__svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 18 L32 32 L50 18" />
      <path d="M32 32 L32 50" />
      <circle cx="14" cy="18" r="6" fill="currentColor" />
      <circle cx="50" cy="18" r="6" fill="currentColor" />
      <circle cx="32" cy="50" r="6" fill="currentColor" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}

/** Enterprise — 클라우드 + 데이터센터 */
function EnterpriseIcon() {
  return (
    <svg
      className="mg-v2-pricing-plan-icon__svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 26 a8 8 0 0 1 16-3 a6 6 0 0 1 12 1 a6 6 0 0 1 4 11 H16 a6 6 0 0 1 -4 -11 z" />
      <rect x="14" y="40" width="36" height="6" rx="2" />
      <rect x="14" y="50" width="36" height="6" rx="2" />
      <circle cx="20" cy="43" r="1.4" fill="currentColor" />
      <circle cx="20" cy="53" r="1.4" fill="currentColor" />
    </svg>
  );
}

const ICON_RENDERERS = {
  [PRICING_PLAN_ICON.STARTER]: StarterIcon,
  [PRICING_PLAN_ICON.PRO]: ProIcon,
  [PRICING_PLAN_ICON.ENTERPRISE]: EnterpriseIcon,
};

/* ================================================================
   PUBLIC — PricingPlanIcon
   ================================================================ */

/**
 * 요금제 카드 일러스트.
 *
 * @param {Object} props
 * @param {('starter'|'pro'|'enterprise')} props.iconKey - SVG 변형 키
 * @param {string} [props.className] - 추가 className
 */
const PricingPlanIcon = ({ iconKey, className = '' }) => {
  const Renderer = ICON_RENDERERS[iconKey];
  const wrapperClass = ['mg-v2-pricing-plan-icon', className].filter(Boolean).join(' ');

  if (!Renderer) {
    return null;
  }

  return (
    <div
      className={wrapperClass}
      data-icon-key={iconKey}
      data-testid={`pricing-plan-icon-${iconKey}`}
    >
      <Renderer />
    </div>
  );
};

PricingPlanIcon.propTypes = {
  iconKey: PropTypes.oneOf(Object.values(PRICING_PLAN_ICON)).isRequired,
  className: PropTypes.string,
};

export default PricingPlanIcon;
