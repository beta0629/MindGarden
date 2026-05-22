/**
 * 상담 메시지 unread-count API 응답 파싱 · isRead 정규화
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

/**
 * API·JSON 직렬화에 따라 isRead가 boolean·문자열·숫자로 올 수 있음.
 * `row.isRead === false` 엄격 비교 대신 사용한다.
 */
export function parseMessageIsRead(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (value === false || value === 0 || value == null) {
    return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'y' || normalized === 'yes') {
      return true;
    }
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'n' ||
      normalized === 'no' ||
      normalized === ''
    ) {
      return false;
    }
  }
  return Boolean(value);
}

/** 수신자 본인 미읽음 여부 — buildConversationsFromRows 집계용 */
export function isUnreadMessageForReceiver(
  isReadRaw: unknown,
  receiverId: number,
  selfId: number,
): boolean {
  if (selfId <= 0 || receiverId !== selfId) {
    return false;
  }
  return !parseMessageIsRead(isReadRaw);
}
