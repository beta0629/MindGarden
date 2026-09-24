/**
 * mappingRefundActionUtils — 환불 CTA 분기 단위 테스트
 */

import {
  MAPPING_REFUND_ACTION,
  isAdditionalPackagePendingMerge,
  resolveMappingRefundAction
} from '../mappingRefundActionUtils';

describe('resolveMappingRefundAction', () => {
  it('routes pending-payment additional package (0-session orphan income) to cancel with income void', () => {
    const mapping = {
      id: 91,
      status: 'PENDING_PAYMENT',
      totalSessions: 0,
      remainingSessions: 0,
      additionalPackagePendingMerge: true
    };
    expect(resolveMappingRefundAction(mapping)).toBe(MAPPING_REFUND_ACTION.CANCEL_PENDING_ADDITIONAL);
  });

  it.each(['PAYMENT_CONFIRMED', 'DEPOSIT_PENDING'])(
    'routes %s unmerged additional package to income void instead of blocking',
    (status) => {
      const mapping = { id: 92, status, remainingSessions: 0, additionalPackagePendingMerge: true };
      expect(resolveMappingRefundAction(mapping)).toBe(MAPPING_REFUND_ACTION.VOID_ADDITIONAL);
    }
  );

  it('keeps the not-active block for regular pending-payment mapping', () => {
    const mapping = { id: 93, status: 'PENDING_PAYMENT', remainingSessions: 0 };
    expect(resolveMappingRefundAction(mapping)).toBe(MAPPING_REFUND_ACTION.BLOCKED_NOT_ACTIVE);
  });

  it('keeps the no-remaining block for active mapping without sessions', () => {
    const mapping = { id: 94, status: 'ACTIVE', remainingSessions: 0 };
    expect(resolveMappingRefundAction(mapping)).toBe(MAPPING_REFUND_ACTION.BLOCKED_NO_REMAINING);
  });

  it('opens partial refund for active mapping with remaining sessions', () => {
    const mapping = { id: 95, status: 'ACTIVE', remainingSessions: 3 };
    expect(resolveMappingRefundAction(mapping)).toBe(MAPPING_REFUND_ACTION.PARTIAL_REFUND);
  });

  it('ignores a non-boolean flag and treats null mapping as blocked', () => {
    expect(isAdditionalPackagePendingMerge({ additionalPackagePendingMerge: 'true' })).toBe(false);
    expect(resolveMappingRefundAction(null)).toBe(MAPPING_REFUND_ACTION.BLOCKED_NOT_ACTIVE);
  });
});
