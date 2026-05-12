/**
 * 상담사 근무 가능 시간 · 휴가 TanStack Query 커스텀 훅
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
import { apiGet, apiPut, apiPost, apiDelete } from '../client';
import { CONSULTANT_API, VACATION_API } from '../endpoints';

export interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Vacation {
  id: number;
  consultantId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt?: string;
}

interface UpdateAvailabilityRequest {
  consultantId: string | number;
  slots: AvailabilitySlot[];
}

interface CreateVacationRequest {
  consultantId: string | number;
  startDate: string;
  endDate: string;
  reason?: string;
}

const AVAILABILITY_QUERY_KEYS = {
  all: ['availability'] as const,
  consultant: (consultantId: string | number) =>
    [...AVAILABILITY_QUERY_KEYS.all, 'consultant', consultantId] as const,
  vacations: (consultantId: string | number) =>
    [...AVAILABILITY_QUERY_KEYS.all, 'vacations', consultantId] as const,
};

export function useConsultantAvailability(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<AvailabilitySlot[]>>,
) {
  return useQuery<AvailabilitySlot[]>({
    queryKey: AVAILABILITY_QUERY_KEYS.consultant(consultantId!),
    queryFn: () =>
      apiGet<AvailabilitySlot[]>(
        CONSULTANT_API.consultantAvailability(consultantId!),
      ),
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultantId, slots }: UpdateAvailabilityRequest) =>
      apiPut(CONSULTANT_API.consultantAvailability(consultantId), { slots }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.consultant(variables.consultantId),
      });
    },
  });
}

export function useVacations(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<Vacation[]>>,
) {
  return useQuery<Vacation[]>({
    queryKey: AVAILABILITY_QUERY_KEYS.vacations(consultantId!),
    queryFn: () =>
      apiGet<Vacation[]>(VACATION_API.vacations(consultantId!)),
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCreateVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultantId, ...body }: CreateVacationRequest) =>
      apiPost(VACATION_API.vacations(consultantId), body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.vacations(variables.consultantId),
      });
    },
  });
}

export function useDeleteVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consultantId,
      vacationId,
    }: {
      consultantId: string | number;
      vacationId: string | number;
    }) => apiDelete(VACATION_API.vacationDetail(consultantId, vacationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.all,
      });
    },
  });
}

export { AVAILABILITY_QUERY_KEYS };
