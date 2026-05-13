/**
 * React #130 방지 — JSX Text에는 스칼라만 전달한다.
 * 웹 `safeDisplay`와 동일한 최소 규칙을 Expo 앱에 적용한다.
 *
 * @author MindGarden
 * @since 2026-05-13
 */

export function toDisplayString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '예' : '아니오';
  }
  return fallback;
}
