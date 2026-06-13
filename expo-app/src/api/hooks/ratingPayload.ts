/**
 * 상담사 평가(Rating) 페이로드 직렬화 유틸 — 순수 함수.
 *
 * `useRatings` 훅과 분리한 이유:
 * - 훅은 `apiPost` 경유로 `react-native` 의존을 끌고 와 ts-jest 단위 테스트에 부적합.
 * - 컨트랙트(필드명·필수값) 회귀 방지는 순수 빌더 단위에서 검증한다.
 *
 * BE 계약: Spring `ConsultantRatingController#createRating`
 * - POST `/api/v1/ratings/create`
 * - Required: `scheduleId`, `clientId`, `heartScore`, `ratingTags`
 * - Optional: `comment`, `isAnonymous`
 *
 * @author MindGarden
 * @since 2026-06-13
 */

export interface CreateRatingRequest {
  scheduleId: number;
  consultantId: number;
  clientId: number;
  heartScore: number;
  ratingTags: string[];
  comment?: string;
  isAnonymous?: boolean;
}

/**
 * `CreateRatingRequest` → BE 페이로드 직렬화.
 *
 * 필수 필드 가드: `clientId`/`scheduleId`/`heartScore`가 누락된 경우 즉시 에러로 종결한다.
 * (BE `Long.valueOf(null)` → NumberFormatException(500) 차단 — 사용자에게 표시되는
 * "평가 제출 중 문제가 발생했습니다." 모달의 근본 원인 방어)
 */
export function buildCreateRatingPayload(input: CreateRatingRequest): Record<string, unknown> {
  if (input.clientId == null || Number.isNaN(input.clientId)) {
    throw new Error('clientId is required to submit a consultant rating.');
  }
  if (input.scheduleId == null || Number.isNaN(input.scheduleId)) {
    throw new Error('scheduleId is required to submit a consultant rating.');
  }
  if (input.heartScore == null || Number.isNaN(input.heartScore)) {
    throw new Error('heartScore is required to submit a consultant rating.');
  }
  return {
    scheduleId: input.scheduleId,
    consultantId: input.consultantId,
    clientId: input.clientId,
    heartScore: input.heartScore,
    ratingTags: input.ratingTags ?? [],
    ...(input.comment ? { comment: input.comment } : {}),
    ...(input.isAnonymous != null ? { isAnonymous: input.isAnonymous } : {}),
  };
}
