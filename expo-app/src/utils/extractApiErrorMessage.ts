/**
 * axios 인터셉터 reject `{ status, message, originalError }` 및 Error 메시지 추출
 *
 * @author MindGarden
 * @since 2026-05-19
 */

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg.length > 0) {
      return msg;
    }
  }
  if (error != null && typeof error === 'object') {
    const rec = error as Record<string, unknown>;
    const msg = rec.message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg.trim();
    }
    const original = rec.originalError;
    if (original != null && typeof original === 'object') {
      const axiosData = (original as { response?: { data?: unknown } }).response?.data;
      if (axiosData != null && typeof axiosData === 'object') {
        const body = axiosData as Record<string, unknown>;
        if (typeof body.message === 'string' && body.message.trim()) {
          return body.message.trim();
        }
        if (typeof body.error === 'string' && body.error.trim()) {
          return body.error.trim();
        }
      }
    }
  }
  return fallback;
}
