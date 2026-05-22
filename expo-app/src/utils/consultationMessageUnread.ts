/**
 * 상담 메시지 unread-count API 응답 파싱
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import { toSafeNumber } from './safeDisplay';

/** `useUnreadMessageCount` · 홈 KPI 공통 파싱 */
export function parseUnreadMessageCountPayload(raw: unknown): number {
  try {
    const inner = unwrapApiResponse<Record<string, unknown>>(raw);
    const bag = inner ?? (raw as Record<string, unknown>);
    if (bag && typeof bag === 'object' && 'unreadCount' in bag) {
      return toSafeNumber(bag.unreadCount, 0);
    }
    return 0;
  } catch {
    return 0;
  }
}
