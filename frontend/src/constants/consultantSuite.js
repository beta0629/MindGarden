/**
 * 상담사 스위트(/consultant/*) 공유 상수 — 클래스명·테스트 id·필터 키
 * SSOT: /consultant/dashboard (mg-v2) · 흰 카드 + slate 선택
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

export const CONSULTANT_SUITE_NS = 'consultantSuite';

export const CONSULTANT_SUITE_CLASS = {
  ROOT: 'consultant-suite',
  CONTAINER: 'consultant-suite__container',
  BODY: 'consultant-suite__body',
  SUMMARY: 'consultant-suite__summary',
  PANEL: 'consultant-suite__panel',
  CHIPS: 'consultant-suite-chips',
  CHIP: 'consultant-suite-chip',
  CHIP_SELECTED: 'consultant-suite-chip--selected',
  NOTICE: 'consultant-suite-notice',
  STATUS: 'consultant-suite-status',
  MONEY: 'consultant-suite-money',
  MONEY_STRONG: 'consultant-suite-money--strong',
  MONEY_OUT: 'consultant-suite-money--out',
  MONEY_MUTED: 'consultant-suite-money--muted',
  EMPTY: 'consultant-suite-empty',
  CAPTION: 'consultant-suite-caption',
  TOOLBAR: 'consultant-suite-toolbar',
  SEARCH: 'consultant-suite-search',
  CARD_GRID: 'consultant-suite-card-grid',
  CARD_LIST: 'consultant-suite-card-list',
  CARD: 'consultant-suite-card',
  CARD_ROW: 'consultant-suite-card--row',
  CARD_INTERACTIVE: 'consultant-suite-card--interactive',
  CARD_HEAD: 'consultant-suite-card__head',
  CARD_HEAD_TEXT: 'consultant-suite-card__head-text',
  CARD_TITLE: 'consultant-suite-card__title',
  CARD_TIME: 'consultant-suite-card__time',
  CARD_BODY: 'consultant-suite-card__body',
  CARD_META: 'consultant-suite-card__meta',
  CARD_FOOT: 'consultant-suite-card__foot',
  PILL: 'consultant-suite-pill',
  AVATAR: 'consultant-suite-avatar',
  ICON_BTN: 'consultant-suite-icon-btn',
  RECORD_CARD: 'consultant-suite-record-card',
  LOADING: 'consultant-suite-loading',
  PAGINATION: 'consultant-suite-pagination'
};

/** 상담사 스위트 목록 기본 page size (관리자 목록과 동일 20) */
export const CONSULTANT_SUITE_PAGE_SIZE = 20;

export const CONSULTANT_SUITE_BUTTON_VARIANT = {
  PRIMARY: 'primary',
  GHOST: 'outline'
};

/** 매핑 status 필터 — API mapping.status 그대로 (시뮬레이션·client.status 금지) */
export const CONSULTANT_CLIENT_STATUS_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  SESSIONS_EXHAUSTED: 'SESSIONS_EXHAUSTED',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
  TERMINATED: 'TERMINATED'
};

export const CONSULTANT_MESSAGE_TYPE_FILTER = {
  ALL: 'ALL',
  GENERAL: 'GENERAL',
  FOLLOW_UP: 'FOLLOW_UP',
  HOMEWORK: 'HOMEWORK',
  REMINDER: 'REMINDER',
  URGENT: 'URGENT',
  PAYMENT_COMPLETION: 'PAYMENT_COMPLETION'
};

/**
 * 메시지 유형 정규화 — 알 수 없으면 GENERAL.
 * PAYMENT_COMPLETION 은 GENERAL 로 폴스루하지 않는다.
 *
 * @param {string} [messageType]
 * @returns {string}
 */
export function resolveConsultantMessageType(messageType) {
  const normalized = typeof messageType === 'string'
    ? messageType.trim().toUpperCase()
    : '';
  if (!normalized) {
    return CONSULTANT_MESSAGE_TYPE_FILTER.GENERAL;
  }
  const known = Object.values(CONSULTANT_MESSAGE_TYPE_FILTER)
    .filter((key) => key !== CONSULTANT_MESSAGE_TYPE_FILTER.ALL);
  return known.includes(normalized) ? normalized : CONSULTANT_MESSAGE_TYPE_FILTER.GENERAL;
}

/** 금액 부호 — 공제는 수학 마이너스(U+2212), 수당은 「+」 */
export const CONSULTANT_MONEY_SIGN = {
  NONE: 'none',
  PLUS: 'plus',
  MINUS: 'minus'
};

export const CONSULTANT_MONEY_SIGN_GLYPH = {
  [CONSULTANT_MONEY_SIGN.PLUS]: '+',
  [CONSULTANT_MONEY_SIGN.MINUS]: '\u2212'
};

export const CONSULTANT_SCHEDULE_STATUS_FILTER = {
  ALL: 'all',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const CONSULTANT_SALARY_FILTER = {
  ALL: 'all',
  PENDING: 'pending',
  PAID: 'paid'
};

/** 상담일지 조회 화면 표면 — admin(기존) / consultant(/consultant/consultation-logs 스위트 셸) */
export const CONSULTATION_LOG_VIEW_SURFACE = {
  ADMIN: 'admin',
  CONSULTANT: 'consultant'
};

export const CONSULTANT_SUITE_TEST_ID = {
  SCHEDULE_PAGE: 'consultant-schedule-page',
  SCHEDULE_EMPTY: 'consultant-schedule-empty',
  SALARY_PAGE: 'consultant-salary-page',
  SALARY_CARD: 'consultant-salary-month-card',
  AVAILABILITY_PAGE: 'consultant-availability-page',
  CLIENTS_PAGE: 'consultant-clients-page',
  MESSAGES_PAGE: 'consultant-messages-page',
  MESSAGE_ROW: 'consultant-message-row',
  RECORDS_PAGE: 'consultant-records-page',
  RECORD_CARD: 'consultant-record-card',
  LOGS_PAGE: 'consultant-logs-page'
};
