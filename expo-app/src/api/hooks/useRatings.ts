/**
 * 상담사 평가(Rating) TanStack Query 커스텀 훅
 *
 * BE 계약: Spring `ConsultantRatingController#createRating`
 * - POST `/api/v1/ratings/create`
 * - Required body: `scheduleId`, `clientId`, `heartScore`, `ratingTags`
 * - Optional body: `comment`, `isAnonymous`
 *
 * 2026-06-13 hotfix(P1): 필드명·필수값 컨트랙트 정정
 * - `rating` → `heartScore`
 * - `tags`   → `ratingTags`
 * - `clientId` 필수 주입 (누락 시 BE NumberFormatException → 500)
 *
 * 2026-06-15 hotfix(TestFlight 1.0.9): 제출 성공 후 평가 가능 목록·상담 캐시 동시 무효화
 * - `RATING_QUERY_KEYS.ratableSchedules(clientId)` 무효화 → 평가 직후 목록에서 즉시 사라짐 (중복 평가 H1 차단)
 * - `RATING_QUERY_KEYS.all` 무효화 → 상담사 평균 별점·평점 수 재조회
 * - `CONSULTATION_QUERY_KEYS.all` 무효화 → 상세 화면 `hasRating` 재조회
 *
 * 페이로드 직렬화는 `./ratingPayload`로 분리해 ts-jest 단위 테스트 대상으로 보존한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { RATING_API } from '../endpoints';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';
import { RATING_QUERY_KEYS } from './ratingQueryKeys';
import { buildCreateRatingPayload, type CreateRatingRequest } from './ratingPayload';

export type { CreateRatingRequest } from './ratingPayload';
export { buildCreateRatingPayload } from './ratingPayload';
export { RATING_QUERY_KEYS } from './ratingQueryKeys';

export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRatingRequest) =>
      apiPost(RATING_API.SUBMIT_RATING, buildCreateRatingPayload(data)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RATING_QUERY_KEYS.ratableSchedules(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: RATING_QUERY_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: CONSULTATION_QUERY_KEYS.all,
      });
    },
  });
}
