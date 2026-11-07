/**
 * 시스템 공지(활성) 조회 — 커버 홈 「소식」 배너 슬롯 전용.
 * 서버가 역할·테넌트 기준으로 걸러 준 PUBLISHED·미만료 공지만 사용하며,
 * 조회 실패·빈 목록이면 배너를 숨긴다(가상 캠페인 생성 금지).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SYSTEM_NOTIFICATION_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import {
  normalizeActiveSystemNotices,
  type ActiveSystemNotice,
} from '@/utils/coverChapterViewModel';

const SYSTEM_NOTIFICATION_QUERY_KEYS = {
  all: ['systemNotifications'] as const,
  active: (tenantId: string, userId: number | string) =>
    [...SYSTEM_NOTIFICATION_QUERY_KEYS.all, 'active', tenantId, userId] as const,
};

const ACTIVE_STALE_MS = 1000 * 60 * 5;

export function useActiveSystemNotices() {
  const { ready, tenantId, userId } = useApiQueryReady({ requireUserId: true });

  return useQuery<ActiveSystemNotice[]>({
    queryKey: SYSTEM_NOTIFICATION_QUERY_KEYS.active(tenantId, userId ?? 'none'),
    queryFn: async () => {
      const raw = await apiGet<unknown>(SYSTEM_NOTIFICATION_API.GET_ACTIVE);
      return normalizeActiveSystemNotices(unwrapApiResponse<unknown>(raw));
    },
    enabled: ready && !!tenantId && userId != null,
    staleTime: ACTIVE_STALE_MS,
    retry: false,
  });
}

export { SYSTEM_NOTIFICATION_QUERY_KEYS };
