/**
 * 내담자용 상담 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useQuery,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API, DASHBOARD_API } from '../endpoints';
import type { Schedule, ScheduleDetail } from './useSchedules';

type ConsultationStatus = 'SCHEDULED' | 'COMPLETED' | 'ALL';

interface ClientConsultationsParams {
  clientId: string | number;
  status?: ConsultationStatus;
}

const CONSULTATION_QUERY_KEYS = {
  all: ['consultations'] as const,
  lists: () => [...CONSULTATION_QUERY_KEYS.all, 'list'] as const,
  list: (params: ClientConsultationsParams) =>
    [...CONSULTATION_QUERY_KEYS.lists(), params] as const,
  details: () => [...CONSULTATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) =>
    [...CONSULTATION_QUERY_KEYS.details(), id] as const,
  upcoming: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'upcoming', clientId] as const,
  clientDashboard: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'dashboard', clientId] as const,
};

const PAGE_SIZE = 20;

export function useClientConsultations(params: ClientConsultationsParams) {
  const statusFilter =
    params.status === 'ALL' ? undefined : params.status;

  return useInfiniteQuery<Schedule[]>({
    queryKey: CONSULTATION_QUERY_KEYS.list(params),
    queryFn: ({ pageParam }) =>
      apiGet<Schedule[]>(SCHEDULE_API.SCHEDULES, {
        userId: params.clientId,
        userRole: 'CLIENT',
        status: statusFilter,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!params.clientId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useConsultationDetail(
  consultationId: string | number | undefined,
  options?: Partial<UseQueryOptions<ScheduleDetail>>,
) {
  return useQuery<ScheduleDetail>({
    queryKey: CONSULTATION_QUERY_KEYS.detail(consultationId!),
    queryFn: () =>
      apiGet<ScheduleDetail>(SCHEDULE_API.scheduleDetail(consultationId!)),
    enabled: !!consultationId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export interface UpcomingConsultation extends Schedule {
  daysUntil: number;
}

export function useUpcomingConsultation(
  clientId: string | number | undefined,
) {
  return useQuery<UpcomingConsultation | null>({
    queryKey: CONSULTATION_QUERY_KEYS.upcoming(clientId!),
    queryFn: () =>
      apiGet<UpcomingConsultation | null>(SCHEDULE_API.SCHEDULES, {
        userId: clientId,
        userRole: 'CLIENT',
        status: 'SCHEDULED',
        page: 0,
        size: 1,
        sort: 'scheduledDate,asc',
      }),
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

export function useClientDashboard(
  clientId: string | number | undefined,
) {
  return useQuery<ClientDashboardData>({
    queryKey: CONSULTATION_QUERY_KEYS.clientDashboard(clientId!),
    queryFn: () => apiGet<ClientDashboardData>(DASHBOARD_API.CLIENT),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

export { CONSULTATION_QUERY_KEYS };
