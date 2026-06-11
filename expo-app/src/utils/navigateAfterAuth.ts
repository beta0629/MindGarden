/**
 * 로그인 성공 후 역할별 홈으로 이동 + 푸시 토큰 등록
 *
 * `app/index.tsx` 진입 분기와 동일한 역할 순서를 유지한다.
 *
 * <p>Apple G1.2 UGC (P2-C): EULA 동의 게이트가 우선한다. BE 의 {@code requiresReconsent}
 * 가 {@code true} 이거나 캐시 미스인 경우 `/(auth)/eula-consent` 로 이동시킨다. EULA 화면은
 * 동의 후 다시 본 함수를 호출하므로 무한 루프 방지를 위해 {@code skipEulaGate} 플래그를
 * 받는다.</p>
 *
 * @author MindGarden
 * @since 2026-05-14
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

/**
 * EULA 게이트가 필요한지 BE 결과로 확인한다.
 *
 * <p>BE 호출이 실패해도 사용자의 진입을 막지 않는다 (네트워크 오류 시 캐시 신뢰). 캐시가
 * 현재 버전과 일치하지 않고 BE 도 실패하면 EULA 화면으로 안내한다 (오프라인이라도 가입
 * 직후라면 캐시 미스가 명확하기 때문).</p>
 *
 * @param userId 현재 사용자 id
 * @returns 게이트 발동 필요 시 {@code true}
 */
async function shouldShowEulaGate(userId: number | null | undefined): Promise<boolean> {
  if (userId == null) {
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
    // 네트워크/세션 오류 — 캐시 미스 시에는 안전한 쪽으로 EULA 게이트 노출
    console.warn('[EulaGate] fetchEulaConsentStatus failed — falling back to gate', err);
    return true;
  }
}

export async function navigateAfterAuthenticated(
  options: NavigateAfterAuthenticatedOptions = {},
): Promise<void> {
  const { role: storeRole, accessToken, user } = useAuthStore.getState();
  const role = resolveStoreRoleFromAccessToken(accessToken) ?? storeRole;

  if (!options.skipEulaGate) {
    const needsGate = await shouldShowEulaGate(user?.id);
    if (needsGate) {
      router.replace(EULA_CONSENT_HREF as Href);
      // 푸시 등록은 EULA 통과 후 처리 — 게이트 진입 단계에서는 보류.
      return;
    }
  }

  router.replace(resolvePostAuthHomeHref(role) as Href);
  // 푸시 권한·Expo projectId 이슈로 대기하면 홈 진입이 막일 수 있어 네비게이션 후 비동기 등록
  void NotificationService.registerToken().catch(() => {});
}
