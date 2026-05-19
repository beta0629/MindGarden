/**
 * 내담자 쇼핑 — 체크아웃용 활성 상담사 매핑 목록
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { SHOP_CHECKOUT_QUERY_KEYS } from '@/api/hooks/useClientShopCheckout';
import {
  parseConsultantMappingsResponse,
  type ShopConsultantMappingOption,
} from '@/utils/clientShopCheckout';

export type { ShopConsultantMappingOption };

async function fetchConsultantMappings(): Promise<ShopConsultantMappingOption[]> {
  const raw = await apiGet<unknown>(SHOP_API.CONSULTANT_MAPPINGS);
  const data = unwrapApiResponse<unknown>(raw);
  return parseConsultantMappingsResponse(data);
}

/**
 * @param enabled CONSULTATION SKU가 장바구니에 있을 때만 true
 */
export function useClientShopConsultantMappings(enabled: boolean) {
  const { ready, tenantId } = useApiQueryReady();

  return useQuery({
    queryKey: [...SHOP_CHECKOUT_QUERY_KEYS.all, 'consultantMappings', tenantId] as const,
    queryFn: fetchConsultantMappings,
    enabled: ready && enabled,
    staleTime: 1000 * 60,
    retry: 1,
  });
}
