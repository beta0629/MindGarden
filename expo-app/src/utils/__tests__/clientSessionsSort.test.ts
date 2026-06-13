import type { Schedule } from '@/api/hooks/useSchedules';
import {
  matchesClientSessionsTab,
  sortClientSessions,
} from '../clientSessionsSort';

function makeSchedule(partial: Partial<Schedule>): Schedule {
  return {
    id: partial.id ?? 0,
    consultantId: partial.consultantId ?? 1,
    clientId: partial.clientId ?? 2,
    clientName: partial.clientName ?? '내담자',
    consultantName: partial.consultantName ?? '상담사',
    date: partial.date ?? '2026-06-10',
    startTime: partial.startTime ?? '10:00',
    endTime: partial.endTime ?? '11:00',
    status: partial.status ?? 'COMPLETED',
    consultationType: partial.consultationType ?? '개인상담',
    ...partial,
  } as Schedule;
}

describe('matchesClientSessionsTab', () => {
  it('COMPLETED 탭은 status === COMPLETED 만 통과', () => {
    expect(matchesClientSessionsTab(makeSchedule({ status: 'COMPLETED' }), 'COMPLETED')).toBe(true);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'BOOKED' }), 'COMPLETED')).toBe(false);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'CANCELLED' }), 'COMPLETED')).toBe(false);
  });

  it('SCHEDULED 탭은 COMPLETED·CANCELLED 외 모두 통과', () => {
    expect(matchesClientSessionsTab(makeSchedule({ status: 'BOOKED' }), 'SCHEDULED')).toBe(true);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'CONFIRMED' }), 'SCHEDULED')).toBe(true);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'SCHEDULED' }), 'SCHEDULED')).toBe(true);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'COMPLETED' }), 'SCHEDULED')).toBe(false);
    expect(matchesClientSessionsTab(makeSchedule({ status: 'CANCELLED' }), 'SCHEDULED')).toBe(false);
  });
});

describe('sortClientSessions', () => {
  it('COMPLETED 탭은 최근 상담이 위로 (DESC) — date 우선', () => {
    const items = [
      makeSchedule({ id: 1, date: '2026-05-01', startTime: '10:00', status: 'COMPLETED' }),
      makeSchedule({ id: 2, date: '2026-06-10', startTime: '14:00', status: 'COMPLETED' }),
      makeSchedule({ id: 3, date: '2026-06-01', startTime: '11:00', status: 'COMPLETED' }),
    ];
    const sorted = sortClientSessions(items, 'COMPLETED');
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('COMPLETED 탭은 같은 날짜면 startTime 늦은 것이 위로 (DESC)', () => {
    const items = [
      makeSchedule({ id: 1, date: '2026-06-10', startTime: '09:00', status: 'COMPLETED' }),
      makeSchedule({ id: 2, date: '2026-06-10', startTime: '15:00', status: 'COMPLETED' }),
      makeSchedule({ id: 3, date: '2026-06-10', startTime: '11:00', status: 'COMPLETED' }),
    ];
    const sorted = sortClientSessions(items, 'COMPLETED');
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('SCHEDULED 탭은 가까운 일정이 위로 (ASC)', () => {
    const items = [
      makeSchedule({ id: 1, date: '2026-07-01', startTime: '10:00', status: 'BOOKED' }),
      makeSchedule({ id: 2, date: '2026-06-15', startTime: '14:00', status: 'CONFIRMED' }),
      makeSchedule({ id: 3, date: '2026-06-20', startTime: '11:00', status: 'BOOKED' }),
    ];
    const sorted = sortClientSessions(items, 'SCHEDULED');
    expect(sorted.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('원본 배열을 변형하지 않는다 (immutable)', () => {
    const items = [
      makeSchedule({ id: 1, date: '2026-05-01', status: 'COMPLETED' }),
      makeSchedule({ id: 2, date: '2026-06-10', status: 'COMPLETED' }),
    ];
    const before = items.map((s) => s.id);
    sortClientSessions(items, 'COMPLETED');
    expect(items.map((s) => s.id)).toEqual(before);
  });

  it('startTime 누락 시에도 안정적으로 정렬', () => {
    const items = [
      makeSchedule({
        id: 1,
        date: '2026-06-10',
        startTime: '' as Schedule['startTime'],
        status: 'COMPLETED',
      }),
      makeSchedule({ id: 2, date: '2026-06-10', startTime: '15:00', status: 'COMPLETED' }),
    ];
    const sorted = sortClientSessions(items, 'COMPLETED');
    expect(sorted[0]?.id).toBe(2);
  });
});
