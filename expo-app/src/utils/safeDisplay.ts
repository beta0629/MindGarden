/**
 * JSX에 넣기 안전한 표시 문자열·수치 정규화 (React #130 방지)
 * 웹 SSOT `frontend/src/utils/safeDisplay.js` 와 동일 알고리즘을 TS로 이식
 *
 * @author MindGarden
 * @since 2026-05-13
 */

/**
 * @param value 표시할 값
 * @param fallback null/빈값/객체 직렬화 실패 시
 * @returns 안전한 한 줄 문자열
 */
export function toDisplayString(value: unknown, fallback = '—'): string {
  if (value == null || value === '') {
    return fallback;
  }
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
 * API 숫자 필드가 문자열·객체로 올 때 안전한 finite number
 *
 * @param value 원본
 * @param fallback 변환 불가 시
 */
export function toSafeNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '') {
      return fallback;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const o = value as Record<string, unknown>;
    const inner = o.value ?? o.current ?? o.rate ?? o.count;
    if (inner != null && inner !== value) {
      return toSafeNumber(inner, fallback);
    }
  }
  return fallback;
}
