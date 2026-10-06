/**
 * 일정 확정·취소 실패 토스트 문구.
 * i18n 보간 `{{message}}` 와 서버 메시지 추출을 한곳에서 맞춘다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import { extractServerErrorMessage } from './ajax';
import { toDisplayString, toErrorMessage } from './safeDisplay';

/**
 * 실패 토스트에 넣을 문자열. 서버 사유가 있으면 보간하고, 없으면 폴백 키를 쓴다.
 * 결과에 `${` 리터럴이 남지 않도록 템플릿 문자열을 i18n에 넣지 않는다.
 *
 * @param {function} t i18n t
 * @param {*} error 잡은 오류
 * @param {string} withReasonKey `{{message}}` 보간 키
 * @param {string} fallbackKey 사유가 없을 때 키
 * @returns {string}
 */
export function resolveScheduleActionFailureMessage(t, error, withReasonKey, fallbackKey) {
  const serverMessage = extractServerErrorMessage(error?.response?.data);
  const thrownMessage = error instanceof Error || typeof error?.message === 'string'
    ? toErrorMessage(error, '')
    : '';
  const visibleReason = toDisplayString(serverMessage || thrownMessage, '').trim();
  if (!visibleReason || visibleReason === '{}') {
    return t(fallbackKey);
  }
  return t(withReasonKey, { message: visibleReason });
}
