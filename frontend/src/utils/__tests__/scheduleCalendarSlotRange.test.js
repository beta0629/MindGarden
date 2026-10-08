import { resolveCalendarSlotTimeRange } from '../scheduleCalendarSlotRange';
import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_SLOT_TIME_RANGE,
  STATUS
} from '../../constants/schedule';

const timed = (start, end, extendedProps = {}) => ({ start, end, extendedProps });

describe('resolveCalendarSlotTimeRange', () => {
  test('기본 범위는 공통 상수(업무 종료 20시대 포함) — 20:00 슬롯이 범위 안', () => {
    const range = resolveCalendarSlotTimeRange([]);
    expect(range.slotMinTime).toBe(`${CALENDAR_SLOT_TIME_RANGE.MIN}:00`);
    expect(range.slotMaxTime).toBe(`${CALENDAR_SLOT_TIME_RANGE.MAX}:00`);
    expect(range.slotMaxTime > '20:00:00').toBe(true);
  });

  test('20:00 시작 일정(id 479 유형)은 기본 범위로 보인다', () => {
    const range = resolveCalendarSlotTimeRange([timed('2026-10-07T20:00:00', '2026-10-07T20:50:00')]);
    expect(range.slotMaxTime >= '21:00:00').toBe(true);
  });

  test('기본보다 늦은 종료·이른 시작 일정이 있으면 정시 단위로 넓힌다', () => {
    const range = resolveCalendarSlotTimeRange([
      timed('2026-10-07T21:30:00', '2026-10-07T22:20:00'),
      timed('2026-10-08T07:10:00', '2026-10-08T08:00:00')
    ]);
    expect(range).toEqual({ slotMinTime: '07:00:00', slotMaxTime: '23:00:00' });
  });

  test('자정을 넘기는 일정은 24:00 까지, 종료 없는 일정도 시작 칸이 보이게', () => {
    expect(resolveCalendarSlotTimeRange([timed('2026-10-07T23:00:00', '2026-10-08T00:30:00')]).slotMaxTime)
      .toBe('24:00:00');
    expect(resolveCalendarSlotTimeRange([timed('2026-10-07T22:00:00', undefined)]).slotMaxTime)
      .toBe('23:00:00');
  });

  test('Date 객체 시각도 같은 규칙', () => {
    const range = resolveCalendarSlotTimeRange([
      timed(new Date(2026, 9, 7, 21, 0), new Date(2026, 9, 7, 21, 50))
    ]);
    expect(range.slotMaxTime).toBe('22:00:00');
  });

  test('휴가·공휴일·종일·배경 이벤트는 범위를 넓히지 않는다', () => {
    const range = resolveCalendarSlotTimeRange([
      timed('2026-10-07T00:00:00', '2026-10-07T23:59:00', { status: STATUS.VACATION }),
      timed('2026-10-07T00:00:00', '2026-10-07T23:59:00', { type: CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY }),
      { start: '2026-10-07T00:00:00', end: '2026-10-07T23:00:00', allDay: true },
      { start: '2026-10-07T00:00:00', end: '2026-10-07T23:00:00', display: 'background' }
    ]);
    expect(range).toEqual(resolveCalendarSlotTimeRange([]));
  });
});
