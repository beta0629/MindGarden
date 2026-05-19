/**
 * 내담자 쇼핑 주문 목록·상세·결제 준비 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import {
  SHOP_CATALOG_QUERY_KEYS,
  useClientShopCatalog,
  type ShopCatalogSku,
} from '@/api/hooks/useClientShopCatalog';
import type { ShopOrderFulfillmentLine } from '@/constants/clientShopConstants';

export interface ShopOrderSummary {
  orderPublicId: string;
  status: string;
  subtotalMinor: number;
  pointsRedeemMinor: number;
  cashDueMinor: number;
  createdAt?: string;
}

export interface ShopOrderLine {
  lineNo: number;
  skuCode: string;
  title: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface ShopOrderDetail {
  orderPublicId: string;
  status: string;
  subtotalMinor: number;
  pointsRedeemMinor: number;
  cashDueMinor: number;
  lines: ShopOrderLine[];
  fulfillmentLines?: ShopOrderFulfillmentLine[];
}

export interface ShopPreparePaymentResult {
  paymentUrl?: string;
}

export const SHOP_ORDERS_QUERY_KEYS = {
  all: ['clientShop', 'orders'] as const,
  list: (tenantId: string, page: number, size: number) =>
    [...SHOP_ORDERS_QUERY_KEYS.all, 'list', tenantId, page, size] as const,
  detail: (tenantId: string, orderPublicId: string) =>
    [...SHOP_ORDERS_QUERY_KEYS.all, 'detail', tenantId, orderPublicId] as const,
};

async function fetchShopOrders(page: number, size: number): Promise<ShopOrderSummary[]> {
  const raw = await apiGet<unknown>(SHOP_API.ORDERS, { page, size });
  const data = unwrapApiResponse<ShopOrderSummary[]>(raw);
  return Array.isArray(data) ? data : [];
}

async function fetchShopOrder(orderPublicId: string): Promise<ShopOrderDetail | null> {
  const raw = await apiGet<unknown>(SHOP_API.orderDetail(orderPublicId));
  const data = unwrapApiResponse<ShopOrderDetail>(raw);
  if (!data || typeof data !== 'object') {
    return null;
  }
  return {
    ...data,
    lines: Array.isArray(data.lines) ? data.lines : [],
    fulfillmentLines: Array.isArray(data.fulfillmentLines) ? data.fulfillmentLines : [],
  };
}

async function postPrepareShopPayment(orderPublicId: string): Promise<ShopPreparePaymentResult> {
  const raw = await apiPost<unknown>(SHOP_API.preparePayment(orderPublicId), {});
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '결제 준비에 실패했습니다.');
  }
  const data = unwrapApiResponse<ShopPreparePaymentResult>(raw);
  return data ?? {};
}

export function useClientShopOrders(page = 0, size = 20) {
  const { ready, tenantId } = useApiQueryReady();

  return useQuery({
    queryKey: SHOP_ORDERS_QUERY_KEYS.list(tenantId, page, size),
    queryFn: () => fetchShopOrders(page, size),
    enabled: ready,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useClientShopOrder(orderPublicId: string | undefined) {
  const { ready, tenantId } = useApiQueryReady();
  const id = orderPublicId?.trim() ?? '';

  return useQuery({
    queryKey: SHOP_ORDERS_QUERY_KEYS.detail(tenantId, id),
    queryFn: () => fetchShopOrder(id),
    enabled: ready && id.length > 0,
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useClientShopPreparePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderPublicId: string) => postPrepareShopPayment(orderPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_ORDERS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['clientShop', 'points'] });
    },
  });
}

/**
 * 카탈로그에서 SKU 1건 조회 (PDP — 별도 단건 API 없음).
 */
export function useClientShopCatalogSku(skuCodeParam: string | undefined) {
  const catalogQuery = useClientShopCatalog();
  const skuCode = useMemo(() => {
    if (!skuCodeParam) {
      return '';
    }
    try {
      return decodeURIComponent(skuCodeParam);
    } catch {
      return skuCodeParam;
    }
  }, [skuCodeParam]);

  const sku: ShopCatalogSku | null = useMemo(() => {
    if (!skuCode) {
      return null;
    }
    return catalogQuery.data?.find((row) => row.skuCode === skuCode) ?? null;
  }, [catalogQuery.data, skuCode]);

  return {
    sku,
    skuCode,
    isLoading: catalogQuery.isLoading,
    isRefetching: catalogQuery.isRefetching,
    error: catalogQuery.error,
    refetch: catalogQuery.refetch,
  };
}
