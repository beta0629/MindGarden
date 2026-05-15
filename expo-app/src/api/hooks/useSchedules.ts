/**
 * 스케줄 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { addDays, format as formatDate, parseISO, startOfWeek } from 'date-fns';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet, apiPut } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  consultationTypeToKorean,
  resolveClientNameForScheduleRow,
} from '@/utils/scheduleDisplayLabels';

export interface Schedule {
  id: number;
  consultantId: number;
  clientId: number;
  clientName: string;
  clientProfileImageUrl?: string;
  consultantName: string;
  consultantProfileImageUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  consultationType: string;
  scheduleType?: string;
  sessionNumber?: number;
  title?: string;
  description?: string;
  notes?: string;
  memo?: string;
  location?: string;
  contactNumber?: string;
  consultationId?: number;
}

export interface ScheduleDetail extends Schedule {
  previousSessions?: Schedule[];
  consultationRecordId?: number;
  /** 백엔드 미제공 시 생략 가능 — UI에서는 falsy로 취급 */
  hasRecord?: boolean;
}

interface SchedulesParams {
  consultantId: string | number;
  date: string;
  view?: 'daily' | 'weekly';
}

const SCHEDULE_QUERY_KEYS = {
  all: ['schedules'] as const,
  lists: () => [...SCHEDULE_QUERY_KEYS.all, 'list'] as const,
  list: (params: SchedulesParams) => [...SCHEDULE_QUERY_KEYS.lists(), params] as const,
  details: () => [...SCHEDULE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...SCHEDULE_QUERY_KEYS.details(), id] as const,
  dashboard: (consultantId: string | number) =>
    [...SCHEDULE_QUERY_KEYS.all, 'dashboard', consultantId] as const,
};

/** Spring `ScheduleController` — 목록/단건은 `userId` + `userRole`(예: CONSULTANT) 쿼리가 표준 */
const CONSULTANT_USER_ROLE = 'CONSULTANT';

type CardScheduleStatus = Schedule['status'];

function mapBackendStatusToCardStatus(raw: string): CardScheduleStatus {
  const u = raw.toUpperCase();
  if (u === 'BOOKED' || u === 'SCHEDULED' || u === 'IN_PROGRESS' || u === 'COMPLETED' || u === 'CANCELLED' || u === 'NO_SHOW') {
    return u as CardScheduleStatus;
  }
  if (u === 'CONFIRMED' || u === 'TENTATIVE_PENDING_PAYMENT') return 'BOOKED';
  if (u === 'AVAILABLE') return 'SCHEDULED';
  if (u === 'VACATION') return 'CANCELLED';
  return 'SCHEDULED';
}

function formatTimePart(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') {
    return v.length >= 5 ? v.slice(0, 5) : v;
  }
  return String(v);
}

function normalizeScheduleRows(raw: unknown): unknown[] {
  const inner = unwrapApiResponse<unknown>(raw);
  if (Array.isArray(inner)) return inner;
  if (inner != null && typeof inner === 'object') {
    const o = inner as Record<string, unknown>;
    if (Array.isArray(o.schedules)) return o.schedules;
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function mapRowToSchedule(row: Record<string, unknown>, fallbackConsultantId: number): Schedule {
  const id = Number(row.id);
  const consultantId = Number(row.consultantId ?? fallbackConsultantId);
  const clientId = Number(row.clientId ?? 0);
  const safeClientId = Number.isFinite(clientId) ? clientId : 0;
  const dateVal = row.date;
  const dateStr =
    typeof dateVal === 'string'
      ? dateVal.slice(0, 10)
      : dateVal != null && typeof dateVal === 'object' && 'toString' in dateVal
        ? String(dateVal).slice(0, 10)
        : '';
  const clientName = resolveClientNameForScheduleRow(row, safeClientId);
  const consultantNameRaw = row.consultantName;
  const consultantName =
    typeof consultantNameRaw === 'string' && consultantNameRaw.trim().length > 0
      ? consultantNameRaw.trim()
      : '상담사';
  const status = mapBackendStatusToCardStatus(String(row.status ?? 'SCHEDULED'));
  const typeRaw =
    typeof row.consultationType === 'string' && row.consultationType.length > 0
      ? row.consultationType
      : typeof row.scheduleType === 'string' && row.scheduleType.length > 0
        ? row.scheduleType
        : '';
  const consultationType = consultationTypeToKorean(typeRaw || undefined);

  return {
    id: Number.isFinite(id) ? id : 0,
    consultantId: Number.isFinite(consultantId) ? consultantId : fallbackConsultantId,
    clientId: safeClientId,
    clientName,
    clientProfileImageUrl:
      typeof row.clientProfileImageUrl === 'string' ? row.clientProfileImageUrl : undefined,
    consultantName,
    consultantProfileImageUrl:
      typeof row.consultantProfileImageUrl === 'string' ? row.consultantProfileImageUrl : undefined,
    date: dateStr,
    startTime: formatTimePart(row.startTime),
    endTime: formatTimePart(row.endTime),
    status,
    consultationType,
    scheduleType: typeof row.scheduleType === 'string' ? row.scheduleType : undefined,
    sessionNumber: typeof row.sessionNumber === 'number' ? row.sessionNumber : undefined,
    title: typeof row.title === 'string' ? row.title : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
    memo: typeof row.memo === 'string' ? row.memo : undefined,
    location:
      typeof row.location === 'string'
        ? row.location
        : typeof row.consultationLocation === 'string'
          ? row.consultationLocation
          : undefined,
    contactNumber: typeof row.contactNumber === 'string' ? row.contactNumber : undefined,
    consultationId:
      typeof row.consultationId === 'number'
        ? row.consultationId
        : row.consultationId != null
          ? Number(row.consultationId)
          : undefined,
  };
}

/**
 * Spring `ScheduleController` — 단일 일자 목록 (`userId`, `userRole`).
 *
 * @param consultantId 상담사 사용자 ID
 * @param dateYmd yyyy-MM-dd
 */
async function fetchConsultantSchedulesForDate(
  consultantId: string | number,
  dateYmd: string,
): Promise<Schedule[]> {
  const raw = await apiGet<unknown>(`${SCHEDULE_API.SCHEDULES}/date/${encodeURIComponent(dateYmd)}`, {
    userId: consultantId,
    userRole: CONSULTANT_USER_ROLE,
  });
  const rows = normalizeScheduleRows(raw);
  const cid = typeof consultantId === 'string' ? Number(consultantId) : consultantId;
  const fallbackCid = Number.isFinite(cid) ? cid : 0;
  return rows.map((r) => mapRowToSchedule(r as Record<string, unknown>, fallbackCid));
}

async function fetchConsultantSchedulesForParams(params: SchedulesParams): Promise<Schedule[]> {
  const userId = params.consultantId;
  const queryBase = {
    userId,
    userRole: CONSULTANT_USER_ROLE,
  };

  if (params.view === 'weekly') {
    const base = parseISO(`${params.date}T12:00:00`);
    const start = startOfWeek(base, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    const raw = await apiGet<unknown>(`${SCHEDULE_API.SCHEDULES}/date-range`, {
      ...queryBase,
      startDate: formatDate(start, 'yyyy-MM-dd'),
      endDate: formatDate(end, 'yyyy-MM-dd'),
    });
    const rows = normalizeScheduleRows(raw);
    const cid = typeof userId === 'string' ? Number(userId) : userId;
    const fallbackCid = Number.isFinite(cid) ? cid : 0;
    return rows.map((r) => mapRowToSchedule(r as Record<string, unknown>, fallbackCid));
  }

  return fetchConsultantSchedulesForDate(userId, params.date);
}

export function useConsultantSchedules(
  params: SchedulesParams,
  options?: Partial<UseQueryOptions<Schedule[]>>,
) {
  return useQuery<Schedule[]>({
    queryKey: SCHEDULE_QUERY_KEYS.list(params),
    queryFn: () => fetchConsultantSchedulesForParams(params),
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
    queryFn: async () => {
      const user = useAuthStore.getState().user;
      if (user?.id == null) {
        throw new Error('로그인이 필요합니다.');
      }
      const userRole = user.role === 'consultant' ? CONSULTANT_USER_ROLE : 'CLIENT';
      const raw = await apiGet<unknown>(SCHEDULE_API.scheduleDetail(scheduleId!), {
        userId: user.id,
        userRole,
      });
      const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
      return mapRowToSchedule(inner, user.id) as ScheduleDetail;
    },
    enabled: !!scheduleId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useConsultantDashboard(consultantId: string | number | undefined) {
  const todayYmdForKey = formatDate(new Date(), 'yyyy-MM-dd');
  return useQuery<{
    todaySchedules: Schedule[];
    pendingRecordCount: number;
    todayCount: number;
    weeklyCount: number;
  }>({
    queryKey: [...SCHEDULE_QUERY_KEYS.dashboard(consultantId!), todayYmdForKey] as const,
    queryFn: async () => {
      const ymd = formatDate(new Date(), 'yyyy-MM-dd');
      const todaySchedules = await fetchConsultantSchedulesForDate(consultantId!, ymd);
      return {
        todaySchedules,
        /** 홈은 `usePendingRecords` 우선 — 대시보드 엔드포인트 미구현으로 중복 집계 방지 */
        pendingRecordCount: 0,
        todayCount: todaySchedules.length,
        weeklyCount: 0,
      };
    },
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
    mutate: (scheduleId: string | number) => mutation.mutate({ scheduleId, status: 'IN_PROGRESS' }),
    mutateAsync: (scheduleId: string | number) =>
      mutation.mutateAsync({ scheduleId, status: 'IN_PROGRESS' }),
  };
}

export function useCompleteConsultation() {
  const mutation = useUpdateScheduleStatus();
  return {
    ...mutation,
    mutate: (scheduleId: string | number) => mutation.mutate({ scheduleId, status: 'COMPLETED' }),
    mutateAsync: (scheduleId: string | number) =>
      mutation.mutateAsync({ scheduleId, status: 'COMPLETED' }),
  };
}

export { SCHEDULE_QUERY_KEYS };
