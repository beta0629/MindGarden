/**
 * 내담자 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CONSULTANT_CLIENTS_LIST_COPY } from '@/constants/consultantClientsListCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import { apiGet } from '../client';
import { CONSULTANT_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'AT_RISK';

export interface Client {
  id: number;
  name: string;
  nickname?: string;
  profileImageUrl?: string;
  registeredDate: string;
  lastSessionDate?: string;
  status: ClientStatus;
  riskLevel?: RiskLevel;
  totalSessions: number;
  consultationPurpose?: string;
  specialNotes?: string;
  contactNumber?: string;
  email?: string;
}

export interface ClientDetail extends Client {
  birthDate?: string;
  gender?: string;
  occupation?: string;
  sessionHistory: SessionHistoryItem[];
  memos: ClientMemo[];
}

export interface SessionHistoryItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sessionNumber: number;
  sessionType: string;
  status: string;
  summary?: string;
}

export interface ClientMemo {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientsParams {
  consultantId: string | number;
  search?: string;
  status?: ClientStatus | 'ALL';
  page?: number;
  size?: number;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
}

const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENT_QUERY_KEYS.all, 'list'] as const,
  list: (params: Omit<ClientsParams, 'page'>) => [...CLIENT_QUERY_KEYS.lists(), params] as const,
  details: () => [...CLIENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...CLIENT_QUERY_KEYS.details(), id] as const,
};

const DEFAULT_PAGE_SIZE = 20;

/**
 * `success: false` 래퍼는 빈 페이지와 동일하게 파싱되면 안 되므로 즉시 실패 처리한다.
 */
function assertClientsListNotFailureEnvelope(raw: unknown): void {
  if (raw == null || typeof raw !== 'object') {
    return;
  }
  const root = raw as Record<string, unknown>;
  if (root.success === false) {
    throw new Error(
      toDisplayString(
        root.message ?? root.error ?? root.code,
        CONSULTANT_CLIENTS_LIST_COPY.API_REJECTED_FALLBACK,
      ),
    );
  }
}

function parseConsultantClientsPage(raw: unknown): PaginatedResponse<Client> {
  assertClientsListNotFailureEnvelope(raw);
  const unwrapped = unwrapApiResponse<Record<string, unknown>>(raw);
  const body =
    unwrapped ?? (raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null);
  if (body == null) {
    throw new Error(CONSULTANT_CLIENTS_LIST_COPY.INVALID_RESPONSE);
  }
  const content = Array.isArray(body.content) ? (body.content as Client[]) : [];
  const totalElements = typeof body.totalElements === 'number' ? body.totalElements : 0;
  const totalPages = typeof body.totalPages === 'number' ? body.totalPages : 0;
  const number = typeof body.number === 'number' ? body.number : 0;
  const last =
    typeof body.last === 'boolean' ? body.last : totalPages <= 0 || number >= totalPages - 1;
  return { content, totalElements, totalPages, last, number };
}

export function useConsultantClients(params: ClientsParams) {
  const { consultantId, search, status, size = DEFAULT_PAGE_SIZE } = params;
  const consultantIdStr =
    consultantId != null && String(consultantId).trim() !== '' ? String(consultantId).trim() : '';

  return useInfiniteQuery<PaginatedResponse<Client>>({
    queryKey: CLIENT_QUERY_KEYS.list({ consultantId: consultantIdStr, search, status }),
    queryFn: async ({ pageParam }) => {
      const raw = await apiGet<unknown>(CONSULTANT_API.consultantClients(consultantIdStr), {
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page: pageParam,
        size,
      });
      return parseConsultantClientsPage(raw);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: consultantIdStr.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClientDetail(
  clientId: string | number | undefined,
  options?: Partial<UseQueryOptions<ClientDetail>>,
) {
  return useQuery<ClientDetail>({
    queryKey: CLIENT_QUERY_KEYS.detail(clientId!),
    queryFn: () => apiGet<ClientDetail>(`/api/v1/clients/${clientId}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export { CLIENT_QUERY_KEYS };
