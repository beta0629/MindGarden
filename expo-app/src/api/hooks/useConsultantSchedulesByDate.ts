/**
 * 상담사·일자별 기존 스케줄 — TimeSlotGrid `GET .../consultant/{id}/date` SSOT
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  buildOccupiedRangesFromSchedules,
  normalizeScheduleTimeForSlot,
  resolveScheduleStatusCodeForConflict,
  type OccupiedTimeRange,
  type ScheduleSlotForConflict,
} from '@/utils/scheduleTimeSlotConflict';

const QUERY_BASE = ['admin-mobile', 'consultant-schedules-by-date'] as const;

export const CONSULTANT_SCHEDULES_BY_DATE_QUERY_KEYS = {
  all: QUERY_BASE,
  detail: (tenantId: string, consultantId: number, dateYmd: string) =>
    [...QUERY_BASE, tenantId, consultantId, dateYmd] as const,
};

export type ConsultantScheduleByDateItem = {
  readonly id: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: string | null;
  readonly statusCode: string | null;
};

function normalizeScheduleRows(raw: unknown): unknown[] {
  const inner = unwrapApiResponse<unknown>(raw);
  if (Array.isArray(inner)) {
    return inner;
  }
  if (inner != null && typeof inner === 'object') {
    const o = inner as Record<string, unknown>;
    if (Array.isArray(o.schedules)) {
      return o.schedules;
    }
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  return [];
}

export function parseConsultantSchedulesByDateResponse(raw: unknown): ConsultantScheduleByDateItem[] {
  const rows = normalizeScheduleRows(raw);
  return rows
    .map((row) => {
      if (row == null || typeof row !== 'object') {
        return null;
      }
      const r = row as Record<string, unknown>;
      const id = Number(r.id);
      const startTime = normalizeScheduleTimeForSlot(r.startTime);
      const endTime = normalizeScheduleTimeForSlot(r.endTime);
      if (!startTime || !endTime) {
        return null;
      }
      const statusRaw = r.status;
      const status =
        statusRaw != null && String(statusRaw).trim() !== '' ? String(statusRaw).trim() : null;
      const statusCodeRaw = r.statusCode;
      const statusCode =
        statusCodeRaw != null && String(statusCodeRaw).trim() !== ''
          ? String(statusCodeRaw).trim().toUpperCase()
          : resolveScheduleStatusCodeForConflict({
              startTime,
              endTime,
              status,
              statusCode: null,
            });
      return {
        id: Number.isFinite(id) ? id : 0,
        startTime,
        endTime,
        status,
        statusCode,
      };
    })
    .filter((item): item is ConsultantScheduleByDateItem => item != null);
}

export function toScheduleSlotsForConflict(
  items: readonly ConsultantScheduleByDateItem[],
): ScheduleSlotForConflict[] {
  return items.map((item) => ({
    startTime: item.startTime,
    endTime: item.endTime,
    status: item.status,
    statusCode: item.statusCode,
  }));
}

export function occupiedRangesFromConsultantSchedules(
  items: readonly ConsultantScheduleByDateItem[],
): OccupiedTimeRange[] {
  return buildOccupiedRangesFromSchedules(toScheduleSlotsForConflict(items));
}

async function fetchConsultantSchedulesByDate(
  consultantId: number,
  dateYmd: string,
): Promise<ConsultantScheduleByDateItem[]> {
  const raw = await apiGet<unknown>(
    `${SCHEDULE_API.SCHEDULES_BY_CONSULTANT}/${consultantId}/date`,
    { date: dateYmd.slice(0, 10) },
  );
  return parseConsultantSchedulesByDateResponse(raw);
}

export function useConsultantSchedulesByDate(
  consultantId: number | null,
  dateYmd: string,
  options?: Partial<UseQueryOptions<ConsultantScheduleByDateItem[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();
  const id = consultantId ?? 0;
  const ymd = dateYmd.slice(0, 10);

  return useQuery({
    queryKey: CONSULTANT_SCHEDULES_BY_DATE_QUERY_KEYS.detail(tenantId, id, ymd),
    queryFn: () => fetchConsultantSchedulesByDate(id, ymd),
    enabled: ready && allowed && id > 0 && ymd.length >= 10 && options?.enabled !== false,
    staleTime: 1000 * 30,
    ...options,
  });
}
