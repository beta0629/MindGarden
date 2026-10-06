/**
 * 당일 빈 슬롯 과거 판정 — 리드타임 버퍼 없음.
 * 로컬 Date 비교(운영 KST 가정). UTC/ISO 파싱으로 시각을 밀지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  DATE_FORMATS,
  DATE_YMD_PART_COUNT,
  DATE_YMD_SEPARATOR,
  MONTH_INDEX_OFFSET,
  TIME_SLOT_HM_PART_COUNT,
  TIME_SLOT_HM_SEPARATOR
} from '../constants/schedule';

/**
 * Date 또는 YYYY-MM-DD를 로컬 달력일(00:00:00)로 변환한다.
 *
 * @param {Date|string|null|undefined} value 선택일
 * @returns {Date|null}
 */
function toLocalCalendarDay(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value !== 'string') {
    return null;
  }
  const ymd = value.trim().slice(0, DATE_FORMATS.API.length);
  const parts = ymd.split(DATE_YMD_SEPARATOR);
  if (parts.length < DATE_YMD_PART_COUNT) {
    return null;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - MONTH_INDEX_OFFSET, day);
}

/**
 * HH:mm 슬롯 시각을 시·분으로 파싱한다.
 *
 * @param {string} slotTimeString HH:mm
 * @returns {{ hour: number, minute: number }|null}
 */
function parseSlotHourMinute(slotTimeString) {
  if (typeof slotTimeString !== 'string') {
    return null;
  }
  const parts = slotTimeString.split(TIME_SLOT_HM_SEPARATOR);
  if (parts.length < TIME_SLOT_HM_PART_COUNT) {
    return null;
  }
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return { hour, minute };
}

/**
 * 선택일 기준 슬롯이 이미 지났는지 판정한다.
 * 어제 이전 → true, 오늘이면 slotStart < now, 미래일 → false.
 * 정각(slotStart === now)은 열린다.
 *
 * @param {string} slotTimeString HH:mm
 * @param {Date|string} selectedDate 선택일 (Date 또는 YYYY-MM-DD)
 * @param {Date} [now] 기준 시각. 생략 시 현재 로컬 시각
 * @returns {boolean} 지난 슬롯이면 true
 */
export function isSameDayTimeSlotInPast(slotTimeString, selectedDate, now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    return true;
  }
  const selectedDay = toLocalCalendarDay(selectedDate);
  if (!selectedDay) {
    return true;
  }
  const today = toLocalCalendarDay(now);
  if (!today) {
    return true;
  }
  if (selectedDay.getTime() < today.getTime()) {
    return true;
  }
  if (selectedDay.getTime() > today.getTime()) {
    return false;
  }
  const hm = parseSlotHourMinute(slotTimeString);
  if (!hm) {
    return true;
  }
  const slotStart = new Date(
    selectedDay.getFullYear(),
    selectedDay.getMonth(),
    selectedDay.getDate(),
    hm.hour,
    hm.minute,
    0,
    0
  );
  return slotStart < now;
}
