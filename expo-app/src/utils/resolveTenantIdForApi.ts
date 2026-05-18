/**
 * API 요청·TanStack Query `enabled` 공통 — X-Tenant-Id 해석 SSOT.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { resolveEffectiveTenantIdForApi } from '@/utils/resolveEffectiveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export type { ResolveTenantIdSources } from '@/utils/resolveTenantIdFromSources';
export { resolveTenantIdFromSources } from '@/utils/resolveTenantIdFromSources';
export { resolveEffectiveUserTenantId } from '@/utils/resolveEffectiveUserTenantId';
export { resolveEffectiveTenantIdForApi } from '@/utils/resolveEffectiveTenantIdForApi';

function getEffectiveTenantInput(): Parameters<typeof resolveEffectiveTenantIdForApi>[0] {
  const {
    tenantId: headerTenantId,
    tenantCode,
    recentTenants,
    _hasHydrated: tenantHydrated,
  } = useTenantStore.getState();
  const { user, accessToken, _hasHydrated: authHydrated, isLoading } = useAuthStore.getState();
  return {
    storesResolved: Boolean(authHydrated && !isLoading && tenantHydrated),
    accessToken,
    headerTenantId,
    userTenantId: user?.tenantId,
    tenantCode,
    recentTenants,
  };
}

/** Zustand getState() 기준 — axios 인터셉터 등 비리액티브 호출용 */
export function resolveTenantIdForApi(): string {
  const { accessToken } = useAuthStore.getState();
  if (accessToken?.trim()) {
    syncTenantFromAccessToken(accessToken);
  }
  return resolveEffectiveTenantIdForApi(getEffectiveTenantInput());
}

/** React 구독 — 훅·화면에서 tenantId 변경 시 재렌더 */
export function useResolveTenantIdForApi(): string {
  const headerTenantId = useTenantStore((s) => s.tenantId);
  const tenantCode = useTenantStore((s) => s.tenantCode);
  const recentTenants = useTenantStore((s) => s.recentTenants);
  const tenantHasHydrated = useTenantStore((s) => s._hasHydrated);
  const userTenantId = useAuthStore((s) => s.user?.tenantId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHasHydrated = useAuthStore((s) => s._hasHydrated);
  const authIsLoading = useAuthStore((s) => s.isLoading);

  return useMemo(() => {
    const storesResolved = authHasHydrated && !authIsLoading && tenantHasHydrated;
    return resolveEffectiveTenantIdForApi({
      storesResolved,
      accessToken,
      headerTenantId,
      userTenantId,
      tenantCode,
      recentTenants,
    });
  }, [
    authHasHydrated,
    authIsLoading,
    tenantHasHydrated,
    headerTenantId,
    userTenantId,
    accessToken,
    tenantCode,
    recentTenants,
  ]);
}
