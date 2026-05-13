/**
 * 웰니스(힐링 콘텐츠) TanStack Query 커스텀 훅
 * 심리 교육 전용 `GET /api/v1/psycho-education` (§13) — 실패 시 UI에서 Empty/재시도
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../client';
import { HEALING_CONTENT_API } from '../endpoints';
import { fetchPsychoEducationListOrThrow } from '@/services/psychoEducationService';
import type { PsychoArticle } from '@/constants/psychoEducationData';

export interface HealingContent {
  id: number;
  title: string;
  description: string;
  category: string;
  type: 'MEDITATION' | 'ARTICLE' | 'AUDIO' | 'VIDEO';
  thumbnailUrl?: string;
  contentUrl?: string;
  durationMinutes?: number;
}

const WELLNESS_QUERY_KEYS = {
  all: ['wellness'] as const,
  healingContents: () =>
    [...WELLNESS_QUERY_KEYS.all, 'healing-contents'] as const,
  randomTip: () =>
    [...WELLNESS_QUERY_KEYS.all, 'random-tip'] as const,
};

export function useHealingContents() {
  return useQuery<HealingContent[]>({
    queryKey: WELLNESS_QUERY_KEYS.healingContents(),
    queryFn: () => apiGet<HealingContent[]>(HEALING_CONTENT_API.GET_ALL),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * 심리 교육 API 경로 (백엔드 예정). 성공 시 `usePsychoEducationApiList`, 실패 시 화면에서 재시도.
 */
export const PSYCHO_EDUCATION_API_PLACEHOLDER = '/api/v1/psycho-education' as const;

const PSYCHO_QUERY_KEYS = {
  all: ['psycho-education'] as const,
  apiList: () => [...PSYCHO_QUERY_KEYS.all, 'api-list'] as const,
};

/**
 * `GET /api/v1/psycho-education` — 오류 시 isError·refetch로 심리 교육 탭에서 Empty/재시도 처리
 */
export function usePsychoEducationApiList() {
  return useQuery<PsychoArticle[]>({
    queryKey: PSYCHO_QUERY_KEYS.apiList(),
    queryFn: () => fetchPsychoEducationListOrThrow(),
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export { PSYCHO_QUERY_KEYS };

export function useRandomWellnessTip() {
  return useQuery<HealingContent | null>({
    queryKey: WELLNESS_QUERY_KEYS.randomTip(),
    queryFn: async () => {
      const contents = await apiGet<HealingContent[]>(
        HEALING_CONTENT_API.GET_ALL,
        { size: 10, sort: 'random' },
      );
      return contents.length > 0
        ? contents[Math.floor(Math.random() * contents.length)]!
        : null;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export { WELLNESS_QUERY_KEYS };
