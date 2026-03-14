/**
 * StatusBadge - 매칭 상태 배지
 * @param {string} status - 매칭 상태 (PENDING_PAYMENT, ACTIVE, TERMINATED 등)
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
  SUSPENDED: '일시정지'
};

const getStatusKoreanName = (status) => STATUS_KO[status] || status;

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  return (
    <span
      className={`integrated-schedule__card-status integrated-schedule__card-status--${normalized}`}
      role="status"
    >
      {getStatusKoreanName(status)}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string
};

StatusBadge.defaultProps = {
  status: ''
};

export default StatusBadge;
