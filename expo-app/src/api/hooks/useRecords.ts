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
  list: (params: Omit<RecordsParams, 'size'>) =>
    [...RECORD_QUERY_KEYS.lists(), params] as const,
  pending: (consultantId: string | number) =>
    [...RECORD_QUERY_KEYS.all, 'pending', consultantId] as const,
  details: () => [...RECORD_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) =>
    [...RECORD_QUERY_KEYS.details(), id] as const,
};

const DEFAULT_PAGE_SIZE = 20;

export function useConsultationRecords(params: RecordsParams) {
  const { consultantId, status, search, size = DEFAULT_PAGE_SIZE } = params;

  return useInfiniteQuery<PaginatedResponse<ConsultationRecord>>({
    queryKey: RECORD_QUERY_KEYS.list({ consultantId, status, search }),
    queryFn: ({ pageParam }) =>
      apiGet<PaginatedResponse<ConsultationRecord>>(
        CONSULTATION_RECORD_API.records(consultantId),
        {
          status: status === 'ALL' ? undefined : status,
          search: search || undefined,
          page: pageParam,
          size,
        },
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 3,
  });
}

export function usePendingRecords(
  consultantId: string | number | undefined,
) {
  return useQuery<PendingRecord[]>({
    queryKey: RECORD_QUERY_KEYS.pending(consultantId!),
    queryFn: () =>
      apiGet<PendingRecord[]>(
        `${CONSULTATION_RECORD_API.records(consultantId!)}/pending`,
      ),
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecordDetail(
  recordId: string | number | undefined,
  options?: Partial<UseQueryOptions<ConsultationRecord>>,
) {
  return useQuery<ConsultationRecord>({
    queryKey: RECORD_QUERY_KEYS.detail(recordId!),
    queryFn: () =>
      apiGet<ConsultationRecord>(
        CONSULTATION_RECORD_API.detail(recordId!),
      ),
    enabled: !!recordId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecordInput) =>
      apiPost<ConsultationRecord>(
        CONSULTATION_RECORD_API.CREATE_RECORD,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECORD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.all });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordId,
      ...input
    }: Partial<CreateRecordInput> & { recordId: number }) =>
      apiPut<ConsultationRecord>(
        CONSULTATION_RECORD_API.detail(recordId),
        input,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RECORD_QUERY_KEYS.detail(variables.recordId),
      });
      queryClient.invalidateQueries({ queryKey: RECORD_QUERY_KEYS.lists() });
    },
  });
}

export { RECORD_QUERY_KEYS };
