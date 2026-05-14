/**
 * 예약 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { CONSULTANT_API, SCHEDULE_API } from '../endpoints';
import { CONSULTATION_QUERY_KEYS } from './useConsultations';

export interface Consultant {
  id: number;
  name: string;
  profileImageUrl?: string;
  specialties: string[];
  averageRating: number;
  reviewCount: number;
  bio?: string;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityResponse {
  consultantId: number;
  consultantName: string;
  slots: AvailableSlot[];
}

interface CreateBookingRequest {
  consultantId: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  paymentMethod: 'SESSION_DEDUCT' | 'TOSS_PAYMENT';
  memo?: string;
}

const BOOKING_QUERY_KEYS = {
  all: ['booking'] as const,
  consultants: () => [...BOOKING_QUERY_KEYS.all, 'consultants'] as const,
  consultantList: (filters?: ConsultantFilters) =>
    [...BOOKING_QUERY_KEYS.consultants(), filters] as const,
  availability: (consultantId: string | number, weekStart: string) =>
    [...BOOKING_QUERY_KEYS.all, 'availability', consultantId, weekStart] as const,
};

interface ConsultantFilters {
  search?: string;
  specialty?: string;
}

const CONSULTANTS_PAGE_SIZE = 10;

export function useAvailableConsultants(filters?: ConsultantFilters) {
  return useInfiniteQuery<Consultant[]>({
    queryKey: BOOKING_QUERY_KEYS.consultantList(filters),
    queryFn: ({ pageParam }) =>
      apiGet<Consultant[]>(CONSULTANT_API.GET_ALL, {
        page: pageParam,
        size: CONSULTANTS_PAGE_SIZE,
        search: filters?.search,
        specialty: filters?.specialty,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === CONSULTANTS_PAGE_SIZE ? allPages.length : undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConsultantAvailability(
  consultantId: string | number | undefined,
  weekStart: string | undefined,
) {
  return useQuery<AvailabilityResponse>({
    queryKey: BOOKING_QUERY_KEYS.availability(consultantId!, weekStart!),
    queryFn: () =>
      apiGet<AvailabilityResponse>(CONSULTANT_API.consultantAvailability(consultantId!), {
        weekStart,
      }),
    enabled: !!consultantId && !!weekStart,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => apiPost(SCHEDULE_API.SCHEDULE_CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CONSULTATION_QUERY_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: BOOKING_QUERY_KEYS.all,
      });
    },
  });
}

export { BOOKING_QUERY_KEYS };
