/**
 * 어드민 API — tenantId·JWT 재동기화 (EmptyState 재시도)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useAuthStore } from '@/stores/useAuthStore';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

export { isAdminListQueryLoading } from '@/utils/isAdminListQueryLoading';

export function retryAdminApiSession(): void {
  syncTenantFromAccessToken(useAuthStore.getState().accessToken);
}
