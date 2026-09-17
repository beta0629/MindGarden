/**
 * clientPaymentHistoryDisplay SSOT 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import {
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryMethodLabel,
  resolveClientPaymentHistoryTitle
} from '../clientPaymentHistoryDisplay';
import { MAPPING_PAYMENT_METHOD_LABELS } from '../../constants/billing';

describe('clientPaymentHistoryDisplay', () => {
  test('amount: paymentAmount 우선', () => {
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

  test('amount: 둘 다 없으면 packagePrice, 없으면 0', () => {
    expect(resolveClientPaymentHistoryAmount({ packagePrice: 99000 })).toBe(99000);
    expect(resolveClientPaymentHistoryAmount({})).toBe(0);
  });

  test('title: productTitle → packageName → fallback', () => {
    expect(resolveClientPaymentHistoryTitle(
      { productTitle: 'Shop 단회', packageName: '무료1회' },
      '미정'
    )).toBe('Shop 단회');
    expect(resolveClientPaymentHistoryTitle(
      { productTitle: '  ', packageName: '무료1회' },
      '미정'
    )).toBe('무료1회');
    expect(resolveClientPaymentHistoryTitle({}, '미정')).toBe('미정');
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
