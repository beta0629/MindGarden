/**
 * Spring `ApiResponse` 래퍼 및 axios 인터셉터 이후 본문 언래핑
 * `{ success, data }` 에서 `data` 추출. 래퍼 없으면 원본 반환
 *
 * @author MindGarden
 * @since 2026-05-13
 */

export function unwrapApiResponse<T>(raw: unknown): T | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (obj.success === false) {
    return null;
  }
  if ('data' in obj && obj.data !== undefined) {
    return obj.data as T;
  }
  return raw as T;
}

/**
 * `{ success: true, data: null }` 등 본문 없는 성공 응답 검증 (PUT void 등)
 *
 * @param raw API 응답 본문
 * @param fallbackMessage success !== true 일 때 기본 메시지
 */
export function assertApiSuccessVoid(raw: unknown, fallbackMessage: string): void {
  if (raw == null || typeof raw !== 'object') {
    throw new Error(fallbackMessage);
  }
  const obj = raw as Record<string, unknown>;
  if (obj.success === true) {
    return;
  }
  if (obj.success === false) {
    const message = obj.message;
    throw new Error(typeof message === 'string' && message.trim() ? message : fallbackMessage);
  }
  throw new Error(fallbackMessage);
}
