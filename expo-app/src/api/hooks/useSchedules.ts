/**
 * 스케줄 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiGet, apiPut } from '../client';
import { SCHEDULE_API, CONSULTANT_API } from '../endpoints';

export interface Schedule {
  id: number;
  consultantId: number;
  clientId: number;
  clientName: string;
  clientProfileImageUrl?: string;
  consultantName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  sessionType: string;
  sessionNumber?: number;
  memo?: string;
  location?: string;
  contactNumber?: string;
}

export interface ScheduleDetail extends Schedule {
  previousSessions?: Schedule[];
  consultationRecordId?: number;
  hasRecord: boolean;
}

interface SchedulesParams {
  consultantId: string | number;
  date: string;
  view?: 'daily' | 'weekly';
}

const SCHEDULE_QUERY_KEYS = {
  all: ['schedules'] as const,
  lists: () => [...SCHEDULE_QUERY_KEYS.all, 'list'] as const,
  list: (params: SchedulesParams) =>
    [...SCHEDULE_QUERY_KEYS.lists(), params] as const,
  details: () => [...SCHEDULE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) =>
    [...SCHEDULE_QUERY_KEYS.details(), id] as const,
  dashboard: (consultantId: string | number) =>
    [...SCHEDULE_QUERY_KEYS.all, 'dashboard', consultantId] as const,
};

export function useConsultantSchedules(
  params: SchedulesParams,
  options?: Partial<UseQueryOptions<Schedule[]>>,
) {
  return useQuery<Schedule[]>({
    queryKey: SCHEDULE_QUERY_KEYS.list(params),
    queryFn: () =>
      apiGet<Schedule[]>(SCHEDULE_API.SCHEDULES, {
        consultantId: params.consultantId,
        date: params.date,
        view: params.view ?? 'daily',
      }),
    enabled: !!params.consultantId && !!params.date,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

export function useScheduleDetail(
  scheduleId: string | number | undefined,
  options?: Partial<UseQueryOptions<ScheduleDetail>>,
) {
  return useQuery<ScheduleDetail>({
    queryKey: SCHEDULE_QUERY_KEYS.detail(scheduleId!),
    queryFn: () =>
      apiGet<ScheduleDetail>(SCHEDULE_API.scheduleDetail(scheduleId!)),
    enabled: !!scheduleId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useConsultantDashboard(
  consultantId: string | number | undefined,
) {
  return useQuery<{
    todaySchedules: Schedule[];
    pendingRecordCount: number;
    todayCount: number;
    weeklyCount: number;
  }>({
    queryKey: SCHEDULE_QUERY_KEYS.dashboard(consultantId!),
    queryFn: () =>
      apiGet(CONSULTANT_API.consultantDashboard(consultantId!)),
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 2,
  });
}

interface StatusMutationVars {
  scheduleId: string | number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export function useUpdateScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, status }: StatusMutationVars) =>
      apiPut(SCHEDULE_API.scheduleDetail(scheduleId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
    },
  });
}

export function useStartConsultation() {
  const mutation = useUpdateScheduleStatus();
  return {
    ...mutation,
    mutate: (scheduleId: string | number) =>
      mutation.mutate({ scheduleId, status: 'IN_PROGRESS' }),
    mutateAsync: (scheduleId: string | number) =>
      mutation.mutateAsync({ scheduleId, status: 'IN_PROGRESS' }),
  };
}

export function useCompleteConsultation() {
  const mutation = useUpdateScheduleStatus();
  return {
    ...mutation,
    mutate: (scheduleId: string | number) =>
      mutation.mutate({ scheduleId, status: 'COMPLETED' }),
    mutateAsync: (scheduleId: string | number) =>
      mutation.mutateAsync({ scheduleId, status: 'COMPLETED' }),
  };
}

export { SCHEDULE_QUERY_KEYS };
