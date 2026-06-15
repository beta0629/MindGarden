/**
 * 상담사 평가 제출 에러 메시지 추출·친화화 유틸 — 순수 함수.
 *
 * `useCreateRating` 의 catch 블록은 BE 가 내려준 message 를 우선 노출해야 한다.
 * apiClient 인터셉터는 이미 `data.message` 를 `ApiClientError.message` 로 옮겨주지만,
 * (a) 어떤 경로로든 axios 원본 에러가 흘러올 수 있고
 * (b) 알려진 BE 문구는 내담자 어조로 다듬어야 하므로
 *
 * 별도 모듈로 추출해 ts-jest 단위 테스트 대상으로 보존한다.
 *
 * BE 계약: `ConsultantRatingServiceImpl#createRating` — 5가지 RuntimeException 메시지
 * - "이미 평가한 상담입니다"
 * - "완료된 상담만 평가할 수 있습니다"
 * - "본인이 받은 상담만 평가할 수 있습니다"
 * - "상담사를 찾을 수 없습니다"
 * - "상담 일정을 찾을 수 없습니다"
 *
 * @author MindGarden
 * @since 2026-06-15
 */

/** 평가 제출 catch 블록 기본 폴백 메시지. */
export const DEFAULT_RATING_ERROR_MESSAGE = '평가 제출 중 문제가 발생했습니다.';

/**
 * 알려진 BE 메시지 → 내담자 친화 문구 매핑.
 * 키는 BE 가 던지는 메시지 *부분 문자열*; 값은 알럿에 표시할 친화 문구.
 */
const FRIENDLY_RATING_ERROR_MESSAGES: readonly (readonly [string, string])[] = [
  ['이미 평가한 상담', '이미 평가하신 상담입니다.'],
  ['완료된 상담만 평가', '아직 완료되지 않은 상담입니다.'],
  ['본인이 받은 상담만 평가', '평가 권한이 없는 상담입니다.'],
  ['상담사를 찾을 수 없', '상담사 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'],
  ['상담 일정을 찾을 수 없', '상담 일정을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.'],
];

interface AxiosLikeResponseError {
  response?: {
    data?: unknown;
    status?: number;
  };
  message?: unknown;
}

function pickStringField(source: unknown, field: string): string | undefined {
  if (source == null || typeof source !== 'object') {
    return undefined;
  }
  const value = (source as Record<string, unknown>)[field];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

/**
 * 에러 객체에서 BE 가 의도한 message 를 최선의 순서로 추출.
 *
 * 우선순위:
 * 1. `err.response.data.message` (axios 원본이 흘러온 경우)
 * 2. `err.response.data.detail` (Spring `ProblemDetail` 호환)
 * 3. `err.message` (apiClient 인터셉터 가공 후 ApiClientError)
 * 4. 폴백 `DEFAULT_RATING_ERROR_MESSAGE`
 */
export function extractRatingErrorRawMessage(error: unknown): string {
  if (error == null) {
    return DEFAULT_RATING_ERROR_MESSAGE;
  }

  const candidate = error as AxiosLikeResponseError;
  const data = candidate.response?.data;
  const fromData = pickStringField(data, 'message') ?? pickStringField(data, 'detail');
  if (fromData) {
    return fromData;
  }

  const fromError = pickStringField(error, 'message');
  if (fromError) {
    return fromError;
  }

  return DEFAULT_RATING_ERROR_MESSAGE;
}

/**
 * BE 메시지를 내담자 친화 문구로 변환.
 * 매핑에 없는 메시지는 원본을 그대로 반환한다.
 */
export function toFriendlyRatingErrorMessage(rawMessage: string): string {
  if (!rawMessage) {
    return DEFAULT_RATING_ERROR_MESSAGE;
  }
  for (const [needle, friendly] of FRIENDLY_RATING_ERROR_MESSAGES) {
    if (rawMessage.includes(needle)) {
      return friendly;
    }
  }
  return rawMessage;
}

/**
 * 평가 제출 catch 블록에서 사용할 최종 알럿 메시지 빌더.
 *
 * @param error catch 가 받은 에러 (apiClientError | axiosError | Error | unknown)
 * @returns Alert.alert 두 번째 인자로 그대로 넘길 한국어 문구
 */
export function buildRatingErrorAlertMessage(error: unknown): string {
  return toFriendlyRatingErrorMessage(extractRatingErrorRawMessage(error));
}
