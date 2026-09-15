/**
 * cardBillingProgressDisplay unit tests
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import {
  CARD_BILLING_SCHEDULE_LIMIT,
  buildBillingProgressSentence,
  buildBillingScheduleGlanceSummary,
  buildBillingScheduleRowLabel,
  buildInstitutionLinkCumulativeSentence,
  formatBillingScheduleDate,
  formatBillingScheduleTime,
  groupConsultationSchedulesByMonth,
  resolveBillingScheduleStatusLabel,
  resolveConsultationSchedulesForCard,
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

  it('builds progress sentence without total (used only)', () => {
    expect(buildBillingProgressSentence({
      usedSessions: 2,
      totalSessions: 0,
      remainingSessions: 0
    })).toBe('누적 진행 2회');
  });

  it('builds institution-link cumulative from mapping COMPLETED (not client lifetime)', () => {
    expect(buildInstitutionLinkCumulativeSentence(3)).toBe('이 연동 누적 3회');
    expect(buildInstitutionLinkCumulativeSentence({
      consultationSchedules: [
        { id: 1, date: '2026-09-07', status: 'COMPLETED' },
        { id: 2, date: '2026-09-14', status: 'BOOKED' }
      ],
      clientCompletedConsultationCount: 99,
      clientConsultationSchedules: [
        { id: 9, date: '2026-08-31', status: 'COMPLETED' }
      ]
    })).toBe('이 연동 누적 1회');
  });

  it('IL card schedules ignore clientConsultationSchedules (sibling/SAME_DAY mix)', () => {
    const schedules = resolveConsultationSchedulesForCard({
      consultationSchedules: [
        { id: 378, date: '2026-09-07', status: 'COMPLETED' }
      ],
      clientConsultationSchedules: [
        { id: 373, date: '2026-08-31', status: 'COMPLETED' },
        { id: 378, date: '2026-09-07', status: 'COMPLETED' },
        { id: 436, date: '2026-09-14', status: 'CONFIRMED' }
      ]
    }, true);
    expect(schedules).toHaveLength(1);
    expect(schedules[0].id).toBe(378);
    expect(buildBillingScheduleGlanceSummary(schedules)).toBe('9월 9/7');
  });

  it('completed glance updates when mapping enrich gains a new COMPLETED schedule', () => {
    const before = [
      { id: 378, date: '2026-09-07', status: 'COMPLETED' }
    ];
    const after = [
      { id: 378, date: '2026-09-07', status: 'COMPLETED' },
      { id: 440, date: '2026-09-21', status: 'COMPLETED' }
    ];
    expect(buildInstitutionLinkCumulativeSentence({ consultationSchedules: before }))
      .toBe('이 연동 누적 1회');
    expect(buildBillingScheduleGlanceSummary(before)).toBe('9월 9/7');
    expect(buildInstitutionLinkCumulativeSentence({ consultationSchedules: after }))
      .toBe('이 연동 누적 2회');
    expect(buildBillingScheduleGlanceSummary(after)).toBe('9월 9/7 · 9/21');
  });

  it('formats date, time and status row for billing scan', () => {
    expect(formatBillingScheduleDate('2026-09-07')).toBe('9/7');
    expect(formatBillingScheduleTime('14:00:00')).toBe('14:00');
    expect(resolveBillingScheduleStatusLabel('COMPLETED')).toBe('완료');
    expect(buildBillingScheduleRowLabel({
      date: '2026-09-07',
      startTime: '14:00:00',
      status: 'COMPLETED',
      sessionSequence: 1
    })).toBe('9/7 · 14:00 · 완료 · 1회차');
  });

  it('builds monthly glance summary for at-a-glance dates', () => {
    const schedules = [
      { id: 1, date: '2026-08-31', status: 'COMPLETED' },
      { id: 2, date: '2026-09-07', status: 'COMPLETED' },
      { id: 3, date: '2026-09-14', status: 'BOOKED' }
    ];
    expect(groupConsultationSchedulesByMonth(schedules)).toEqual([
      { monthKey: '2026-08', monthLabel: '8월', dateLabels: ['8/31'] },
      { monthKey: '2026-09', monthLabel: '9월', dateLabels: ['9/7', '9/14'] }
    ]);
    expect(buildBillingScheduleGlanceSummary(schedules)).toBe(
      '8월 8/31 · 9월 9/7 · 9/14'
    );
  });

  it('omits null sessionSequence without inventing a count', () => {
    expect(buildBillingScheduleRowLabel({
      date: '2026-09-07',
      startTime: '10:30',
      status: 'BOOKED',
      sessionSequence: null
    })).toBe('9/7 · 10:30 · 예약');
  });

  it('slices long schedule lists keeping recent items', () => {
    const schedules = Array.from({ length: CARD_BILLING_SCHEDULE_LIMIT + 3 }, (_, i) => ({
      id: i + 1,
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      status: 'COMPLETED'
    }));
    const sliced = sliceConsultationSchedulesForCard(schedules);
    expect(sliced.items).toHaveLength(CARD_BILLING_SCHEDULE_LIMIT);
    expect(sliced.hiddenCount).toBe(3);
    expect(sliced.totalCount).toBe(CARD_BILLING_SCHEDULE_LIMIT + 3);
    expect(sliced.items[0].id).toBe(4);
    expect(sliced.items[sliced.items.length - 1].id).toBe(CARD_BILLING_SCHEDULE_LIMIT + 3);
  });

  it('guards non-array schedules', () => {
    expect(sliceConsultationSchedulesForCard({ bad: true })).toEqual({
      items: [],
      hiddenCount: 0,
      totalCount: 0
    });
  });
});
