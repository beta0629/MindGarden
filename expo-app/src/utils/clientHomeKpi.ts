/**
 * 내담자 홈 KPI — 스케줄 목록 정규화·이번 달 상담 건수
 * 웹 ClientDashboard SSOT
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { unwrapApiResponse } from '@/api/unwrapApiResponse';

const LIST_ARRAY_KEYS = ['data', 'content', 'mappings', 'items'] as const;

function extractListArrayFromObject(obj: Record<string, unknown>): unknown[] | null {
  for (const key of LIST_ARRAY_KEYS) {
    if (Array.isArray(obj[key])) {
      return obj[key] as unknown[];
    }
  }
  return null;
}

function normalizeApiListPayload(payload: unknown): unknown[] {
  if (payload == null) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const fromKeys = extractListArrayFromObject(obj);
    if (fromKeys) {
      return fromKeys;
    }
    if (obj.data != null && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return normalizeApiListPayload(obj.data);
    }
  }
  return [];
}

export interface ScheduleDateRow {
  date?: string;
  status?: string;
}

/**
 * 웹 `normalizeScheduleListPayload`와 동등 — schedules 래핑·ApiResponse 언래핑 지원
 */
export function normalizeScheduleListPayload(payload: unknown): ScheduleDateRow[] {
  const unwrapped = unwrapApiResponse<unknown>(payload) ?? payload;
  const direct = normalizeApiListPayload(unwrapped);
  if (direct.length > 0) {
    return direct as ScheduleDateRow[];
  }
  if (unwrapped != null && typeof unwrapped === 'object') {
    const obj = unwrapped as Record<string, unknown>;
    if (Array.isArray(obj.schedules)) {
      return obj.schedules as ScheduleDateRow[];
    }
  }
  return [];
}

/**
 * 이번 달 상담 건수 — 웹 ClientDashboard와 동일 (status 필터 없음, cancelled 포함)
 */
export function countThisMonthSchedules(
  schedules: ScheduleDateRow[],
  referenceDate: Date = new Date(),
): number {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  return schedules.filter((s) => {
    const scheduleDate = new Date(s.date ?? '');
    return (
      !Number.isNaN(scheduleDate.getTime()) &&
      scheduleDate.getFullYear() === y &&
      scheduleDate.getMonth() === m
    );
  }).length;
}
