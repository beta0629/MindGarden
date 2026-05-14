/**
 * 명상 카탈로그 — `GET /api/v1/meditations` + 단일 데모 폴백 (`meditationCatalogService`)
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-C·§13
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useQuery } from '@tanstack/react-query';
import type { MeditationTrack } from '@/constants/meditationData';
import {
  fetchMeditationCatalog,
  getDemoMeditationCatalogState,
  type MeditationCatalogSource,
} from '@/services/meditationCatalogService';

export type { MeditationCatalogSource } from '@/services/meditationCatalogService';

const MEDITATION_QUERY_KEYS = {
  all: ['meditations'] as const,
  catalog: () => [...MEDITATION_QUERY_KEYS.all, 'catalog'] as const,
};

export interface MeditationCatalogState {
  source: MeditationCatalogSource;
  tracks: MeditationTrack[];
}

export function useMeditationCatalog() {
  return useQuery<MeditationCatalogState>({
    queryKey: MEDITATION_QUERY_KEYS.catalog(),
    queryFn: () => fetchMeditationCatalog(),
    staleTime: 1000 * 60 * 10,
    placeholderData: () => getDemoMeditationCatalogState(),
  });
}

export function useMeditationTrackById(trackId: number) {
  const q = useMeditationCatalog();
  const track = q.data?.tracks.find((t) => t.id === trackId) ?? null;
  return {
    track,
    source: q.data?.source ?? ('demo' as MeditationCatalogSource),
    isLoading: q.isPending,
    isError: q.isError,
    refetch: q.refetch,
  };
}

export { MEDITATION_QUERY_KEYS };
