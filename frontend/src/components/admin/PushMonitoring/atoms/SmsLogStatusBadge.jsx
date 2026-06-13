/**
 * SmsLogStatusBadge — 발송 성공·실패·대기 상태 표시 atom.
 *
 * `successFlag` 가 true / false / null 인 3가지 경우를 색상 변형으로 구분한다.
 * 디자인 토큰만 사용 (CSS).
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './SmsLogStatusBadge.css';

const STATUS_VARIANTS = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
  PENDING: 'pending'
});

const resolveVariant = (successFlag) => {
  if (successFlag === true) {
    return STATUS_VARIANTS.SUCCESS;
  }
  if (successFlag === false) {
    return STATUS_VARIANTS.FAILURE;
  }
  return STATUS_VARIANTS.PENDING;
};

const resolveLabel = (successFlag) => {
  if (successFlag === true) {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_SUCCESS;
  }
  if (successFlag === false) {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_FAILURE;
  }
  return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_PENDING;
};

const SmsLogStatusBadge = ({ successFlag }) => {
  const variant = resolveVariant(successFlag);
  const label = resolveLabel(successFlag);
  const className = [
    'mg-sms-log-status-badge',
    `mg-sms-log-status-badge--${variant}`
  ].join(' ');
  return (
    <span className={className} role="img" aria-label={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_STATUS}: ${label}`}>
      {label}
    </span>
  );
};

SmsLogStatusBadge.propTypes = {
  successFlag: PropTypes.bool
};

export default SmsLogStatusBadge;
export { STATUS_VARIANTS as SMS_LOG_STATUS_VARIANTS };
