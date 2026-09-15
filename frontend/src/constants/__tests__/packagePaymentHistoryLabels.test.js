/**
 * 패키지 결제 이력 타입 라벨 — 최가을형 타임라인
 *
 * 사실(PROD client 78): mapping 242(8/31) 배정 먼저 → schedule 373 → mapping 245(9/1) IL.
 * 245를 「최초 배정」으로 보이면 안 됨.
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

describe('packagePaymentHistory type labels (최가을형)', () => {
  const choiItems = [
    {
      type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
      mappingId: 245,
      createdAt: '2026-09-01T19:25:12',
      paymentDate: '2026-09-01T19:25:12',
      packageName: '단회기 90,000원'
    },
    {
      type: PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING,
      mappingId: 242,
      createdAt: '2026-08-31T13:04:12',
      paymentDate: '2026-08-31T13:04:12',
      packageName: '단회기 90,000원'
    }
  ];

  it('earliest INITIAL_MAPPING is 242 (8/31), not 245', () => {
    expect(resolveEarliestInitialMappingId(choiItems)).toBe(242);
  });

  it('245 is labeled 배정, not 최초 배정', () => {
    const item245 = choiItems[0];
    expect(resolvePackagePaymentHistoryTypeLabel(item245, choiItems))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.MAPPING_ASSIGNMENT);
    expect(resolvePackagePaymentHistoryTypeLabel(item245, choiItems))
      .not.toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING);
  });

  it('242 keeps 최초 배정', () => {
    const item242 = choiItems[1];
    expect(resolvePackagePaymentHistoryTypeLabel(item242, choiItems))
      .toBe(PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS.INITIAL_MAPPING);
  });
});
