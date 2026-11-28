/**
 * SCT 공개 — 본인확인 세션 필요 오류 판별
 *
 * @author MindGarden
 * @since 2026-03-27
 */

import { SCT_ERROR_CODE } from '../constants/sctOnline';

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
