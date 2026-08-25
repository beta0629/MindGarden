/**
 * scheduleRescheduleUtils — DnD 잠금(완료·취소·과거) 단위 테스트
 */
import {
  SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE,
  SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE,
  SCHEDULE_DRAG_LOCKED_PAST_MESSAGE,
  getScheduleCalendarDragLockedMessage,
  isPastDateOnly,
  isScheduleCalendarDragLocked,
  isScheduleSlotInPast,
  isScheduleStatusSlotLocked
} from '../scheduleRescheduleUtils';

describe('scheduleRescheduleUtils drag lock', () => {
  describe('isPastDateOnly', () => {
    test('어제 → true', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      d.setHours(12, 0, 0, 0);
      expect(isPastDateOnly(d)).toBe(true);
    });

    test('오늘 → false', () => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      expect(isPastDateOnly(d)).toBe(false);
    });
  });

  describe('isScheduleSlotInPast', () => {
    test('어제 슬롯 → true', () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(11, 0, 0, 0);
      expect(isScheduleSlotInPast(start, end)).toBe(true);
    });

    test('당일·종료 시각이 지남 → true', () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(0, 0, 1, 0);
      if (end.getTime() >= Date.now()) {
        end.setTime(Date.now() - 60_000);
      }
      expect(isScheduleSlotInPast(start, end)).toBe(true);
    });

    test('내일 슬롯 → false', () => {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(11, 0, 0, 0);
      expect(isScheduleSlotInPast(start, end)).toBe(false);
    });
  });

  describe('isScheduleStatusSlotLocked', () => {
    test('COMPLETED / CANCELLED → true', () => {
      expect(isScheduleStatusSlotLocked('COMPLETED')).toBe(true);
      expect(isScheduleStatusSlotLocked('CANCELLED')).toBe(true);
      expect(isScheduleStatusSlotLocked('완료됨')).toBe(true);
      expect(isScheduleStatusSlotLocked('취소됨')).toBe(true);
    });

    test('CONFIRMED → false', () => {
      expect(isScheduleStatusSlotLocked('CONFIRMED')).toBe(false);
    });
  });

  describe('isScheduleCalendarDragLocked / getScheduleCalendarDragLockedMessage', () => {
    test('COMPLETED 우선 메시지', () => {
      const start = new Date();
      start.setDate(start.getDate() + 2);
      expect(isScheduleCalendarDragLocked({ status: 'COMPLETED', start, end: start })).toBe(true);
      expect(getScheduleCalendarDragLockedMessage({ status: 'COMPLETED', start, end: start }))
        .toBe(SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE);
    });

    test('CANCELLED 메시지', () => {
      const start = new Date();
      start.setDate(start.getDate() + 2);
      expect(getScheduleCalendarDragLockedMessage({ status: 'CANCELLED', start, end: start }))
        .toBe(SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE);
    });

    test('과거 BOOKED 메시지', () => {
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(11, 0, 0, 0);
      expect(isScheduleCalendarDragLocked({ status: 'BOOKED', start, end })).toBe(true);
      expect(getScheduleCalendarDragLockedMessage({ status: 'BOOKED', start, end }))
        .toBe(SCHEDULE_DRAG_LOCKED_PAST_MESSAGE);
    });

    test('미래 CONFIRMED → 잠금 없음', () => {
      const start = new Date();
      start.setDate(start.getDate() + 3);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(11, 0, 0, 0);
      expect(isScheduleCalendarDragLocked({ status: 'CONFIRMED', start, end })).toBe(false);
      expect(getScheduleCalendarDragLockedMessage({ status: 'CONFIRMED', start, end })).toBeNull();
    });
  });
});
