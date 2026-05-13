/**
 * 자가 심리검사 TanStack Query 훅
 * `selfAssessmentService` — API 우선, 실패 시 MMKV Mock (§13 `/api/v1/self-assessments`)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AssessmentType } from '@/constants/assessmentQuestions';
import {
  fetchAssessmentDetail,
  fetchSelfAssessments,
  submitSelfAssessmentRemote,
  type AssessmentResult,
} from '@/services/selfAssessmentService';

export type { AssessmentResult } from '@/services/selfAssessmentService';

const ASSESSMENT_QUERY_KEYS = {
  all: ['self-assessment'] as const,
  list: () => [...ASSESSMENT_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...ASSESSMENT_QUERY_KEYS.all, 'detail', id] as const,
  lastByType: (type: AssessmentType) =>
    [...ASSESSMENT_QUERY_KEYS.all, 'last', type] as const,
};

export function useSelfAssessments() {
  return useQuery<AssessmentResult[]>({
    queryKey: ASSESSMENT_QUERY_KEYS.list(),
    queryFn: () => fetchSelfAssessments(),
    staleTime: 1000 * 60,
  });
}

export function useAssessmentDetail(id: string) {
  return useQuery<AssessmentResult | null>({
    queryKey: ASSESSMENT_QUERY_KEYS.detail(id),
    queryFn: () => fetchAssessmentDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useLastAssessmentByType(type: AssessmentType) {
  return useQuery<AssessmentResult | null>({
    queryKey: ASSESSMENT_QUERY_KEYS.lastByType(type),
    queryFn: async () => {
      const results = await fetchSelfAssessments();
      const filtered = results
        .filter((r) => r.type === type)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      return filtered[0] ?? null;
    },
    staleTime: 1000 * 60,
  });
}

interface SubmitAssessmentParams {
  type: AssessmentType;
  answers: number[];
  sharedWithConsultant: boolean;
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation<AssessmentResult, Error, SubmitAssessmentParams>({
    mutationFn: (params) => submitSelfAssessmentRemote(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENT_QUERY_KEYS.list() });
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_QUERY_KEYS.lastByType(variables.type),
      });
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_QUERY_KEYS.detail(data.id),
      });
    },
  });
}

export { ASSESSMENT_QUERY_KEYS };
