/**
 * 상담사 평가(Rating) TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { RATING_API } from '../endpoints';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';

interface CreateRatingRequest {
  scheduleId: number;
  consultantId: number;
  rating: number;
  tags: string[];
  comment?: string;
}

export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRatingRequest) =>
      apiPost(RATING_API.SUBMIT_RATING, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONSULTATION_QUERY_KEYS.all,
      });
    },
  });
}
