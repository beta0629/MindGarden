/**
 * Bearer JWT의 tenantId로 MMKV 테넌트 스토어·auth user를 맞춘다.
 * Android(세션 쿠키 없음)에서 X-Tenant-Id·JWT 불일치로 API 빈 목록이 나는 경우를 줄인다.
 *
 * useAuthStore는 require로 지연 로드해 `useAuthStore ↔ syncTenant` 순환 참조를 끊는다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { syncTenantStoreFromAccessToken } from '@/utils/tenantJwtSync';

function getAuthStoreModule(): typeof import('@/stores/useAuthStore') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- 순환 참조 방지
  return require('@/stores/useAuthStore');
}

export function syncTenantFromAccessToken(accessToken: string | null | undefined): void {
  const jwtTenantId = syncTenantStoreFromAccessToken(accessToken);
  if (!jwtTenantId) {
    return;
  }

  const { useAuthStore } = getAuthStoreModule();
  const auth = useAuthStore.getState();
  const userTid = auth.user?.tenantId?.trim() ?? '';
  if (auth.user != null && userTid !== jwtTenantId) {
    auth.updateUser({ tenantId: jwtTenantId });
  }
}
