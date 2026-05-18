/**
 * 어드민 API ready 게이트 진단 — release APK에서 ready=false 원인 추적
 *
 * @author MindGarden
 * @since 2026-05-18
 */

export type AdminApiReadyGateSnapshot = {
  ready: boolean;
  authHasHydrated: boolean;
  authIsLoading: boolean;
  tenantHasHydrated: boolean;
  accessTokenPresent: boolean;
  effectiveTenantId: string;
  userId?: number;
  requireAccessToken: boolean;
  requireUserId: boolean;
  isAuthenticated?: boolean;
  headerTenantId?: string;
  userTenantId?: string;
  jwtTenantPresent?: boolean;
  source?: string;
};

function isAdminSessionDiagVerbose(): boolean {
  return process.env.EXPO_PUBLIC_ADMIN_SESSION_DIAG === '1';
}

function maskTenantId(tenantId: string): { len: number; prefix: string } {
  const trimmed = tenantId.trim();
  if (!trimmed) {
    return { len: 0, prefix: '' };
  }
  const visible = trimmed.slice(0, 4);
  return { len: trimmed.length, prefix: trimmed.length > 4 ? `${visible}…` : visible };
}

function buildPayload(snapshot: AdminApiReadyGateSnapshot, verbose: boolean): Record<string, unknown> {
  const tenantMask = maskTenantId(snapshot.effectiveTenantId);
  const base: Record<string, unknown> = {
    ready: snapshot.ready,
    accessToken: snapshot.accessTokenPresent ? 'present' : 'missing',
    effectiveTenantId: tenantMask,
    authHasHydrated: snapshot.authHasHydrated,
    authIsLoading: snapshot.authIsLoading,
    tenantHasHydrated: snapshot.tenantHasHydrated,
    requireAccessToken: snapshot.requireAccessToken,
    requireUserId: snapshot.requireUserId,
  };
  if (snapshot.source) {
    base.source = snapshot.source;
  }
  if (verbose) {
    return {
      ...base,
      userId: snapshot.userId ?? null,
      isAuthenticated: snapshot.isAuthenticated ?? null,
      headerTenantId: maskTenantId(snapshot.headerTenantId ?? ''),
      userTenantId: maskTenantId(snapshot.userTenantId ?? ''),
      jwtTenantPresent: snapshot.jwtTenantPresent ?? null,
    };
  }
  return base;
}

let hasLoggedNotReadyGate = false;

/**
 * ready=false일 때 원인 스냅샷을 warn 로그로 남긴다 (release 포함).
 * `EXPO_PUBLIC_ADMIN_SESSION_DIAG=1` 이면 상세 필드·반복 로그 허용.
 */
export function logAdminApiReadyGate(snapshot: AdminApiReadyGateSnapshot): void {
  if (snapshot.ready) {
    return;
  }

  const verbose = isAdminSessionDiagVerbose();
  if (!verbose && hasLoggedNotReadyGate) {
    return;
  }
  if (!verbose) {
    hasLoggedNotReadyGate = true;
  }

  // eslint-disable-next-line no-console -- 어드민 release 진단(PII·토큰 미포함)
  console.warn('[AdminSession]', JSON.stringify(buildPayload(snapshot, verbose)));
}

/** 테스트·재시도 후 진단용 throttle 초기화 */
export function resetAdminSessionDiagThrottle(): void {
  hasLoggedNotReadyGate = false;
}
