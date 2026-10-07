import i18n from 'i18next';
import { extractServerErrorMessage } from './ajax';
import { API_ERROR_MESSAGES } from '../constants/api';
import {
  GENERIC_API_ERROR_I18N_KEY,
  SERVER_ERROR_CODES,
  USER_FACING_VALIDATION_STATUSES,
  isGenericServerErrorMessage,
  isRawServerErrorText
} from '../constants/genericServerErrorMessages';

const SERVER_ERROR_CODE_SET = new Set(SERVER_ERROR_CODES);
const VALIDATION_STATUS_SET = new Set(USER_FACING_VALIDATION_STATUSES);
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

const textOf = (value) => (typeof value === 'string' ? value.trim() : '');

const bodyOf = (error) => {
  const data = error && error.response && error.response.data;
  return data && typeof data === 'object' ? data : null;
};

const statusOf = (error) => {
  const raw = error && (error.status != null ? error.status : error.response && error.response.status);
  return typeof raw === 'number' && raw > 0 ? raw : null;
};

const errorCodeOf = (body) => textOf(body && (body.errorCode || body.code));

const isNetworkError = (error) => Boolean(error) && (
  error.isNetworkError === true
  || error.name === 'TypeError'
  || error.name === 'AbortError'
  || textOf(error.message) === API_ERROR_MESSAGES.NETWORK_ERROR
);

/** 본문 필드 오류 맵(errors: { field: 문구 })을 한 줄로. */
const fieldErrorsText = (body) => {
  const errs = body && body.errors;
  if (!errs || typeof errs !== 'object' || Array.isArray(errs)) {
    return '';
  }
  return Object.values(errs).map(textOf).filter(Boolean).join(' ');
};

const isShowable = (text) => text !== '' && !isGenericServerErrorMessage(text) && !isRawServerErrorText(text);

/**
 * 서버가 사용자 문구로 표시한 오류인지.
 * 5xx·서버 오류 코드는 아니고, 4xx 검증·충돌(400·409·422)이거나 다른 4xx 에 서버 정의 코드가 있을 때.
 */
const isServerMarkedUserFacing = (status, body) => {
  if (status >= HTTP_SERVER_ERROR_MIN || status < HTTP_CLIENT_ERROR_MIN) {
    return false;
  }
  const code = errorCodeOf(body);
  if (SERVER_ERROR_CODE_SET.has(code)) {
    return false;
  }
  return VALIDATION_STATUS_SET.has(status) || code !== '';
};

/**
 * ajax·StandardizedApi 오류에서 화면에 보여 줄 문구를 고른다.
 *
 * - 서버 문구 그대로: 4xx 검증·충돌(400·409·422) 또는 서버 정의 코드가 있는 4xx 이고,
 *   문구가 예외 원문(Exception·`${`·RUNTIME_ERROR·스택·내부 경로)이 아닐 때만.
 * - 일반 문구: 5xx, 서버 오류 코드(RUNTIME_ERROR 등), 네트워크 오류, 예외 원문, 문구 없음.
 *   일반 문구는 fallback(화면 i18n 문구), 없으면 common:apiError.generic.
 * - HTTP 상태가 없는 오류(화면이 success:false 본문으로 만든 Error)는 원문 검사를 통과한 문구만 쓴다.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveUserFacingApiErrorMessage(error, fallback) {
  const generic = textOf(fallback) || i18n.t(GENERIC_API_ERROR_I18N_KEY);
  if (error == null || isNetworkError(error)) {
    return generic;
  }
  const status = statusOf(error);
  const body = bodyOf(error);
  const fromError = textOf(error.message);
  if (status === null) {
    return isShowable(fromError) ? fromError : generic;
  }
  if (!isServerMarkedUserFacing(status, body)) {
    return generic;
  }
  const candidates = [extractServerErrorMessage(body), fieldErrorsText(body), fromError];
  const found = candidates.map(textOf).find(isShowable);
  return found || generic;
}
