/**
 * 결제 최소·최대 금액 SSOT (FE).
 * BE {@code PaymentConstants.MIN_PAYMENT_AMOUNT} 와 동기 — 하드코딩 산재 금지.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

/** PG·카드 결제 최소 금액 (원). BE PaymentConstants.MIN_PAYMENT_AMOUNT = 1000 */
export const MIN_PAYMENT_AMOUNT = 1000;

/** BE PaymentConstants.MAX_PAYMENT_AMOUNT 와 동기 */
export const MAX_PAYMENT_AMOUNT = 10000000;

/** i18n 기본 locale (금액 표시) */
export const PAYMENT_AMOUNT_DISPLAY_LOCALE = 'ko-KR';

/**
 * 금액을 locale 천단위 구분으로 표시한다.
 *
 * @param {number} amount
 * @param {string} [locale=PAYMENT_AMOUNT_DISPLAY_LOCALE]
 * @returns {string}
 */
export const formatPaymentAmountForDisplay = (
  amount,
  locale = PAYMENT_AMOUNT_DISPLAY_LOCALE
) => Number(amount).toLocaleString(locale);

/**
 * 0원 초과·최소 미만이면 true (전액 포인트 0원은 false).
 *
 * @param {number|string|null|undefined} amount
 * @returns {boolean}
 */
export const isBelowMinPaymentAmount = (amount) => {
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 && n < MIN_PAYMENT_AMOUNT;
};

/**
 * 카드(PG) 현금 청구액이 최소 미만인지.
 *
 * @param {number|string|null|undefined} cashDueMinor
 * @returns {boolean}
 */
export const isBelowMinCardCashDue = (cashDueMinor) => isBelowMinPaymentAmount(cashDueMinor);
