/**
 * 자가 심리검사 TanStack Query 커스텀 훅
 * API 미구현 → MMKV 로컬 저장 + Mock 데이터로 동작
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMMKV } from 'react-native-mmkv';
import {
  ASSESSMENT_STORAGE_KEY,
  ASSESSMENTS,
  PSS_REVERSE_ITEMS,
  type AssessmentType,
  type AssessmentInterpretation,
} from '@/constants/assessmentQuestions';

const mmkv = createMMKV({ id: ASSESSMENT_STORAGE_KEY });

export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  answers: number[];
  totalScore: number;
  interpretation: AssessmentInterpretation;
  sharedWithConsultant: boolean;
  createdAt: string;
}

const ASSESSMENT_QUERY_KEYS = {
  all: ['self-assessment'] as const,
  list: () => [...ASSESSMENT_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...ASSESSMENT_QUERY_KEYS.all, 'detail', id] as const,
  lastByType: (type: AssessmentType) =>
    [...ASSESSMENT_QUERY_KEYS.all, 'last', type] as const,
};

function getAllResults(): AssessmentResult[] {
  const raw = mmkv.getString('results');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssessmentResult[];
  } catch {
    return [];
  }
}

function saveAllResults(results: AssessmentResult[]) {
  mmkv.set('results', JSON.stringify(results));
}

function calculateScore(type: AssessmentType, answers: number[]): number {
  if (type === 'PSS') {
    return answers.reduce((sum, val, idx) => {
      const isReverse = PSS_REVERSE_ITEMS.includes(idx as 3 | 4 | 6 | 7);
      return sum + (isReverse ? 4 - val : val);
    }, 0);
  }
  return answers.reduce((sum, val) => sum + val, 0);
}

export function useSelfAssessments() {
  return useQuery<AssessmentResult[]>({
    queryKey: ASSESSMENT_QUERY_KEYS.list(),
    queryFn: () => {
      const results = getAllResults();
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    staleTime: 0,
  });
}

export function useAssessmentDetail(id: string) {
  return useQuery<AssessmentResult | null>({
    queryKey: ASSESSMENT_QUERY_KEYS.detail(id),
    queryFn: () => {
      const results = getAllResults();
      return results.find((r) => r.id === id) ?? null;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useLastAssessmentByType(type: AssessmentType) {
  return useQuery<AssessmentResult | null>({
    queryKey: ASSESSMENT_QUERY_KEYS.lastByType(type),
    queryFn: () => {
      const results = getAllResults();
      const filtered = results
        .filter((r) => r.type === type)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      return filtered[0] ?? null;
    },
    staleTime: 0,
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
    mutationFn: async (params) => {
      const definition = ASSESSMENTS[params.type];
      const totalScore = calculateScore(params.type, params.answers);
      const interpretation = definition.interpret(totalScore);

      const result: AssessmentResult = {
        id: `${params.type}_${Date.now()}`,
        type: params.type,
        answers: params.answers,
        totalScore,
        interpretation,
        sharedWithConsultant: params.sharedWithConsultant,
        createdAt: new Date().toISOString(),
      };

      const all = getAllResults();
      all.unshift(result);
      saveAllResults(all);
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENT_QUERY_KEYS.list() });
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_QUERY_KEYS.lastByType(variables.type),
      });
    },
  });
}

export { ASSESSMENT_QUERY_KEYS };
