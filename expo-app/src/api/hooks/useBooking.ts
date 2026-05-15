/**
 * 예약 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { CONSULTANT_API, SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
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

function extractConsultantsPayload(raw: unknown): unknown[] {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  if (data != null && typeof data === 'object') {
    const list = (data as Record<string, unknown>).consultants;
    if (Array.isArray(list)) {
      return list;
    }
  }
  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (Array.isArray(root.consultants)) {
      return root.consultants;
    }
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  return [];
}

function mapConsultantRow(row: Record<string, unknown>): Consultant {
  const id = Number(row.id);
  const nameRaw = row.name;
  const name = typeof nameRaw === 'string' && nameRaw.trim().length > 0 ? nameRaw.trim() : '상담사';
  const spec = row.specialty;
  const specialties =
    typeof spec === 'string' && spec.trim().length > 0
      ? spec
          .split(/[,/，]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const avg = row.averageRating;
  const averageRating = typeof avg === 'number' && Number.isFinite(avg) ? avg : Number(avg) || 0;
  const tr = row.totalRatings ?? row.reviewCount;
  const reviewCount = typeof tr === 'number' && Number.isFinite(tr) ? tr : Number(tr) || 0;
  const bioRaw = row.professionalBackground ?? row.specialtyDetails;
  const bio = typeof bioRaw === 'string' && bioRaw.trim().length > 0 ? bioRaw.trim() : undefined;
  const profileImageUrl = typeof row.profileImageUrl === 'string' ? row.profileImageUrl : undefined;

  return {
    id: Number.isFinite(id) ? id : 0,
    name,
    profileImageUrl,
    specialties,
    averageRating,
    reviewCount,
    bio,
  };
}

export function useAvailableConsultants(filters?: ConsultantFilters) {
  return useInfiniteQuery<Consultant[]>({
    queryKey: BOOKING_QUERY_KEYS.consultantList(filters),
    queryFn: async () => {
      const raw = await apiGet<unknown>(CONSULTANT_API.GET_ALL, {
        search: filters?.search,
        specialty: filters?.specialty,
      });
      const rows = extractConsultantsPayload(raw);
      return rows.map((r) => mapConsultantRow(r as Record<string, unknown>));
    },
    initialPageParam: 0,
    /** Spring `ConsultantController#getConsultants` 는 페이지 파라미터 없이 전체 목록만 반환 */
    getNextPageParam: () => undefined,
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
