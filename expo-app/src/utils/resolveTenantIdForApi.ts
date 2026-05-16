/**
 * API 요청·TanStack Query `enabled` 공통 — X-Tenant-Id 해석 SSOT.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';

export interface ResolveTenantIdSources {
  readonly headerTenantId?: string | null;
  readonly userTenantId?: string | null;
  readonly tenantCode?: string | null;
  readonly recentTenants: readonly { readonly code: string; readonly id: string }[];
}

/**
 * 테넌트 스토어 → 사용자 프로필 → recentTenants+tenantCode 순으로 tenantId를 반환한다.
 * 없으면 빈 문자열.
 */
export function resolveTenantIdFromSources(sources: ResolveTenantIdSources): string {
  const h = (sources.headerTenantId ?? '').trim();
  if (h.length > 0) {
    return h;
  }
  const u = (sources.userTenantId ?? '').trim();
  if (u.length > 0) {
    return u;
  }
  const c = (sources.tenantCode ?? '').trim();
  if (c.length > 0 && sources.recentTenants.length > 0) {
    const hit = sources.recentTenants.find((t) => t.code === c);
    const fromRecent = hit?.id?.trim();
    if (fromRecent && fromRecent.length > 0) {
      return fromRecent;
    }
  }
  return '';
}

/** Zustand getState() 기준 — axios 인터셉터 등 비리액티브 호출용 */
export function resolveTenantIdForApi(): string {
  const { tenantId: headerTenantId, tenantCode, recentTenants } = useTenantStore.getState();
  const userTenantId = useAuthStore.getState().user?.tenantId;
  return resolveTenantIdFromSources({
    headerTenantId,
    userTenantId,
    tenantCode,
    recentTenants,
  });
}
