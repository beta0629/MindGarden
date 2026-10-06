/**
 * Core Solution 로그인 비밀번호 정책을 만족하는 임의 문자열 생성.
 * 정책 판단은 {@link ./loginPasswordPolicy} 만 사용한다(백엔드 PasswordPolicy 와 동일).
 */
import { LOGIN_PASSWORD_ALLOWED_SPECIALS } from '../constants/passwordPolicyUi';
import { isBlankPassword, isLoginPasswordCompliant } from './loginPasswordPolicy';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT = '0123456789';
const ALL_ALLOWED = LOWER + UPPER + DIGIT + LOGIN_PASSWORD_ALLOWED_SPECIALS;

const GENERATED_MIN_LENGTH = 12;
const GENERATED_MAX_LENGTH = 32;
const GENERATED_DEFAULT_LENGTH = 14;
const GENERATE_MAX_ATTEMPTS = 200;

function randomInt(max) {
  if (max <= 0) return 0;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function pick(pool) {
  return pool[randomInt(pool.length)];
}

/**
 * 백엔드 encodePassword 정책 통과 여부 (클라이언트 사전 검증용).
 * @param {string} password
 * @returns {boolean}
 */
export function isMgLoginPasswordCompliant(password) {
  if (!password || typeof password !== 'string') return false;
  return isLoginPasswordCompliant(password);
}

/**
 * 선택 입력 비밀번호. 비어 있거나 공백만이면 임시 비밀번호 등록으로 통과한다.
 * @param {unknown} password
 * @returns {boolean} true 이면 제출을 막는다
 */
export function shouldBlockOptionalMgLoginPassword(password) {
  if (isBlankPassword(password)) return false;
  return !isLoginPasswordCompliant(String(password));
}

/**
 * 정책을 만족하는 임의 비밀번호 (crypto.getRandomValues 기반).
 * 시도가 모두 실패하면 빈 문자열을 돌려준다(화면은 정책 검증에서 막거나 서버 임시 비밀번호로 처리).
 * @param {number} [length=14] — 최소 12, 최대 32로 클램프
 * @returns {string}
 */
export function generateMgLoginPassword(length = GENERATED_DEFAULT_LENGTH) {
  const targetLen = Math.min(GENERATED_MAX_LENGTH, Math.max(GENERATED_MIN_LENGTH, length));
  for (let attempt = 0; attempt < GENERATE_MAX_ATTEMPTS; attempt++) {
    const chars = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(LOGIN_PASSWORD_ALLOWED_SPECIALS)];
    while (chars.length < targetLen) {
      chars.push(pick(ALL_ALLOWED));
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    const pwd = chars.join('');
    if (isLoginPasswordCompliant(pwd)) return pwd;
  }
  return '';
}
