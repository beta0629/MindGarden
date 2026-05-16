/**
 * JWT tenantId → MMKV 테넌트 스토어만 동기화 (useAuthStore import 없음 — 순환 참조 방지)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useTenantStore } from '@/stores/useTenantStore';
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';

/**
 * @returns 동기화에 사용한 tenantId. 없으면 null
 */
export function syncTenantStoreFromAccessToken(
  accessToken: string | null | undefined,
): string | null {
  const jwtTenantId = extractTenantIdFromAccessToken(accessToken);
  if (!jwtTenantId) {
    return null;
  }

  const { tenantId: storedId, tenantCode, tenantName, recentTenants } = useTenantStore.getState();
  if ((storedId ?? '').trim() === jwtTenantId) {
    return jwtTenantId;
  }

  const recentHit = tenantCode
    ? recentTenants.find((t) => t.code === tenantCode && t.id === jwtTenantId)
    : undefined;

  if (tenantCode) {
    useTenantStore.getState().setTenant(
      tenantCode,
      jwtTenantId,
      tenantName ?? recentHit?.name ?? tenantCode,
    );
    return jwtTenantId;
  }

  useTenantStore.setState({ tenantId: jwtTenantId });
  return jwtTenantId;
}
