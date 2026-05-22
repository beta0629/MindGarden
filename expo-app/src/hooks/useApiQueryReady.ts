/**
 * TanStack Query `enabled` — auth·tenant MMKV rehydrate 완료 후 API 호출
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { logAdminApiReadyGate } from '@/utils/adminSessionDiag';
import { extractTenantIdFromAccessToken } from '@/utils/jwtPayload';
import { resolveClientScheduleUserId } from '@/utils/resolveClientScheduleUserId';
import { resolveEffectiveTenantIdForApi } from '@/utils/resolveEffectiveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import { isTenantHydrationGateOk } from '@/utils/tenantHydrationGate';

const TENANT_HYDRATE_FALLBACK_MS = 500;

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
  const didLogNotReadyRef = useRef(false);

  const authIsLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUserId = useAuthStore((s) => s.user?.id);
  const userTenantId = useAuthStore((s) => s.user?.tenantId);
  const tenantHasHydrated = useTenantStore((s) => s._hasHydrated);
  const headerTenantId = useTenantStore((s) => s.tenantId);
  const tenantCode = useTenantStore((s) => s.tenantCode);
  const recentTenants = useTenantStore((s) => s.recentTenants);

  const authStoresReady = authHasHydrated && !authIsLoading;

  const effectiveTenantId = useMemo(
    () =>
      resolveEffectiveTenantIdForApi({
        storesResolved: authStoresReady && tenantHasHydrated,
        accessToken,
        headerTenantId,
        userTenantId,
        tenantCode,
        recentTenants,
      }),
    [
      authStoresReady,
      tenantHasHydrated,
      accessToken,
      headerTenantId,
      userTenantId,
      tenantCode,
      recentTenants,
    ],
  );

  const tenantGateOk = isTenantHydrationGateOk(tenantHasHydrated, effectiveTenantId);
  const storesResolved = authStoresReady && tenantGateOk;

  const userId = useMemo(
    () => resolveClientScheduleUserId(storeUserId, accessToken),
    [storeUserId, accessToken],
  );

  useEffect(() => {
    if (tenantHasHydrated) {
      return;
    }
    if (!effectiveTenantId.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      if (!useTenantStore.getState()._hasHydrated) {
        useTenantStore.setState({ _hasHydrated: true });
      }
    }, TENANT_HYDRATE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [tenantHasHydrated, effectiveTenantId]);

  useEffect(() => {
    if (!storesResolved || !accessToken?.trim() || !effectiveTenantId) {
      return;
    }
    const storeTid = (useTenantStore.getState().tenantId ?? '').trim();
    if (storeTid) {
      return;
    }
    syncTenantFromAccessToken(accessToken);
    if (__DEV__) {
      // eslint-disable-next-line no-console -- hydrate 후 tenantId 누락 진단(개발 전용)
      console.debug('[useApiQueryReady] synced JWT tenantId into store');
    }
  }, [storesResolved, accessToken, effectiveTenantId]);

  const ready =
    authHasHydrated &&
    !authIsLoading &&
    tenantGateOk &&
    (!requireAccessToken || Boolean(accessToken)) &&
    Boolean(effectiveTenantId) &&
    (!requireUserId || Boolean(userId));

  useEffect(() => {
    const verbose = process.env.EXPO_PUBLIC_ADMIN_SESSION_DIAG === '1';
    if (ready) {
      didLogNotReadyRef.current = false;
      return;
    }
    if (!verbose && didLogNotReadyRef.current) {
      return;
    }
    didLogNotReadyRef.current = true;
    logAdminApiReadyGate({
      ready,
      authHasHydrated,
      authIsLoading,
      tenantHasHydrated,
      accessTokenPresent: Boolean(accessToken?.trim()),
      effectiveTenantId,
      userId,
      requireAccessToken,
      requireUserId,
      isAuthenticated,
      headerTenantId: headerTenantId ?? undefined,
      userTenantId,
      jwtTenantPresent: Boolean(extractTenantIdFromAccessToken(accessToken)),
      source: 'useApiQueryReady',
    });
  }, [
    ready,
    authHasHydrated,
    authIsLoading,
    tenantHasHydrated,
    accessToken,
    effectiveTenantId,
    userId,
    requireAccessToken,
    requireUserId,
    isAuthenticated,
    headerTenantId,
    userTenantId,
  ]);

  return { ready, tenantId: effectiveTenantId, userId, accessToken };
}
