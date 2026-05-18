/**
 * 어드민 일정 등록 — 상담사·일자별 기존 일정 리스트 표시 정규화
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { parseTimeToMinutes } from '@/utils/adminScheduleCreateBody';
import { resolveClientNameForScheduleRow } from '@/utils/scheduleDisplayLabels';
import {
  normalizeScheduleTimeForSlot,
  resolveScheduleStatusCodeForConflict,
} from '@/utils/scheduleTimeSlotConflict';
import { toDisplayString } from '@/utils/safeDisplay';

export type ConsultantDayScheduleStatusCode =
  | 'BOOKED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'TENTATIVE_PENDING_PAYMENT'
  | 'AVAILABLE'
  | 'VACATION';

export type ConsultantDayScheduleBadgeVariant =
  | 'info'
  | 'warning'
  | 'success'
  | 'gray'
  | 'error';

export type ConsultantDaySchedule = {
  readonly id: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeRangeLabel: string;
  readonly clientName: string;
  readonly statusCode: ConsultantDayScheduleStatusCode | string;
  readonly statusLabel: string;
  readonly statusBadgeVariant: ConsultantDayScheduleBadgeVariant;
};

const STATUS_LABEL: Record<string, string> = {
  BOOKED: '예정',
  SCHEDULED: '예정',
  CONFIRMED: '예약확정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '불참',
  TENTATIVE_PENDING_PAYMENT: '가예약',
  AVAILABLE: '가능',
  VACATION: '휴무',
};

const STATUS_BADGE_VARIANT: Record<string, ConsultantDayScheduleBadgeVariant> = {
  BOOKED: 'info',
  SCHEDULED: 'info',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'gray',
  NO_SHOW: 'error',
  TENTATIVE_PENDING_PAYMENT: 'warning',
  AVAILABLE: 'gray',
  VACATION: 'gray',
};

export function formatConsultantDayScheduleTimeRange(startTime: string, endTime: string): string {
  const start = toDisplayString(startTime, '—');
  const end = toDisplayString(endTime, '—');
  return `${start}–${end}`;
}

function mapStatusCode(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === '') {
    return 'SCHEDULED';
  }
  const upper = String(raw).trim().toUpperCase();
  if (upper === 'TENTATIVE_PENDING_PAYMENT') {
    return 'TENTATIVE_PENDING_PAYMENT';
  }
  if (upper === 'TENTATIVE') {
    return 'TENTATIVE_PENDING_PAYMENT';
  }
  return upper;
}

export function resolveConsultantDayScheduleStatusLabel(statusCode: string): string {
  const key = mapStatusCode(statusCode);
  return STATUS_LABEL[key] ?? toDisplayString(statusCode, '—');
}

export function resolveConsultantDayScheduleBadgeVariant(
  statusCode: string,
): ConsultantDayScheduleBadgeVariant {
  const key = mapStatusCode(statusCode);
  return STATUS_BADGE_VARIANT[key] ?? 'info';
}

export function normalizeConsultantDayScheduleRow(row: unknown): ConsultantDaySchedule | null {
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
  const clientId = Number(r.clientId ?? 0);
  const clientName = resolveClientNameForScheduleRow(r, Number.isFinite(clientId) ? clientId : 0);
  const statusRaw = r.status;
  const status =
    statusRaw != null && String(statusRaw).trim() !== '' ? String(statusRaw).trim() : null;
  const statusCode = mapStatusCode(
    resolveScheduleStatusCodeForConflict({
      startTime,
      endTime,
      status,
      statusCode:
        r.statusCode != null && String(r.statusCode).trim() !== ''
          ? String(r.statusCode).trim()
          : null,
    }) ?? 'SCHEDULED',
  );

  return {
    id: Number.isFinite(id) ? id : 0,
    startTime,
    endTime,
    timeRangeLabel: formatConsultantDayScheduleTimeRange(startTime, endTime),
    clientName,
    statusCode,
    statusLabel: resolveConsultantDayScheduleStatusLabel(statusCode),
    statusBadgeVariant: resolveConsultantDayScheduleBadgeVariant(statusCode),
  };
}

export function normalizeConsultantDaySchedules(rows: readonly unknown[]): ConsultantDaySchedule[] {
  return rows
    .map((row) => normalizeConsultantDayScheduleRow(row))
    .filter((item): item is ConsultantDaySchedule => item != null)
    .sort(
      (a, b) =>
        (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0),
    );
}

export function normalizeConsultantDaySchedulesFromItems(
  items: readonly {
    readonly id: number;
    readonly startTime: string;
    readonly endTime: string;
    readonly status: string | null;
    readonly statusCode: string | null;
    readonly clientId?: number;
    readonly clientName?: string;
  }[],
): ConsultantDaySchedule[] {
  return normalizeConsultantDaySchedules(
    items.map((item) => ({
      id: item.id,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      statusCode: item.statusCode,
      clientId: item.clientId,
      clientName: item.clientName,
    })),
  );
}
