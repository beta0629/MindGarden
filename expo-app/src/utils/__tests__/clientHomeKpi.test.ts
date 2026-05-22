import {
  countThisMonthSchedules,
  normalizeScheduleListPayload,
} from '../clientHomeKpi';

describe('normalizeScheduleListPayload', () => {
  it('extracts schedules from ApiResponse-wrapped payload', () => {
    const payload = {
      success: true,
      data: {
        schedules: [{ date: '2026-05-10', status: 'CONFIRMED' }],
        totalCount: 1,
      },
    };
    expect(normalizeScheduleListPayload(payload)).toEqual([
      { date: '2026-05-10', status: 'CONFIRMED' },
    ]);
  });

  it('extracts schedules from direct schedules object', () => {
    const payload = {
      schedules: [{ date: '2026-05-15' }],
      totalCount: 1,
    };
    expect(normalizeScheduleListPayload(payload)).toHaveLength(1);
  });
});

describe('countThisMonthSchedules', () => {
  const ref = new Date('2026-05-22T12:00:00');

  it('counts schedules in the same year and month', () => {
    const schedules = [
      { date: '2026-05-01', status: 'CONFIRMED' },
      { date: '2026-05-20', status: 'COMPLETED' },
      { date: '2026-04-30', status: 'CONFIRMED' },
      { date: '2026-06-01', status: 'CONFIRMED' },
    ];
    expect(countThisMonthSchedules(schedules, ref)).toBe(2);
  });

  it('includes cancelled schedules (web SSOT — no status filter)', () => {
    const schedules = [
      { date: '2026-05-10', status: 'CANCELLED' },
      { date: '2026-05-12', status: 'CONFIRMED' },
    ];
    expect(countThisMonthSchedules(schedules, ref)).toBe(2);
  });

  it('ignores invalid date strings', () => {
    const schedules = [
      { date: '2026-05-10' },
      { date: 'not-a-date' },
      { date: undefined },
    ];
    expect(countThisMonthSchedules(schedules, ref)).toBe(1);
  });
});
