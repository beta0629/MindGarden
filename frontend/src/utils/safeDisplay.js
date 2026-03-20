/**
 * JSX에 넣기 안전한 표시 문자열로 정규화 (React #130: 객체를 자식으로 렌더 방지)
 * @author Core Solution
 * @since 2026-02-12
 */

/**
 * @param {*} value
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function toDisplayString(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

/**
 * 에러·예외·API 오류 객체를 사용자-facing 한 줄 문자열로
 * @param {*} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function toErrorMessage(error, fallback = '오류가 발생했습니다.') {
  if (error == null || error === '') return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object') {
    const msg = error.message ?? error.error ?? error.detail ?? error.msg;
    if (msg != null && typeof msg === 'string') return msg;
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
