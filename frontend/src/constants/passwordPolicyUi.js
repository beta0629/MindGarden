/**
 * 로그인 비밀번호 저장 정책 UI·클라이언트 검증
 * (백엔드 PasswordPolicy.collectLoginStorageViolations 와 동기화).
 *
 * @author CoreSolution
 */

/** @type {number} */
export const LOGIN_PASSWORD_MIN_LENGTH = 8;

/** @type {number} */
export const LOGIN_PASSWORD_MAX_LENGTH = 100;

/** @type {string} */
export const LOGIN_PASSWORD_ALLOWED_SPECIALS = '@$!%*?&';

const LOGIN_CHARSET_PATTERN = /^[A-Za-z\d@$!%*?&]+$/;

const COMMON_SUBSTRINGS = [
  'password', '123456', 'qwerty', 'admin', 'user',
  'password123', 'admin123', 'test123', 'hello123',
  'welcome', 'login', 'letmein', 'master', 'secret'
];

/**
 * 한 줄 안내 (마이페이지·관리 폼 힌트용).
 */
export const LOGIN_PASSWORD_POLICY_HINT_ONE_LINE =
  `8~${LOGIN_PASSWORD_MAX_LENGTH}자, 영문 대·소문자·숫자·특수문자(${LOGIN_PASSWORD_ALLOWED_SPECIALS}) 각 1자 이상, `
  + '연속 문자(예: abc, 123)·동일 문자 3회 반복·일반적인 단어·패턴은 사용할 수 없습니다.';

/**
 * 비밀번호 입력 placeholder (등록·초기화 폼).
 */
export const LOGIN_PASSWORD_FIELD_PLACEHOLDER =
  `영문 대·소문자·숫자·${LOGIN_PASSWORD_ALLOWED_SPECIALS} 포함 8~${LOGIN_PASSWORD_MAX_LENGTH}자`;

/**
 * @param {string} password
 * @returns {boolean}
 */
function hasSequentialCharacters(password) {
  for (let i = 0; i < password.length - 2; i += 1) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    if (c1 + 1 === c2 && c2 + 1 === c3) {
      return true;
    }
    if (c1 - 1 === c2 && c2 - 1 === c3) {
      return true;
    }
  }
  return false;
}

/**
 * @param {string} password
 * @returns {boolean}
 */
function hasRepeatedCharacters(password) {
  return /(.)\1{2,}/.test(password);
}

/**
 * @param {string} password
 * @returns {boolean}
 */
function isCommonPattern(password) {
  if (password == null) {
    return false;
  }
  const lower = password.toLowerCase();
  return COMMON_SUBSTRINGS.some((p) => lower.includes(p));
}

/**
 * 로그인 저장 정책 위반 목록 (우선순위·메시지는 PasswordPolicy.collectLoginStorageViolations 와 동일).
 *
 * @param {string|null|undefined} plain
 * @returns {{ code: string, message: string }[]}
 */
export function getLoginPasswordViolations(plain) {
  const password = plain == null ? '' : String(plain);
  const out = [];

  if (password.length < LOGIN_PASSWORD_MIN_LENGTH) {
    out.push({
      code: 'tooShort',
      message: `비밀번호는 최소 ${LOGIN_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
    });
    return out;
  }
  if (password.length > LOGIN_PASSWORD_MAX_LENGTH) {
    out.push({
      code: 'tooLong',
      message: `비밀번호는 최대 ${LOGIN_PASSWORD_MAX_LENGTH}자 이하여야 합니다.`
    });
    return out;
  }
  if (!LOGIN_CHARSET_PATTERN.test(password)) {
    out.push({
      code: 'invalidCharacters',
      message:
        '비밀번호에 허용되지 않은 문자가 포함되어 있습니다. 특수문자는 '
        + `${LOGIN_PASSWORD_ALLOWED_SPECIALS}만 사용할 수 있습니다.`
    });
    return out;
  }
  if (!/[a-z]/.test(password)) {
    out.push({ code: 'lowercaseRequired', message: '비밀번호는 최소 1개의 소문자를 포함해야 합니다.' });
    return out;
  }
  if (!/[A-Z]/.test(password)) {
    out.push({ code: 'uppercaseRequired', message: '비밀번호는 최소 1개의 대문자를 포함해야 합니다.' });
    return out;
  }
  if (!/\d/.test(password)) {
    out.push({ code: 'digitRequired', message: '비밀번호는 최소 1개의 숫자를 포함해야 합니다.' });
    return out;
  }
  if (!/[@$!%*?&]/.test(password)) {
    out.push({
      code: 'specialRequired',
      message: `비밀번호는 특수문자(${LOGIN_PASSWORD_ALLOWED_SPECIALS})를 최소 1개 포함해야 합니다.`
    });
    return out;
  }
  if (hasSequentialCharacters(password)) {
    out.push({
      code: 'consecutiveForbidden',
      message: '비밀번호에 연속된 문자(abc, 123 등)를 사용할 수 없습니다.'
    });
    return out;
  }
  if (hasRepeatedCharacters(password)) {
    out.push({
      code: 'repeatedForbidden',
      message: '비밀번호에 동일한 문자가 3회 이상 반복될 수 없습니다.'
    });
    return out;
  }
  if (isCommonPattern(password)) {
    out.push({
      code: 'commonPattern',
      message: '일반적인 패턴의 비밀번호는 사용할 수 없습니다.'
    });
    return out;
  }
  return out;
}

/**
 * @param {string|null|undefined} plain
 * @returns {string|null}
 */
export function getFirstLoginPasswordViolationMessage(plain) {
  const list = getLoginPasswordViolations(plain);
  return list.length === 0 ? null : list[0].message;
}

/**
 * API/표준화 오류에서 비밀번호 관련 메시지 추출 (400 시 message 우선, errors 맵 병합).
 *
 * @param {Error & { status?: number, response?: { data?: Record<string, unknown> } }} [error]
 * @returns {string}
 */
export function getPasswordPolicyApiErrorMessage(error) {
  if (!error) {
    return '요청에 실패했습니다.';
  }
  const data = error.response && error.response.data;
  if (data && typeof data === 'object') {
    const msg = data.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
    const errStr = data.error;
    if (typeof errStr === 'string' && errStr.trim()) {
      return errStr.trim();
    }
    const errs = data.errors;
    if (errs && typeof errs === 'object' && !Array.isArray(errs)) {
      const parts = Object.values(errs)
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }
  }
  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return '요청에 실패했습니다.';
}
