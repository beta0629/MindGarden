/**
 * 어드민 일정 등록 — 가용 시간 슬롯·충돌 검사 (웹 TimeSlotGrid / schedule.js SSOT)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { format, parseISO, startOfDay } from 'date-fns';
import { formatMinutesToTime, parseTimeToMinutes } from '@/utils/adminScheduleCreateBody';

/** 웹 BUSINESS_HOURS·ScheduleCalendarUtils 기본 그리드 */
export const ADMIN_SCHEDULE_SLOT_GRID = {
  DAY_START_MINUTES: 9 * 60,
  DAY_END_MINUTES: 21 * 60,
  INTERVAL_MINUTES: 30,
} as const;

const OCCUPYING_STATUSES = new Set(['BOOKED', 'CONFIRMED', 'IN_PROGRESS']);

export type OccupiedTimeRange = {
  readonly startTime: string;
  readonly endTime: string;
};

export type ScheduleSlotForConflict = {
  readonly startTime: string;
  readonly endTime: string;
  readonly status?: string | null;
  readonly statusCode?: string | null;
};

/**
 * 30분 간격 시작 시각 목록 (기본 09:00–21:00 미만, 웹 ScheduleCalendarUtils·BUSINESS_HOURS 정합)
 */
export function generateAdminScheduleTimeSlots(options?: {
  readonly dayStartMinutes?: number;
  readonly dayEndMinutes?: number;
  readonly intervalMinutes?: number;
}): string[] {
  const start = options?.dayStartMinutes ?? ADMIN_SCHEDULE_SLOT_GRID.DAY_START_MINUTES;
  const end = options?.dayEndMinutes ?? ADMIN_SCHEDULE_SLOT_GRID.DAY_END_MINUTES;
  const step = options?.intervalMinutes ?? ADMIN_SCHEDULE_SLOT_GRID.INTERVAL_MINUTES;
  const slots: string[] = [];
  for (let m = start; m < end; m += step) {
    slots.push(formatMinutesToTime(m));
  }
  return slots;
}

export function resolveScheduleStatusCodeForConflict(schedule: ScheduleSlotForConflict): string | null {
  if (schedule.statusCode != null && String(schedule.statusCode).trim() !== '') {
    return String(schedule.statusCode).trim().toUpperCase();
  }
  const st = schedule.status;
  if (st == null || st === '') {
    return null;
  }
  const s = String(st).trim();
  const upper = s.toUpperCase();
  const known = [
    'BOOKED',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'VACATION',
    'AVAILABLE',
    'IN_PROGRESS',
    'SCHEDULED',
    'NO_SHOW',
  ];
  if (known.includes(upper)) {
    return upper;
  }
  if (/취소|취소됨/.test(s)) {
    return 'CANCELLED';
  }
  if (/예약됨|예약/.test(s)) {
    return 'BOOKED';
  }
  if (/완료|완료됨/.test(s)) {
    return 'COMPLETED';
  }
  if (/확정|확정됨/.test(s)) {
    return 'CONFIRMED';
  }
  if (/휴가/.test(s)) {
    return 'VACATION';
  }
  return upper;
}

/** BOOKED·CONFIRMED·IN_PROGRESS만 점유 (CANCELLED·COMPLETED·VACATION 제외) */
export function isScheduleStatusOccupyingSlot(status: string | null | undefined): boolean {
  if (status == null || status === '') {
    return false;
  }
  return OCCUPYING_STATUSES.has(String(status).toUpperCase());
}

export function normalizeScheduleTimeForSlot(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
    if (!m) {
      return value.trim();
    }
    const h = String(Number(m[1])).padStart(2, '0');
    const mi = String(Number(m[2])).padStart(2, '0');
    return `${h}:${mi}`;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const h = String(Number(value[0])).padStart(2, '0');
    const mi = String(Number(value[1])).padStart(2, '0');
    return `${h}:${mi}`;
  }
  if (typeof value === 'object' && value != null && 'hour' in value) {
    const o = value as { hour: number; minute?: number };
    const h = String(Number(o.hour)).padStart(2, '0');
    const mi = String(Number(o.minute ?? 0)).padStart(2, '0');
    return `${h}:${mi}`;
  }
  return String(value);
}

export function buildOccupiedRangesFromSchedules(
  schedules: readonly ScheduleSlotForConflict[],
): OccupiedTimeRange[] {
  return schedules
    .map((s) => {
      const code = resolveScheduleStatusCodeForConflict(s);
      if (!isScheduleStatusOccupyingSlot(code)) {
        return null;
      }
      const startTime = normalizeScheduleTimeForSlot(s.startTime);
      const endTime = normalizeScheduleTimeForSlot(s.endTime);
      if (!startTime || !endTime) {
        return null;
      }
      return { startTime, endTime };
    })
    .filter((r): r is OccupiedTimeRange => r != null);
}

function rangeToMinutes(start: string, end: string): { start: number; end: number } | null {
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);
  if (s == null || e == null || e <= s) {
    return null;
  }
  return { start: s, end: e };
}

/** [start, end) 구간이 점유 구간과 겹치면 true */
export function isTimeRangeOverlappingOccupied(
  start: string,
  end: string,
  occupiedRanges: readonly OccupiedTimeRange[],
): boolean {
  const probe = rangeToMinutes(start, end);
  if (!probe) {
    return true;
  }
  return occupiedRanges.some((occ) => {
    const block = rangeToMinutes(occ.startTime, occ.endTime);
    if (!block) {
      return false;
    }
    return probe.start < block.end && block.start < probe.end;
  });
}

/** 시작 시각부터 durationMin 전체가 비어 있어야 true */
export function isSlotStartAvailableForDuration(
  start: string,
  durationMin: number,
  occupiedRanges: readonly OccupiedTimeRange[],
): boolean {
  const startMin = parseTimeToMinutes(start);
  if (startMin == null || !Number.isFinite(durationMin) || durationMin <= 0) {
    return false;
  }
  const end = formatMinutesToTime(startMin + durationMin);
  return !isTimeRangeOverlappingOccupied(start, end, occupiedRanges);
}

export function isSlotStartInPast(dateYmd: string, startTime: string): boolean {
  const startMin = parseTimeToMinutes(startTime);
  if (startMin == null || dateYmd.length < 10) {
    return false;
  }
  let selectedDay: Date;
  try {
    selectedDay = startOfDay(parseISO(`${dateYmd.slice(0, 10)}T12:00:00`));
  } catch {
    return false;
  }
  const today = startOfDay(new Date());
  if (selectedDay < today) {
    return true;
  }
  if (selectedDay > today) {
    return false;
  }
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return startMin < nowMin;
}

export type AdminScheduleSlotAvailability = {
  readonly startTime: string;
  readonly isAvailable: boolean;
  readonly isPast: boolean;
  readonly isOccupied: boolean;
};

export function buildAdminScheduleSlotAvailabilities(
  dateYmd: string,
  durationMin: number,
  occupiedRanges: readonly OccupiedTimeRange[],
  slotStarts?: readonly string[],
): AdminScheduleSlotAvailability[] {
  const starts = slotStarts ?? generateAdminScheduleTimeSlots();
  return starts.map((startTime) => {
    const isPast = isSlotStartInPast(dateYmd, startTime);
    const fitsDuration = isSlotStartAvailableForDuration(startTime, durationMin, occupiedRanges);
    const isOccupied = !fitsDuration && !isPast;
    return {
      startTime,
      isPast,
      isOccupied: isPast ? false : isOccupied,
      isAvailable: !isPast && fitsDuration,
    };
  });
}

/** 제출 직전 클라이언트 검증 */
export function validateAdminScheduleTimeSelection(
  dateYmd: string,
  startTime: string,
  endTime: string,
  occupiedRanges: readonly OccupiedTimeRange[],
): { ok: true } | { ok: false; reason: 'past' | 'overlap' | 'invalid' } {
  if (isSlotStartInPast(dateYmd, startTime)) {
    return { ok: false, reason: 'past' };
  }
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin == null || endMin == null || endMin <= startMin) {
    return { ok: false, reason: 'invalid' };
  }
  if (isTimeRangeOverlappingOccupied(startTime, endTime, occupiedRanges)) {
    return { ok: false, reason: 'overlap' };
  }
  return { ok: true };
}
