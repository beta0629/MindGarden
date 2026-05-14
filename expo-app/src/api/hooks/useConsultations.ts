/**
 * 내담자용 상담 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API, DASHBOARD_API } from '../endpoints';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Schedule, ScheduleDetail } from './useSchedules';

type ConsultationStatus = 'SCHEDULED' | 'BOOKED' | 'COMPLETED' | 'ALL';

interface ClientConsultationsParams {
  clientId: string | number | undefined;
  status?: ConsultationStatus;
}

const CONSULTATION_QUERY_KEYS = {
  all: ['consultations'] as const,
  lists: () => [...CONSULTATION_QUERY_KEYS.all, 'list'] as const,
  list: (params: ClientConsultationsParams) =>
    [...CONSULTATION_QUERY_KEYS.lists(), params] as const,
  details: () => [...CONSULTATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number, userId?: string | number | null) =>
    [...CONSULTATION_QUERY_KEYS.details(), id, userId ?? 'none'] as const,
  upcoming: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'upcoming', clientId] as const,
  clientDashboard: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'dashboard', clientId] as const,
};

const PAGE_SIZE = 20;

export function useClientConsultations(params: ClientConsultationsParams) {
  const statusFilter = params.status === 'ALL' ? undefined : params.status;
  const hasValidClientId =
    params.clientId != null && params.clientId !== '' && params.clientId !== 0;

  return useInfiniteQuery<Schedule[]>({
    queryKey: CONSULTATION_QUERY_KEYS.list(params),
    queryFn: async ({ pageParam }) => {
      const response = await apiGet<any>(SCHEDULE_API.SCHEDULES, {
        userId: params.clientId,
        userRole: 'CLIENT',
        status: statusFilter,
        page: pageParam,
        size: PAGE_SIZE,
      });

      console.log(
        '[useClientConsultations] raw response:',
        JSON.stringify(response)?.substring(0, 500),
      );

      const extracted =
        response?.data?.schedules ??
        response?.data?.content ??
        (Array.isArray(response?.data) ? response.data : null) ??
        response?.schedules ??
        response?.content ??
        (Array.isArray(response) ? response : []);
      return extracted;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: hasValidClientId,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
  });
}

export function useConsultationDetail(
  consultationId: string | number | undefined,
  options?: Partial<UseQueryOptions<ScheduleDetail>>,
) {
  const authUserId = useAuthStore((s) => s.user?.id);

  return useQuery<ScheduleDetail>({
    queryKey: CONSULTATION_QUERY_KEYS.detail(consultationId!, authUserId),
    queryFn: async () => {
      const { user, role } = useAuthStore.getState();
      const userId = user?.id;
      if (userId == null) {
        throw new Error('로그인이 필요합니다.');
      }
      const userRole = role === 'consultant' ? 'CONSULTANT' : 'CLIENT';
      const r = await apiGet<any>(SCHEDULE_API.scheduleDetail(consultationId!), {
        userId,
        userRole,
      });
      console.log('[useConsultationDetail] raw response:', JSON.stringify(r)?.substring(0, 500));
      const d = r?.data;
      if (d != null && typeof d === 'object' && 'id' in d) {
        return d as ScheduleDetail;
      }
      const nested = d?.schedule ?? d;
      if (nested != null && typeof nested === 'object' && 'id' in nested) {
        return nested as ScheduleDetail;
      }
      const fallback = r?.schedule ?? r;
      return fallback as ScheduleDetail;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
    enabled: options?.enabled !== false && !!consultationId && authUserId != null,
  });
}

export interface UpcomingConsultation extends Schedule {
  daysUntil: number;
}

export function useUpcomingConsultation(clientId: string | number | undefined) {
  return useQuery<UpcomingConsultation | null>({
    queryKey: CONSULTATION_QUERY_KEYS.upcoming(clientId!),
    queryFn: async () => {
      const response = await apiGet<any>(SCHEDULE_API.SCHEDULES, {
        userId: clientId,
        userRole: 'CLIENT',
        status: 'SCHEDULED',
        page: 0,
        size: 1,
        sort: 'date,asc',
      });

      console.log(
        '[useUpcomingConsultation] raw response:',
        JSON.stringify(response)?.substring(0, 500),
      );

      const schedules =
        response?.data?.schedules ??
        response?.data?.content ??
        (Array.isArray(response?.data) ? response.data : null) ??
        response?.schedules ??
        response?.content ??
        (Array.isArray(response) ? response : []);
      return schedules.length > 0 ? schedules[0] : null;
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

export interface ClientDashboardData {
  totalConsultations: number;
  thisMonthCount: number;
  streakDays: number;
  upcomingSchedule: Schedule | null;
}

export function useClientDashboard(clientId: string | number | undefined) {
  return useQuery<ClientDashboardData>({
    queryKey: CONSULTATION_QUERY_KEYS.clientDashboard(clientId!),
    queryFn: async () => {
      const response = await apiGet<any>(DASHBOARD_API.CLIENT);
      console.log(
        '[useClientDashboard] raw response:',
        JSON.stringify(response)?.substring(0, 500),
      );
      return response?.data ?? response;
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

export { CONSULTATION_QUERY_KEYS };
