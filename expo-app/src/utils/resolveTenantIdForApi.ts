/**
 * API 요청·TanStack Query `enabled` 공통 — X-Tenant-Id 해석 SSOT.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { resolveEffectiveUserTenantId } from '@/utils/resolveEffectiveUserTenantId';
import {
  resolveTenantIdFromSources,
  type ResolveTenantIdSources,
} from '@/utils/resolveTenantIdFromSources';

export type { ResolveTenantIdSources } from '@/utils/resolveTenantIdFromSources';
export { resolveTenantIdFromSources } from '@/utils/resolveTenantIdFromSources';
export { resolveEffectiveUserTenantId } from '@/utils/resolveEffectiveUserTenantId';

/** Zustand getState() 기준 — axios 인터셉터 등 비리액티브 호출용 */
export function resolveTenantIdForApi(): string {
  const { tenantId: headerTenantId, tenantCode, recentTenants } = useTenantStore.getState();
  const { user, accessToken } = useAuthStore.getState();
  const userTenantId = resolveEffectiveUserTenantId(user?.tenantId, accessToken);
  return resolveTenantIdFromSources({
    headerTenantId,
    userTenantId,
    tenantCode,
    recentTenants,
  });
}

/** React 구독 — 훅·화면에서 tenantId 변경 시 재렌더 */
export function useResolveTenantIdForApi(): string {
  const headerTenantId = useTenantStore((s) => s.tenantId);
  const tenantCode = useTenantStore((s) => s.tenantCode);
  const recentTenants = useTenantStore((s) => s.recentTenants);
  const userTenantId = useAuthStore((s) => s.user?.tenantId);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMemo(() => {
    const effectiveUserTenantId = resolveEffectiveUserTenantId(userTenantId, accessToken);
    return resolveTenantIdFromSources({
      headerTenantId,
      userTenantId: effectiveUserTenantId,
      tenantCode,
      recentTenants,
    });
  }, [headerTenantId, userTenantId, accessToken, tenantCode, recentTenants]);
}
