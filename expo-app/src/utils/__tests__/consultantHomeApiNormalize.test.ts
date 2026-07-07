/**
 * 상담사 홈 API 응답 정규화 단위 테스트 (ROLE-04 / #544+#545)
 */
import { format as formatDate } from 'date-fns';
import {
  normalizeConsultantHomeStats,
  normalizeHighPriorityClients,
  normalizeIncompleteRecords,
  normalizeUpcomingPreparation,
} from '../consultantHomeApiNormalize';

describe('normalizeConsultantHomeStats', () => {
  it('maps ApiResponse-wrapped stats with legacy field aliases', () => {
    const result = normalizeConsultantHomeStats({
      success: true,
      data: {
        todaySchedules: 4,
        newClients: 2,
        completedToday: 1,
        confirmedToday: 3,
      },
    });
    expect(result).toEqual({
      totalToday: 4,
      newClients: 2,
      completedToday: 1,
      bookedToday: 3,
    });
  });

  it('returns zeroed stats for nullish or invalid payload', () => {
    expect(normalizeConsultantHomeStats(null)).toEqual({
      totalToday: 0,
      newClients: 0,
      completedToday: 0,
      bookedToday: 0,
    });
    expect(normalizeConsultantHomeStats({ success: false })).toEqual({
      totalToday: 0,
      newClients: 0,
      completedToday: 0,
      bookedToday: 0,
    });
  });

  it('clamps negative and non-finite values to zero', () => {
    const result = normalizeConsultantHomeStats({
      totalToday: -3,
      newClients: 'bad',
      completedToday: 1.9,
      bookedToday: Number.NaN,
    });
    expect(result).toEqual({
      totalToday: 0,
      newClients: 0,
      completedToday: 1,
      bookedToday: 0,
    });
  });
});

describe('normalizeIncompleteRecords', () => {
  it('extracts records from wrapped payload and falls back client name', () => {
    const result = normalizeIncompleteRecords({
      success: true,
      data: {
        count: 1,
        records: [
          {
            scheduleId: 101,
            clientName: '김내담',
            sessionDate: '2026-07-01T10:00:00',
            sessionNumber: 3,
          },
        ],
      },
    });
    expect(result.count).toBe(1);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      scheduleId: 101,
      clientName: '김내담',
      sessionDate: '2026-07-01',
      sessionNumber: 3,
    });
  });

  it('accepts schedules alias and filters invalid rows', () => {
    const result = normalizeIncompleteRecords({
      schedules: [
        { scheduleId: 0, clientName: 'skip' },
        { scheduleId: 202, clientName: '' },
      ],
    });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.clientName).toBe('내담자');
    expect(result.count).toBe(1);
  });

  it('returns empty state for error-like payload', () => {
    expect(normalizeIncompleteRecords(undefined)).toEqual({ count: 0, records: [] });
  });
});

describe('normalizeHighPriorityClients', () => {
  it('maps clients with default risk level and name fallback', () => {
    const result = normalizeHighPriorityClients({
      success: true,
      data: {
        clients: [
          { clientId: 55, clientName: '이긴급', riskLevel: 'CRITICAL' },
          { clientId: 56, clientName: '', riskLevel: '' },
        ],
      },
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ clientId: 55, riskLevel: 'CRITICAL' });
    expect(result[1]).toMatchObject({ clientId: 56, clientName: '내담자', riskLevel: 'HIGH' });
  });

  it('returns empty array when clients missing', () => {
    expect(normalizeHighPriorityClients(null)).toEqual([]);
    expect(normalizeHighPriorityClients({ clients: [{ clientId: 0 }] })).toEqual([]);
  });
});

describe('normalizeUpcomingPreparation', () => {
  const todayYmd = formatDate(new Date(), 'yyyy-MM-dd');
  const tomorrowYmd = formatDate(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
    'yyyy-MM-dd',
  );

  it('maps legacy consultation object for today', () => {
    const result = normalizeUpcomingPreparation({
      consultation: {
        scheduleId: 301,
        clientName: '박내담',
        sessionDate: todayYmd,
        startTime: '14:30',
        sessionNumber: 2,
        consultationType: '대면',
      },
    });
    expect(result).toMatchObject({
      scheduleId: 301,
      clientName: '박내담',
      sessionDate: todayYmd,
      startTime: '14:30',
      endTime: '15:20',
      isToday: true,
      consultationType: '대면',
    });
  });

  it('picks first valid preparation from list for tomorrow', () => {
    const result = normalizeUpcomingPreparation({
      preparations: [
        { scheduleId: 0, sessionDate: tomorrowYmd, startTime: '09:00' },
        {
          scheduleId: 302,
          clientName: '최내담',
          date: tomorrowYmd,
          sessionTime: '10:00:00',
          sessionNumber: 1,
        },
      ],
    });
    expect(result).toMatchObject({
      scheduleId: 302,
      clientName: '최내담',
      isToday: false,
      startTime: '10:00',
    });
  });

  it('returns null when no today/tomorrow session', () => {
    expect(
      normalizeUpcomingPreparation({
        preparations: [{ scheduleId: 1, sessionDate: '2020-01-01', startTime: '09:00' }],
      }),
    ).toBeNull();
    expect(normalizeUpcomingPreparation({})).toBeNull();
  });
});
