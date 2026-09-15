/**
 * cardBillingProgressDisplay unit tests
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import {
  CARD_BILLING_SCHEDULE_LIMIT,
  buildBillingProgressSentence,
  buildBillingScheduleRowLabel,
  formatBillingScheduleDate,
  resolveBillingScheduleStatusLabel,
  sliceConsultationSchedulesForCard
} from '../cardBillingProgressDisplay';

describe('cardBillingProgressDisplay', () => {
  it('builds progress sentence with total', () => {
    expect(buildBillingProgressSentence({
      usedSessions: 2,
      totalSessions: 10,
      remainingSessions: 8
    })).toBe('누적 진행 2회 / 총 10회 · 잔여 8');
  });

  it('builds progress sentence without total', () => {
    expect(buildBillingProgressSentence({
      usedSessions: 2,
      totalSessions: 0,
      remainingSessions: 0
    })).toBe('누적 진행 2회 · 잔여 0');
  });

  it('formats date and status row for billing scan', () => {
    expect(formatBillingScheduleDate('2026-09-07')).toBe('9/7');
    expect(resolveBillingScheduleStatusLabel('COMPLETED')).toBe('완료');
    expect(buildBillingScheduleRowLabel({
      date: '2026-09-07',
      status: 'COMPLETED',
      sessionSequence: 1
    })).toBe('9/7 · 완료 · 1회차');
  });

  it('omits null sessionSequence without inventing a count', () => {
    expect(buildBillingScheduleRowLabel({
      date: '2026-09-07',
      status: 'BOOKED',
      sessionSequence: null
    })).toBe('9/7 · 예약');
  });

  it('slices long schedule lists and reports hidden count', () => {
    const schedules = Array.from({ length: CARD_BILLING_SCHEDULE_LIMIT + 3 }, (_, i) => ({
      id: i + 1,
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      status: 'COMPLETED'
    }));
    const sliced = sliceConsultationSchedulesForCard(schedules);
    expect(sliced.items).toHaveLength(CARD_BILLING_SCHEDULE_LIMIT);
    expect(sliced.hiddenCount).toBe(3);
    expect(sliced.totalCount).toBe(CARD_BILLING_SCHEDULE_LIMIT + 3);
  });

  it('guards non-array schedules', () => {
    expect(sliceConsultationSchedulesForCard({ bad: true })).toEqual({
      items: [],
      hiddenCount: 0,
      totalCount: 0
    });
  });
});
