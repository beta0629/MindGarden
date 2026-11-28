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
