/**
 * pendingPaymentAggregation SSOT 락
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  PENDING_PAYMENT_KPI_LABEL,
  unwrapPendingPaymentMappings,
  selectPendingPaymentMappings,
  countPendingPaymentMappings,
  sumPendingPaymentAmount,
  aggregatePendingPaymentStats
} from '../pendingPaymentAggregation';

describe('pendingPaymentAggregation', () => {
  test('KPI 라벨은 사이드바「결제 대기」와 동일', () => {
    expect(PENDING_PAYMENT_KPI_LABEL).toBe('결제 대기');
  });

  test('unwrapPendingPaymentMappings: { mappings } / nested data', () => {
    expect(unwrapPendingPaymentMappings([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapPendingPaymentMappings({ mappings: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(unwrapPendingPaymentMappings({
      data: { mappings: [{ id: 3 }] }
    })).toEqual([{ id: 3 }]);
    expect(unwrapPendingPaymentMappings(null)).toBeNull();
    expect(unwrapPendingPaymentMappings({ data: { notList: true } })).toBeNull();
  });

  test('select/count: PENDING_PAYMENT만 · PAYMENT_CONFIRMED·회기추가 제외', () => {
    const list = [
      { id: 1, status: 'PENDING_PAYMENT', packagePrice: 100000 },
      { id: 2, status: 'PAYMENT_CONFIRMED', packagePrice: 200000 },
      { id: 3, status: 'PENDING', packagePrice: 50000 },
      { id: 4, packagePrice: 30000 }
    ];
    expect(selectPendingPaymentMappings(list)).toEqual([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 4 })
    ]);
    expect(countPendingPaymentMappings(list)).toBe(2);
  });

  test('sumPendingPaymentAmount: packagePrice ?? paymentAmount, 이질 status 무시', () => {
    const list = [
      { status: 'PENDING_PAYMENT', packagePrice: 100000 },
      { status: 'PENDING_PAYMENT', paymentAmount: 50000 },
      { status: 'PENDING_PAYMENT', packagePrice: 10000, paymentAmount: 999 },
      { status: 'PAYMENT_CONFIRMED', packagePrice: 999999 },
      {
        id: 'SESSION_EXTENSION-1',
        sourceType: 'SESSION_EXTENSION',
        status: 'PENDING',
        packagePrice: 888888
      }
    ];
    expect(sumPendingPaymentAmount(list)).toBe(160000);
  });

  test('aggregatePendingPaymentStats: pending-payment API 형태', () => {
    const stats = aggregatePendingPaymentStats({
      mappings: [
        { status: 'PENDING_PAYMENT', packagePrice: 120000 },
        { status: 'PAYMENT_CONFIRMED', packagePrice: 1 }
      ],
      count: 2
    });
    expect(stats.count).toBe(1);
    expect(stats.totalAmount).toBe(120000);
  });

  test('빈 목록 → count 0 · amount 0', () => {
    expect(aggregatePendingPaymentStats([])).toEqual({
      mappings: [],
      count: 0,
      totalAmount: 0
    });
    expect(aggregatePendingPaymentStats({ mappings: [] })).toEqual({
      mappings: [],
      count: 0,
      totalAmount: 0
    });
  });
});
