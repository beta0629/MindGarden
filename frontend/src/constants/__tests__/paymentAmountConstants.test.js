/**
 * paymentAmountConstants / minPaymentAmountMessage 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  MIN_PAYMENT_AMOUNT,
  formatPaymentAmountForDisplay,
  isBelowMinPaymentAmount,
  isBelowMinCardCashDue
} from '../paymentAmountConstants';
import {
  buildMinCardPaymentAmountMessage,
  translateMinCardPaymentAmountMessage
} from '../../utils/minPaymentAmountMessage';

describe('paymentAmountConstants', () => {
  test('MIN_PAYMENT_AMOUNT is 1000 (BE PaymentConstants sync)', () => {
    expect(MIN_PAYMENT_AMOUNT).toBe(1000);
  });

  test('formatPaymentAmountForDisplay formats with thousands separator', () => {
    expect(formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT)).toBe('1,000');
  });

  test('isBelowMinPaymentAmount: 0 is not below (points-only)', () => {
    expect(isBelowMinPaymentAmount(0)).toBe(false);
  });

  test('isBelowMinPaymentAmount: 999 is below', () => {
    expect(isBelowMinPaymentAmount(999)).toBe(true);
  });

  test('isBelowMinPaymentAmount: 1000 is ok', () => {
    expect(isBelowMinPaymentAmount(1000)).toBe(false);
  });

  test('isBelowMinCardCashDue mirrors isBelowMinPaymentAmount', () => {
    expect(isBelowMinCardCashDue(500)).toBe(true);
    expect(isBelowMinCardCashDue(1000)).toBe(false);
  });
});

describe('minPaymentAmountMessage', () => {
  test('buildMinCardPaymentAmountMessage includes formatted amount', () => {
    expect(buildMinCardPaymentAmountMessage()).toBe(
      '카드 결제는 1,000원 이상이어야 합니다'
    );
  });

  test('translateMinCardPaymentAmountMessage uses t interpolation', () => {
    const t = (key, opts) =>
      `카드 결제는 ${opts.amount}원 이상이어야 합니다`;
    expect(translateMinCardPaymentAmountMessage(t)).toBe(
      '카드 결제는 1,000원 이상이어야 합니다'
    );
  });
});
