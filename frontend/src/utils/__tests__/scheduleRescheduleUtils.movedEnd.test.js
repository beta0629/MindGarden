/**
 * resolveMovedScheduleEnd — 드래그 이동 시 종료 시각이 기존 길이를 유지해 함께 이동.
 *
 * @author MindGarden
 * @since 2026-09-30
 */

import { buildScheduleDatetimeUpdateBody, resolveMovedScheduleEnd } from '../scheduleRescheduleUtils';

const localDate = (y, m, d, hh, mm) => new Date(y, m - 1, d, hh, mm, 0, 0);

describe('resolveMovedScheduleEnd', () => {
  const originalStart = localDate(2026, 10, 5, 14, 30);
  const originalEnd = localDate(2026, 10, 5, 15, 20);

  test('FullCalendar 가 이동 후 종료를 주면 그대로 사용', () => {
    const newStart = localDate(2026, 10, 6, 10, 0);
    const newEnd = localDate(2026, 10, 6, 10, 50);
    expect(resolveMovedScheduleEnd(newStart, newEnd, originalStart, originalEnd)).toBe(newEnd);
  });

  test('종료가 없으면(event.end=null) 기존 50분 길이를 유지해 계산 → PUT 본문 endTime 도 이동', () => {
    const newStart = localDate(2026, 10, 6, 8, 30);
    const end = resolveMovedScheduleEnd(newStart, null, originalStart, originalEnd);

    expect(end).toEqual(localDate(2026, 10, 6, 9, 20));
    expect(buildScheduleDatetimeUpdateBody(newStart, end)).toEqual({
      date: '2026-10-06',
      startTime: '08:30',
      endTime: '09:20'
    });
  });

  test('기존 시작·종료를 알 수 없으면 입력 종료 그대로', () => {
    const newStart = localDate(2026, 10, 6, 8, 30);
    expect(resolveMovedScheduleEnd(newStart, null, null, originalEnd)).toBeNull();
    expect(resolveMovedScheduleEnd(newStart, undefined, originalEnd, originalStart)).toBeUndefined();
  });
});
