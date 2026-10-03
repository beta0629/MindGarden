/**
 * 토스트 표시 시간 계산 (NOTIFICATION_DURATION SSOT)
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import { NOTIFICATION_DURATION } from '../constants/notificationTiming';

/**
 * 알림 메시지에서 길이 계산용 텍스트를 뽑는다. (문자열 또는 { message, title } payload)
 *
 * @param {*} message
 * @returns {string}
 */
export const getNotificationText = (message) => {
  if (typeof message === 'string') {
    return message;
  }
  if (message && typeof message === 'object') {
    const inner = message.message ?? message.title;
    return typeof inner === 'string' ? inner : '';
  }
  if (typeof message === 'number') {
    return String(message);
  }
  return '';
};

const isExplicitDuration = (duration) =>
  typeof duration === 'number' && Number.isFinite(duration) && duration > 0;

/**
 * 표시 시간(ms)을 계산한다.
 * - 명시 duration(양수)이 있으면 그대로 쓴다.
 * - 없으면 타입별 기본값 + 기준 글자 수 초과분에 대해 단계별 가산, 최대 MAX_MS.
 *
 * @param {*} message 알림 메시지
 * @param {string} [type] success | error | warning | info
 * @param {number} [explicitDuration] 호출부 명시 시간(ms)
 * @returns {number}
 */
export const resolveNotificationDuration = (message, type, explicitDuration) => {
  if (isExplicitDuration(explicitDuration)) {
    return explicitDuration;
  }
  const {
    BY_TYPE,
    FALLBACK_TYPE,
    LONG_TEXT_THRESHOLD_CHARS,
    LONG_TEXT_STEP_CHARS,
    LONG_TEXT_STEP_MS,
    MAX_MS
  } = NOTIFICATION_DURATION;
  const key = String(type || FALLBACK_TYPE).toLowerCase();
  const base = BY_TYPE[key] ?? BY_TYPE[FALLBACK_TYPE];
  const length = Array.from(getNotificationText(message)).length;
  const overflow = length - LONG_TEXT_THRESHOLD_CHARS;
  const extra = overflow > 0 ? Math.ceil(overflow / LONG_TEXT_STEP_CHARS) * LONG_TEXT_STEP_MS : 0;
  return Math.min(base + extra, MAX_MS);
};
