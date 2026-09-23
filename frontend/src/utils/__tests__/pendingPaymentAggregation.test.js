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
  unwrapAdminSchedulesList,
  selectPendingPaymentMappings,
  selectScheduleSoftUnpaidMappingIds,
  countPendingPaymentMappings,
  sumPendingPaymentAmount,
  aggregatePendingPaymentStats,
  mergeUnpaidSoftMappings,
  mergeUnpaidSoftWithScheduleMappingIds,
  applyUnpaidSoftStatusFromSchedules,
  isUnpaidSoftMappingStatus
} from '../pendingPaymentAggregation';
import { MAPPING_STATUS } from '../../constants/mapping';
import { STATUS } from '../../constants/schedule';

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

  test('mergeUnpaidSoftMappings: richer ACTIVE base 가 pending PENDING_PAYMENT status 를 덮어쓰지 않음', () => {
    const base = [{
      id: 279,
      status: 'ACTIVE',
      clientName: 'SoftUnpaidClient',
      remainingSessions: 1,
      consultantName: 'c',
      packageName: 'pkg',
      usedSessions: 0,
      totalSessions: 1,
      paymentTiming: 'SAME_DAY_CARD',
      hasConsultationSchedule: true,
      nextConsultationDate: '2026-09-20',
      createdAt: '2026-09-01',
      consultantId: 1,
      clientId: 2
    }];
    const pending = {
      mappings: [{
        id: 279,
        status: 'PENDING_PAYMENT',
        clientName: 'SoftUnpaidClient',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 1
      }]
    };
    const merged = mergeUnpaidSoftMappings(base, pending);
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe(MAPPING_STATUS.PENDING_PAYMENT);
    expect(merged[0].paymentTiming).toBe('SAME_DAY_CARD');
    expect(merged[0].consultantName).toBe('c');
    expect(selectPendingPaymentMappings(merged).map((m) => m.id)).toEqual([279]);
  });

  test('unwrapAdminSchedulesList: content/schedules/data/list/array', () => {
    expect(unwrapAdminSchedulesList([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapAdminSchedulesList({ content: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(unwrapAdminSchedulesList({ schedules: [{ id: 3 }] })).toEqual([{ id: 3 }]);
    expect(unwrapAdminSchedulesList({ data: { content: [{ id: 4 }] } })).toEqual([{ id: 4 }]);
    expect(unwrapAdminSchedulesList({ list: [{ id: 5 }] })).toEqual([{ id: 5 }]);
    expect(unwrapAdminSchedulesList(null)).toEqual([]);
    expect(unwrapAdminSchedulesList({ foo: true })).toEqual([]);
  });

  test('selectScheduleSoftUnpaidMappingIds: TENTATIVE_PENDING_PAYMENT + mappingId only', () => {
    const ids = selectScheduleSoftUnpaidMappingIds([
      { id: 10, mappingId: 101, status: STATUS.TENTATIVE_PENDING_PAYMENT },
      { id: 11, mappingId: 102, status: 'BOOKED' },
      { id: 12, mappingId: 103, status: 'PENDING' },
      { id: 13, mappingId: 104, status: 'TENTATIVE' },
      { mappingId: 105, status: STATUS.TENTATIVE_PENDING_PAYMENT },
      { id: 106, status: STATUS.TENTATIVE_PENDING_PAYMENT },
      { status: STATUS.TENTATIVE_PENDING_PAYMENT }
    ]);
    expect([...ids].sort()).toEqual(['101', '105', '106']);
  });

  test('applyUnpaidSoftStatusFromSchedules: ACTIVE + soft schedule → PENDING_PAYMENT overlay', () => {
    const merged = [
      { id: 201, status: 'PENDING_PAYMENT', clientName: 'A' },
      { id: 202, status: 'ACTIVE', clientName: 'B', remainingSessions: 1, paymentTiming: 'SAME_DAY_CARD' },
      { id: 203, status: 'ACTIVE', clientName: 'C' }
    ];
    const schedulesRaw = {
      content: [
        { id: 1, mappingId: 202, status: STATUS.TENTATIVE_PENDING_PAYMENT },
        { id: 2, mappingId: 999, status: STATUS.TENTATIVE_PENDING_PAYMENT }
      ]
    };
    const overlaid = applyUnpaidSoftStatusFromSchedules(merged, schedulesRaw);
    expect(overlaid.find((m) => m.id === 201).status).toBe('PENDING_PAYMENT');
    expect(overlaid.find((m) => m.id === 202).status).toBe(MAPPING_STATUS.PENDING_PAYMENT);
    expect(overlaid.find((m) => m.id === 203).status).toBe('ACTIVE');
  });

  test('mergeUnpaidSoftWithScheduleMappingIds: schedule soft ids include existing mapping · no invent · status unpaid', () => {
    const merged = [
      {
        id: 201,
        status: 'PENDING_PAYMENT',
        clientName: 'PendingPeer',
        packagePrice: 100000
      },
      {
        id: 202,
        status: 'ACTIVE',
        clientName: 'SoftScheduleClient',
        packagePrice: 200000,
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 1
      },
      {
        id: 203,
        status: 'PAYMENT_CONFIRMED',
        clientName: 'Confirmed'
      }
    ];
    const schedulesRaw = {
      content: [
        { id: 1, mappingId: 201, status: STATUS.TENTATIVE_PENDING_PAYMENT },
        { id: 2, mappingId: 202, status: STATUS.TENTATIVE_PENDING_PAYMENT },
        { id: 3, mappingId: 999, status: STATUS.TENTATIVE_PENDING_PAYMENT }
      ]
    };
    const card = mergeUnpaidSoftWithScheduleMappingIds(merged, schedulesRaw);
    expect(card.map((m) => m.id).sort()).toEqual([201, 202]);
    expect(card.every((m) => m.status === MAPPING_STATUS.PENDING_PAYMENT)).toBe(true);
    expect(card.find((m) => m.id === 202).clientName).toBe('SoftScheduleClient');
    expect(card.find((m) => m.id === 999)).toBeUndefined();
  });
});
