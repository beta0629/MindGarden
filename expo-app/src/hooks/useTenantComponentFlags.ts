/**
 * 테넌트 활성 컴포넌트 플래그 (TenantComponent API)
 *
 * @author Core Solution
 * @since 2026-05-19
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { TENANT_COMPONENT_API } from '@/api/endpoints';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { PLATFORM_COMPONENT_CODES } from '@/constants/platformComponentCodes';

interface ActiveCodesResponse {
  activeComponentCodes?: string[];
}

export const TENANT_COMPONENT_QUERY_KEYS = {
  all: ['tenantComponent'] as const,
  activeCodes: (tenantId: string) =>
    [...TENANT_COMPONENT_QUERY_KEYS.all, 'activeCodes', tenantId] as const,
};

async function fetchActiveComponentCodes(): Promise<string[]> {
  try {
    const raw = await apiGet<unknown>(TENANT_COMPONENT_API.ACTIVE_CODES);
    if (raw != null && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const data = (obj.data ?? obj) as ActiveCodesResponse;
      if (Array.isArray(data?.activeComponentCodes)) {
        return data.activeComponentCodes;
      }
      if (Array.isArray(obj.activeComponentCodes)) {
        return obj.activeComponentCodes as string[];
      }
    }
    return [];
  } catch {
    return [];
  }
}

export type UseTenantComponentFlagsOptions = {
  enabled?: boolean;
};

export function useTenantComponentFlags(options: UseTenantComponentFlagsOptions = {}) {
  const { enabled = true } = options;
  const { ready, tenantId } = useApiQueryReady();

  const query = useQuery({
    queryKey: TENANT_COMPONENT_QUERY_KEYS.activeCodes(tenantId),
    queryFn: fetchActiveComponentCodes,
    enabled: ready && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const activeCodes = query.data ?? null;

  const isActive = useMemo(
    () => (code: string) => {
      if (!code || activeCodes === null) {
        return false;
      }
      return activeCodes.includes(code);
    },
    [activeCodes],
  );

  const clientShopEnabled = useMemo(() => {
    if (activeCodes === null) {
      return undefined;
    }
    return isActive(PLATFORM_COMPONENT_CODES.CLIENT_SHOP);
  }, [activeCodes, isActive]);

  return {
    loading: query.isLoading,
    activeCodes: activeCodes ?? [],
    isActive,
    clientShopEnabled,
  };
}
