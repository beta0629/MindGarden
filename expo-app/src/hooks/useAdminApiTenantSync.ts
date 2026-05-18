/**
 * 어드민 API — JWT tenantId → tenant store 동기화
 * queryKey의 tenantId 변경으로 refetch되므로 자동 invalidate는 하지 않음.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export function useAdminApiTenantSync(): void {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    syncTenantFromAccessToken(accessToken);
  }, [accessToken]);
}
