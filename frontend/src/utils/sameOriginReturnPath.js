/**
 * 같은 오리진 내부 경로 검사 — sessionRedirect·loginReturnPath 가 함께 쓴다(순환 import 방지용 분리).
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

/** 브라우저가 경로에서 지우거나 `/` 로 바꾸는 문자(역슬래시·제어문자) — `/\evil.com`, `/\t/evil.com` 차단용 */
const hasUnsafeReturnPathChar = (value) => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (value[i] === '\\' || code < 0x20 || code === 0x7f) return true;
  }
  return false;
};

/**
 * 로그인 후 돌아갈 경로를 같은 오리진의 상대 경로로만 통과시킨다(오픈 리다이렉트 방지).
 * `/`로 시작하고 `//`·역슬래시·제어문자가 없으며, 현재 오리진 기준으로 해석해도 오리진이 같아야 한다.
 *
 * @param {unknown} value
 * @returns {string} 안전한 경로(pathname+search+hash), 아니면 빈 문자열
 */
export const sanitizeSameOriginReturnPath = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || hasUnsafeReturnPathChar(trimmed)) return '';
  try {
    const { origin } = window.location;
    const resolved = new URL(trimmed, origin);
    if (resolved.origin !== origin) return '';
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return '';
  }
};
