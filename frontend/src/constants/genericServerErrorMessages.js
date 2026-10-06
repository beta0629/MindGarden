import { API_ERROR_MESSAGES } from './api';
import { AJAX_SERVER_ERROR_SHORT } from './ajaxUserMessages';
import { COMMON_MESSAGES } from './messages';

/**
 * HTTP 5xx 사용자 문구.
 * 백엔드 {@code ServerErrorMessages.INTERNAL_SERVER_ERROR} 와 같은 문장이다.
 * 이 문구(또는 프런트 공통 5xx 문구)만 오면 화면별 fallback 을 쓴다.
 */
export const SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE =
  '요청을 처리하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 관리자에게 문의해 주세요.';

/**
 * 원인 없는 일반 5xx 문구. 구체 메시지(비밀번호 정책·409 중복 등)는 포함하지 않는다.
 * @type {readonly string[]}
 */
export const GENERIC_SERVER_ERROR_USER_MESSAGES = Object.freeze([
  API_ERROR_MESSAGES.SERVER_ERROR,
  AJAX_SERVER_ERROR_SHORT,
  COMMON_MESSAGES.SERVER_ERROR,
  SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE,
  '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
]);

const GENERIC_SERVER_ERROR_MESSAGE_SET = new Set(
  GENERIC_SERVER_ERROR_USER_MESSAGES.map((message) => message.trim())
);

/**
 * @param {unknown} message
 * @returns {boolean} 비어 있거나 일반 5xx 문구이면 true
 */
export function isGenericServerErrorMessage(message) {
  if (typeof message !== 'string') {
    return true;
  }
  const text = message.trim();
  if (text === '') {
    return true;
  }
  return GENERIC_SERVER_ERROR_MESSAGE_SET.has(text);
}
