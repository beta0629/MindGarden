/**
 * isSameDayTimeSlotInPast — 당일 슬롯 과거 판정 (리드타임 버퍼 없음)
 */

import { isSameDayTimeSlotInPast } from '../isSameDayTimeSlotInPast';

const YEAR = 2026;
const MONTH_SEPTEMBER = 8;
const DAY = 14;
const SLOT_13_00 = '13:00';
const SLOT_09_00 = '09:00';
const SLOT_23_00 = '23:00';

function localAt(hour, minute, second = 0, ms = 0, day = DAY) {
  return new Date(YEAR, MONTH_SEPTEMBER, day, hour, minute, second, ms);
}

function localDay(day) {
  return new Date(YEAR, MONTH_SEPTEMBER, day);
}

describe('isSameDayTimeSlotInPast', () => {
  test('now=12:30:00, slot 13:00, today → false (열림)', () => {
    const now = localAt(12, 30, 0, 0);
    expect(isSameDayTimeSlotInPast(SLOT_13_00, localDay(DAY), now)).toBe(false);
  });

  test('now=12:30:01, slot 13:00, today → false (열림, 버퍼 없음)', () => {
    const now = localAt(12, 30, 1, 0);
    expect(isSameDayTimeSlotInPast(SLOT_13_00, localDay(DAY), now)).toBe(false);
  });

  test('now=13:00:01, slot 13:00, today → true (닫힘)', () => {
    const now = localAt(13, 0, 1, 0);
    expect(isSameDayTimeSlotInPast(SLOT_13_00, localDay(DAY), now)).toBe(true);
  });

  test('now=13:00:00, slot 13:00, today → false (정각 열림, <)', () => {
    const now = localAt(13, 0, 0, 0);
    expect(isSameDayTimeSlotInPast(SLOT_13_00, localDay(DAY), now)).toBe(false);
  });

  test('yesterday + any slot → true', () => {
    const now = localAt(12, 30, 0, 0);
    const yesterday = localDay(DAY - 1);
    expect(isSameDayTimeSlotInPast(SLOT_13_00, yesterday, now)).toBe(true);
    expect(isSameDayTimeSlotInPast(SLOT_09_00, yesterday, now)).toBe(true);
    expect(isSameDayTimeSlotInPast(SLOT_23_00, yesterday, now)).toBe(true);
  });

  test('tomorrow + 09:00 even if now 23:00 → false', () => {
    const now = localAt(23, 0, 0, 0);
    const tomorrow = localDay(DAY + 1);
    expect(isSameDayTimeSlotInPast(SLOT_09_00, tomorrow, now)).toBe(false);
  });

  test('YYYY-MM-DD 문자열 선택일도 로컬 달력일로 비교한다', () => {
    const now = localAt(12, 30, 0, 0);
    const todayYmd = `${YEAR}-09-${DAY}`;
    expect(isSameDayTimeSlotInPast(SLOT_13_00, todayYmd, now)).toBe(false);
  });
});
