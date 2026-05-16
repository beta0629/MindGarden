/**
 * TanStack Query `enabled` — auth·tenant MMKV rehydrate 완료 후 API 호출
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { useResolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';

export type UseApiQueryReadyOptions = {
  /** false면 userId 없이도 ready 가능 (드묾) */
  requireUserId?: boolean;
  requireAccessToken?: boolean;
};

export function useApiQueryReady(options?: UseApiQueryReadyOptions): {
  ready: boolean;
  tenantId: string;
  userId: number | undefined;
  accessToken: string | null;
} {
  const requireUserId = options?.requireUserId !== false;
  const requireAccessToken = options?.requireAccessToken !== false;

  const authIsLoading = useAuthStore((s) => s.isLoading);
  const authHasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const tenantHasHydrated = useTenantStore((s) => s._hasHydrated);
  const tenantId = useResolveTenantIdForApi();

  const ready =
    authHasHydrated &&
    !authIsLoading &&
    tenantHasHydrated &&
    (!requireAccessToken || Boolean(accessToken)) &&
    Boolean(tenantId) &&
    (!requireUserId || Boolean(userId));

  return { ready, tenantId, userId, accessToken };
}
