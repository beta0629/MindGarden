/**
 * apiClient 응답 인터셉터 표준 에러 헬퍼.
 *
 * <p>BE 비즈니스 에러 코드 (예: {@code NO_ACTIVE_CONSULTANT_MAPPING}) 를 FE 가 분기에 사용할 수 있도록
 * Axios 거부 값을 {@link ApiClientError} 인스턴스 (Error 서브셋) 로 변환한다.
 * RN/axios 의존성 없이 단위 테스트 가능하도록 별도 모듈로 분리.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

/**
 * apiClient 가 reject 하는 표준 에러 — `err instanceof Error` 분기를 위해 Error 인스턴스.
 */
export interface ApiClientError extends Error {
  status: number;
  code?: string;
  originalError: unknown;
}

/**
 * BE 응답 본문에서 message 와 errorCode 를 추출.
 *
 * <p>본문 형태가 일관되지 않으므로 `errorCode`/`code` 둘 다 시도하고, 문자열만 받아들인다.</p>
 *
 * @param data 응답 본문 (any)
 * @returns message 와 code 스니펫
 */
export function extractErrorMeta(data: unknown): { message?: string; code?: string } {
  if (data == null || typeof data !== 'object') {
    return {};
  }
  const root = data as Record<string, unknown>;
  const message = typeof root.message === 'string' ? root.message : undefined;
  let code: string | undefined;
  if (typeof root.errorCode === 'string') {
    code = root.errorCode;
  } else if (typeof root.code === 'string') {
    code = root.code;
  }
  return { message, code };
}

/**
 * status 코드별 폴백 메시지 — 응답 본문에 message 가 없을 때 사용.
 *
 * @param status HTTP status (0 이면 네트워크 오류)
 * @returns 한글 폴백 메시지
 */
export function fallbackMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return '요청이 올바르지 않습니다.';
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '이미 처리 중이거나 충돌이 발생했습니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    default:
      return '네트워크 연결을 확인해주세요.';
  }
}

/**
 * Axios 응답 인터셉터에서 reject 할 표준 에러 객체 생성.
 *
 * <p>{@link Error} 인스턴스 + {@code status}/{@code code}/{@code originalError} 부가 필드.
 * 화면의 {@code err instanceof Error} 분기와 토스트 메시지가 정상 작동.</p>
 *
 * @param status HTTP status (0 이면 네트워크 오류)
 * @param data 응답 본문
 * @param originalError Axios 원본 에러 (디버깅용)
 * @returns 표준 에러 인스턴스
 */
export function buildApiClientError(
  status: number,
  data: unknown,
  originalError: unknown,
): ApiClientError {
  const meta = extractErrorMeta(data);
  const message = meta.message && meta.message.trim().length > 0
    ? meta.message.trim()
    : fallbackMessageForStatus(status);
  const err = new Error(message) as ApiClientError;
  err.status = status;
  if (meta.code) {
    err.code = meta.code;
  }
  err.originalError = originalError;
  return err;
}
