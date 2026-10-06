/**
 * 서버 오류 토스트 문구. 사유는 공용 추출기와 i18n `{{message}}` 로만 잇는다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import { extractServerErrorMessageFromError } from './ajax';
import { toDisplayString } from './safeDisplay';

/**
 * 실패 토스트 문구 — 서버 사유가 있으면 {{message}} 로 보간, 없으면 사유 없는 문구.
 *
 * @param {Function} t i18n 번역 함수
 * @param {unknown} error 던져진 API 오류
 * @param {string} withMessageKey `{{message}}` 를 가진 문구 키
 * @param {string} fallbackKey 사유 없는 문구 키
 * @returns {string}
 */
export function resolveServerFailureMessage(t, error, withMessageKey, fallbackKey) {
  const serverMessage = toDisplayString(extractServerErrorMessageFromError(error), '');
  return serverMessage
    ? t(withMessageKey, { message: serverMessage })
    : t(fallbackKey);
}
