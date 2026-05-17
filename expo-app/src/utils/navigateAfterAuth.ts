/**
 * 로그인 성공 후 역할별 홈으로 이동 + 푸시 토큰 등록
 *
 * `app/index.tsx` 진입 분기와 동일한 역할 순서를 유지한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { router, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationService } from '@/services/NotificationService';
import { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';

export { resolvePostAuthHomeHref } from '@/utils/resolvePostAuthHomeHref';

export async function navigateAfterAuthenticated(): Promise<void> {
  const { role } = useAuthStore.getState();
  router.replace(resolvePostAuthHomeHref(role) as Href);
  // 푸시 권한·Expo projectId 이슈로 대기하면 홈 진입이 막일 수 있어 네비게이션 후 비동기 등록
  void NotificationService.registerToken().catch(() => {});
}
