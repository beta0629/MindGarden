/**
 * 예약 문자 SMS 상태 → 표시(라벨/툴팁/aria) mapper SSOT.
 * molecule 밖 단일 util — CardMeta·캘린더·Compact 이중 로직 금지.
 *
 * @author MindGarden
 * @since 2026-08-01
 */

import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  CLIENT_REMINDER_SMS_ARIA_PREFIX,
  CLIENT_REMINDER_SMS_BADGE_STATUS_VARIANT,
  CLIENT_REMINDER_SMS_LABEL,
  CLIENT_REMINDER_SMS_STATUS,
  CLIENT_REMINDER_SMS_TOOLTIP_PREFIX
} from '../../../../../constants/scheduleClientReminderSms';

const VISIBLE_STATUSES = new Set([
  CLIENT_REMINDER_SMS_STATUS.SENT,
  CLIENT_REMINDER_SMS_STATUS.PENDING,
  CLIENT_REMINDER_SMS_STATUS.FAILED
]);

/**
 * ISO datetime / LocalDateTime 문자열에서 HH:mm 추출.
 * @param {*} raw
 * @returns {string}
 */
export function formatReminderSmsClock(raw) {
  const text = toDisplayString(raw, '');
  if (!text) {
    return '';
  }
  const match = text.match(/T(\d{2}):(\d{2})/) || text.match(/\s(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return '';
}

/**
 * @param {object|null|undefined} sms - API clientReminderSms
 * @returns {{
 *   status: string,
 *   label: string,
 *   tooltip: string,
 *   ariaLabel: string,
 *   statusVariant: string
 * }|null} 숨김이면 null
 */
export function resolveScheduleReminderSmsDisplay(sms) {
  if (sms == null || typeof sms !== 'object') {
    return null;
  }
  const status = toDisplayString(sms.status, '').toUpperCase();
  if (!VISIBLE_STATUSES.has(status)) {
    return null;
  }

  const label = CLIENT_REMINDER_SMS_LABEL[status] || '';
  const statusVariant = CLIENT_REMINDER_SMS_BADGE_STATUS_VARIANT[status] || 'neutral';
  const prefix = CLIENT_REMINDER_SMS_TOOLTIP_PREFIX[status] || '';

  let detail = '';
  if (status === CLIENT_REMINDER_SMS_STATUS.PENDING) {
    detail = formatReminderSmsClock(sms.fireAt) || formatReminderSmsClock(sms.sentAt);
  } else if (status === CLIENT_REMINDER_SMS_STATUS.SENT) {
    detail = formatReminderSmsClock(sms.sentAt);
  } else if (status === CLIENT_REMINDER_SMS_STATUS.FAILED) {
    detail = toDisplayString(sms.failureReason, '');
  }

  let tooltip = label;
  if (detail) {
    tooltip = `${prefix}: ${detail}`;
  } else if (prefix) {
    tooltip = `${prefix}: ${label}`;
  }

  const ariaDetail = detail ? `. ${tooltip}` : '';
  const ariaLabel = `${CLIENT_REMINDER_SMS_ARIA_PREFIX}: ${label}${ariaDetail}`;

  return {
    status,
    label: toDisplayString(label, ''),
    tooltip: toDisplayString(tooltip, ''),
    ariaLabel: toDisplayString(ariaLabel, ''),
    statusVariant
  };
}

export { VISIBLE_STATUSES as SCHEDULE_REMINDER_SMS_VISIBLE_STATUSES };
