/**
 * 기관연동 Side Peek — 초기 결제 완료·월말 기관 청구 안내 SSOT
 *
 * 금액(선납 10만 등) 강제 표시 금지. 재무 FT 존재 여부만으로 완료 배지.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

/** 월말 N일 전부터 기관 청구 안내 배너 표시 (당일·말일 포함) */
export const MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS = 5;

/** Side Peek / 카드 초기 결제 완료 배지 test id */
export const INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID = 'side-peek-initial-payment-completed';

/** 월말 기관 청구 안내 배너 test id */
export const MONTH_END_INSTITUTION_BILLING_REMINDER_TEST_ID =
  'side-peek-month-end-institution-billing-reminder';

/** 카드용 초기 결제 완료 배지 test id */
export const CARD_INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID =
  'mapping-card-initial-payment-completed';

/** 월 청구 요약 섹션 test id */
export const SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID = 'side-peek-monthly-billing-summary';
export const SIDE_PEEK_MONTHLY_BILLING_AMOUNT_TEST_ID = 'side-peek-monthly-billing-amount';
export const SIDE_PEEK_MONTHLY_BILLING_COUNT_TEST_ID = 'side-peek-monthly-billing-count';
export const SIDE_PEEK_MONTHLY_BILLING_DATES_TEST_ID = 'side-peek-monthly-billing-dates';
export const SIDE_PEEK_MONTHLY_BILLING_CHARGE_HINT_TEST_ID =
  'side-peek-monthly-billing-charge-hint';
