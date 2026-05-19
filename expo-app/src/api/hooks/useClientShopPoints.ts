/**
 * 내담자 쇼핑 포인트·원장 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { POINT_LEDGER_DEFAULT_LIMIT } from '@/constants/clientShopConstants';
import type { ShopPointBalance } from '@/api/hooks/useClientShopCheckout';

export type PointLedgerEntryType = 'HOLD' | 'RELEASE' | 'COMMIT' | 'EARN';

export interface ShopPointLedgerEntry {
  type: PointLedgerEntryType;
  amountMinor: number;
  orderPublicId?: string | null;
  createdAt?: string;
  labelKey?: string;
}

export const SHOP_POINTS_QUERY_KEYS = {
  all: ['clientShop', 'points'] as const,
  ledger: (tenantId: string, limit: number) =>
    [...SHOP_POINTS_QUERY_KEYS.all, 'ledger', tenantId, limit] as const,
  balance: (tenantId: string) => [...SHOP_POINTS_QUERY_KEYS.all, 'balance', tenantId] as const,
};

async function fetchPointLedger(limit: number): Promise<ShopPointLedgerEntry[]> {
  const raw = await apiGet<unknown>(SHOP_API.POINTS_LEDGER, { limit });
  const data = unwrapApiResponse<ShopPointLedgerEntry[]>(raw);
  return Array.isArray(data) ? data : [];
}

async function fetchPointBalance(): Promise<ShopPointBalance> {
  const raw = await apiGet<unknown>(SHOP_API.POINTS_BALANCE);
  const data = unwrapApiResponse<ShopPointBalance>(raw);
  if (!data || typeof data !== 'object') {
    return { availableMinor: 0, heldMinor: 0 };
  }
  return {
    availableMinor: Number(data.availableMinor) || 0,
    heldMinor: Number(data.heldMinor) || 0,
  };
}

export function useClientShopPoints(limit = POINT_LEDGER_DEFAULT_LIMIT) {
  const { ready, tenantId } = useApiQueryReady();

  const balanceQuery = useQuery({
    queryKey: SHOP_POINTS_QUERY_KEYS.balance(tenantId),
    queryFn: fetchPointBalance,
    enabled: ready,
    staleTime: 1000 * 60,
    retry: 1,
  });

  const ledgerQuery = useQuery({
    queryKey: SHOP_POINTS_QUERY_KEYS.ledger(tenantId, limit),
    queryFn: () => fetchPointLedger(limit),
    enabled: ready,
    staleTime: 1000 * 60,
    retry: 1,
  });

  return {
    balance: balanceQuery.data ?? { availableMinor: 0, heldMinor: 0 },
    ledger: ledgerQuery.data ?? [],
    isLoading: balanceQuery.isLoading || ledgerQuery.isLoading,
    isRefetching: balanceQuery.isRefetching || ledgerQuery.isRefetching,
    error: balanceQuery.error ?? ledgerQuery.error,
    refetch: async () => {
      await Promise.all([balanceQuery.refetch(), ledgerQuery.refetch()]);
    },
  };
}
