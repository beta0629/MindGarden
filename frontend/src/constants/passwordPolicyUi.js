/**
 * 로그인 비밀번호 저장 정책 — 프론트 단일 상수 파일.
 *
 * 값은 백엔드 {@code com.coresolution.core.security.PasswordPolicy} 와 같아야 한다.
 * 양쪽 모두 {@code src/test/resources/password-policy/login-password-policy-parity.json} 픽스처로 검사한다
 * (BE PasswordPolicyParityFixtureTest · FE loginPasswordPolicy.parity.test.js).
 * 검증 로직은 {@code utils/loginPasswordPolicy.js}, 화면 입력은 {@code hooks/usePasswordPolicyField.js}·
 * {@code components/common/PasswordPolicyInput.js} 만 사용한다.
 *
 * @author CoreSolution
 */

/** @type {number} */
export const LOGIN_PASSWORD_MIN_LENGTH = 8;

/** @type {number} */
export const LOGIN_PASSWORD_MAX_LENGTH = 100;

/** @type {string} */
export const LOGIN_PASSWORD_ALLOWED_SPECIALS = '@$!%*?&';

/** 연속 문자(abc·321)·동일 문자 반복 금지 길이. */
export const LOGIN_PASSWORD_FORBIDDEN_RUN_LENGTH = 3;

/** 포함 금지 일반 부분 문자열(대소문자 무시). */
export const LOGIN_PASSWORD_COMMON_SUBSTRINGS = Object.freeze([
  'password', '123456', 'qwerty', 'admin', 'user',
  'password123', 'admin123', 'test123', 'hello123',
  'welcome', 'login', 'letmein', 'master', 'secret'
]);

/** 정책 위반 코드 (BE collectLoginStorageViolations 키와 같음, 검사 순서대로). */
export const LOGIN_PASSWORD_VIOLATION = Object.freeze({
  TOO_SHORT: 'tooShort',
  TOO_LONG: 'tooLong',
  INVALID_CHARACTERS: 'invalidCharacters',
  LOWERCASE_REQUIRED: 'lowercaseRequired',
  UPPERCASE_REQUIRED: 'uppercaseRequired',
  DIGIT_REQUIRED: 'digitRequired',
  SPECIAL_REQUIRED: 'specialRequired',
  CONSECUTIVE_FORBIDDEN: 'consecutiveForbidden',
  REPEATED_FORBIDDEN: 'repeatedForbidden',
  COMMON_PATTERN: 'commonPattern'
});

/** 입력 단계 오류 코드 (정책 외). */
export const PASSWORD_INPUT_ERROR = Object.freeze({
  REQUIRED: 'required',
  CONFIRM_REQUIRED: 'confirmRequired',
  CONFIRM_MISMATCH: 'confirmMismatch'
});

/** 정책 문구 i18n 키 (common namespace). */
export const PASSWORD_POLICY_I18N = Object.freeze({
  HINT: 'common:passwordPolicy.hint',
  PLACEHOLDER: 'common:passwordPolicy.placeholder',
  OPTIONAL_HINT: 'common:passwordPolicy.optionalHint',
  GUIDANCE: 'common:passwordPolicy.guidance',
  REQUEST_FAILED: 'common:passwordPolicy.requestFailed',
  VIOLATION_PREFIX: 'common:passwordPolicy.violation.'
});

/** 정책 입력 공통 CSS 클래스. */
export const PASSWORD_POLICY_CSS = Object.freeze({
  INPUT: 'mg-v2-form-input',
  INPUT_ERROR: 'mg-v2-form-input--error',
  HELP: 'mg-v2-form-help',
  ERROR: 'mg-v2-form-help mg-v2-form-help--error'
});

/** 새 비밀번호 입력 autocomplete (정책 대상). 로그인·현재 비밀번호 확인은 current-password. */
export const PASSWORD_AUTOCOMPLETE = Object.freeze({
  NEW: 'new-password',
  CURRENT: 'current-password'
});
