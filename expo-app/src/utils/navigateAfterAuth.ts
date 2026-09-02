/**
 * 로그인 성공 후 역할별 홈으로 이동 + 푸시 토큰 claim(등록)
 *
 * `app/index.tsx` 진입 분기와 동일한 역량 우선 순서를 유지한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { router, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationService } from '@/services/NotificationService';
import { resolveStoreRoleFromAccessToken } from '@/utils/adminRole';
import { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';

export { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';

function buildLandingUser(): ReturnType<typeof useAuthStore.getState>['user'] {
  const { user, role: storeRole, accessToken } = useAuthStore.getState();
  const roleFromJwt = resolveStoreRoleFromAccessToken(accessToken);
  const role = roleFromJwt ?? storeRole ?? user?.role ?? null;
  if (user == null) {
    return role != null ? { id: 0, email: '', name: '', role } : null;
  }
  return role != null ? { ...user, role } : user;
}

/**
 * 인증 완료 후 홈 이동 + 디바이스 푸시 토큰을 현재 사용자로 claim.
 * 네비게이션을 먼저 수행한 뒤 claim 을 await 한다(홈 진입 차단 방지).
 * claim 실패 시 토스트 + 1회 재시도는 {@link NotificationService.registerTokenWithClaimRetry} 가 담당.
 */
export async function navigateAfterAuthenticated(): Promise<void> {
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
