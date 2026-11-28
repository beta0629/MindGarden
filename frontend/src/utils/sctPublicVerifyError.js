/**
 * SCT 공개 — 본인확인 세션 필요 오류 판별
 *
 * @author MindGarden
 * @since 2026-03-27
 */

import { SCT_ERROR_CODE, SCT_UI } from '../constants/sctOnline';
import { resolveUserFacingApiErrorMessage } from './userFacingApiErrorMessage';

const VERIFY_REQUIRED_MSG_HINT = '본인 확인이 필요';

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSctVerifyRequiredError(error) {
  if (error == null || typeof error !== 'object') {
    return false;
  }
  const body = error.response && typeof error.response.data === 'object'
    ? error.response.data
    : null;
  const code = (body && (body.errorCode || body.code))
    || error.errorCode
    || error.code
    || '';
  if (String(code) === SCT_ERROR_CODE.VERIFY_REQUIRED) {
    return true;
  }
  const message = String(
    (body && body.message)
      || error.message
      || ''
  );
  if (message.includes(VERIFY_REQUIRED_MSG_HINT)) {
    return true;
  }
  const status = typeof error.status === 'number'
    ? error.status
    : (error.response && typeof error.response.status === 'number'
      ? error.response.status
      : null);
  return status === 401 && message.includes(VERIFY_REQUIRED_MSG_HINT);
}

const HTTP_NOT_FOUND = 404;
const HTTP_GONE = 410;

const statusOfError = (error) => {
  if (error == null || typeof error !== 'object') {
    return null;
  }
  if (typeof error.status === 'number') {
    return error.status;
  }
  return error.response && typeof error.response.status === 'number'
    ? error.response.status
    : null;
};

const codeOfError = (error) => {
  if (error == null || typeof error !== 'object') {
    return '';
  }
  const body = error.response && typeof error.response.data === 'object'
    ? error.response.data
    : null;
  return String((body && (body.errorCode || body.code)) || error.errorCode || error.code || '');
};

/**
 * 공개 링크(단축 링크 교환 코드) 사용 시간 초과 — 410 + SCT_LINK_SESSION_EXPIRED.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSctLinkSessionExpiredError(error) {
  return codeOfError(error) === SCT_ERROR_CODE.LINK_SESSION_EXPIRED;
}

/**
 * 작성 중 링크로 더 이상 저장·제출할 수 없는 오류(404 없음 · 410 만료/취소).
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSctLinkUnusableError(error) {
  const status = statusOfError(error);
  return status === HTTP_NOT_FOUND || status === HTTP_GONE
    || isSctLinkSessionExpiredError(error);
}

/**
 * 센터가 취소한 초대 — 410 + SCT_LINK_CANCELLED.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSctLinkCancelledError(error) {
  return codeOfError(error) === SCT_ERROR_CODE.LINK_CANCELLED;
}

/**
 * 재발급·재발송으로 닫힌 이전 링크 — 410 + SCT_LINK_REISSUED.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isSctLinkReissuedError(error) {
  return codeOfError(error) === SCT_ERROR_CODE.LINK_REISSUED;
}

/**
 * 429 본문 {@code data.retryAfterSeconds}(남은 대기 초). 없으면 null.
 * @param {unknown} error
 * @returns {number|null}
 */
export function getSctRetryAfterSeconds(error) {
  const body = error && error.response && typeof error.response.data === 'object'
    ? error.response.data
    : null;
  const raw = body && body.data && body.data.retryAfterSeconds;
  const sec = Number(raw);
  return Number.isFinite(sec) && sec > 0 ? Math.ceil(sec) : null;
}

const SECONDS_PER_MINUTE = 60;
const HANGUL = /[가-힣]/;

const retryHint = (error) => {
  const sec = getSctRetryAfterSeconds(error);
  if (sec == null) {
    return '';
  }
  return sec < SECONDS_PER_MINUTE
    ? SCT_UI.ERR_RETRY_AFTER_SECONDS(sec)
    : SCT_UI.ERR_RETRY_AFTER_MINUTES(Math.ceil(sec / SECONDS_PER_MINUTE));
};

const withRetry = (base, error) => {
  const hint = retryHint(error);
  return hint ? `${base} ${hint}` : base;
};

/**
 * SCT 공개 화면 오류 문구 — 에러코드 → 한글 문구 매핑. 서버·예외 원문(영문 등)은 노출하지 않는다.
 * 매핑이 없으면 공통 사용자 문구 규칙을 거친 뒤에도 한글이 아니면 fallback.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveSctPublicErrorMessage(error, fallback) {
  const safeFallback = fallback || SCT_UI.ERR_GENERIC;
  const code = codeOfError(error);
  switch (code) {
    case SCT_ERROR_CODE.SESSION_INVALIDATED:
      return SCT_UI.ERR_SESSION_INVALIDATED;
    case SCT_ERROR_CODE.OTP_INVALID:
      return SCT_UI.ERR_OTP_INVALID;
    case SCT_ERROR_CODE.OTP_EXPIRED:
      return SCT_UI.ERR_OTP_EXPIRED;
    case SCT_ERROR_CODE.OTP_RATE_LIMITED:
      return withRetry(SCT_UI.ERR_OTP_RATE_LIMITED, error);
    case SCT_ERROR_CODE.OTP_LOCKED:
    case SCT_ERROR_CODE.VERIFY_LOCKED:
      return withRetry(SCT_UI.ERR_OTP_LOCKED, error);
    case SCT_ERROR_CODE.LINK_CANCELLED:
      return SCT_UI.CANCELLED_BODY;
    case SCT_ERROR_CODE.LINK_REISSUED:
      return SCT_UI.ERR_LINK_REISSUED;
    case SCT_ERROR_CODE.LINK_SESSION_EXPIRED:
      return SCT_UI.LINK_SESSION_EXPIRED;
    case SCT_ERROR_CODE.GONE:
      return SCT_UI.ERR_LINK_GONE;
    case SCT_ERROR_CODE.ENTITY_NOT_FOUND:
      return SCT_UI.ERR_LINK_NOT_FOUND;
    default:
      break;
  }
  const resolved = resolveUserFacingApiErrorMessage(error, safeFallback);
  return HANGUL.test(resolved) ? resolved : safeFallback;
}
