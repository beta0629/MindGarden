/**
 * 상담사 근무 가능 시간 · 휴가 TanStack Query 커스텀 훅
 * 백엔드: GET/POST `/{consultantId}/availability`, DELETE/PUT `/availability/{id}`,
 * 휴가 GET/POST `/{consultantId}/vacation`, DELETE `/{consultantId}/vacation/{date}`
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../client';
import { CONSULTANT_API, VACATION_API } from '../endpoints';

export interface AvailabilitySlot {
  /** 서버 슬롯 PK (동기화 시 필요) */
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Vacation {
  id: number;
  consultantId: number;
  /** 백엔드 휴무 단위일 */
  date: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface UpdateAvailabilityRequest {
  consultantId: string | number;
  slots: AvailabilitySlot[];
}

interface CreateVacationRequest {
  consultantId: string | number;
  startDate: string;
  endDate: string;
  reason?: string;
}

const AVAILABILITY_QUERY_KEYS = {
  all: ['availability'] as const,
  consultant: (consultantId: string | number) =>
    [...AVAILABILITY_QUERY_KEYS.all, 'consultant', consultantId] as const,
  vacations: (consultantId: string | number) =>
    [...AVAILABILITY_QUERY_KEYS.all, 'vacations', consultantId] as const,
};

function unwrapListPayload<T>(raw: unknown): T[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (o.success === false) {
      throw new Error(typeof o.message === 'string' ? o.message : '요청에 실패했습니다.');
    }
    if (Array.isArray(o.data)) {
      return o.data as T[];
    }
  }
  return [];
}

/** 백엔드/네트워크 에러를 사용자에게 노출 가능한 한 줄 메시지로 변환 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object') {
    const o = error as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message) return o.message;
    if (typeof o.status === 'number' && o.status === 403) {
      return '권한이 없습니다.';
    }
  }
  return fallback;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD 포맷 + 유효 날짜인지 검증 */
export function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

function normalizeTime(t: unknown): string {
  if (t == null) return '';
  const s = String(t);
  if (s.length >= 5) {
    return s.substring(0, 5);
  }
  return s;
}

function dayOfWeekToApi(day: unknown): string {
  if (day == null) return '';
  const s = String(day);
  if (s.length === 3) {
    const map: Record<string, string> = {
      MON: 'MONDAY',
      TUE: 'TUESDAY',
      WED: 'WEDNESDAY',
      THU: 'THURSDAY',
      FRI: 'FRIDAY',
      SAT: 'SATURDAY',
      SUN: 'SUNDAY',
    };
    return map[s.toUpperCase()] ?? s.toUpperCase();
  }
  return s.toUpperCase();
}

function slotKey(dayOfWeek: string, startTime: string): string {
  return `${dayOfWeekToApi(dayOfWeek)}|${normalizeTime(startTime)}`;
}

function parseAvailabilityRows(raw: unknown): AvailabilitySlot[] {
  const rows = unwrapListPayload<Record<string, unknown>>(raw);
  return rows.map((row) => ({
    id: row.id != null ? Number(row.id) : undefined,
    dayOfWeek: dayOfWeekToApi(row.dayOfWeek),
    startTime: normalizeTime(row.startTime),
    endTime: normalizeTime(row.endTime),
  }));
}

function parseVacationRows(raw: unknown): Vacation[] {
  const rows = unwrapListPayload<Record<string, unknown>>(raw);
  const out: Vacation[] = [];
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    const dateStr =
      row.date != null
        ? (String(row.date).split('T')[0] ?? '')
        : (String(row.startDate ?? '').split('T')[0] ?? '');
    if (!dateStr) {
      continue;
    }
    out.push({
      id,
      consultantId: Number(row.consultantId) || 0,
      date: dateStr,
      startDate: dateStr,
      endDate: dateStr,
      reason: row.reason != null ? String(row.reason) : undefined,
    });
  }
  return out;
}

function enumerateDatesInclusive(start: string, end: string): string[] {
  const startD = new Date(`${start}T00:00:00`);
  const endD = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) {
    return [];
  }
  const out: string[] = [];
  const cur = new Date(startD);
  while (cur.getTime() <= endD.getTime()) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function useConsultantAvailability(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<AvailabilitySlot[]>>,
) {
  return useQuery<AvailabilitySlot[]>({
    queryKey: AVAILABILITY_QUERY_KEYS.consultant(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(CONSULTANT_API.consultantAvailability(consultantId!));
      return parseAvailabilityRows(raw);
    },
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * 그리드에서 온 슬롯 목록을 서버와 동기화(삭제 후 추가).
 * 백엔드는 PUT `/{consultantId}/availability` 벌크가 없으므로 POST/DELETE로 맞춘다.
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ consultantId, slots }: UpdateAvailabilityRequest) => {
      const raw = await apiGet<unknown>(CONSULTANT_API.consultantAvailability(consultantId));
      const current = parseAvailabilityRows(raw);

      const desiredKeys = new Set(slots.map((s) => slotKey(s.dayOfWeek, s.startTime)));
      const desiredByKey = new Map(
        slots.map((s) => [slotKey(s.dayOfWeek, s.startTime), s] as const),
      );

      for (const row of current) {
        const k = slotKey(row.dayOfWeek, row.startTime);
        if (!desiredKeys.has(k) && row.id != null) {
          await apiDelete(CONSULTANT_API.consultantAvailabilitySlot(row.id));
        }
      }

      const currentKeys = new Set(current.map((c) => slotKey(c.dayOfWeek, c.startTime)));

      for (const k of desiredKeys) {
        if (!currentKeys.has(k)) {
          const s = desiredByKey.get(k);
          if (!s) continue;
          const body = {
            dayOfWeek: dayOfWeekToApi(s.dayOfWeek),
            startTime: s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
            endTime: s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
            durationMinutes: 30,
            isActive: true,
          };
          await apiPost(CONSULTANT_API.consultantAvailability(consultantId), body);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.consultant(variables.consultantId),
      });
    },
  });
}

export function useVacations(
  consultantId: string | number | undefined,
  options?: Partial<UseQueryOptions<Vacation[]>>,
) {
  return useQuery<Vacation[]>({
    queryKey: AVAILABILITY_QUERY_KEYS.vacations(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(VACATION_API.vacations(consultantId!));
      return parseVacationRows(raw);
    },
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCreateVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ consultantId, startDate, endDate, reason }: CreateVacationRequest) => {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        throw new Error('휴가 시작일·종료일을 YYYY-MM-DD 형식으로 입력해 주세요.');
      }
      if (startDate > endDate) {
        throw new Error('휴가 종료일은 시작일과 같거나 이후여야 합니다.');
      }
      const dates = enumerateDatesInclusive(startDate, endDate);
      if (dates.length === 0) {
        throw new Error('유효한 휴가 기간이 아닙니다.');
      }
      for (const date of dates) {
        await apiPost(VACATION_API.vacations(consultantId), {
          date,
          type: 'ALL_DAY',
          reason: reason ?? undefined,
        });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.vacations(variables.consultantId),
      });
    },
  });
}

export function useDeleteVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultantId, date }: { consultantId: string | number; date: string }) =>
      apiDelete(
        VACATION_API.vacationByDate(consultantId, date.includes('T') ? date.slice(0, 10) : date),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: AVAILABILITY_QUERY_KEYS.vacations(variables.consultantId),
      });
    },
  });
}

export { AVAILABILITY_QUERY_KEYS };
