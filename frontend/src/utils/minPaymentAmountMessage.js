/**
 * 최소 결제 금액 안내 카피 헬퍼 (i18n + 상수).
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  MIN_PAYMENT_AMOUNT,
  formatPaymentAmountForDisplay
} from '../constants/paymentAmountConstants';

/** i18n key — common:payment.minCardAmount */
export const PAYMENT_MIN_CARD_AMOUNT_I18N_KEY = 'payment.minCardAmount';

/** i18n key — common:payment.minCardAmountTitle */
export const PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY = 'payment.minCardAmountTitle';

/**
 * 카드 결제 최소 금액 본문 (i18n 미사용 폴백).
 *
 * @param {number} [minAmount=MIN_PAYMENT_AMOUNT]
 * @returns {string}
 */
export const buildMinCardPaymentAmountMessage = (minAmount = MIN_PAYMENT_AMOUNT) =>
  `카드 결제는 ${formatPaymentAmountForDisplay(minAmount)}원 이상이어야 합니다`;

/**
 * t 함수로 최소 카드 결제 카피를 만든다.
 *
 * @param {function} t i18n t
 * @param {number} [minAmount=MIN_PAYMENT_AMOUNT]
 * @returns {string}
 */
export const translateMinCardPaymentAmountMessage = (
  t,
  minAmount = MIN_PAYMENT_AMOUNT
) => {
  const amount = formatPaymentAmountForDisplay(minAmount);
  if (typeof t !== 'function') {
    return buildMinCardPaymentAmountMessage(minAmount);
  }
  return t(PAYMENT_MIN_CARD_AMOUNT_I18N_KEY, {
    amount,
    defaultValue: buildMinCardPaymentAmountMessage(minAmount)
  });
};
