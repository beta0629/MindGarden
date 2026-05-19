/**
 * 내담자 쇼핑 카탈로그 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import type { ShopCatalogCategory } from '@/constants/clientShopConstants';

export interface ShopCatalogSku {
  skuCode: string;
  title: string;
  descriptionText?: string;
  unitPriceMinor: number;
  currency: string;
  catalogCategory: ShopCatalogCategory | string;
}

export const SHOP_CATALOG_QUERY_KEYS = {
  all: ['clientShop', 'catalog'] as const,
  list: (tenantId: string) => [...SHOP_CATALOG_QUERY_KEYS.all, tenantId] as const,
};

async function fetchShopCatalog(): Promise<ShopCatalogSku[]> {
  const raw = await apiGet<unknown>(SHOP_API.CATALOG);
  const data = unwrapApiResponse<ShopCatalogSku[]>(raw);
  return Array.isArray(data) ? data : [];
}

export function useClientShopCatalog() {
  const { ready, tenantId } = useApiQueryReady();

  return useQuery({
    queryKey: SHOP_CATALOG_QUERY_KEYS.list(tenantId),
    queryFn: fetchShopCatalog,
    enabled: ready,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
