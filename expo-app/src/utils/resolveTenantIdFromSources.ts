/**
 * X-Tenant-Id 해석 — 순수 함수 (스토어 무의존, 단위 테스트·SSOT)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

export interface ResolveTenantIdSources {
  readonly headerTenantId?: string | null;
  readonly userTenantId?: string | null;
  readonly tenantCode?: string | null;
  readonly recentTenants: readonly { readonly code: string; readonly id: string }[];
}

/**
 * `userTenantId`(상위에서 JWT·프로필 effective 값) → 테넌트 헤더(MMKV) → recentTenants+tenantCode 순.
 * Bearer 앱은 `resolveTenantIdForApi` / `resolveEffectiveUserTenantId`가 JWT를 user보다 먼저 넣는다.
 * 없으면 빈 문자열.
 */
export function resolveTenantIdFromSources(sources: ResolveTenantIdSources): string {
  const u = (sources.userTenantId ?? '').trim();
  if (u.length > 0) {
    return u;
  }
  const h = (sources.headerTenantId ?? '').trim();
  if (h.length > 0) {
    return h;
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
