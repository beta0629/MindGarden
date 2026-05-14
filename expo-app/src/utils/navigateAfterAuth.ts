/**
 * 로그인 성공 후 역할별 홈으로 이동 + 푸시 토큰 등록
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { router, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { NotificationService } from '@/services/NotificationService';

export async function navigateAfterAuthenticated(): Promise<void> {
  await NotificationService.registerToken();
  const { role } = useAuthStore.getState();
  if (role === 'consultant') {
    router.replace('/(consultant)/(home)' as Href);
  } else {
    router.replace('/(client)/(home)' as Href);
  }
}
