/**
 * SmsLogRow — 최근 SMS/알림톡 발송 카드 1행 (Molecule).
 *
 * 시각 / 채널(배지) / 템플릿코드 / 대상자 / 상태(배지) / 오류 메시지 컬럼 구성.
 * PII 가드: `recipientPhone` 은 백엔드에서 이미 마스킹된 값을 그대로 사용한다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */

import React from 'react';
import PropTypes from 'prop-types';
import SmsLogChannelBadge from '../atoms/SmsLogChannelBadge';
import SmsLogStatusBadge from '../atoms/SmsLogStatusBadge';
import PushMonitorMaskedRecipient from '../atoms/PushMonitorMaskedRecipient';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './SmsLogRow.css';

const formatTime = (iso) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return String(iso);
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
};

const SmsLogRow = ({ entry }) => {
  const recipientLabel = entry.recipientName
    || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK;
  const errorText = entry.errorMessage || '';
  const ariaLabel = [
    formatTime(entry.createdAt),
    entry.channelUsed || '',
    entry.templateCode || '',
    recipientLabel,
    entry.successFlag === true
      ? ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_SUCCESS
      : ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_FAILURE
  ].join(' ');
  return (
    <li
      className="mg-sms-log-row"
      role="row"
      aria-label={ariaLabel}
      data-testid="sms-log-row"
    >
      <span className="mg-sms-log-row__time" role="cell">{formatTime(entry.createdAt)}</span>
      <span className="mg-sms-log-row__channel" role="cell">
        <SmsLogChannelBadge channel={entry.channelUsed} />
      </span>
      <span className="mg-sms-log-row__template" role="cell">
        {entry.templateCode || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK}
      </span>
      <span className="mg-sms-log-row__recipient" role="cell">
        <span className="mg-sms-log-row__recipient-name">{recipientLabel}</span>
        {entry.recipientPhone ? (
          <PushMonitorMaskedRecipient
            value={entry.recipientPhone}
            ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_RECIPIENT}: ${entry.recipientPhone}`}
          />
        ) : null}
      </span>
      <span className="mg-sms-log-row__status" role="cell">
        <SmsLogStatusBadge successFlag={entry.successFlag} />
      </span>
      <span className="mg-sms-log-row__error" role="cell" title={errorText}>
        {errorText}
      </span>
    </li>
  );
};

SmsLogRow.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    templateCode: PropTypes.string,
    channelUsed: PropTypes.string,
    targetType: PropTypes.string,
    targetId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    recipientUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    recipientName: PropTypes.string,
    recipientPhone: PropTypes.string,
    successFlag: PropTypes.bool,
    errorCode: PropTypes.string,
    errorMessage: PropTypes.string,
    createdAt: PropTypes.string
  }).isRequired
};

export default SmsLogRow;
