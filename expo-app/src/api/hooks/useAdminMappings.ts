/**
 * 어드민·스태프 — 매칭 목록 GET
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import { canViewMappingsOnMobile } from '@/utils/adminRole';
import {
  normalizeAdminMappingsList,
  type AdminMappingListItem,
} from '@/utils/adminMappingNormalize';

export type { AdminMappingViewFilter } from '@/utils/adminMappingNormalize';
export { filterAdminMappingsByView, findAdminMappingById } from '@/utils/adminMappingNormalize';
import { extractApiErrorMessage } from '@/utils/adminSchedulePickerNormalize';

const MAPPINGS_BASE = ['admin-mobile', 'mappings'] as const;

export const ADMIN_MAPPINGS_QUERY_KEYS = {
  all: MAPPINGS_BASE,
  list: (tenantId: string) => [...MAPPINGS_BASE, 'list', tenantId] as const,
};

type ApiReject = { status?: number };

function isForbiddenError(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as ApiReject).status === 403
  );
}

export function useAdminMappings(options?: Partial<UseQueryOptions<AdminMappingListItem[]>>) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canViewMappingsOnMobile(role, accessToken);
  useAdminApiTenantSync();

  const query = useQuery({
    queryKey: ADMIN_MAPPINGS_QUERY_KEYS.list(tenantId),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.MAPPINGS);
      return normalizeAdminMappingsList(raw);
    },
    enabled: ready && allowed && options?.enabled !== false,
    staleTime: 1000 * 30,
    retry: (failureCount, error) => !isForbiddenError(error) && failureCount < 1,
    ...options,
  });

  return { ...query, ready };
}

export type { AdminMappingListItem } from '@/utils/adminMappingNormalize';

export function getAdminMappingsErrorMessage(error: unknown, fallback: string): string {
  if (isForbiddenError(error)) {
    return '매칭 조회 권한이 없습니다.';
  }
  return extractApiErrorMessage(error, fallback);
}
