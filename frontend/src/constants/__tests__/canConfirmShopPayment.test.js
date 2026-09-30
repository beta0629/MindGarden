/**
 * canConfirmShopPayment / isShopOrderAwaitingPayment — Path B EXPIRED 복구 경계
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import {
  canConfirmShopPayment,
  isShopOrderAwaitingPayment
} from '../clientShopConstants';

describe('canConfirmShopPayment', () => {
  const base = {
    paymentId: 'pay-1',
    cashDueMinor: 2000
  };

  test('PENDING_PAYMENT + paymentId + cashDue → true', () => {
    expect(
      canConfirmShopPayment({ ...base, status: 'PENDING_PAYMENT' })
    ).toBe(true);
  });

  test('EXPIRED + paymentId + cashDue → true (verify-only recovery)', () => {
    expect(canConfirmShopPayment({ ...base, status: 'EXPIRED' })).toBe(true);
  });

  test('EXPIRED without paymentId → false', () => {
    expect(
      canConfirmShopPayment({
        status: 'EXPIRED',
        paymentId: '  ',
        cashDueMinor: 2000
      })
    ).toBe(false);
  });

  test('CREATED is not confirm CTA (prepare path)', () => {
    expect(canConfirmShopPayment({ ...base, status: 'CREATED' })).toBe(false);
  });

  test('cashDueMinor <= 0 → false', () => {
    expect(
      canConfirmShopPayment({
        status: 'PENDING_PAYMENT',
        paymentId: 'pay-1',
        cashDueMinor: 0
      })
    ).toBe(false);
  });
});

describe('isShopOrderAwaitingPayment (prepare/PortOne)', () => {
  test('CREATED|PENDING_PAYMENT only — EXPIRED excluded', () => {
    expect(
      isShopOrderAwaitingPayment({
        status: 'CREATED',
        cashDueMinor: 2000
      })
    ).toBe(true);
    expect(
      isShopOrderAwaitingPayment({
        status: 'PENDING_PAYMENT',
        cashDueMinor: 2000
      })
    ).toBe(true);
    expect(
      isShopOrderAwaitingPayment({
        status: 'EXPIRED',
        cashDueMinor: 2000
      })
    ).toBe(false);
  });
});
