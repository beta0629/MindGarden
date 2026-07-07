/**
 * 상담사 모바일 홈 Phase1 API 훅 — 웹 ConsultantDashboardV2 SSOT 정렬
 *
 * @author MindGarden
 * @since 2026-07-07
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_DASHBOARD_V2_ENHANCED.md §4
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { format as formatDate } from 'date-fns';
import { apiGet } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';

const CONSULTANT_USER_ROLE = 'CONSULTANT';
const STALE_MS = 1000 * 60 * 2;

export const CONSULTANT_HOME_QUERY_KEYS = {
  all: ['consultantHome'] as const,
  stats: () => [...CONSULTANT_HOME_QUERY_KEYS.all, 'stats'] as const,
  incompleteRecords: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'incompleteRecords', consultantId] as const,
  highPriorityClients: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'highPriorityClients', consultantId] as const,
  upcomingPreparation: (consultantId: string | number) =>
    [...CONSULTANT_HOME_QUERY_KEYS.all, 'upcomingPreparation', consultantId] as const,
};

export interface ConsultantHomeStats {
  totalToday: number;
  newClients: number;
  completedToday: number;
  bookedToday: number;
}

export interface IncompleteRecordItem {
  scheduleId: number;
  clientId?: number;
  clientName: string;
  sessionDate: string;
  sessionNumber?: number;
  elapsedHours?: number;
}

export interface IncompleteRecordsData {
  count: number;
  records: IncompleteRecordItem[];
}

export interface HighPriorityClientItem {
  clientId: number;
  clientName: string;
  riskLevel: string;
  mainIssue?: string;
  sessionNumber?: number;
  lastSessionDate?: string;
}

export interface UpcomingPreparationSession {
  scheduleId: number;
  clientId?: number;
  clientName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionNumber: number;
  consultationType?: string;
  isToday: boolean;
  countdownLabel?: string;
}

function toNonNegativeInt(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.trunc(n));
}

function readString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  return String(value);
}

function normalizeDateYmd(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.split('T')[0] ?? '';
  if (Array.isArray(value) && value.length >= 3) {
    const y = value[0];
    const m = String(value[1] ?? 1).padStart(2, '0');
    const d = String(value[2] ?? 1).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function normalizeHm(value: unknown): string {
  const raw = readString(value);
  if (!raw) return '';
  if (raw.includes('T')) {
    const part = raw.split('T')[1]?.split('.')[0] ?? raw;
    return part.length >= 5 ? part.slice(0, 5) : part;
  }
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function addMinutesToHm(hm: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hm);
  if (!m) return hm;
  const total = Number(m[1]) * 60 + Number(m[2]) + minutes;
  const h = Math.floor(total / 60) % 24;
  const min = total % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function isSameLocalDate(ymd: string, offsetDays: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const target = new Date();
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + offsetDays);
  const expected = formatDate(target, 'yyyy-MM-dd');
  return ymd === expected;
}

function buildCountdownLabel(sessionDate: string, startTime: string): string | undefined {
  const hm = normalizeHm(startTime);
  if (!sessionDate || !hm) return undefined;
  const ms = Date.parse(`${sessionDate}T${hm}:00`);
  if (!Number.isFinite(ms)) return undefined;
  const diffMin = Math.floor((ms - Date.now()) / 60000);
  if (diffMin <= 0) return '곧 시작';
  if (diffMin < 60) return `${diffMin}분 뒤`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}시간 뒤`;
  return undefined;
}

function normalizeStats(raw: unknown): ConsultantHomeStats {
  const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  const obj = inner != null && typeof inner === 'object' ? inner : {};
  return {
    totalToday: toNonNegativeInt(obj.totalToday ?? obj.todaySchedules),
    newClients: toNonNegativeInt(obj.newClients),
    completedToday: toNonNegativeInt(obj.completedToday),
    bookedToday: toNonNegativeInt(obj.bookedToday ?? obj.confirmedToday),
  };
}

function normalizeIncompleteRecordRow(row: Record<string, unknown>): IncompleteRecordItem | null {
  const scheduleId = toNonNegativeInt(row.scheduleId);
  if (scheduleId <= 0) return null;
  const clientName = readString(row.clientName) || '내담자';
  const clientIdRaw = row.clientId;
  const clientId =
    clientIdRaw != null && Number.isFinite(Number(clientIdRaw))
      ? toNonNegativeInt(clientIdRaw)
      : undefined;
  return {
    scheduleId,
    clientId,
    clientName,
    sessionDate: normalizeDateYmd(row.sessionDate ?? row.consultationDate),
    sessionNumber:
      row.sessionNumber != null ? toNonNegativeInt(row.sessionNumber) : undefined,
    elapsedHours:
      row.elapsedHours != null ? toNonNegativeInt(row.elapsedHours) : undefined,
  };
}

function normalizeIncompleteRecords(raw: unknown): IncompleteRecordsData {
  const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  const obj = inner != null && typeof inner === 'object' ? inner : {};
  const listRaw = Array.isArray(obj.records)
    ? obj.records
    : Array.isArray(obj.schedules)
      ? obj.schedules
      : [];
  const records = listRaw
    .map((row) => normalizeIncompleteRecordRow(row as Record<string, unknown>))
    .filter((row): row is IncompleteRecordItem => row != null);
  const count = toNonNegativeInt(obj.count ?? records.length);
  return { count, records };
}

function normalizeHighPriorityClientRow(row: Record<string, unknown>): HighPriorityClientItem | null {
  const clientId = toNonNegativeInt(row.clientId);
  if (clientId <= 0) return null;
  const clientName = readString(row.clientName) || '내담자';
  return {
    clientId,
    clientName,
    riskLevel: readString(row.riskLevel) || 'HIGH',
    mainIssue: readString(row.mainIssue) || undefined,
    sessionNumber:
      row.sessionNumber != null ? toNonNegativeInt(row.sessionNumber) : undefined,
    lastSessionDate: normalizeDateYmd(row.lastSessionDate) || undefined,
  };
}

function normalizeHighPriorityClients(raw: unknown): HighPriorityClientItem[] {
  const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  const obj = inner != null && typeof inner === 'object' ? inner : {};
  const listRaw = Array.isArray(obj.clients) ? obj.clients : [];
  return listRaw
    .map((row) => normalizeHighPriorityClientRow(row as Record<string, unknown>))
    .filter((row): row is HighPriorityClientItem => row != null);
}

function normalizePreparationRow(row: Record<string, unknown>): UpcomingPreparationSession | null {
  const scheduleId = toNonNegativeInt(row.scheduleId);
  if (scheduleId <= 0) return null;

  const sessionDate = normalizeDateYmd(row.sessionDate ?? row.date);
  const startTime = normalizeHm(row.sessionTime ?? row.startTime);
  if (!sessionDate || !startTime) return null;

  const isToday = isSameLocalDate(sessionDate, 0);
  const isTomorrow = isSameLocalDate(sessionDate, 1);
  if (!isToday && !isTomorrow) return null;

  const clientName = readString(row.clientName) || '내담자';
  const clientIdRaw = row.clientId;
  const clientId =
    clientIdRaw != null && Number.isFinite(Number(clientIdRaw))
      ? toNonNegativeInt(clientIdRaw)
      : undefined;

  return {
    scheduleId,
    clientId,
    clientName,
    sessionDate,
    startTime,
    endTime: addMinutesToHm(startTime, 50),
    sessionNumber: toNonNegativeInt(row.sessionNumber),
    consultationType: readString(row.consultationType ?? row.scheduleType) || undefined,
    isToday,
    countdownLabel: buildCountdownLabel(sessionDate, startTime),
  };
}

function normalizeUpcomingPreparation(raw: unknown): UpcomingPreparationSession | null {
  const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? (raw as Record<string, unknown>);
  const obj = inner != null && typeof inner === 'object' ? inner : {};

  if (obj.consultation != null && typeof obj.consultation === 'object') {
    const legacy = normalizePreparationRow(obj.consultation as Record<string, unknown>);
    if (legacy) return legacy;
  }

  const listRaw = Array.isArray(obj.preparations) ? obj.preparations : [];
  for (const row of listRaw) {
    const mapped = normalizePreparationRow(row as Record<string, unknown>);
    if (mapped) return mapped;
  }
  return null;
}

export function useConsultantHomeStats(
  options?: Partial<UseQueryOptions<ConsultantHomeStats>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<ConsultantHomeStats>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.stats(),
    queryFn: async () => {
      const raw = await apiGet<unknown>(SCHEDULE_API.TODAY_STATISTICS, {
        userRole: CONSULTANT_USER_ROLE,
      });
      return normalizeStats(raw);
    },
    enabled: ready,
    staleTime: STALE_MS,
    placeholderData: {
      totalToday: 0,
      newClients: 0,
      completedToday: 0,
      bookedToday: 0,
    },
    ...options,
  });
}

export function useIncompleteRecords(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<IncompleteRecordsData>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<IncompleteRecordsData>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.incompleteRecords(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantIncompleteRecords(consultantId!),
      );
      return normalizeIncompleteRecords(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: { count: 0, records: [] },
    ...options,
  });
}

export function useHighPriorityClients(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<HighPriorityClientItem[]>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<HighPriorityClientItem[]>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.highPriorityClients(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantHighPriorityClients(consultantId!),
      );
      return normalizeHighPriorityClients(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: [],
    ...options,
  });
}

export function useUpcomingPreparation(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<UpcomingPreparationSession | null>>,
) {
  const { ready } = useApiQueryReady({ requireUserId: true });
  return useQuery<UpcomingPreparationSession | null>({
    queryKey: CONSULTANT_HOME_QUERY_KEYS.upcomingPreparation(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        SCHEDULE_API.consultantUpcomingPreparation(consultantId!),
      );
      return normalizeUpcomingPreparation(raw);
    },
    enabled: ready && consultantId != null,
    staleTime: STALE_MS,
    placeholderData: null,
    ...options,
  });
}
