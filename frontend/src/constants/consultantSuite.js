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
  RECORD_CARD: 'consultant-suite-record-card',
  LOADING: 'consultant-suite-loading'
};

export const CONSULTANT_SUITE_BUTTON_VARIANT = {
  PRIMARY: 'primary',
  GHOST: 'outline'
};

export const CONSULTANT_CLIENT_STATUS_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED'
};

export const CONSULTANT_MESSAGE_TYPE_FILTER = {
  ALL: 'ALL',
  GENERAL: 'GENERAL',
  FOLLOW_UP: 'FOLLOW_UP',
  HOMEWORK: 'HOMEWORK',
  REMINDER: 'REMINDER',
  URGENT: 'URGENT'
};

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
