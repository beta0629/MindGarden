/**
 * Core Solution 로그인 비밀번호 정책과 동일한 문자열 생성.
 * {@link com.coresolution.core.security.PasswordService#validatePassword} 와 맞춤
 * (대·소문자·숫자·@$!%*?& 각 1+, 허용 문자만, 연속 3자·동일 3연속 금지).
 */

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGIT = '0123456789';
const SPECIAL = '@$!%*?&';
const ALL_ALLOWED = LOWER + UPPER + DIGIT + SPECIAL;

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function randomInt(max) {
  if (max <= 0) return 0;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function pick(pool) {
  return pool[randomInt(pool.length)];
}

function hasSequentialCharacters(password) {
  for (let i = 0; i < password.length - 2; i++) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    if (c1 + 1 === c2 && c2 + 1 === c3) return true;
    if (c1 - 1 === c2 && c2 - 1 === c3) return true;
  }
  return false;
}

function hasRepeatedCharacters(password) {
  return /(.)\1{2,}/.test(password);
}

/**
 * 백엔드 encodePassword 정책 통과 여부 (클라이언트 사전 검증용).
 * @param {string} password
 * @returns {boolean}
 */
export function isMgLoginPasswordCompliant(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 100) return false;
  if (!PASSWORD_PATTERN.test(password)) return false;
  if (hasSequentialCharacters(password)) return false;
  if (hasRepeatedCharacters(password)) return false;
  return true;
}

/**
 * 정책을 만족하는 임의 비밀번호 (crypto.getRandomValues 기반).
 * @param {number} [length=14] — 최소 12, 최대 32로 클램프
 * @returns {string}
 */
export function generateMgLoginPassword(length = 14) {
  const targetLen = Math.min(32, Math.max(12, length));
  for (let attempt = 0; attempt < 100; attempt++) {
    const chars = [];
    chars.push(pick(LOWER));
    chars.push(pick(UPPER));
    chars.push(pick(DIGIT));
    chars.push(pick(SPECIAL));
    const extra = targetLen - 4;
    for (let i = 0; i < extra; i++) {
      chars.push(pick(ALL_ALLOWED));
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    const pwd = chars.join('');
    if (isMgLoginPasswordCompliant(pwd)) return pwd;
  }
  return 'Mg9!kPxQw2vH';
}
