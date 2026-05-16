/**
 * Bearer JWT의 tenantId로 MMKV 테넌트 스토어·auth user를 맞춘다.
 * Android(세션 쿠키 없음)에서 X-Tenant-Id·JWT 불일치로 API 빈 목록이 나는 경우를 줄인다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';

export function syncTenantFromAccessToken(accessToken: string | null | undefined): void {
  const jwtTenantId = extractTenantIdFromAccessToken(accessToken);
  if (!jwtTenantId) {
    return;
  }

  const auth = useAuthStore.getState();
  const userTid = auth.user?.tenantId?.trim() ?? '';
  if (auth.user != null && userTid !== jwtTenantId) {
    auth.updateUser({ tenantId: jwtTenantId });
  }

  const { tenantId: storedId, tenantCode, tenantName, recentTenants } = useTenantStore.getState();
  if ((storedId ?? '').trim() === jwtTenantId) {
    return;
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
    return;
  }

  useTenantStore.setState({ tenantId: jwtTenantId });
}
