/**
 * 어드민 API — SecureStore 토큰 복구·tenantId·JWT 재동기화 (EmptyState 재시도)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { logAdminApiReadyGate, resetAdminSessionDiagThrottle } from '@/utils/adminSessionDiag';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';
import { resolveEffectiveTenantIdForApi } from '@/utils/resolveEffectiveTenantIdForApi';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export { isAdminListQueryLoading } from '@/utils/isAdminListQueryLoading';

function logRetryAdminApiReadyGate(accessToken: string | null): void {
  const auth = useAuthStore.getState();
  const tenant = useTenantStore.getState();
  const storesResolved = auth._hasHydrated && !auth.isLoading && tenant._hasHydrated;
  const effectiveTenantId = resolveEffectiveTenantIdForApi({
    storesResolved,
    accessToken,
    headerTenantId: tenant.tenantId,
    userTenantId: auth.user?.tenantId,
    tenantCode: tenant.tenantCode,
    recentTenants: tenant.recentTenants,
  });
  const ready =
    storesResolved &&
    Boolean(accessToken?.trim()) &&
    Boolean(effectiveTenantId);

  resetAdminSessionDiagThrottle();
  logAdminApiReadyGate({
    ready,
    authHasHydrated: auth._hasHydrated,
    authIsLoading: auth.isLoading,
    tenantHasHydrated: tenant._hasHydrated,
    accessTokenPresent: Boolean(accessToken?.trim()),
    effectiveTenantId,
    requireAccessToken: true,
    requireUserId: false,
    isAuthenticated: auth.isAuthenticated,
    headerTenantId: tenant.tenantId ?? '',
    userTenantId: auth.user?.tenantId,
    jwtTenantPresent: Boolean(extractTenantIdFromAccessToken(accessToken)),
    source: 'retryAdminApiSession',
  });
}

export async function retryAdminApiSession(): Promise<void> {
  await useAuthStore.getState().restoreTokens();

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

  logRetryAdminApiReadyGate(accessToken);
  invalidateAdminApiQueries(queryClient);
}
