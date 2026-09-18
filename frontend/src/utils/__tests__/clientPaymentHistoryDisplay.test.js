/**
 * clientPaymentHistoryDisplay SSOT 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import {
  isClientPaymentHistoryRefundedOrCancelled,
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryMethodLabel,
  resolveClientPaymentHistoryStatus,
  resolveClientPaymentHistoryTitle,
  shouldIncludeInClientPaymentHistoryTotals
} from '../clientPaymentHistoryDisplay';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../constants/billing';

describe('clientPaymentHistoryDisplay', () => {
  test('amount: pgAmount 우선 (packagePrice보다 PortOne 실결제)', () => {
    expect(resolveClientPaymentHistoryAmount({
      pgAmount: 100000,
      paymentAmount: 100000,
      lineTotalMinor: 100000,
      packagePrice: 10000
    })).toBe(100000);
  });

  test('amount: paymentAmount 우선 (pg 없을 때)', () => {
    expect(resolveClientPaymentHistoryAmount({
      paymentAmount: 55000,
      lineTotalMinor: 1,
      packagePrice: 2
    })).toBe(55000);
  });

  test('amount: paymentAmount 없으면 lineTotalMinor', () => {
    expect(resolveClientPaymentHistoryAmount({
      paymentAmount: null,
      lineTotalMinor: 44000,
      packagePrice: 2
    })).toBe(44000);
  });

  test('amount: line 없으면 cashDueMinor, 그다음 packagePrice, 없으면 0', () => {
    expect(resolveClientPaymentHistoryAmount({ cashDueMinor: 77000, packagePrice: 1 })).toBe(77000);
    expect(resolveClientPaymentHistoryAmount({ packagePrice: 99000 })).toBe(99000);
    expect(resolveClientPaymentHistoryAmount({})).toBe(0);
  });

  test('title: productTitle → packageName → fallback (Welcome over 무료1회)', () => {
    expect(resolveClientPaymentHistoryTitle(
      { productTitle: 'Welcome 패키지', packageName: '무료1회' },
      '미정'
    )).toBe('Welcome 패키지');
    expect(resolveClientPaymentHistoryTitle(
      { productTitle: '  ', packageName: '무료1회' },
      '미정'
    )).toBe('무료1회');
    expect(resolveClientPaymentHistoryTitle({}, '미정')).toBe('미정');
  });

  test('status: effectivePaymentStatus 우선 (환불 진실)', () => {
    expect(resolveClientPaymentHistoryStatus({
      paymentStatus: 'CONFIRMED',
      effectivePaymentStatus: 'REFUNDED'
    })).toBe('REFUNDED');
    expect(resolveClientPaymentHistoryStatus({ paymentStatus: 'CONFIRMED' })).toBe('CONFIRMED');
  });

  test('totals: 환불·취소는 KPI 제외', () => {
    const refunded = {
      effectivePaymentStatus: 'REFUNDED',
      paymentStatus: 'CONFIRMED',
      pgAmount: 100000,
      packagePrice: 10000,
      totalSessions: 1
    };
    const cancelledOrder = {
      paymentStatus: 'CONFIRMED',
      orderStatus: 'CANCELLED',
      paymentAmount: 50000,
      totalSessions: 2
    };
    const active = {
      paymentStatus: 'CONFIRMED',
      paymentAmount: 30000,
      totalSessions: 3
    };
    expect(isClientPaymentHistoryRefundedOrCancelled(refunded)).toBe(true);
    expect(isClientPaymentHistoryRefundedOrCancelled(cancelledOrder)).toBe(true);
    expect(shouldIncludeInClientPaymentHistoryTotals(refunded)).toBe(false);
    expect(shouldIncludeInClientPaymentHistoryTotals(cancelledOrder)).toBe(false);
    expect(shouldIncludeInClientPaymentHistoryTotals(active)).toBe(true);

    const rows = [refunded, cancelledOrder, active];
    const totalAmount = rows
      .filter(shouldIncludeInClientPaymentHistoryTotals)
      .reduce((sum, m) => sum + resolveClientPaymentHistoryAmount(m), 0);
    const totalSessions = rows
      .filter(shouldIncludeInClientPaymentHistoryTotals)
      .reduce((sum, m) => sum + m.totalSessions, 0);
    expect(totalAmount).toBe(30000);
    expect(totalSessions).toBe(3);
  });

  test('method: CREDIT_CARD + IAMPORT → 카드라벨 · PortOne', () => {
    const label = resolveClientPaymentHistoryMethodLabel(
      'CREDIT_CARD',
      'IAMPORT',
      '미지정'
    );
    expect(label).toContain(MAPPING_PAYMENT_METHOD_LABELS.CREDIT_CARD);
    expect(label).toContain('PortOne');
  });

  test('method: legacy CARD 는 CREDIT_CARD 동일 라벨 (별칭)', () => {
    expect(resolveClientPaymentHistoryMethodLabel('CARD', null, '미지정'))
      .toBe(MAPPING_PAYMENT_METHOD_LABELS.CARD);
    expect(MAPPING_PAYMENT_METHOD_LABELS.CARD)
      .toBe(MAPPING_PAYMENT_METHOD_LABELS.CREDIT_CARD);
  });

  test('method: 알 수 없는 코드는 미지정 (발명 금지)', () => {
    expect(resolveClientPaymentHistoryMethodLabel('FOO_PAY', 'IAMPORT', '미지정'))
      .toBe('미지정');
    expect(resolveClientPaymentHistoryMethodLabel('', null, '미지정')).toBe('미지정');
  });
});
