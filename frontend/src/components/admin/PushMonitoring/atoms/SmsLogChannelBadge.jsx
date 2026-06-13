/**
 * SmsLogChannelBadge — SMS / 알림톡 채널 표시 atom.
 *
 * 「최근 SMS/알림톡 발송」 카드의 한 셀에서 사용된다. 디자인 토큰만 사용 — 하드코딩 금지
 * (CSS 의 background/color 는 `var(--ad-b0kla-*)` / `var(--mg-color-*)` 로 정의).
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './SmsLogChannelBadge.css';

const CHANNEL_VARIANTS = Object.freeze({
  SMS: 'sms',
  ALIMTALK: 'alimtalk',
  UNKNOWN: 'unknown'
});

const resolveVariant = (channel) => {
  if (channel === 'SMS') {
    return CHANNEL_VARIANTS.SMS;
  }
  if (channel === 'ALIMTALK') {
    return CHANNEL_VARIANTS.ALIMTALK;
  }
  return CHANNEL_VARIANTS.UNKNOWN;
};

const resolveLabel = (channel) => {
  if (channel === 'SMS') {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS;
  }
  if (channel === 'ALIMTALK') {
    return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK;
  }
  return channel || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_RECIPIENT_FALLBACK;
};

const SmsLogChannelBadge = ({ channel }) => {
  const variant = resolveVariant(channel);
  const label = resolveLabel(channel);
  const className = [
    'mg-sms-log-channel-badge',
    `mg-sms-log-channel-badge--${variant}`
  ].join(' ');
  return (
    <span className={className} role="img" aria-label={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_TH_CHANNEL}: ${label}`}>
      {label}
    </span>
  );
};

SmsLogChannelBadge.propTypes = {
  channel: PropTypes.string
};

export default SmsLogChannelBadge;
export { CHANNEL_VARIANTS as SMS_LOG_CHANNEL_VARIANTS };
