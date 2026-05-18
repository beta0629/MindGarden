/**
 * 어드민 API — JWT tenantId 동기화·tenant 변경 시 쿼리 무효화
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export function useAdminApiTenantSync(): void {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const before = resolveTenantIdForApi();
    syncTenantFromAccessToken(accessToken);
    const after = resolveTenantIdForApi();
    if (before !== after) {
      invalidateAdminApiQueries(queryClient);
    }
  }, [accessToken, queryClient]);
}
