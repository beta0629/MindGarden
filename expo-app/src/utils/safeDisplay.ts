/**
 * JSX에 넣기 안전한 표시 문자열·수치 정규화 (React #130 방지)
 * 웹 SSOT `frontend/src/utils/safeDisplay.js` 와 동일 알고리즘을 TS로 이식
 *
 * @author MindGarden
 * @since 2026-05-13
 */

/**
 * 알림·푸시 본문 등에 포함된 HTML 태그를 제거하고 읽기용 평문으로 만든다.
 * React Native Text에는 HTML 렌더링을 쓰지 않고 평문만 표시한다.
 */
export function stripHtmlToPlainText(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : toDisplayString(raw, '');
  if (!s) {
    return '';
  }
  let t = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  t = t.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/p>/gi, '\n');
  t = t.replace(/<\/h[1-6]>/gi, '\n');
  t = t.replace(/<\/div>/gi, '\n');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) && code > 0 ? String.fromCharCode(code) : ' ';
    });
  t = t.replace(/[ \t\f\v]+/g, ' ');
  t = t.replace(/\n\s*\n/g, '\n').trim();
  return t;
}

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
