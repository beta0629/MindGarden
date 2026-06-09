/**
 * 내담자 본인의 활성 상담사 매핑 — 마음 날씨·무드 저널 공유 사전 가드 훅.
 *
 * <p>{@code GET /api/v1/clients/me/consultant-mappings/active} 를 호출하여
 * 공유 가능한 매핑 (ACTIVE 또는 SESSIONS_EXHAUSTED) 존재 여부를 노출한다.
 * UI 는 본 훅의 `hasActiveMapping` 으로 공유 아이콘 disabled / 토글 disabled / 안내 메시지 분기.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { CLIENT_CONSULTANT_MAPPING_API } from '@/api/endpoints';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import {
  parseConsultantMappingActiveStatus,
  type ConsultantMappingActiveStatus,
} from '@/api/consultantMappingActiveStatus';

export type { ConsultantMappingActiveStatus, ConsultantMappingSummary } from '@/api/consultantMappingActiveStatus';

const STALE_TIME_MS = 60 * 1000;
const GC_TIME_MS = 5 * 60 * 1000;

const QUERY_KEY_PREFIX = ['client', 'me', 'consultant-mappings', 'active'] as const;

async function fetchActiveMappingStatus(): Promise<ConsultantMappingActiveStatus> {
  const raw = await apiGet<unknown>(CLIENT_CONSULTANT_MAPPING_API.ACTIVE);
  return parseConsultantMappingActiveStatus(raw);
}

/**
 * 활성 상담사 매핑 상태 조회 훅.
 *
 * @returns React Query 결과 + 편의 플래그 `hasActiveMapping`
 */
export function useHasActiveConsultantMapping() {
  const { ready, tenantId } = useApiQueryReady();
  const queryResult = useQuery({
    queryKey: [...QUERY_KEY_PREFIX, tenantId] as const,
    queryFn: fetchActiveMappingStatus,
    enabled: ready,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    retry: 1,
  });
  return {
    ...queryResult,
    hasActiveMapping: queryResult.data?.hasActiveMapping ?? false,
    mappings: queryResult.data?.mappings ?? [],
  };
}
