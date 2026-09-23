/**
 * resolveCardTodoPill — PENDING_PAYMENT 필 라벨 (SAME_DAY vs ADVANCE)
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import {
  ASSIGNMENT_PAYMENT_TIMING,
  ASSIGNMENT_PAYMENT_TIMING_LABELS
} from '../../../../../../constants/clientEngagementType';
import { PENDING_PAYMENT_KPI_LABEL } from '../../../../../../utils/pendingPaymentAggregation';
import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_ADVANCE,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../../../constants/integratedScheduleSidebarFilterConstants';
import { CARD_TODO_LABEL, resolveCardTodoPill } from '../resolveCardTodoPill';

describe('resolveCardTodoPill', () => {
  it('CARD_TODO_LABEL.PENDING_PAYMENT 는 KPI SSOT와 동일', () => {
    expect(CARD_TODO_LABEL.PENDING_PAYMENT).toBe(PENDING_PAYMENT_KPI_LABEL);
    expect(CARD_TODO_LABEL.PENDING_PAYMENT).toBe('결제 대기');
  });

  it('PENDING_PAYMENT + SAME_DAY_CARD → 가예약 (타이밍 SSOT)', () => {
    const pill = resolveCardTodoPill({
      status: MAPPING_STATUS_PENDING_PAYMENT,
      paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD
    });
    const expected =
      ASSIGNMENT_PAYMENT_TIMING_LABELS[ASSIGNMENT_PAYMENT_TIMING.SAME_DAY_CARD];
    expect(expected).toBe('가예약');
    expect(pill).toEqual({ label: expected, title: expected });
  });

  it('PENDING_PAYMENT + ADVANCE → 결제 대기 (KPI SSOT)', () => {
    const pill = resolveCardTodoPill({
      status: MAPPING_STATUS_PENDING_PAYMENT,
      paymentTiming: PAYMENT_TIMING_ADVANCE
    });
    expect(pill).toEqual({
      label: PENDING_PAYMENT_KPI_LABEL,
      title: PENDING_PAYMENT_KPI_LABEL
    });
  });

  it('PENDING_PAYMENT + paymentTiming 누락 → 결제 대기', () => {
    const pill = resolveCardTodoPill({
      status: MAPPING_STATUS_PENDING_PAYMENT
    });
    expect(pill).toEqual({
      label: PENDING_PAYMENT_KPI_LABEL,
      title: PENDING_PAYMENT_KPI_LABEL
    });
  });

  it('ACTIVE 등 PENDING_PAYMENT 아니면 null (desync/연장 없을 때)', () => {
    expect(resolveCardTodoPill({ status: 'ACTIVE', remainingSessions: 1 })).toBeNull();
  });

  it('mapping 없으면 null', () => {
    expect(resolveCardTodoPill(null)).toBeNull();
    expect(resolveCardTodoPill(undefined)).toBeNull();
  });
});
