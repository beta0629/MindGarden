/**
 * pendingPaymentAggregation SSOT 락
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  PENDING_PAYMENT_KPI_LABEL,
  PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS,
  unwrapPendingPaymentMappings,
  unwrapDirtyPendingPaymentMappings,
  selectPendingPaymentMappings,
  countPendingPaymentMappings,
  sumPendingPaymentAmount,
  aggregatePendingPaymentStats,
  mergeUnpaidSoftMappings,
  isUnpaidSoftMappingStatus
} from '../pendingPaymentAggregation';
import { MAPPING_STATUS } from '../../constants/mapping';

describe('pendingPaymentAggregation', () => {
  test('KPI 라벨은 사이드바「결제 대기」와 동일', () => {
    expect(PENDING_PAYMENT_KPI_LABEL).toBe('결제 대기');
  });

  test('dirty 기본 ageHours SSOT', () => {
    expect(PENDING_PAYMENT_DIRTY_DEFAULT_AGE_HOURS).toBe(24);
  });

  test('isUnpaidSoftMappingStatus: PENDING_PAYMENT only', () => {
    expect(isUnpaidSoftMappingStatus(MAPPING_STATUS.PENDING_PAYMENT)).toBe(true);
    expect(isUnpaidSoftMappingStatus('PAYMENT_CONFIRMED')).toBe(false);
    expect(isUnpaidSoftMappingStatus('PENDING')).toBe(false);
    expect(isUnpaidSoftMappingStatus('TENTATIVE')).toBe(false);
    expect(isUnpaidSoftMappingStatus(null)).toBe(false);
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

  test('unwrapDirtyPendingPaymentMappings: { items } / ApiResponse + mappingId→id', () => {
    expect(unwrapDirtyPendingPaymentMappings(null)).toBeNull();
    expect(unwrapDirtyPendingPaymentMappings({ mappings: [{ id: 1 }] })).toBeNull();
    const fromItems = unwrapDirtyPendingPaymentMappings({
      items: [
        {
          mappingId: 9001,
          clientName: '김아영',
          status: 'PENDING_PAYMENT',
          packagePrice: 100000
        }
      ]
    });
    expect(fromItems).toEqual([
      expect.objectContaining({
        id: 9001,
        mappingId: 9001,
        clientName: '김아영',
        status: 'PENDING_PAYMENT'
      })
    ]);
    const fromApi = unwrapDirtyPendingPaymentMappings({
      data: {
        items: [{ mappingId: 42, status: 'PENDING_PAYMENT' }]
      }
    });
    expect(fromApi[0].id).toBe(42);
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

  test('mergeUnpaidSoftMappings: page-20 base 밖 PENDING 이 pending-payment 로 포함', () => {
    const base = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      status: 'ACTIVE',
      clientName: `Client${i + 1}`
    }));
    const pendingOutsidePage = {
      mappings: [
        {
          id: 9001,
          status: 'PENDING_PAYMENT',
          clientName: '김아영',
          packagePrice: 150000,
          remainingSessions: 0
        }
      ]
    };
    const merged = mergeUnpaidSoftMappings(base, pendingOutsidePage);
    expect(merged).toHaveLength(21);
    expect(merged.find((m) => m.id === 9001)).toEqual(
      expect.objectContaining({
        status: 'PENDING_PAYMENT',
        clientName: '김아영',
        remainingSessions: 0
      })
    );
    expect(countPendingPaymentMappings(merged)).toBe(1);
  });

  test('mergeUnpaidSoftMappings: dirty-only mappingId 병합 · id 보강 · 발명 없음', () => {
    const base = [{ id: 1, status: 'ACTIVE' }];
    const dirty = {
      items: [
        {
          mappingId: 777,
          status: 'PENDING_PAYMENT',
          clientName: 'DirtyOnly',
          packagePrice: 50000
        }
      ]
    };
    const merged = mergeUnpaidSoftMappings(base, null, dirty);
    expect(merged.find((m) => String(m.id) === '777')).toEqual(
      expect.objectContaining({
        id: 777,
        mappingId: 777,
        status: 'PENDING_PAYMENT',
        clientName: 'DirtyOnly'
      })
    );
    expect(merged.filter((m) => m.id == null)).toHaveLength(0);
  });

  test('mergeUnpaidSoftMappings: dedupe by id · richer row wins', () => {
    const base = [
      {
        id: 10,
        status: 'PENDING_PAYMENT',
        clientName: 'Sparse'
      }
    ];
    const pending = {
      mappings: [
        {
          id: 10,
          status: 'PENDING_PAYMENT',
          clientName: 'Sparse',
          packagePrice: 200000,
          remainingSessions: 0,
          paymentTiming: 'SAME_DAY_CARD'
        }
      ]
    };
    const merged = mergeUnpaidSoftMappings(base, pending);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        id: 10,
        packagePrice: 200000,
        paymentTiming: 'SAME_DAY_CARD'
      })
    );
  });

  test('mergeUnpaidSoftMappings: PAYMENT_CONFIRMED 등 pendingLists 비-PENDING 제외', () => {
    const base = [{ id: 1, status: 'ACTIVE' }];
    const pending = {
      mappings: [
        { id: 2, status: 'PENDING_PAYMENT' },
        { id: 3, status: 'PAYMENT_CONFIRMED' }
      ]
    };
    const merged = mergeUnpaidSoftMappings(base, pending);
    expect(merged.map((m) => m.id).sort()).toEqual([1, 2]);
  });
});
