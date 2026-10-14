/**
 * 범례 건수는 칩과 같은 일정이다.
 * 완료-only 월 API(예: 10월 완료 44/0)가 아니라
 * 보이는 그리드의 모든 상태(예: 84/7, 앞달 넘침 포함)를 센다.
 */

import { CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY, CALENDAR_EXTENDED_TYPE_VACATION } from '../../../../constants/schedule';
import {
  countVisibleConsultantScheduleEvents,
  isCountableConsultantScheduleEvent
} from '../countVisibleConsultantScheduleEvents';

const consultants = [
  { id: 3, name: 'DevConsultant-000003', isActive: true },
  { id: 22, name: 'DevConsultant-000022', isActive: true }
];

const event = (consultantId, date, status) => ({
  start: `${date}T10:00:00`,
  extendedProps: { consultantId, status, clientId: 1 }
});

describe('countVisibleConsultantScheduleEvents', () => {
  test('보이는 달 그리드의 모든 상태를 세고, 완료만 세지 않는다', () => {
    const events = [
      event(3, '2026-09-28', 'COMPLETED'),
      event(3, '2026-10-01', 'COMPLETED'),
      event(3, '2026-10-02', 'BOOKED'),
      event(22, '2026-09-29', 'COMPLETED'),
      event(22, '2026-10-06', 'CONFIRMED')
    ];
    const octoberCompletedOnly = { 3: 1, 22: 0 };
    expect(octoberCompletedOnly[3]).toBe(1);
    expect(octoberCompletedOnly[22]).toBe(0);

    const counts = countVisibleConsultantScheduleEvents(events, consultants, {
      startDate: '2026-09-28',
      endDate: '2026-11-01'
    });
    expect(counts.get(3)).toBe(3);
    expect(counts.get(22)).toBe(2);
  });

  test('그리드 밖 일정·공휴일·휴무는 칩 건수에 넣지 않는다', () => {
    const events = [
      event(3, '2026-09-01', 'COMPLETED'),
      event(3, '2026-10-14', 'BOOKED'),
      {
        display: 'background',
        start: '2026-10-03',
        extendedProps: {
          type: CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
          consultantId: 3
        }
      },
      {
        start: '2026-10-05T00:00:00',
        extendedProps: {
          type: CALENDAR_EXTENDED_TYPE_VACATION,
          consultantId: 22,
          status: 'VACATION'
        }
      }
    ];
    const counts = countVisibleConsultantScheduleEvents(events, consultants, {
      startDate: '2026-09-28',
      endDate: '2026-11-01'
    });
    expect(counts.get(3)).toBe(1);
    expect(counts.get(22)).toBe(0);
    expect(isCountableConsultantScheduleEvent(events[2])).toBe(false);
    expect(isCountableConsultantScheduleEvent(events[3])).toBe(false);
  });

  test('비활성 상담사는 0 목록에 넣지 않고, 없는 상담사 칩은 그 id 로 센다', () => {
    const counts = countVisibleConsultantScheduleEvents(
      [event(99, '2026-10-02', 'BOOKED')],
      [{ id: 3, isActive: false }, { id: 22, isActive: true }],
      { startDate: '2026-09-28', endDate: '2026-11-01' }
    );
    expect(counts.has(3)).toBe(false);
    expect(counts.get(22)).toBe(0);
    expect(counts.get(99)).toBe(1);
  });
});
