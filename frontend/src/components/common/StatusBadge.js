/**
 * StatusBadge - 매칭 상태 표시 배지
 * status→variant 매핑, STATUS_KO 한글 라벨 적용
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StatusBadge.css';

const STATUS_KO = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  DEPOSIT_PENDING: '승인 대기',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진',
  SUSPENDED: '일시정지',
  COMPLETED: '완료',
  PENDING: '대기중',
  ACTIVE_MAPPING: '활성',
  INACTIVE_MAPPING: '비활성',
  TERMINATED_MAPPING: '종료',
  SESSIONS_EXHAUSTED_MAPPING: '회기 소진'
};

/** 사용자/내담자/상담사 상태 및 매칭 상태 → variant 매핑 (BADGE_STYLE_UNIFICATION_PLAN) */
const STATUS_TO_VARIANT = {
  /* 사용자 상태 */
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  PENDING: 'warning',
  SUSPENDED: 'warning',
  COMPLETED: 'success',
  TERMINATED: 'neutral',
  /* 매칭/결제 */
  PAYMENT_CONFIRMED: 'success',
  DEPOSIT_PENDING: 'success',
  PENDING_PAYMENT: 'warning',
  SESSIONS_EXHAUSTED: 'neutral',
  /* 매핑 상태 (MAPPING_STATUS) */
  ACTIVE_MAPPING: 'success',
  INACTIVE_MAPPING: 'neutral',
  TERMINATED_MAPPING: 'neutral',
  SESSIONS_EXHAUSTED_MAPPING: 'neutral'
};

const VALID_VARIANTS = new Set(['success', 'warning', 'neutral', 'danger', 'info']);

function getVariant(status, variantProp) {
  if (variantProp && VALID_VARIANTS.has(variantProp)) {
    return variantProp;
  }
  const mapped = STATUS_TO_VARIANT[status];
  return mapped || 'neutral';
}

function StatusBadge({ status = '', variant, children, className = '', ...rest }) {
  const resolvedVariant = getVariant(status, variant);
  const displayStatus = status || '—';
  const label = children == null
    ? (STATUS_KO[status] != null ? STATUS_KO[status] : displayStatus)
    : children;
  const classNames = ['mg-v2-status-badge', `mg-v2-badge--${resolvedVariant}`, className].filter(Boolean).join(' ');

  return (
    <span
      className={classNames}
      role="status"
      {...rest}
    >
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'warning', 'neutral', 'danger', 'info']),
  children: PropTypes.node,
  className: PropTypes.string
};

StatusBadge.defaultProps = {
  status: '',
  variant: undefined,
  children: undefined,
  className: ''
};

export default StatusBadge;
