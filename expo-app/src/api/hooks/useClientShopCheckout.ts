/**
 * 내담자 쇼핑 체크아웃·포인트 잔액 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { SHOP_CART_QUERY_KEYS } from '@/api/hooks/useClientShopCart';
import { createShopIdempotencyKey } from '@/utils/clientShopCart';

export interface ShopPointBalance {
  availableMinor: number;
  heldMinor: number;
}

export interface ShopCheckoutResult {
  orderPublicId: string;
  status: string;
  subtotalMinor: number;
  pointsRedeemMinor: number;
  cashDueMinor: number;
  nextStep?: string;
}

const EMPTY_BALANCE: ShopPointBalance = { availableMinor: 0, heldMinor: 0 };

export const SHOP_CHECKOUT_QUERY_KEYS = {
  all: ['clientShop', 'checkout'] as const,
  balance: (tenantId: string) => [...SHOP_CHECKOUT_QUERY_KEYS.all, 'balance', tenantId] as const,
};

async function fetchPointBalance(): Promise<ShopPointBalance> {
  const raw = await apiGet<unknown>(SHOP_API.POINTS_BALANCE);
  const data = unwrapApiResponse<ShopPointBalance>(raw);
  if (!data || typeof data !== 'object') {
    return EMPTY_BALANCE;
  }
  return {
    availableMinor: Number(data.availableMinor) || 0,
    heldMinor: Number(data.heldMinor) || 0,
  };
}

async function postShopCheckout(
  idempotencyKey: string,
  pointsToRedeemMinor: number,
  consultantClientMappingId?: number | string | null,
): Promise<ShopCheckoutResult> {
  const body: {
    idempotencyKey: string;
    pointsToRedeemMinor: number;
    consultantClientMappingId?: number;
  } = {
    idempotencyKey,
    pointsToRedeemMinor,
  };
  if (consultantClientMappingId != null && consultantClientMappingId !== '') {
    body.consultantClientMappingId = Number(consultantClientMappingId);
  }
  const raw = await apiPost<unknown>(SHOP_API.CHECKOUT, body);
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '체크아웃에 실패했습니다.');
  }
  const data = unwrapApiResponse<ShopCheckoutResult>(raw);
  if (!data) {
    throw new Error('체크아웃에 실패했습니다.');
  }
  return data;
}

async function prepareShopPayment(orderPublicId: string): Promise<unknown> {
  const raw = await apiPost<unknown>(SHOP_API.preparePayment(orderPublicId), {});
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '결제 준비에 실패했습니다.');
  }
  return unwrapApiResponse(raw);
}

export function useClientShopPointBalance() {
  const { ready, tenantId } = useApiQueryReady();

  return useQuery({
    queryKey: SHOP_CHECKOUT_QUERY_KEYS.balance(tenantId),
    queryFn: fetchPointBalance,
    enabled: ready,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useClientShopCheckout() {
  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: async ({
      pointsToRedeemMinor,
      idempotencyKey,
      consultantClientMappingId,
    }: {
      pointsToRedeemMinor: number;
      idempotencyKey?: string;
      consultantClientMappingId?: number | string | null;
    }) => {
      const key = idempotencyKey ?? createShopIdempotencyKey();
      const result = await postShopCheckout(key, pointsToRedeemMinor, consultantClientMappingId);
      if (result.nextStep === 'PAYMENT' && result.orderPublicId) {
        await prepareShopPayment(result.orderPublicId);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SHOP_CHECKOUT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['clientShop', 'points'] });
    },
  });

  return {
    checkout: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
    checkoutResult: checkoutMutation.data,
    checkoutError: checkoutMutation.error,
    resetCheckout: checkoutMutation.reset,
  };
}

/** @deprecated use useClientShopPointBalance */
export const useClientShopCheckoutBalance = useClientShopPointBalance;
