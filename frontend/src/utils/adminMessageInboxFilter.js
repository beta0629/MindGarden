/**
 * 관리자 메시지 인박스 운영 알림 필터 (2차·클라이언트 SSOT)
 * SSOT: docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3
 * 백엔드 {@code AdminMessageInboxFilter} 와 동일 규칙 유지.
 *
 * @author CoreSolution
 * @since 2026-05-18
 */

export const ADMIN_MESSAGE_INBOX_VIEW = {
  ADMIN_OPS: 'admin_ops',
  FULL: 'full'
};

export const MESSAGE_TYPE_ALLOW_UNCONDITIONAL = new Set([
  'PAYMENT_COMPLETION',
  'APPOINTMENT_CONFIRMATION',
  'NEW_APPOINTMENT',
  'APPOINTMENT'
]);

export const MESSAGE_TYPE_DENY = new Set([
  'REMINDER',
  'INCOMPLETE_CONSULTATION',
  'DAILY_SUMMARY',
  'MONTHLY_REPORT',
  'RATING_REQUEST',
  'GENERAL',
  'FOLLOW_UP',
  'HOMEWORK',
  'IMPORTANT'
]);

export const KEYWORD_ALLOW_PAYMENT = [
  '결제',
  '입금',
  '매칭',
  'PENDING_PAYMENT',
  'DEPOSIT',
  '환불',
  '결제 완료',
  '결제 확인'
];

export const KEYWORD_ALLOW_SCHEDULE = [
  '예약',
  '일정',
  '스케줄',
  '취소',
  '변경',
  '가예약',
  '예약 확인',
  '새 예약'
];

export const KEYWORD_DENY_ALWAYS = [
  '리마인더',
  '미완료 상담',
  '일일',
  '성과 요약',
  '월간',
  '상담일지',
  '일지 누락',
  '30분',
  '분 전'
];

const SENDER_TYPE_SYSTEM = 'SYSTEM';
const MESSAGE_TYPE_COMPLETION = 'COMPLETION';
const MESSAGE_TYPE_URGENT = 'URGENT';

function normalizeCode(value) {
  if (value == null || typeof value !== 'string') {
    return '';
  }
  return value.trim().toUpperCase();
}

function combineText(title, content) {
  return `${title ?? ''}${content ?? ''}`;
}

function containsAnyKeyword(text, keywords) {
  if (!text || !keywords?.length) {
    return false;
  }
  return keywords.some((keyword) => keyword && text.includes(keyword));
}

function containsOpsAllowKeyword(text) {
  return (
    containsAnyKeyword(text, KEYWORD_ALLOW_PAYMENT) ||
    containsAnyKeyword(text, KEYWORD_ALLOW_SCHEDULE)
  );
}

function isDeniedMessageType(normalizedType) {
  if (!normalizedType) {
    return true;
  }
  if (MESSAGE_TYPE_DENY.has(normalizedType)) {
    return true;
  }
  return normalizedType.startsWith('INCOMPLETE_');
}

/**
 * @param {object} message
 * @returns {boolean}
 */
export function isAdminMessageVisibleInOpsInbox(message) {
  if (message == null || typeof message !== 'object') {
    return false;
  }
  return isVisibleInAdminOpsInbox(
    message.messageType,
    message.senderType,
    message.title,
    message.content
  );
}

/**
 * @param {string} messageType
 * @param {string} senderType
 * @param {string} [title]
 * @param {string} [content]
 * @returns {boolean}
 */
export function isVisibleInAdminOpsInbox(messageType, senderType, title, content) {
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

/**
 * @param {object[]} messages
 * @returns {object[]}
 */
export function filterAdminMessagesForOpsInbox(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.filter(isAdminMessageVisibleInOpsInbox);
}
