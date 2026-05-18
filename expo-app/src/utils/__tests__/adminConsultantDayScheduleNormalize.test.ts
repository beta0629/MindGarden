import {
  formatConsultantDayScheduleTimeRange,
  normalizeConsultantDayScheduleRow,
  normalizeConsultantDaySchedules,
} from '../adminConsultantDayScheduleNormalize';

describe('adminConsultantDayScheduleNormalize', () => {
  it('normalizes API rows with time range, client name, and status label', () => {
    const rows = [
      {
        id: 10,
        startTime: '14:00:00',
        endTime: '14:50:00',
        clientId: 2,
        clientName: '이내담',
        status: 'BOOKED',
      },
      {
        id: 11,
        startTime: '09:30',
        endTime: '10:20',
        clientId: 3,
        statusCode: 'CONFIRMED',
      },
    ];
    expect(formatConsultantDayScheduleTimeRange('14:00', '14:50')).toBe('14:00–14:50');
    expect(normalizeConsultantDayScheduleRow(rows[0])).toMatchObject({
      id: 10,
      timeRangeLabel: '14:00–14:50',
      clientName: '이내담',
      statusLabel: '예정',
    });
    const list = normalizeConsultantDaySchedules(rows);
    expect(list).toHaveLength(2);
    expect(list[0]?.startTime).toBe('09:30');
    expect(list[1]?.timeRangeLabel).toBe('14:00–14:50');
    expect(list[1]?.statusLabel).toBe('예정');
  });
});
