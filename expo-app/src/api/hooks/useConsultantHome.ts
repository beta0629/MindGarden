/**
 * 상담사 모바일 홈 Phase1 API 훅 — 웹 ConsultantDashboardV2 SSOT 정렬
 *
 * @author MindGarden
 * @since 2026-07-07
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md §4
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { CONSULTANT_HOME_QUERY_KEYS } from './consultantHomeQueryKeys';
import {
  normalizeConsultantHomeStats,
  normalizeHighPriorityClients,
  normalizeIncompleteRecords,
  normalizeUpcomingPreparation,
  type ConsultantHomeStats,
  type HighPriorityClientItem,
  type IncompleteRecordsData,
  type UpcomingPreparationSession,
} from '@/utils/consultantHomeApiNormalize';

export { CONSULTANT_HOME_QUERY_KEYS } from './consultantHomeQueryKeys';

export type {
  ConsultantHomeStats,
  IncompleteRecordItem,
  IncompleteRecordsData,
  HighPriorityClientItem,
  UpcomingPreparationSession,
} from '@/utils/consultantHomeApiNormalize';

const CONSULTANT_USER_ROLE = 'CONSULTANT';
const STALE_MS = 1000 * 60 * 2;

export function useConsultantHomeStats(
  options?: Partial<UseQueryOptions<ConsultantHomeStats>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<ConsultantHomeStats>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.stats(),
    queryFn: async () => {
      const raw = await apiGet<unknown>(SCHEDULE_API.TODAY_STATISTICS, {
        userRole: CONSULTANT_USER_ROLE,
      });
      return normalizeConsultantHomeStats(raw);
    },
    enabled: ready,
    staleTime: STALE_MS,
    placeholderData: {
      totalToday: 0,
      newClients: 0,
      completedToday: 0,
      bookedToday: 0,
    },
    ...options,
  });
}

export function useIncompleteRecords(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<IncompleteRecordsData>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<IncompleteRecordsData>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.incompleteRecords(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantIncompleteRecords(consultantId!),
      );
      return normalizeIncompleteRecords(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: { count: 0, records: [] },
    ...options,
  });
}

export function useHighPriorityClients(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<HighPriorityClientItem[]>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<HighPriorityClientItem[]>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.highPriorityClients(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantHighPriorityClients(consultantId!),
      );
      return normalizeHighPriorityClients(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: [],
    ...options,
  });
}

export function useUpcomingPreparation(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<UpcomingPreparationSession | null>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<UpcomingPreparationSession | null>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.upcomingPreparation(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantUpcomingPreparation(consultantId!),
      );
      return normalizeUpcomingPreparation(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: null,
    ...options,
  });
}
