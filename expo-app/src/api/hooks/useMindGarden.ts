/**
 * 「마음 정원」서버 상태 TanStack Query 훅 (백엔드 미연동 시 비활성 스텁)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useQuery } from '@tanstack/react-query';
import type { MindGardenServerState } from '@/types/mindGarden';

const MIND_GARDEN_QUERY_KEYS = {
  all: ['mind-garden'] as const,
  serverState: () => [...MIND_GARDEN_QUERY_KEYS.all, 'server-state'] as const,
};

/**
 * 서버 권위 정원 상태 조회 — Spring `GET /api/v1/clients/me/mind-garden` 연동 시 `enabled`·`queryFn`을 활성화한다.
 */
export function useMindGardenServerState() {
  return useQuery<MindGardenServerState | null>({
    queryKey: MIND_GARDEN_QUERY_KEYS.serverState(),
    queryFn: async () => {
      /* TODO: core-coder 백엔드 부착 후 — `apiGet<MindGardenServerState>(GARDEN_API.STATE)` */
      return null;
    },
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * 정원 이벤트 서버 적재 — 오프라인 큐·POST `/api/v1/clients/me/mind-garden/events` 완성은 별도 Task.
 */
export async function postMindGardenEventStub(): Promise<void> {
  /* TODO: `apiPost(GARDEN_API.APPLY_EVENT, body)` + 실패 시 `gardenGrowthLocalEventQueue` 적재 */
}
