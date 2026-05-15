/**
 * 상담일지 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '../client';
import { CONSULTATION_RECORD_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  consultationTypeToKorean,
  resolveClientNameForScheduleRow,
} from '@/utils/scheduleDisplayLabels';
import { SCHEDULE_QUERY_KEYS } from './useSchedules';

export interface ConsultationRecord {
  id: number;
  scheduleId: number;
  consultantId: number;
  clientId: number;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  summary?: string;
  expertMemo?: string;
  tags: string[];
  nextSessionDate?: string;
  nextSessionMemo?: string;
  status: 'DRAFT' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface PendingRecord {
  scheduleId: number;
  clientId: number;
  clientName: string;
  clientProfileImageUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: string;
}

export interface CreateRecordInput {
  scheduleId: number;
  clientId: number;
  consultantId: number;
  summary: string;
  expertMemo?: string;
  tags: string[];
  nextSessionDate?: string;
  nextSessionMemo?: string;
  status: 'DRAFT' | 'COMPLETED';
}

interface RecordsParams {
  consultantId: string | number;
  status?: 'DRAFT' | 'COMPLETED' | 'ALL';
  search?: string;
  size?: number;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
}

const RECORD_QUERY_KEYS = {
  all: ['records'] as const,
  lists: () => [...RECORD_QUERY_KEYS.all, 'list'] as const,
  list: (params: Omit<RecordsParams, 'size'>) => [...RECORD_QUERY_KEYS.lists(), params] as const,
  pending: (consultantId: string | number) =>
    [...RECORD_QUERY_KEYS.all, 'pending', consultantId] as const,
  details: () => [...RECORD_QUERY_KEYS.all, 'detail'] as const,
  detail: (consultantId: string | number | undefined, recordId: string | number) =>
    [...RECORD_QUERY_KEYS.details(), consultantId, recordId] as const,
  existenceBySchedule: (scheduleId: string | number) =>
    [...RECORD_QUERY_KEYS.all, 'existsBySchedule', String(scheduleId)] as const,
};

const DEFAULT_PAGE_SIZE = 20;

function readStringProp(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '';
}

function parseJsonLocalDate(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const y = Number(value[0]);
    const m = Number(value[1]);
    const d = Number(value[2]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '';
}

function parseIsoTimePart(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    if (value.includes('T')) {
      const segments = value.split('T');
      const timePart = segments.length > 1 ? segments[1] : undefined;
      if (timePart == null || timePart === '') return '';
      return timePart.length >= 5 ? timePart.slice(0, 5) : timePart;
    }
    return value.length >= 5 ? value.slice(0, 5) : value;
  }
  return '';
}

function assertApiSuccess(raw: unknown): void {
  if (
    raw != null &&
    typeof raw === 'object' &&
    (raw as Record<string, unknown>).success === false
  ) {
    const msg = (raw as Record<string, unknown>).message;
    throw new Error(typeof msg === 'string' ? msg : '요청이 실패했습니다.');
  }
}

function normalizeEntityRowToConsultationRecord(row: Record<string, unknown>): ConsultationRecord {
  const id = Number(row.id ?? 0);
  const consultationId = Number(row.consultationId ?? row.consultation_id ?? 0);
  const consultantId = Number(row.consultantId ?? row.consultant_id ?? 0);
  const clientId = Number(row.clientId ?? row.client_id ?? 0);
  const clientName = resolveClientNameForScheduleRow(row, clientId);
  const sessionDate = parseJsonLocalDate(row.sessionDate ?? row.session_date);
  const date = sessionDate || parseJsonLocalDate(row.date);
  const startTime = parseIsoTimePart(row.startTime ?? row.start_time);
  const endTime = parseIsoTimePart(row.endTime ?? row.end_time);
  const completed = Boolean(row.isSessionCompleted ?? row.is_session_completed);
  const obs =
    readStringProp(row, 'consultantObservations') || readStringProp(row, 'consultant_observations');
  const createdAt =
    readStringProp(row, 'createdAt') ||
    readStringProp(row, 'created_at') ||
    (date ? `${date}T00:00:00` : new Date().toISOString());
  const updatedAt =
    readStringProp(row, 'updatedAt') || readStringProp(row, 'updated_at') || createdAt;

  return {
    id,
    scheduleId: consultationId > 0 ? consultationId : id,
    consultantId,
    clientId,
    clientName,
    date,
    startTime,
    endTime,
    summary:
      readStringProp(row, 'clientCondition') ||
      readStringProp(row, 'mainIssues') ||
      obs ||
      undefined,
    expertMemo: obs || undefined,
    tags: [],
    nextSessionDate: parseJsonLocalDate(row.nextSessionDate ?? row.next_session_date) || undefined,
    nextSessionMemo:
      readStringProp(row, 'nextSessionPlan') ||
      readStringProp(row, 'next_session_plan') ||
      undefined,
    status: completed ? 'COMPLETED' : 'DRAFT',
    createdAt,
    updatedAt,
  };
}

function normalizeAdminDetailToConsultationRecord(
  data: Record<string, unknown>,
): ConsultationRecord {
  const id = Number(data.id ?? 0);
  const clientId = Number(data.clientId ?? data.client_id ?? 0);
  const consultantId = Number(data.consultantId ?? data.consultant_id ?? 0);
  const clientName = resolveClientNameForScheduleRow(data as Record<string, unknown>, clientId);
  const date =
    parseJsonLocalDate(data.sessionDate) || parseJsonLocalDate(data.consultationDate) || '';
  const startTime = parseIsoTimePart(data.startTime);
  const endTime = parseIsoTimePart(data.endTime);
  const statusRaw = readStringProp(data, 'status').toUpperCase();
  const completed = statusRaw === 'COMPLETED';
  const notes = readStringProp(data, 'notes');
  const obs =
    readStringProp(data, 'consultantObservations') ||
    readStringProp(data, 'consultant_observations');
  const summary =
    readStringProp(data, 'clientCondition') ||
    readStringProp(data, 'mainIssues') ||
    notes ||
    obs ||
    undefined;
  const expertMemo = obs || notes || undefined;
  const nextSessionDate =
    parseJsonLocalDate(data.nextSessionDate ?? data.next_session_date) || undefined;
  const follow = readStringProp(data, 'followUpActions') || readStringProp(data, 'nextSessionPlan');
  const nowIso = new Date().toISOString();

  return {
    id,
    scheduleId: id,
    consultantId,
    clientId,
    clientName,
    date,
    startTime,
    endTime,
    summary,
    expertMemo,
    tags: [],
    nextSessionDate,
    nextSessionMemo: follow || undefined,
    status: completed ? 'COMPLETED' : 'DRAFT',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function normalizeEntityRowToPending(row: Record<string, unknown>): PendingRecord | null {
  const completed = Boolean(row.isSessionCompleted ?? row.is_session_completed);
  if (completed) return null;
  const consultationId = Number(row.consultationId ?? row.consultation_id ?? 0);
  if (!consultationId) return null;
  const clientId = Number(row.clientId ?? row.client_id ?? 0);
  const clientName = resolveClientNameForScheduleRow(row, clientId);
  const date = parseJsonLocalDate(row.sessionDate ?? row.session_date) || '';
  return {
    scheduleId: consultationId,
    clientId,
    clientName,
    clientProfileImageUrl: readStringProp(row, 'clientProfileImageUrl') || undefined,
    date,
    startTime: parseIsoTimePart(row.startTime ?? row.start_time),
    endTime: parseIsoTimePart(row.endTime ?? row.end_time),
    consultationType: consultationTypeToKorean(
      readStringProp(row, 'consultationType') || 'INDIVIDUAL',
    ),
  };
}

export function useConsultationRecords(params: RecordsParams) {
  const { consultantId, status, search, size = DEFAULT_PAGE_SIZE } = params;

  return useInfiniteQuery<PaginatedResponse<ConsultationRecord>>({
    queryKey: RECORD_QUERY_KEYS.list({ consultantId, status, search }),
    queryFn: async ({ pageParam }) => {
      const raw = await apiGet<unknown>(
        CONSULTATION_RECORD_API.listEntitiesByConsultant(consultantId),
        {
          page: pageParam,
          size,
        },
      );
      assertApiSuccess(raw);
      const inner = unwrapApiResponse<Record<string, unknown> | unknown[]>(raw);
      let rows: Record<string, unknown>[] = [];
      let pageEnvelope: Record<string, unknown> | null = null;
      if (Array.isArray(inner)) {
        rows = inner as Record<string, unknown>[];
      } else if (inner != null && typeof inner === 'object') {
        pageEnvelope = inner as Record<string, unknown>;
        if (Array.isArray(pageEnvelope.records)) {
          rows = pageEnvelope.records as Record<string, unknown>[];
        }
      }
      let content = rows.map((r) => normalizeEntityRowToConsultationRecord(r));
      if (status && status !== 'ALL') {
        content = content.filter((r) => r.status === status);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        content = content.filter((r) => r.clientName.toLowerCase().includes(q));
      }
      const totalElements =
        pageEnvelope && typeof pageEnvelope.totalCount === 'number'
          ? (pageEnvelope.totalCount as number)
          : content.length;
      const totalPages =
        pageEnvelope && typeof pageEnvelope.totalPages === 'number'
          ? (pageEnvelope.totalPages as number)
          : 1;
      const last =
        pageEnvelope && typeof pageEnvelope.last === 'boolean'
          ? (pageEnvelope.last as boolean)
          : true;
      const number =
        pageEnvelope && typeof pageEnvelope.number === 'number'
          ? (pageEnvelope.number as number)
          : typeof pageParam === 'number'
            ? pageParam
            : 0;
      return {
        content,
        totalElements,
        totalPages,
        last,
        number,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * 해당 스케줄(상담) ID에 연결된 비삭제 상담일지가 1건 이상인지.
 * Spring `ScheduleController` GET `/api/v1/schedules/consultation-records?consultationId=`
 *
 * @param scheduleId 스케줄·상담 ID(숫자 문자열)
 * @param enabled 진행 중(IN_PROGRESS) 등 조건부 fetch 시 false
 */
export function useConsultationRecordExistsForSchedule(
  scheduleId: string | number | undefined,
  enabled: boolean,
) {
  const sid = scheduleId != null && String(scheduleId).trim() !== '' ? String(scheduleId) : '';

  return useQuery<boolean>({
    queryKey: RECORD_QUERY_KEYS.existenceBySchedule(sid || '0'),
    queryFn: async () => {
      const raw = await apiGet<unknown>(CONSULTATION_RECORD_API.listByConsultationId(sid));
      assertApiSuccess(raw);
      const inner = unwrapApiResponse<Record<string, unknown>>(raw);
      if (inner == null || typeof inner !== 'object') {
        return false;
      }
      const rec = (inner as Record<string, unknown>).records;
      return Array.isArray(rec) && rec.length > 0;
    },
    enabled: Boolean(sid) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * 미작성 후보 — `/pending` 전용 API 없음. `ScheduleController` 상담일지 엔티티 목록에서
 * `isSessionCompleted === false` 인 항목만 필터한다.
 */
export function usePendingRecords(consultantId: string | number | undefined) {
  return useQuery<PendingRecord[]>({
    queryKey: RECORD_QUERY_KEYS.pending(consultantId!),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        CONSULTATION_RECORD_API.listEntitiesByConsultant(consultantId!),
        { page: 0, size: 500 },
      );
      assertApiSuccess(raw);
      const inner = unwrapApiResponse<Record<string, unknown> | unknown[]>(raw);
      let rows: Record<string, unknown>[] = [];
      if (Array.isArray(inner)) {
        rows = inner as Record<string, unknown>[];
      } else if (
        inner != null &&
        typeof inner === 'object' &&
        Array.isArray((inner as Record<string, unknown>).records)
      ) {
        rows = (inner as Record<string, unknown>).records as Record<string, unknown>[];
      }
      const out: PendingRecord[] = [];
      for (const r of rows) {
        const p = normalizeEntityRowToPending(r);
        if (p) out.push(p);
      }
      return out;
    },
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecordDetail(
  recordId: string | number | undefined,
  options?: Partial<UseQueryOptions<ConsultationRecord>>,
) {
  const consultantId = useAuthStore((s) => s.user?.id);

  const hasConsultantId = consultantId != null && String(consultantId).trim() !== '';

  return useQuery<ConsultationRecord>({
    queryKey: RECORD_QUERY_KEYS.detail(consultantId, recordId!),
    queryFn: async () => {
      if (!hasConsultantId) {
        throw new Error('상담사 정보가 없습니다.');
      }
      const raw = await apiGet<unknown>(
        CONSULTATION_RECORD_API.detail(consultantId as string | number, recordId!),
      );
      assertApiSuccess(raw);
      const inner = unwrapApiResponse<Record<string, unknown>>(raw);
      if (inner == null || typeof inner !== 'object') {
        throw new Error('상담일지를 불러오지 못했습니다.');
      }
      return normalizeAdminDetailToConsultationRecord(inner);
    },
    enabled: !!recordId && hasConsultantId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecordInput) => {
      const parts = [input.summary, input.expertMemo].filter((s) => s && String(s).trim());
      const consultantObservations = parts.join('\n\n');
      const body: Record<string, unknown> = {
        consultationId: input.scheduleId,
        clientId: input.clientId,
        consultantId: input.consultantId,
        consultantObservations,
        isSessionCompleted: input.status === 'COMPLETED',
      };
      if (input.nextSessionMemo && input.nextSessionMemo.trim()) {
        body.nextSessionPlan = input.nextSessionMemo.trim();
      }
      return apiPost<unknown>(CONSULTATION_RECORD_API.CREATE_RECORD, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: RECORD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: RECORD_QUERY_KEYS.existenceBySchedule(String(variables.scheduleId)),
      });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordId,
      summary,
      expertMemo,
    }: Partial<CreateRecordInput> & { recordId: number }) => {
      const parts = [summary, expertMemo].filter((s) => s != null && String(s).trim());
      const body: Record<string, unknown> = {
        clientCondition: summary != null ? String(summary) : undefined,
        consultantObservations: parts.join('\n\n') || undefined,
      };
      return apiPut<unknown>(CONSULTATION_RECORD_API.update(recordId), body);
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: RECORD_QUERY_KEYS.details() });
      queryClient.invalidateQueries({ queryKey: RECORD_QUERY_KEYS.lists() });
    },
  });
}

export { RECORD_QUERY_KEYS };
