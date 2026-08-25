/**
 * 스케줄 재예약(드래그·폼 공통) 검증·페이로드 유틸
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  normalizeCalendarSessionStatusCode,
  STATUS
} from '../constants/schedule';

/** API·input[type=time] 공통 HH:mm 길이 */
const HM_LEN = 5;

/** 완료 스케줄 DnD/리사이즈 거부 */
export const SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE = '완료된 스케줄은 이동할 수 없습니다.';

/** 취소 스케줄 DnD/리사이즈 거부 */
export const SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE = '취소된 스케줄은 이동할 수 없습니다.';

/** 과거 스케줄 DnD/리사이즈 거부 */
export const SCHEDULE_DRAG_LOCKED_PAST_MESSAGE = '과거 스케줄은 이동할 수 없습니다.';

/** 과거 날짜로 이동 거부 (기존 drop 대상 가드) */
export const SCHEDULE_DRAG_TO_PAST_DATE_MESSAGE = '과거 날짜로는 스케줄을 이동할 수 없습니다.';

/**
 * 로컬 Date 기준으로 PUT /api/v1/schedules/{id} 본문 생성 (handleEventDrop과 동일)
 * @param {Date} newStart 시작
 * @param {Date} newEnd 종료
 * @returns {{ date: string, startTime: string, endTime: string }}
 */
export function buildScheduleDatetimeUpdateBody(newStart, newEnd) {
  const ts = (d) => d.toTimeString().split(' ')[0].slice(0, HM_LEN);
  return {
    date: newStart.toISOString().split('T')[0],
    startTime: ts(newStart),
    endTime: ts(newEnd)
  };
}

/**
 * YYYY-MM-DD + HH:mm 로 로컬 Date 생성
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeHm HH:mm
 * @returns {Date}
 */
export function combineDateAndTimeHm(dateStr, timeHm) {
  const [y, mo, d] = String(dateStr || '').split('-').map((n) => parseInt(n, 10));
  const [hh, mmRaw] = String(timeHm || '00:00').split(':').map((n) => parseInt(n, 10));
  const mm = Number.isFinite(mmRaw) ? mmRaw : 0;
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
}

/**
 * 같은 상담사 기준 시간 겹침 (캘린더 events 배열, 드래그 로직과 동일)
 * @param {Array} events UnifiedScheduleComponent state 이벤트
 * @param {string|number} excludeEventId 이동 중인 스케줄 id
 * @param {string|number|null|undefined} consultantId 상담사 id
 * @param {Date} newStart 새 시작
 * @param {Date} newEnd 새 종료
 * @returns {boolean}
 */
export function hasConsultantScheduleTimeOverlap(events, excludeEventId, consultantId, newStart, newEnd) {
  if (consultantId == null) {
    return false;
  }
  const newStartMs = newStart.getTime();
  const newEndMs = newEnd.getTime();
  return events.some((e) => {
    if (String(e.id) === String(excludeEventId)) {
      return false;
    }
    if (e.extendedProps?.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
      return false;
    }
    const otherConsultantId = e.extendedProps?.consultantId;
    if (otherConsultantId == null || String(otherConsultantId) !== String(consultantId)) {
      return false;
    }
    const otherStart = e.start instanceof Date ? e.start : new Date(e.start);
    const otherEnd = e.end instanceof Date ? e.end : new Date(e.end);
    const otherStartMs = otherStart.getTime();
    const otherEndMs = otherEnd.getTime();
    return newStartMs < otherEndMs && newEndMs > otherStartMs;
  });
}

/**
 * 자정 기준 과거 날짜 여부 (브라우저 로컬 = 운영 Asia/Seoul 가정)
 * @param {Date} day
 * @returns {boolean}
 */
export function isPastDateOnly(day) {
  if (day == null) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dropDate = new Date(day);
  dropDate.setHours(0, 0, 0, 0);
  return dropDate.getTime() < today.getTime();
}

/**
 * 스케줄 슬롯이 과거인지 — 날짜가 오늘 이전이거나, 당일이지만 종료 시각이 지남.
 * FullCalendar·캘린더 past 스타일과 동일 계층에서 DnD 잠금에 사용.
 *
 * @param {Date|string|number|null|undefined} start
 * @param {Date|string|number|null|undefined} end
 * @returns {boolean}
 */
export function isScheduleSlotInPast(start, end) {
  if (start == null) {
    return false;
  }
  const startDate = start instanceof Date ? start : new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return false;
  }
  if (isPastDateOnly(startDate)) {
    return true;
  }
  if (end == null) {
    return false;
  }
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return false;
  }
  return endDate.getTime() < Date.now();
}

/**
 * 완료·취소 상태로 캘린더 슬롯 이동이 잠긴지.
 * @param {*} status API status 또는 한글 라벨
 * @returns {boolean}
 */
export function isScheduleStatusSlotLocked(status) {
  const code = normalizeCalendarSessionStatusCode(status);
  return code === STATUS.COMPLETED || code === STATUS.CANCELLED;
}

/**
 * 완료·취소·과거로 DnD/리사이즈가 잠긴지.
 * @param {{ status?: *, start?: *, end?: * }} params
 * @returns {boolean}
 */
export function isScheduleCalendarDragLocked({ status, start, end } = {}) {
  if (isScheduleStatusSlotLocked(status)) {
    return true;
  }
  return isScheduleSlotInPast(start, end);
}

/**
 * DnD/리사이즈 잠금 시 사용자 경고 문구.
 * @param {{ status?: *, start?: *, end?: * }} params
 * @returns {string|null}
 */
export function getScheduleCalendarDragLockedMessage({ status, start, end } = {}) {
  const code = normalizeCalendarSessionStatusCode(status);
  if (code === STATUS.COMPLETED) {
    return SCHEDULE_DRAG_LOCKED_COMPLETED_MESSAGE;
  }
  if (code === STATUS.CANCELLED) {
    return SCHEDULE_DRAG_LOCKED_CANCELLED_MESSAGE;
  }
  if (isScheduleSlotInPast(start, end)) {
    return SCHEDULE_DRAG_LOCKED_PAST_MESSAGE;
  }
  return null;
}
