/**
 * 내담자 쇼핑 장바구니 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { assertApiSuccessVoid, unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { buildCartLinesPayload, type ShopCartLinePayload } from '@/utils/clientShopCart';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

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

const CART_REPLACE_FAILED_MESSAGE = '장바구니 갱신에 실패했습니다.';

export async function replaceShopCart(lines: ShopCartLinePayload[]): Promise<void> {
  let raw: unknown;
  try {
    raw = await apiPut<unknown>(SHOP_API.CART, { lines });
  } catch (error) {
    if (__DEV__) {
      console.warn('[shop-cart]', error);
    }
    throw new Error(extractApiErrorMessage(error, CART_REPLACE_FAILED_MESSAGE));
  }
  try {
    assertApiSuccessVoid(raw, CART_REPLACE_FAILED_MESSAGE);
  } catch (error) {
    if (__DEV__) {
      console.warn('[shop-cart]', raw);
    }
    throw error instanceof Error ? error : new Error(CART_REPLACE_FAILED_MESSAGE);
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
