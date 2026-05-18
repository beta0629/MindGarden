/**
 * 관리자 메시지 인박스 운영 알림 필터 (2차·클라이언트 SSOT)
 * SSOT: docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3
 *
 * @author MindGarden
 * @since 2026-05-18
 */

export const ADMIN_MESSAGE_INBOX_VIEW = {
  ADMIN_OPS: 'admin_ops',
  FULL: 'full',
} as const;

const MESSAGE_TYPE_ALLOW_UNCONDITIONAL = new Set([
  'PAYMENT_COMPLETION',
  'APPOINTMENT_CONFIRMATION',
  'NEW_APPOINTMENT',
  'APPOINTMENT',
]);

const MESSAGE_TYPE_DENY = new Set([
  'REMINDER',
  'INCOMPLETE_CONSULTATION',
  'DAILY_SUMMARY',
  'MONTHLY_REPORT',
  'RATING_REQUEST',
  'GENERAL',
  'FOLLOW_UP',
  'HOMEWORK',
  'IMPORTANT',
]);

const KEYWORD_ALLOW_PAYMENT = [
  '결제',
  '입금',
  '매칭',
  'PENDING_PAYMENT',
  'DEPOSIT',
  '환불',
  '결제 완료',
  '결제 확인',
];

const KEYWORD_ALLOW_SCHEDULE = [
  '예약',
  '일정',
  '스케줄',
  '취소',
  '변경',
  '가예약',
  '예약 확인',
  '새 예약',
];

const KEYWORD_DENY_ALWAYS = [
  '리마인더',
  '미완료 상담',
  '일일',
  '성과 요약',
  '월간',
  '상담일지',
  '일지 누락',
  '30분',
  '분 전',
];

const SENDER_TYPE_SYSTEM = 'SYSTEM';
const MESSAGE_TYPE_COMPLETION = 'COMPLETION';
const MESSAGE_TYPE_URGENT = 'URGENT';

function normalizeCode(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toUpperCase();
}

function combineText(title: unknown, content: unknown): string {
  return `${typeof title === 'string' ? title : ''}${typeof content === 'string' ? content : ''}`;
}

function containsAnyKeyword(text: string, keywords: readonly string[]): boolean {
  if (!text || keywords.length === 0) {
    return false;
  }
  return keywords.some((keyword) => keyword.length > 0 && text.includes(keyword));
}

function containsOpsAllowKeyword(text: string): boolean {
  return (
    containsAnyKeyword(text, KEYWORD_ALLOW_PAYMENT) ||
    containsAnyKeyword(text, KEYWORD_ALLOW_SCHEDULE)
  );
}

function isDeniedMessageType(normalizedType: string): boolean {
  if (!normalizedType) {
    return true;
  }
  if (MESSAGE_TYPE_DENY.has(normalizedType)) {
    return true;
  }
  return normalizedType.startsWith('INCOMPLETE_');
}

export function isVisibleInAdminOpsInbox(
  messageType: unknown,
  senderType: unknown,
  title?: unknown,
  content?: unknown,
): boolean {
  const text = combineText(title, content);
  if (containsAnyKeyword(text, KEYWORD_DENY_ALWAYS)) {
    return false;
  }
  if (containsOpsAllowKeyword(text)) {
    return true;
  }
  const normalizedType = normalizeCode(messageType);
  const normalizedSender = normalizeCode(senderType);
  if (normalizedSender !== SENDER_TYPE_SYSTEM) {
    return false;
  }
  if (MESSAGE_TYPE_ALLOW_UNCONDITIONAL.has(normalizedType)) {
    return true;
  }
  if (normalizedType === MESSAGE_TYPE_COMPLETION) {
    return containsAnyKeyword(text, KEYWORD_ALLOW_SCHEDULE);
  }
  if (normalizedType === MESSAGE_TYPE_URGENT) {
    return containsOpsAllowKeyword(text);
  }
  if (isDeniedMessageType(normalizedType)) {
    return false;
  }
  return false;
}

export interface AdminMessageInboxFilterRow {
  messageType?: unknown;
  senderType?: unknown;
  title?: unknown;
  content?: unknown;
}

export function filterAdminMessagesForOpsInbox<T extends AdminMessageInboxFilterRow>(
  messages: T[],
): T[] {
  return messages.filter((row) =>
    isVisibleInAdminOpsInbox(row.messageType, row.senderType, row.title, row.content),
  );
}
