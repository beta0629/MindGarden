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
 * 페이로드 직렬화는 `./ratingPayload`로 분리해 ts-jest 단위 테스트 대상으로 보존한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { RATING_API } from '../endpoints';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';
import { buildCreateRatingPayload, type CreateRatingRequest } from './ratingPayload';

export type { CreateRatingRequest } from './ratingPayload';
export { buildCreateRatingPayload } from './ratingPayload';

export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRatingRequest) =>
      apiPost(RATING_API.SUBMIT_RATING, buildCreateRatingPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONSULTATION_QUERY_KEYS.all,
      });
    },
  });
}
