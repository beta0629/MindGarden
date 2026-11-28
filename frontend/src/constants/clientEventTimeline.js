/**
 * 내담자 관리용 타임라인(client_event) FE SSOT.
 * BE enum ClientEventType 코드와 동일. UI 카피는 「매칭/매핑」금지 → 「배정」.
 *
 * @author MindGarden
 * @since 2026-11-27
 */

/** BE ClientEventType 코드 */
export const CLIENT_EVENT_TYPE = Object.freeze({
  TEMP_RESERVATION_CREATED: 'TEMP_RESERVATION_CREATED',
  TEMP_RESERVATION_CONFIRMED: 'TEMP_RESERVATION_CONFIRMED',
  SCHEDULE_CREATED: 'SCHEDULE_CREATED',
  SCHEDULE_UPDATED: 'SCHEDULE_UPDATED',
  SCHEDULE_CANCELLED: 'SCHEDULE_CANCELLED',
  MAPPING_CREATED: 'MAPPING_CREATED',
  MAPPING_STATUS_CHANGED: 'MAPPING_STATUS_CHANGED',
  MAPPING_REASSIGNED: 'MAPPING_REASSIGNED',
  SESSION_DEDUCTED: 'SESSION_DEDUCTED',
  SESSION_RESTORED: 'SESSION_RESTORED',
  SESSION_ADJUSTED: 'SESSION_ADJUSTED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED'
});

/** enum → 한글 라벨 (UI SSOT) */
export const CLIENT_EVENT_TYPE_LABELS = Object.freeze({
  [CLIENT_EVENT_TYPE.TEMP_RESERVATION_CREATED]: '임시 예약 생성',
  [CLIENT_EVENT_TYPE.TEMP_RESERVATION_CONFIRMED]: '임시 예약 확정',
  [CLIENT_EVENT_TYPE.SCHEDULE_CREATED]: '일정 생성',
  [CLIENT_EVENT_TYPE.SCHEDULE_UPDATED]: '일정 변경',
  [CLIENT_EVENT_TYPE.SCHEDULE_CANCELLED]: '일정 취소',
  [CLIENT_EVENT_TYPE.MAPPING_CREATED]: '배정 생성',
  [CLIENT_EVENT_TYPE.MAPPING_STATUS_CHANGED]: '배정 상태 변경',
  [CLIENT_EVENT_TYPE.MAPPING_REASSIGNED]: '재배정',
  [CLIENT_EVENT_TYPE.SESSION_DEDUCTED]: '회기 차감',
  [CLIENT_EVENT_TYPE.SESSION_RESTORED]: '회기 복원',
  [CLIENT_EVENT_TYPE.SESSION_ADJUSTED]: '회기 조정',
  [CLIENT_EVENT_TYPE.PAYMENT_COMPLETED]: '결제 완료',
  [CLIENT_EVENT_TYPE.PAYMENT_CANCELLED]: '결제 취소',
  [CLIENT_EVENT_TYPE.PAYMENT_REFUNDED]: '결제 환불'
});

export const CLIENT_EVENT_TIMELINE_UI = Object.freeze({
  TAB_HISTORY: '이력',
  SECTION_TITLE: '이력',
  EMPTY: '아직 기록된 이력이 없어요',
  LOADING: '이력을 불러오는 중...',
  ERROR: '이력을 불러오지 못했습니다.',
  FORBIDDEN: '이력을 볼 권한이 없습니다.',
  LOAD_MORE: '더보기',
  RETRY: '다시 시도',
  ARIA_LIST: '내담자 이력 타임라인'
});

/** Side Peek UX: 최신 이벤트 우선 */
export const CLIENT_EVENT_TIMELINE_SORT = Object.freeze({
  ASC: 'asc',
  DESC: 'desc'
});

export const CLIENT_EVENT_TIMELINE_DEFAULT_PAGE_SIZE = 20;

/**
 * 이벤트 타입 코드 → 한글 라벨.
 *
 * @param {string|null|undefined} code
 * @returns {string}
 */
export const resolveClientEventTypeLabel = (code) => {
  if (code == null) {
    return '';
  }
  const key = String(code).trim();
  if (!key) {
    return '';
  }
  if (Object.prototype.hasOwnProperty.call(CLIENT_EVENT_TYPE_LABELS, key)) {
    return CLIENT_EVENT_TYPE_LABELS[key];
  }
  return key;
};
