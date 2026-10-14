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

/** 사용자 일반 오류 문구 i18n 키 (5xx·예외 원문·네트워크 오류일 때). */
export const GENERIC_API_ERROR_I18N_KEY = 'common:apiError.generic';

/**
 * 백엔드 GlobalExceptionHandler.sanitizedServerError 가 쓰는 서버 오류 코드.
 * 이 코드가 오면 4xx 여도 본문 문구를 보여 주지 않는다.
 * @type {readonly string[]}
 */
export const SERVER_ERROR_CODES = Object.freeze([
  'RUNTIME_ERROR',
  'INTERNAL_SERVER_ERROR',
  'TRANSACTION_SYSTEM_ERROR',
  'UNEXPECTED_ERROR'
]);

/** 본문 문구를 그대로 보여 줄 수 있는 4xx 검증·충돌 상태 (코드 없이도 사용자 문구로 본다). */
export const USER_FACING_VALIDATION_STATUSES = Object.freeze([400, 409, 422]);

/**
 * 예외 원문·스택·템플릿 미치환·내부 경로처럼 화면에 그대로 내보내면 안 되는 문구.
 * @type {readonly RegExp[]}
 */
export const RAW_SERVER_ERROR_TEXT_PATTERNS = Object.freeze([
  /Exception/,
  /\$\{/,
  /RUNTIME_ERROR/,
  /\bat\s+[\w$]+(?:\.[\w$<>]+)+\(/,
  /\b(?:java|javax|jakarta|org|com)\.[a-z]\w*\.[\w.]+/,
  /\/api\//,
  /^(?:Bad Request|Unauthorized|Forbidden|Not Found|Conflict|Unprocessable Entity|Internal Server Error)$/i
]);

/**
 * @param {unknown} message
 * @returns {boolean} 예외 원문·스택 등 기술 문구이면 true
 */
export function isRawServerErrorText(message) {
  if (typeof message !== 'string') {
    return false;
  }
  return RAW_SERVER_ERROR_TEXT_PATTERNS.some((pattern) => pattern.test(message));
}

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
