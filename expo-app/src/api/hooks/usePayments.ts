/**
 * 결제·회기 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { PAYMENT_API } from '../endpoints';

export interface SessionBalance {
  clientId: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentItem {
  id: number;
  paymentDate: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: PaymentStatus;
  packageName?: string;
  sessionCount?: number;
  createdAt: string;
}

export interface PaymentDetail {
  id: number;
  paymentDate: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: PaymentStatus;
  packageName?: string;
  sessionCount?: number;
  consultantName?: string;
  consultationDate?: string;
  consultationTime?: string;
  receiptUrl?: string;
  refundable: boolean;
  refundDeadline?: string;
  createdAt: string;
}

export type UsageType = 'USED' | 'CHARGED' | 'REFUNDED';

export interface SessionUsageItem {
  id: number;
  date: string;
  type: UsageType;
  consultantName?: string;
  description: string;
  sessionChange: number;
  remainingAfter: number;
}

export type PaymentFilter = 'ALL' | 'COMPLETED' | 'REFUNDED';

interface CreatePaymentRequest {
  clientId: number;
  packageId: number;
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface RequestExtensionRequest {
  clientId: number;
  packageId: number;
  sessionCount: number;
}

interface PaymentListResponse {
  content: PaymentItem[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  balance: (clientId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'balance', clientId] as const,
  history: (clientId: number, filter?: PaymentFilter) =>
    [...PAYMENT_QUERY_KEYS.all, 'history', clientId, filter] as const,
  detail: (paymentId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'detail', paymentId] as const,
  usage: (clientId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'usage', clientId] as const,
};

const PAYMENTS_PAGE_SIZE = 15;

export function useSessionBalance(clientId: number | undefined) {
  return useQuery<SessionBalance>({
    queryKey: PAYMENT_QUERY_KEYS.balance(clientId!),
    queryFn: () =>
      apiGet<SessionBalance>(PAYMENT_API.SESSION_BALANCE, { clientId }),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 3,
  });
}

export function usePaymentHistory(
  clientId: number | undefined,
  filter: PaymentFilter = 'ALL',
) {
  return useInfiniteQuery<PaymentListResponse>({
    queryKey: PAYMENT_QUERY_KEYS.history(clientId!, filter),
    queryFn: ({ pageParam }) =>
      apiGet<PaymentListResponse>(PAYMENT_API.GET_PAYMENTS, {
        clientId,
        status: filter === 'ALL' ? undefined : filter,
        page: pageParam,
        size: PAYMENTS_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.last ? undefined : allPages.length,
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePaymentDetail(paymentId: number | undefined) {
  return useQuery<PaymentDetail>({
    queryKey: PAYMENT_QUERY_KEYS.detail(paymentId!),
    queryFn: () =>
      apiGet<PaymentDetail>(PAYMENT_API.paymentDetail(paymentId!)),
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSessionUsageHistory(clientId: number | undefined) {
  return useQuery<SessionUsageItem[]>({
    queryKey: PAYMENT_QUERY_KEYS.usage(clientId!),
    queryFn: () =>
      apiGet<SessionUsageItem[]>(PAYMENT_API.SESSION_USAGE_HISTORY, { clientId }),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) =>
      apiPost(PAYMENT_API.CONFIRM_PAYMENT, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
    },
  });
}

export function useRequestExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestExtensionRequest) =>
      apiPost(PAYMENT_API.SESSION_EXTENSIONS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
    },
  });
}

export { PAYMENT_QUERY_KEYS };
