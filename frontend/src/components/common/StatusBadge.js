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
  PENDING: '대기중'
};

const STATUS_TO_VARIANT = {
  ACTIVE: 'success',
  PAYMENT_CONFIRMED: 'success',
  COMPLETED: 'success',
  DEPOSIT_PENDING: 'success',
  PENDING_PAYMENT: 'warning',
  PENDING: 'warning',
  SUSPENDED: 'warning',
  INACTIVE: 'neutral',
  TERMINATED: 'neutral',
  SESSIONS_EXHAUSTED: 'neutral'
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
