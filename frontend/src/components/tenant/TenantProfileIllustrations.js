/**
 * 테넌트 프로필 — B0KlA 빈 상태 일러스트 (Subscription / Payment)
 *
 * - 디자인 핸드오프 §C 명세에 따른 인라인 SVG.
 *   - 100 x 100 viewBox
 *   - Base: var(--ad-b0kla-bg) — Surface
 *   - Stroke/Line: var(--ad-b0kla-border) — Border
 *   - Accent: var(--ad-b0kla-green) — Primary B0KlA green
 * - 장식용 그래픽이므로 `aria-hidden="true"` 처리.
 *
 * @author CoreSolution
 * @since 2026-05-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TenantProfileIllustrations.css';

const ILLUSTRATION_SIZE = 100;

/**
 * 구독 정보 빈 상태 일러스트 (달력 + 체크리스트)
 */
export const TenantSubscriptionEmptyIllustration = ({ size = ILLUSTRATION_SIZE, className = '' }) => {
  const wrapperClass = ['mg-v2-tenant-profile__illustration', className].filter(Boolean).join(' ');
  return (
    <svg
      className={wrapperClass}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 카드 베이스 (달력 본체) */}
      <rect
        x="14"
        y="22"
        width="72"
        height="64"
        rx="10"
        ry="10"
        className="mg-v2-tenant-profile__illustration-surface"
      />
      {/* 상단 행(달력 헤더) */}
      <rect
        x="14"
        y="22"
        width="72"
        height="16"
        rx="10"
        ry="10"
        className="mg-v2-tenant-profile__illustration-accent"
      />
      <rect
        x="14"
        y="32"
        width="72"
        height="6"
        className="mg-v2-tenant-profile__illustration-accent"
      />
      {/* 달력 고리 */}
      <rect x="30" y="14" width="4" height="14" rx="2" ry="2" className="mg-v2-tenant-profile__illustration-stroke" />
      <rect x="66" y="14" width="4" height="14" rx="2" ry="2" className="mg-v2-tenant-profile__illustration-stroke" />
      {/* 체크리스트 라인 */}
      <line x1="26" y1="50" x2="74" y2="50" className="mg-v2-tenant-profile__illustration-line" />
      <line x1="26" y1="62" x2="66" y2="62" className="mg-v2-tenant-profile__illustration-line" />
      <line x1="26" y1="74" x2="58" y2="74" className="mg-v2-tenant-profile__illustration-line" />
      {/* 체크 마크 (Accent) */}
      <polyline
        points="74,60 78,64 86,56"
        className="mg-v2-tenant-profile__illustration-check"
      />
    </svg>
  );
};

TenantSubscriptionEmptyIllustration.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string
};

/**
 * 결제 수단 빈 상태 일러스트 (지갑 + 신용카드)
 */
export const TenantPaymentEmptyIllustration = ({ size = ILLUSTRATION_SIZE, className = '' }) => {
  const wrapperClass = ['mg-v2-tenant-profile__illustration', className].filter(Boolean).join(' ');
  return (
    <svg
      className={wrapperClass}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 지갑 본체 */}
      <rect
        x="14"
        y="30"
        width="72"
        height="48"
        rx="8"
        ry="8"
        className="mg-v2-tenant-profile__illustration-surface"
      />
      {/* 신용카드 (앞면) */}
      <rect
        x="22"
        y="22"
        width="56"
        height="36"
        rx="6"
        ry="6"
        className="mg-v2-tenant-profile__illustration-accent"
      />
      {/* 카드 자기띠 */}
      <rect
        x="22"
        y="30"
        width="56"
        height="6"
        className="mg-v2-tenant-profile__illustration-stroke-block"
      />
      {/* 카드 번호 라인 */}
      <line x1="30" y1="46" x2="46" y2="46" className="mg-v2-tenant-profile__illustration-card-line" />
      <line x1="50" y1="46" x2="66" y2="46" className="mg-v2-tenant-profile__illustration-card-line" />
      {/* 지갑 클립 */}
      <rect
        x="60"
        y="50"
        width="20"
        height="14"
        rx="4"
        ry="4"
        className="mg-v2-tenant-profile__illustration-clip"
      />
      <circle
        cx="74"
        cy="57"
        r="3"
        className="mg-v2-tenant-profile__illustration-clip-dot"
      />
    </svg>
  );
};

TenantPaymentEmptyIllustration.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string
};

export default {
  TenantSubscriptionEmptyIllustration,
  TenantPaymentEmptyIllustration
};
