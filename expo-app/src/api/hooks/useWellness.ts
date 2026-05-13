/**
 * 웰니스(힐링 콘텐츠) TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../client';
import { HEALING_CONTENT_API } from '../endpoints';

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
 * 심리 교육 전용 API는 아직 없음 (`GET /api/v1/psycho-education` 예정).
 * 카드뉴스 목록·상세는 `MOCK_PSYCHO_ARTICLES` + 로컬 북마크(MMKV)를 사용한다.
 */
export const PSYCHO_EDUCATION_API_PLACEHOLDER = '/api/v1/psycho-education' as const;

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
