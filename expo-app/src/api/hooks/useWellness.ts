/**
 * 웰니스(힐링 콘텐츠) TanStack Query 커스텀 훅
 * 심리 교육 `GET /api/v1/psycho-education` (§13) — 카탈로그 훅에서 API·샘플 경계 처리
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../client';
import { HEALING_CONTENT_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { fetchPsychoEducationCatalog } from '@/services/psychoEducationService';
import type {
  PsychoCatalogSource,
  PsychoEducationCatalogState,
} from '@/services/psychoEducationService';

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

function normalizeHealingList(data: HealingContent[] | undefined): HealingContent[] {
  return Array.isArray(data) ? data : [];
}

export function useHealingContents() {
  return useQuery({
    queryKey: WELLNESS_QUERY_KEYS.healingContents(),
    queryFn: async () => {
      const raw = await apiGet<unknown>(HEALING_CONTENT_API.GET_ALL);
      const list = unwrapApiResponse<HealingContent[]>(raw);
      return Array.isArray(list) ? list : [];
    },
    select: normalizeHealingList,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * 심리 교육 API 경로 (백엔드 예정). `usePsychoEducationCatalog`와 배너 문구에 사용.
 */
export const PSYCHO_EDUCATION_API_PLACEHOLDER = '/api/v1/psycho-education' as const;

const PSYCHO_QUERY_KEYS = {
  all: ['psycho-education'] as const,
  catalog: () => [...PSYCHO_QUERY_KEYS.all, 'catalog'] as const,
};

export type { PsychoCatalogSource, PsychoEducationCatalogState };

/**
 * `GET /api/v1/psycho-education` + 샘플 단일 폴백 (`psychoEducationService`, 명상 카탈로그와 동일 패턴)
 */
export function usePsychoEducationCatalog() {
  return useQuery<PsychoEducationCatalogState>({
    queryKey: PSYCHO_QUERY_KEYS.catalog(),
    queryFn: () => fetchPsychoEducationCatalog(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePsychoEducationArticleById(articleId: number) {
  const q = usePsychoEducationCatalog();
  const article =
    q.data?.articles.find((a) => a.id === articleId) ?? null;
  return {
    article,
    source: q.data?.source ?? ('demo' as PsychoCatalogSource),
    usedFallbackDueToError: q.data?.usedFallbackDueToError ?? false,
    isLoading: q.isPending,
    isError: q.isError,
    refetch: q.refetch,
  };
}

export { PSYCHO_QUERY_KEYS };

export function useRandomWellnessTip() {
  return useQuery<HealingContent | null>({
    queryKey: WELLNESS_QUERY_KEYS.randomTip(),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        HEALING_CONTENT_API.GET_ALL,
        { size: 10, sort: 'random' },
      );
      const list = unwrapApiResponse<HealingContent[]>(raw);
      const contents = Array.isArray(list) ? list : [];
      return contents.length > 0
        ? contents[Math.floor(Math.random() * contents.length)]!
        : null;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export { WELLNESS_QUERY_KEYS };
