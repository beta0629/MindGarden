/**
 * 중복 로그인 확인 응답 감지 — 백엔드 `duplicate_login_confirmation` 신호 판별
 *
 * 백엔드 흐름:
 * - `POST /api/v1/auth/login` 또는 `social-login` 응답이 다음 중 하나면 사용자 확인 모달이 필요.
 *   - 본문 `responseType === 'duplicate_login_confirmation'`
 *   - 본문 `requiresConfirmation === true`
 *   - `ApiResponse` 래퍼인 경우 `data.responseType` / `data.requiresConfirmation`
 *
 * axios 인터셉터(`src/api/client.ts`) 가 4xx 응답을 `{ status, message, originalError }` 형태로
 * reject 하므로, catch 측 에러의 `originalError.response.data` 도 함께 검사한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */

export interface DuplicateLoginSignal {
  readonly message: string;
}

/** 기본 안내 문구(서버 메시지가 없을 때 사용) */
export const DUPLICATE_LOGIN_FALLBACK_MESSAGE =
  '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractMessage(payload: Record<string, unknown>): string | undefined {
  const direct = payload.message;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    const nestedMsg = nested.message;
    if (typeof nestedMsg === 'string' && nestedMsg.trim().length > 0) {
      return nestedMsg;
    }
  }
  return undefined;
}

function payloadHasConfirmationFlag(payload: Record<string, unknown>): boolean {
  if (payload.responseType === 'duplicate_login_confirmation') {
    return true;
  }
  if (payload.requiresConfirmation === true) {
    return true;
  }
  const nested = asRecord(payload.data);
  if (nested) {
    if (nested.responseType === 'duplicate_login_confirmation') {
      return true;
    }
    if (nested.requiresConfirmation === true) {
      return true;
    }
  }
  return false;
}

/**
 * 응답 본문 또는 axios 에러 객체에서 중복 로그인 확인 신호를 감지한다.
 *
 * @param input 백엔드 응답 본문(`Record`) 또는 axios reject 객체(`{ originalError }`)
 * @returns 감지된 경우 `{ message }`, 아니면 `null`
 */
export function detectDuplicateLoginConfirmation(input: unknown): DuplicateLoginSignal | null {
  const root = asRecord(input);
  if (!root) {
    return null;
  }

  if (payloadHasConfirmationFlag(root)) {
    return { message: extractMessage(root) ?? DUPLICATE_LOGIN_FALLBACK_MESSAGE };
  }

  const original = asRecord(root.originalError);
  const responseBody = asRecord(asRecord(original?.response)?.data);
  if (responseBody && payloadHasConfirmationFlag(responseBody)) {
    return { message: extractMessage(responseBody) ?? DUPLICATE_LOGIN_FALLBACK_MESSAGE };
  }

  return null;
}
