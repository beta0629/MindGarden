/**
 * 패키지 결제 이력 타입 라벨 — INITIAL_MAPPING 다중 시 일반 규칙
 *
 * 규칙: 가장 이른 createdAt 의 INITIAL_MAPPING 만 「최초 배정」, 이후는 「배정」.
 * 특정 mappingId / clientId 분기 없음.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import {
  PACKAGE_PAYMENT_HISTORY_TYPE,
  PACKAGE_PAYMENT_HISTORY_UI,
  resolveEarliestInitialMappingId,
  resolvePackagePaymentHistoryTypeLabel
} from '../packagePaymentHistory';

describe('packagePaymentHistory type labels', () => {
  const timelineItems = [
    {
      type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
      mappingId: 9002,
      createdAt: '2026-09-01T19:25:12',
      paymentDate: '2026-09-01T19:25:12',
      packageName: '단회기 90,000원'
    },
    {
      type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
      mappingId: 9001,
      createdAt: '2026-08-31T13:04:12',
      paymentDate: '2026-08-31T13:04:12',
      packageName: '단회기 90,000원'
    }
  ];

  it('earliest INITIAL_MAPPING is by createdAt, not list order', () => {
    expect(resolveEarliestInitialMappingId(timelineItems)).toBe(9001);
  });

  it('later INITIAL_MAPPING is labeled 배정, not 최초 배정', () => {
    const later = timelineItems[0];
    expect(resolvePackagePaymentHistoryTypeLabel(later, timelineItems))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.MAPPING_ASSIGNMENT);
    expect(resolvePackagePaymentHistoryTypeLabel(later, timelineItems))
      .not.toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING);
  });

  it('earliest INITIAL_MAPPING keeps 최초 배정', () => {
    const earliest = timelineItems[1];
    expect(resolvePackagePaymentHistoryTypeLabel(earliest, timelineItems))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING);
  });

  it('tie on createdAt prefers smaller mappingId without hardcoding ids', () => {
    const tied = [
      {
        type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
        mappingId: 12,
        createdAt: '2026-08-31T10:00:00'
      },
      {
        type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
        mappingId: 11,
        createdAt: '2026-08-31T10:00:00'
      }
    ];
    expect(resolveEarliestInitialMappingId(tied)).toBe(11);
    expect(resolvePackagePaymentHistoryTypeLabel(tied[0], tied))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.MAPPING_ASSIGNMENT);
    expect(resolvePackagePaymentHistoryTypeLabel(tied[1], tied))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING);
  });
});
