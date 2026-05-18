/**
 * 어드민 API — tenantId·JWT 재동기화 (EmptyState 재시도)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export { isAdminListQueryLoading } from '@/utils/isAdminListQueryLoading';

export function retryAdminApiSession(): void {
  const accessToken = useAuthStore.getState().accessToken;
  syncTenantFromAccessToken(accessToken);

  let tenantId = resolveTenantIdForApi();
  if (!tenantId?.trim()) {
    const jwtTenantId = extractTenantIdFromAccessToken(accessToken);
    if (jwtTenantId) {
      useTenantStore.setState({ tenantId: jwtTenantId });
      tenantId = jwtTenantId;
    }
  }

  if (__DEV__ && !tenantId?.trim()) {
    // eslint-disable-next-line no-console -- 재시도 후에도 tenantId 없음 진단
    console.debug('[retryAdminApiSession] tenantId still missing after sync');
  }

  invalidateAdminApiQueries(queryClient);
}
