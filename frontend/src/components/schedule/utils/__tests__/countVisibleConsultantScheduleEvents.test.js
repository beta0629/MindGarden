/**
 * 범례 건수는 칩과 같은 일정이다.
 * 완료-only 월 API가 아니라 호출측 range(표시 월) 안의 모든 상태를 센다.
 * 가시 그리드 spill 을 넣으면 과대(예: 93·7), 표시 월만 쓰면 기대값(예: 80·4)에 맞는다.
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

/** 표시 월 80/4 + spill 13/3 → 그리드면 93/7, 월 범위면 80/4 */
const buildOctoberVsSpillEvents = () => {
  const events = [];
  for (let i = 0; i < 80; i += 1) {
    events.push(event(3, `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, i % 2 === 0 ? 'COMPLETED' : 'BOOKED'));
  }
  for (let i = 0; i < 4; i += 1) {
    events.push(event(22, `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, 'CONFIRMED'));
  }
  for (let i = 0; i < 13; i += 1) {
    events.push(event(3, '2026-09-29', 'COMPLETED'));
  }
  for (let i = 0; i < 3; i += 1) {
    events.push(event(22, '2026-11-01', 'BOOKED'));
  }
  return events;
};

describe('countVisibleConsultantScheduleEvents', () => {
  test('표시 월 range 의 모든 상태를 세고, 완료만 세지 않는다', () => {
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
      startDate: '2026-10-01',
      endDate: '2026-10-31'
    });
    expect(counts.get(3)).toBe(2);
    expect(counts.get(22)).toBe(1);
  });

  test('표시 월 범위는 spill 을 빼고, 가시 그리드 범위는 spill 을 포함한다(80/4 vs 93/7)', () => {
    const events = buildOctoberVsSpillEvents();
    const monthRange = { startDate: '2026-10-01', endDate: '2026-10-31' };
    const gridRange = { startDate: '2026-09-27', endDate: '2026-11-07' };

    const monthCounts = countVisibleConsultantScheduleEvents(events, consultants, monthRange);
    expect(monthCounts.get(3)).toBe(80);
    expect(monthCounts.get(22)).toBe(4);

    const gridCounts = countVisibleConsultantScheduleEvents(events, consultants, gridRange);
    expect(gridCounts.get(3)).toBe(93);
    expect(gridCounts.get(22)).toBe(7);
  });

  test('범위 밖 일정·공휴일·휴무는 칩 건수에 넣지 않는다', () => {
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
      startDate: '2026-10-01',
      endDate: '2026-10-31'
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
      { startDate: '2026-10-01', endDate: '2026-10-31' }
    );
    expect(counts.has(3)).toBe(false);
    expect(counts.get(22)).toBe(0);
    expect(counts.get(99)).toBe(1);
  });
});
