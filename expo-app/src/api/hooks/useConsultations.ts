/**
 * 내담자용 상담 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { format, subDays, startOfDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useClientScheduleApiContext } from '@/hooks/useClientScheduleApiContext';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  consultationTypeToKorean,
  resolveClientNameForScheduleRow,
} from '@/utils/scheduleDisplayLabels';
import type { Schedule, ScheduleDetail } from './useSchedules';

type ConsultationStatus = 'SCHEDULED' | 'BOOKED' | 'COMPLETED' | 'ALL';

/**
 * Spring에 `GET /api/v1/dashboard/client` JSON REST 없음 — 내담자 상담 목록으로 홈 통계 구성
 * (`endpoints.ts` 변경 없이 이 파일에서만 사용)
 */
const CLIENT_HOME_STATS_URL = '/api/v1/consultations';

interface ClientConsultationsParams {
  status?: ConsultationStatus;
  clientId?: number | string;
}

const CONSULTATION_QUERY_KEYS = {
  all: ['consultations'] as const,
  lists: () => [...CONSULTATION_QUERY_KEYS.all, 'list'] as const,
  list: (params: ClientConsultationsParams) =>
    [...CONSULTATION_QUERY_KEYS.lists(), params] as const,
  /** 탭과 무관하게 동일 캐시 — 클라이언트에서 탭별 필터 */
  clientPagedList: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.lists(), 'paged', clientId] as const,
  details: () => [...CONSULTATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number, userId?: string | number | null) =>
    [...CONSULTATION_QUERY_KEYS.details(), id, userId ?? 'none'] as const,
  upcoming: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'upcoming', clientId] as const,
  clientDashboard: (clientId: string | number) =>
    [...CONSULTATION_QUERY_KEYS.all, 'dashboard', clientId] as const,
};

const PAGE_SIZE = 20;

/** 내 상담 화면 탭 — `Schedule` 카드 상태 기준 */
export function matchesClientSessionsTab(
  schedule: Schedule,
  tab: 'SCHEDULED' | 'COMPLETED',
): boolean {
  if (tab === 'COMPLETED') {
    return schedule.status === 'COMPLETED';
  }
  return schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELLED';
}

type CardScheduleStatus = Schedule['status'];

function mapBackendStatusToCardStatus(raw: string): CardScheduleStatus {
  const u = raw.toUpperCase();
  if (
    u === 'BOOKED' ||
    u === 'SCHEDULED' ||
    u === 'IN_PROGRESS' ||
    u === 'COMPLETED' ||
    u === 'CANCELLED' ||
    u === 'NO_SHOW'
  ) {
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

function mapClientScheduleRow(
  row: Record<string, unknown>,
  fallbackConsultantId: number,
): Schedule {
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

export interface ClientConsultationPage {
  items: Schedule[];
  pageNumber: number;
  totalPages: number;
}

function parseSpringPagePayload(raw: unknown): {
  content: Record<string, unknown>[];
  pageNumber: number;
  totalPages: number;
} {
  const pageBody =
    unwrapApiResponse<Record<string, unknown>>(raw) ??
    (raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null);
  if (pageBody == null) {
    return { content: [], pageNumber: 0, totalPages: 0 };
  }
  const content = Array.isArray(pageBody.content)
    ? (pageBody.content as Record<string, unknown>[])
    : [];
  const pageNumber = typeof pageBody.number === 'number' ? pageBody.number : 0;
  const totalPages = typeof pageBody.totalPages === 'number' ? pageBody.totalPages : 0;
  return { content, pageNumber, totalPages };
}

export function useClientConsultations(params: ClientConsultationsParams = {}) {
  const { effectiveUserId, queryEnabled } = useClientScheduleApiContext(params.clientId);
  const clientIdNum = effectiveUserId ?? -1;

  return useInfiniteQuery<ClientConsultationPage>({
    queryKey: CONSULTATION_QUERY_KEYS.clientPagedList(clientIdNum),
    queryFn: async ({ pageParam }) => {
      const raw = await apiGet<unknown>(`${SCHEDULE_API.SCHEDULES}/paged`, {
        userId: effectiveUserId,
        userRole: 'CLIENT',
        page: pageParam,
        size: PAGE_SIZE,
      });
      const { content, pageNumber, totalPages } = parseSpringPagePayload(raw);
      const fallbackCid = effectiveUserId ?? 0;
      const items = content.map((r) => mapClientScheduleRow(r, fallbackCid));
      return { items, pageNumber, totalPages };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.totalPages > 0 && lastPage.pageNumber + 1 < lastPage.totalPages
        ? lastPage.pageNumber + 1
        : undefined,
    enabled: queryEnabled,
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
      const r = await apiGet<unknown>(SCHEDULE_API.scheduleDetail(consultationId!), {
        userId,
        userRole,
      });
      const inner = unwrapApiResponse<Record<string, unknown>>(r) ?? (r as Record<string, unknown>);
      if (inner != null && typeof inner === 'object' && 'id' in inner) {
        return mapClientScheduleRow(inner, userId) as ScheduleDetail;
      }
      const nested = inner?.schedule;
      if (nested != null && typeof nested === 'object' && 'id' in nested) {
        return mapClientScheduleRow(nested as Record<string, unknown>, userId) as ScheduleDetail;
      }
      const fallback = (inner as Record<string, unknown> | undefined)?.schedule ?? inner ?? r;
      return mapClientScheduleRow(fallback as Record<string, unknown>, userId) as ScheduleDetail;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
    enabled: options?.enabled !== false && !!consultationId && authUserId != null,
  });
}

export interface UpcomingConsultation extends Schedule {
  daysUntil: number;
}

function scheduleSortKey(s: Schedule): string {
  return `${s.date}T${(s.startTime ?? '00:00').slice(0, 5)}:00`;
}

export function useUpcomingConsultation(clientId?: number | string) {
  const { effectiveUserId, queryEnabled } = useClientScheduleApiContext(clientId);
  const clientIdNum = effectiveUserId ?? -1;

  return useQuery<UpcomingConsultation | null>({
    queryKey: CONSULTATION_QUERY_KEYS.upcoming(clientIdNum),
    queryFn: async () => {
      const raw = await apiGet<unknown>(`${SCHEDULE_API.SCHEDULES}/paged`, {
        userId: effectiveUserId,
        userRole: 'CLIENT',
        page: 0,
        size: 48,
      });
      const { content } = parseSpringPagePayload(raw);
      const fallbackCid = effectiveUserId ?? 0;
      const schedules = content.map((r) => mapClientScheduleRow(r, fallbackCid));
      const upcoming = schedules
        .filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
        .sort((a, b) => scheduleSortKey(a).localeCompare(scheduleSortKey(b)))[0];
      if (upcoming == null) {
        return null;
      }
      const target = parseISO(`${upcoming.date}T12:00:00`);
      const daysUntil = differenceInCalendarDays(startOfDay(target), startOfDay(new Date()));
      return { ...upcoming, daysUntil };
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface ClientDashboardData {
  totalConsultations: number;
  thisMonthCount: number;
  streakDays: number;
  upcomingSchedule: Schedule | null;
}

function extractConsultationsListForStats(raw: unknown): {
  rows: Record<string, unknown>[];
  totalCount: number;
} {
  const data =
    unwrapApiResponse<Record<string, unknown>>(raw) ??
    (raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null);
  if (data == null) {
    return { rows: [], totalCount: 0 };
  }
  const list = data.consultations;
  const rows = Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
  const tc = data.totalCount;
  const totalCount = typeof tc === 'number' && Number.isFinite(tc) ? tc : rows.length;
  return { rows, totalCount };
}

function activeConsultationDateKeys(rows: Record<string, unknown>[]): Set<string> {
  const keys = new Set<string>();
  for (const o of rows) {
    const st = String(o.status ?? '').toUpperCase();
    if (st === 'CANCELLED') {
      continue;
    }
    const d = o.consultationDate;
    if (typeof d === 'string' && d.length >= 10) {
      keys.add(d.slice(0, 10));
    }
  }
  return keys;
}

function streakDaysFromDates(activeDates: Set<string>): number {
  let streak = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 366; i += 1) {
    const key = format(subDays(today, i), 'yyyy-MM-dd');
    if (activeDates.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function useClientDashboard(clientId?: number | string) {
  const { effectiveUserId, queryEnabled } = useClientScheduleApiContext(clientId);
  const clientIdNum = effectiveUserId ?? -1;

  return useQuery<ClientDashboardData>({
    queryKey: CONSULTATION_QUERY_KEYS.clientDashboard(clientIdNum),
    queryFn: async () => {
      const raw = await apiGet<unknown>(CLIENT_HOME_STATS_URL, {
        clientId: effectiveUserId,
      });
      const { rows, totalCount } = extractConsultationsListForStats(raw);
      const monthPrefix = format(new Date(), 'yyyy-MM');
      const thisMonthCount = rows.filter((o) => {
        const st = String(o.status ?? '').toUpperCase();
        if (st === 'CANCELLED') {
          return false;
        }
        const d = o.consultationDate;
        return typeof d === 'string' && d.startsWith(monthPrefix);
      }).length;
      const streakDays = streakDaysFromDates(activeConsultationDateKeys(rows));
      return {
        totalConsultations: totalCount,
        thisMonthCount,
        streakDays,
        upcomingSchedule: null,
      };
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });
}

export { CONSULTATION_QUERY_KEYS };
