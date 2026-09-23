/**
 * 기관연동 Side Peek — 초기 결제 완료·월말 기관 청구 안내·월 청구 요약 SSOT
 *
 * 결제 패턴은 기관·매핑마다 다름(단일 강제 템플릿 금지 · client 특례 금지).
 * - SEPARATE: 초기 별도 결제(FT) → 「초기 결제 완료」·월 요약에서 초기 제외
 * - MONTHLY_COMBINED: 월 합산 → 해당 월 상담(초기 포함) 단가×횟수
 * - ALL_COMBINED: 전체 합산 → 월 전체 한 번에(계약 monthly 우선, 없으면 단가×횟수)
 * 월간 금액: packagePrice×횟수 또는 계약 institutionLinkMonthlyAmount.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

/** 월말 N일 전부터 기관 청구 안내 배너 표시 (당일·말일 포함) */
export const MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS = 5;

/**
 * 기관연동 청구 합산 모드 (확장 포인트).
 * API/계약에 {@code institutionLinkBillingComposition} 또는
 * legacy {@code institutionLinkInitialBillingMode} 가 오면 우선.
 * 없으면 재무 FT·계약 monthly 금액으로 추론(추측 하드코딩 금지).
 */
export const INSTITUTION_LINK_BILLING_COMPOSITION = Object.freeze({
  SEPARATE: 'SEPARATE',
  MONTHLY_COMBINED: 'MONTHLY_COMBINED',
  ALL_COMBINED: 'ALL_COMBINED'
});

/** @deprecated alias — prefer INSTITUTION_LINK_BILLING_COMPOSITION */
export const INSTITUTION_LINK_INITIAL_BILLING_MODE = Object.freeze({
  SEPARATE: INSTITUTION_LINK_BILLING_COMPOSITION.SEPARATE,
  COMBINED: INSTITUTION_LINK_BILLING_COMPOSITION.MONTHLY_COMBINED
});

/** mapping 확장 필드명 — 명시 모드(없으면 데이터 추론) */
export const INSTITUTION_LINK_BILLING_COMPOSITION_FIELD =
  'institutionLinkBillingComposition';

/** @deprecated alias — SEPARATE|COMBINED 만 쓰던 구 필드 */
export const INSTITUTION_LINK_INITIAL_BILLING_MODE_FIELD =
  'institutionLinkInitialBillingMode';

/** Side Peek / 카드 초기 결제 완료 배지 test id */
export const INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID = 'side-peek-initial-payment-completed';

/** 월말 기관 청구 안내 배너 test id */
export const MONTH_END_INSTITUTION_BILLING_REMINDER_TEST_ID =
  'side-peek-month-end-institution-billing-reminder';

/** 카드용 초기 결제 완료 배지 test id */
export const CARD_INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID =
  'mapping-card-initial-payment-completed';

/** Side Peek 월 청구 요약 섹션 */
export const SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID = 'side-peek-monthly-billing-summary';
export const SIDE_PEEK_MONTHLY_BILLING_DATES_TEST_ID = 'side-peek-monthly-billing-dates';
export const SIDE_PEEK_MONTHLY_BILLING_COUNT_TEST_ID = 'side-peek-monthly-billing-count';
export const SIDE_PEEK_MONTHLY_BILLING_AMOUNT_TEST_ID = 'side-peek-monthly-billing-amount';
export const SIDE_PEEK_MONTHLY_BILLING_CHARGE_HINT_TEST_ID =
  'side-peek-monthly-billing-charge-hint';

/** @deprecated alias — prefer SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID */
export const MONTH_BILLING_SUMMARY_TEST_ID = SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID;
