/**
 * pendingPaymentAlertUtils 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — IntegratedMatchingSchedule 알림 카드 분기 검증.
 * unpaid soft SSOT: selectPendingPaymentMappings / isUnpaidSoftMappingStatus.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import {
  filterPendingPaymentMappings,
  computePendingPaymentAlert
} from '../pendingPaymentAlertUtils';

describe('filterPendingPaymentMappings', () => {
  test('PENDING_PAYMENT 매핑만 추출', () => {
    const mappings = [
      { id: 1, status: 'ACTIVE' },
      { id: 2, status: 'PENDING_PAYMENT' },
      { id: 3, status: 'DEPOSIT_PENDING' },
      { id: 4, status: 'PENDING_PAYMENT' }
    ];
    const result = filterPendingPaymentMappings(mappings);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual([2, 4]);
  });

  test('status 부재 행은 pending-payment API 스코프로 포함 (SSOT)', () => {
    const mappings = [
      { id: 1, status: 'ACTIVE' },
      { id: 2 },
      { id: 3, status: '' }
    ];
    const result = filterPendingPaymentMappings(mappings);
    expect(result.map((m) => m.id)).toEqual([2, 3]);
  });

  test('null/undefined/비배열 안전', () => {
    expect(filterPendingPaymentMappings(null)).toEqual([]);
    expect(filterPendingPaymentMappings(undefined)).toEqual([]);
    expect(filterPendingPaymentMappings('not-array')).toEqual([]);
    expect(filterPendingPaymentMappings([null, undefined, { status: 'PENDING_PAYMENT' }]))
      .toEqual([{ status: 'PENDING_PAYMENT' }]);
  });
});

describe('computePendingPaymentAlert', () => {
  test('PENDING_PAYMENT 매핑 없음: visible=false, count=0, firstPending=null', () => {
    const result = computePendingPaymentAlert([
      { id: 1, status: 'ACTIVE' },
      { id: 2, status: 'TERMINATED' }
    ]);
    expect(result).toEqual({ visible: false, count: 0, firstPending: null });
  });

  test('PENDING_PAYMENT 3건: visible=true, count=3, firstPending=첫 매핑', () => {
    const first = { id: 10, status: 'PENDING_PAYMENT', packageName: 'p1' };
    const second = { id: 11, status: 'PENDING_PAYMENT', packageName: 'p2' };
    const third = { id: 12, status: 'PENDING_PAYMENT', packageName: 'p3' };
    const result = computePendingPaymentAlert([
      { id: 1, status: 'ACTIVE' },
      first,
      second,
      third
    ]);
    expect(result.visible).toBe(true);
    expect(result.count).toBe(3);
    expect(result.firstPending).toBe(first);
  });

  test('빈 배열: visible=false', () => {
    expect(computePendingPaymentAlert([])).toEqual({
      visible: false,
      count: 0,
      firstPending: null
    });
  });

  test('null 입력 안전', () => {
    expect(computePendingPaymentAlert(null)).toEqual({
      visible: false,
      count: 0,
      firstPending: null
    });
  });

  test('visible 은 unpaid soft 건수만 — ACTIVE 필터와 무관', () => {
    const unpaid = { id: 99, status: 'PENDING_PAYMENT' };
    const result = computePendingPaymentAlert([
      { id: 1, status: 'ACTIVE' },
      unpaid
    ]);
    expect(result.visible).toBe(true);
    expect(result.count).toBe(1);
    expect(result.firstPending).toBe(unpaid);
  });
});
