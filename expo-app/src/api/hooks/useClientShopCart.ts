/**
 * 내담자 쇼핑 장바구니 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { buildCartLinesPayload, type ShopCartLinePayload } from '@/utils/clientShopCart';

export interface ShopCartLine {
  skuCode: string;
  title: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface ShopCart {
  lines: ShopCartLine[];
  subtotalMinor: number;
}

const EMPTY_CART: ShopCart = { lines: [], subtotalMinor: 0 };

export const SHOP_CART_QUERY_KEYS = {
  all: ['clientShop', 'cart'] as const,
  detail: (tenantId: string) => [...SHOP_CART_QUERY_KEYS.all, tenantId] as const,
};

async function fetchShopCart(): Promise<ShopCart> {
  const raw = await apiGet<unknown>(SHOP_API.CART);
  const data = unwrapApiResponse<ShopCart>(raw);
  if (!data || typeof data !== 'object') {
    return EMPTY_CART;
  }
  return {
    lines: Array.isArray(data.lines) ? data.lines : [],
    subtotalMinor: Number(data.subtotalMinor) || 0,
  };
}

async function replaceShopCart(lines: ShopCartLinePayload[]): Promise<void> {
  const raw = await apiPut<unknown>(SHOP_API.CART, { lines });
  const unwrapped = unwrapApiResponse<unknown>(raw);
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '장바구니 갱신에 실패했습니다.');
  }
  if (unwrapped === null && raw != null && typeof raw === 'object' && 'success' in raw) {
    throw new Error((raw as { message?: string }).message || '장바구니 갱신에 실패했습니다.');
  }
}

export function useClientShopCart() {
  const { ready, tenantId } = useApiQueryReady();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SHOP_CART_QUERY_KEYS.detail(tenantId),
    queryFn: fetchShopCart,
    enabled: ready,
    staleTime: 1000 * 30,
    retry: 1,
  });

  const replaceMutation = useMutation({
    mutationFn: (lines: ShopCartLinePayload[]) => replaceShopCart(lines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEYS.all });
    },
  });

  return {
    ...query,
    replaceCart: replaceMutation.mutateAsync,
    isReplacing: replaceMutation.isPending,
  };
}

export { buildCartLinesPayload };
