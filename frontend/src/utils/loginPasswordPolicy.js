/**
 * 로그인 비밀번호 정책 검증 — 프론트 단일 진입점.
 *
 * 규칙 순서·코드는 백엔드 PasswordPolicy.collectLoginStorageViolations 와 같다.
 * 상수는 constants/passwordPolicyUi.js 만, 문구는 i18n(common:passwordPolicy.*) 만 쓴다.
 * i18n 초기화(src/i18n)는 앱 진입점이 맡고, 이 모듈은 같은 i18next 기본 인스턴스만 읽는다
 * (utils/common·validationUtils 가 import 해도 i18n 초기화 부수효과가 생기지 않게).
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
import i18n from 'i18next';
import {
  LOGIN_PASSWORD_ALLOWED_SPECIALS,
  LOGIN_PASSWORD_COMMON_SUBSTRINGS,
  LOGIN_PASSWORD_FORBIDDEN_RUN_LENGTH,
  LOGIN_PASSWORD_MAX_LENGTH,
  LOGIN_PASSWORD_MIN_LENGTH,
  LOGIN_PASSWORD_VIOLATION,
  PASSWORD_INPUT_ERROR,
  PASSWORD_POLICY_I18N
} from '../constants/passwordPolicyUi';

const escapeForCharClass = (chars) => chars.replace(/[\\\]^-]/g, '\\$&');

const SPECIALS_CLASS = escapeForCharClass(LOGIN_PASSWORD_ALLOWED_SPECIALS);
const LOGIN_CHARSET_PATTERN = new RegExp(`^[A-Za-z\\d${SPECIALS_CLASS}]+$`);
const SPECIAL_PATTERN = new RegExp(`[${SPECIALS_CLASS}]`);
const REPEAT_PATTERN = new RegExp(`(.)\\1{${LOGIN_PASSWORD_FORBIDDEN_RUN_LENGTH - 1},}`);

function hasSequentialRun(password) {
  const run = LOGIN_PASSWORD_FORBIDDEN_RUN_LENGTH;
  for (let i = 0; i + run <= password.length; i += 1) {
    let up = true;
    let down = true;
    for (let k = 1; k < run; k += 1) {
      const diff = password.charCodeAt(i + k) - password.charCodeAt(i + k - 1);
      up = up && diff === 1;
      down = down && diff === -1;
    }
    if (up || down) {
      return true;
    }
  }
  return false;
}

/**
 * 일반 단어 포함 여부 — 대소문자 무시 부분 일치(서버 PasswordPolicy.isCommonPattern 과 같음).
 *
 * @param {unknown} plain
 * @returns {boolean}
 */
export function containsLoginPasswordCommonSubstring(plain) {
  if (plain == null) {
    return false;
  }
  const lower = String(plain).toLowerCase();
  return LOGIN_PASSWORD_COMMON_SUBSTRINGS.some((p) => lower.includes(p));
}

/**
 * 첫 정책 위반 코드. 통과 시 null.
 *
 * @param {unknown} plain
 * @returns {string|null} LOGIN_PASSWORD_VIOLATION 값
 */
export function getLoginPasswordViolationCode(plain) {
  const password = plain == null ? '' : String(plain);
  if (password.length < LOGIN_PASSWORD_MIN_LENGTH) {
    return LOGIN_PASSWORD_VIOLATION.TOO_SHORT;
  }
  if (password.length > LOGIN_PASSWORD_MAX_LENGTH) {
    return LOGIN_PASSWORD_VIOLATION.TOO_LONG;
  }
  if (!LOGIN_CHARSET_PATTERN.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.INVALID_CHARACTERS;
  }
  if (!/[a-z]/.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.LOWERCASE_REQUIRED;
  }
  if (!/[A-Z]/.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.UPPERCASE_REQUIRED;
  }
  if (!/\d/.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.DIGIT_REQUIRED;
  }
  if (!SPECIAL_PATTERN.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.SPECIAL_REQUIRED;
  }
  if (hasSequentialRun(password)) {
    return LOGIN_PASSWORD_VIOLATION.CONSECUTIVE_FORBIDDEN;
  }
  if (REPEAT_PATTERN.test(password)) {
    return LOGIN_PASSWORD_VIOLATION.REPEATED_FORBIDDEN;
  }
  if (containsLoginPasswordCommonSubstring(password)) {
    return LOGIN_PASSWORD_VIOLATION.COMMON_PATTERN;
  }
  return null;
}

/**
 * @param {unknown} plain
 * @returns {boolean}
 */
export function isLoginPasswordCompliant(plain) {
  return getLoginPasswordViolationCode(plain) === null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isBlankPassword(value) {
  return value == null || String(value).trim() === '';
}

/**
 * 화면 입력 검증. allowEmpty 이면 빈 값(공백만 포함)은 통과한다(서버가 임시 비밀번호 발급).
 *
 * @param {unknown} value
 * @param {{ allowEmpty?: boolean, requireConfirm?: boolean, confirmValue?: unknown }} [options]
 * @returns {{ valid: boolean, errorCode: string|null, confirmErrorCode: string|null }}
 */
export function validatePasswordPolicyInput(value, options = {}) {
  const { allowEmpty = false, requireConfirm = false, confirmValue } = options;
  let errorCode = null;
  if (isBlankPassword(value)) {
    errorCode = allowEmpty ? null : PASSWORD_INPUT_ERROR.REQUIRED;
  } else {
    errorCode = getLoginPasswordViolationCode(value);
  }
  let confirmErrorCode = null;
  if (requireConfirm && !(allowEmpty && isBlankPassword(value))) {
    if (isBlankPassword(confirmValue)) {
      confirmErrorCode = PASSWORD_INPUT_ERROR.CONFIRM_REQUIRED;
    } else if (String(confirmValue) !== String(value == null ? '' : value)) {
      confirmErrorCode = PASSWORD_INPUT_ERROR.CONFIRM_MISMATCH;
    }
  }
  return { valid: errorCode === null && confirmErrorCode === null, errorCode, confirmErrorCode };
}

const POLICY_PARAMS = Object.freeze({
  min: LOGIN_PASSWORD_MIN_LENGTH,
  max: LOGIN_PASSWORD_MAX_LENGTH,
  specials: LOGIN_PASSWORD_ALLOWED_SPECIALS
});

const resolveT = (t) => (typeof t === 'function' ? t : i18n.t.bind(i18n));

const INPUT_ERROR_CODES = new Set(Object.values(PASSWORD_INPUT_ERROR));

/**
 * 오류 코드 → 화면 문구. 정책 위반이면 위반 사유 뒤에 전체 정책 안내를 붙인다.
 *
 * @param {string|null} code
 * @param {Function} [t]
 * @returns {string}
 */
export function formatPasswordPolicyError(code, t) {
  if (!code) {
    return '';
  }
  const tr = resolveT(t);
  const reason = tr(`${PASSWORD_POLICY_I18N.VIOLATION_PREFIX}${code}`, POLICY_PARAMS);
  if (INPUT_ERROR_CODES.has(code)) {
    return reason;
  }
  return `${reason} ${tr(PASSWORD_POLICY_I18N.GUIDANCE, POLICY_PARAMS)}`;
}

/**
 * 첫 정책 위반 문구(위반 사유만). 통과 시 null.
 *
 * @param {unknown} plain
 * @param {Function} [t]
 * @returns {string|null}
 */
export function getFirstLoginPasswordViolationMessage(plain, t) {
  const code = getLoginPasswordViolationCode(plain);
  return code ? resolveT(t)(`${PASSWORD_POLICY_I18N.VIOLATION_PREFIX}${code}`, POLICY_PARAMS) : null;
}

/**
 * 입력란 아래 정책 힌트.
 *
 * @param {Function} [t]
 * @param {{ allowEmpty?: boolean }} [options]
 * @returns {string}
 */
export function getPasswordPolicyHint(t, options = {}) {
  const tr = resolveT(t);
  const hint = tr(PASSWORD_POLICY_I18N.HINT, POLICY_PARAMS);
  return options.allowEmpty ? `${hint} ${tr(PASSWORD_POLICY_I18N.OPTIONAL_HINT)}` : hint;
}

/**
 * @param {Function} [t]
 * @returns {string}
 */
export function getPasswordPolicyPlaceholder(t) {
  return resolveT(t)(PASSWORD_POLICY_I18N.PLACEHOLDER, POLICY_PARAMS);
}
