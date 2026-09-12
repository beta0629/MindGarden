/**
 * 로그인 성공 후 역할별 홈으로 이동 + 푸시 토큰 claim(등록)
 *
 * `app/index.tsx` 진입 분기와 동일한 역량 우선 순서를 유지한다.
 *
 * Apple G1.2: EULA 동의 게이트가 우선. `requiresReconsent` 또는 캐시 미스 시
 * `/(auth)/eula-consent` 로 이동. 동의 후 `skipEulaGate` 로 재호출.
 *
 * @author MindGarden
 * @since 2026-05-14
 * @updated 2026-09-12 — EULA 게이트 (Apple 1.2 follow-up)
 */
import { router, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  shouldShowEulaGateFromCache,
  useEulaConsentStore,
} from '@/stores/useEulaConsentStore';
import { NotificationService } from '@/services/NotificationService';
import { fetchEulaConsentStatus } from '@/services/eulaConsentService';
import { resolveStoreRoleFromAccessToken } from '@/utils/adminRole';
import { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';
import { EULA_CURRENT_VERSION } from '@/constants/eulaTerms';

export { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';

export const EULA_CONSENT_HREF = '/(auth)/eula-consent' as const;

export type NavigateAfterAuthenticatedOptions = {
  /** EULA 게이트 건너뛰기 — EULA 화면에서 동의 완료 후 호출 시 사용. */
  readonly skipEulaGate?: boolean;
};

function buildLandingUser(): ReturnType<typeof useAuthStore.getState>['user'] {
  const { user, role: storeRole, accessToken } = useAuthStore.getState();
  const roleFromJwt = resolveStoreRoleFromAccessToken(accessToken);
  const role = roleFromJwt ?? storeRole ?? user?.role ?? null;
  if (user == null) {
    return role != null ? { id: 0, email: '', name: '', role } : null;
  }
  return role != null ? { ...user, role } : user;
}

async function shouldShowEulaGate(userId: number | null | undefined): Promise<boolean> {
  if (userId == null || userId === 0) {
    return false;
  }
  const cacheMiss = shouldShowEulaGateFromCache(userId, EULA_CURRENT_VERSION);
  if (!cacheMiss) {
    return false;
  }
  try {
    const remote = await fetchEulaConsentStatus();
    if (remote.requiresReconsent) {
      return true;
    }
    useEulaConsentStore.getState().setRecord(userId, {
      acceptedVersion: remote.acceptedVersion ?? remote.currentVersion,
      acceptedAt: remote.acceptedAt,
    });
    return false;
  } catch (err) {
    // eslint-disable-next-line no-console -- 게이트 폴백 로그만
    console.warn('[EulaGate] fetchEulaConsentStatus failed — falling back to gate', err);
    return true;
  }
}

/**
 * 인증 완료 후 홈 이동 + 디바이스 푸시 토큰을 현재 사용자로 claim.
 * EULA 미동의 시 동의 화면으로 보내고, 통과 후에만 홈·claim 을 수행한다.
 */
export async function navigateAfterAuthenticated(
  options: NavigateAfterAuthenticatedOptions = {},
): Promise<void> {
  const { user } = useAuthStore.getState();

  if (!options.skipEulaGate) {
    const needsGate = await shouldShowEulaGate(user?.id);
    if (needsGate) {
      router.replace(EULA_CONSENT_HREF as Href);
      return;
    }
  }

  const landingUser = buildLandingUser();
  router.replace(resolvePostAuthHomeHref(landingUser) as Href);
  try {
    await NotificationService.registerTokenWithClaimRetry({ notifyUser: false });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'register_claim_error';
    // eslint-disable-next-line no-console -- 토큰·JWT 원문 미포함
    console.warn('[navigateAfterAuthenticated] push claim failed', { reason });
  }
}
