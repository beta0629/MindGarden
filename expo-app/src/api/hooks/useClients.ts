/**
 * 내담자 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useQuery,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiGet } from '../client';
import { CONSULTANT_API } from '../endpoints';

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
  list: (params: Omit<ClientsParams, 'page'>) =>
    [...CLIENT_QUERY_KEYS.lists(), params] as const,
  details: () => [...CLIENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | number) =>
    [...CLIENT_QUERY_KEYS.details(), id] as const,
};

const DEFAULT_PAGE_SIZE = 20;

export function useConsultantClients(params: ClientsParams) {
  const { consultantId, search, status, size = DEFAULT_PAGE_SIZE } = params;

  return useInfiniteQuery<PaginatedResponse<Client>>({
    queryKey: CLIENT_QUERY_KEYS.list({ consultantId, search, status }),
    queryFn: ({ pageParam }) =>
      apiGet<PaginatedResponse<Client>>(
        CONSULTANT_API.consultantClients(consultantId),
        {
          search: search || undefined,
          status: status === 'ALL' ? undefined : status,
          page: pageParam,
          size,
        },
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: !!consultantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClientDetail(
  clientId: string | number | undefined,
  options?: Partial<UseQueryOptions<ClientDetail>>,
) {
  return useQuery<ClientDetail>({
    queryKey: CLIENT_QUERY_KEYS.detail(clientId!),
    queryFn: () =>
      apiGet<ClientDetail>(`/api/v1/clients/${clientId}`),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export { CLIENT_QUERY_KEYS };
