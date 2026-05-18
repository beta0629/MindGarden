/**
 * 어드민·스태프 — 오늘 테넌트 스케줄 (SCHEDULE_API 재사용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { format } from 'date-fns';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { type Schedule, sortSchedulesChronologically } from './useSchedules';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  adminMobileScheduleUserRole,
  resolveAdminMobileJwtRole,
  resolveAdminMobileJwtRoleFromStoreRole,
} from '@/utils/adminRole';

const ADMIN_SCHEDULE_QUERY_KEYS = {
  all: ['admin-mobile', 'schedules'] as const,
  today: (userId: number, role: string, dateYmd: string) =>
    [...ADMIN_SCHEDULE_QUERY_KEYS.all, 'today', userId, role, dateYmd] as const,
};

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

function formatTimePart(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') {
    return v.length >= 5 ? v.slice(0, 5) : v;
  }
  return String(v);
}

type CardScheduleStatus = Schedule['status'];

function mapBackendStatusToCardStatus(raw: string): CardScheduleStatus {
  const u = raw.toUpperCase();
  if (
    u === 'BOOKED' ||
    u === 'SCHEDULED' ||
    u === 'CONFIRMED' ||
    u === 'IN_PROGRESS' ||
    u === 'COMPLETED' ||
    u === 'CANCELLED' ||
    u === 'NO_SHOW'
  ) {
    return u as CardScheduleStatus;
  }
  if (u === 'TENTATIVE_PENDING_PAYMENT') return 'BOOKED';
  if (u === 'AVAILABLE') return 'SCHEDULED';
  if (u === 'VACATION') return 'CANCELLED';
  return 'SCHEDULED';
}

function mapAdminScheduleRow(row: Record<string, unknown>): Schedule {
  const id = Number(row.id);
  const consultantId = Number(row.consultantId ?? 0);
  const clientId = Number(row.clientId ?? 0);
  const dateVal = row.date;
  const dateStr =
    typeof dateVal === 'string'
      ? dateVal.slice(0, 10)
      : dateVal != null
        ? String(dateVal).slice(0, 10)
        : '';
  const clientNameRaw = row.clientName;
  const clientName =
    typeof clientNameRaw === 'string' && clientNameRaw.trim().length > 0
      ? clientNameRaw.trim()
      : '내담자';
  const consultantNameRaw = row.consultantName;
  const consultantName =
    typeof consultantNameRaw === 'string' && consultantNameRaw.trim().length > 0
      ? consultantNameRaw.trim()
      : '상담사';

  return {
    id: Number.isFinite(id) ? id : 0,
    consultantId: Number.isFinite(consultantId) ? consultantId : 0,
    clientId: Number.isFinite(clientId) ? clientId : 0,
    clientName,
    consultantName,
    date: dateStr,
    startTime: formatTimePart(row.startTime),
    endTime: formatTimePart(row.endTime),
    status: mapBackendStatusToCardStatus(String(row.status ?? 'SCHEDULED')),
    consultationType:
      typeof row.consultationType === 'string'
        ? row.consultationType
        : typeof row.scheduleType === 'string'
          ? row.scheduleType
          : '',
  };
}

async function fetchAdminTodaySchedules(
  userId: number,
  userRole: string,
  dateYmd: string,
): Promise<Schedule[]> {
  const raw = await apiGet<unknown>(
    `${SCHEDULE_API.SCHEDULES}/date/${encodeURIComponent(dateYmd)}`,
    { userId, userRole },
  );
  const rows = normalizeScheduleRows(raw);
  return sortSchedulesChronologically(
    rows.map((r) => mapAdminScheduleRow(r as Record<string, unknown>)),
  );
}

export function useAdminTodaySchedules(options?: Partial<UseQueryOptions<Schedule[]>>) {
  const { ready, userId } = useAdminApiQueryReady();
  useAdminApiTenantSync();
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeRole = useAuthStore((s) => s.role);
  const jwtRole =
    resolveAdminMobileJwtRole(accessToken) ??
    resolveAdminMobileJwtRoleFromStoreRole(storeRole);
  const scheduleRole = adminMobileScheduleUserRole(jwtRole);
  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  const query = useQuery<Schedule[]>({
    queryKey:
      userId && scheduleRole
        ? ADMIN_SCHEDULE_QUERY_KEYS.today(userId, scheduleRole, todayYmd)
        : [...ADMIN_SCHEDULE_QUERY_KEYS.all, 'disabled'],
    queryFn: () => {
      if (userId == null || !scheduleRole) {
        throw new Error('관리자 일정 조회 권한이 없습니다.');
      }
      return fetchAdminTodaySchedules(userId, scheduleRole, todayYmd);
    },
    enabled: ready && Boolean(scheduleRole) && options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
    retry: false,
    ...options,
  });

  return { ...query, ready };
}
