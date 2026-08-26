/**
 * 테넌트 프로필 — 빈 상태 기하 아이콘 (장식 SVG 제거)
 *
 * Spec: CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC §7.2
 * 32px Lucide stroke + 텍스트 설명으로 간소화.
 *
 * @author CoreSolution
 * @since 2026-05-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CalendarCheck, CreditCard } from 'lucide-react';
import './TenantProfileIllustrations.css';

const ILLUSTRATION_SIZE = 32;

/**
 * 구독 정보 빈 상태 아이콘
 */
export const TenantSubscriptionEmptyIllustration = ({ size = ILLUSTRATION_SIZE, className = '' }) => {
  const wrapperClass = ['mg-v2-tenant-profile__illustration', className].filter(Boolean).join(' ');
  return (
    <CalendarCheck
      className={wrapperClass}
      size={size}
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
    />
  );
};

TenantSubscriptionEmptyIllustration.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string
};

/**
 * 결제 수단 빈 상태 아이콘
 */
export const TenantPaymentEmptyIllustration = ({ size = ILLUSTRATION_SIZE, className = '' }) => {
  const wrapperClass = ['mg-v2-tenant-profile__illustration', className].filter(Boolean).join(' ');
  return (
    <CreditCard
      className={wrapperClass}
      size={size}
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
    />
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
