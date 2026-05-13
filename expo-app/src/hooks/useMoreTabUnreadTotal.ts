/**
 * 더보기 탭 배지용 미읽음 합계(시스템 알림 + 상담 메시지)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useUnreadCount } from '@/api/hooks/useNotifications';
import { useUnreadMessageCount } from '@/api/hooks/useMessages';

export function useMoreTabUnreadTotal(): number {
  const { data: notification } = useUnreadCount();
  const { data: messages } = useUnreadMessageCount();
  const a = notification?.count ?? 0;
  const b = messages?.count ?? 0;
  return Math.max(0, a + b);
}
