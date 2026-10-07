/**
 * 상담사 「내 일정」 요약 — 오늘·이번 주(월~일) 일정 건수 (취소·휴무 제외)
 * 입력: UnifiedScheduleComponent onScheduleEventsChange 의 FullCalendar 이벤트(숫자 id 일정만)
 * 날짜 경계는 브라우저 로컬 자정 기준(운영 단말 KST).
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import { STATUS } from '../constants/schedule';

const DAYS_PER_WEEK = 7;
const SUNDAY_INDEX = 0;
const MONDAY_OFFSET_FROM_SUNDAY = 6;

const EXCLUDED_STATUSES = new Set([STATUS.CANCELLED, STATUS.VACATION]);

/**
 * @param {Date} date
 * @returns {Date}
 */
const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * @param {Date} date
 * @returns {Date} 해당 주 월요일 00:00
 */
export const startOfLocalWeekMonday = (date) => {
  const day = startOfLocalDay(date);
  const dow = day.getDay();
  const back = dow === SUNDAY_INDEX ? MONDAY_OFFSET_FROM_SUNDAY : dow - 1;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - back);
};

/**
 * @param {Object} event
 * @returns {Date|null}
 */
const resolveEventStart = (event) => {
  const raw = event?.start;
  if (raw == null || raw === '') {
    return null;
  }
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @param {Object} event
 * @returns {boolean}
 */
const isCountableEvent = (event) => {
  const status = String(event?.extendedProps?.status ?? '').trim().toUpperCase();
  return !EXCLUDED_STATUSES.has(status);
};

/**
 * @param {Array<Object>} events
 * @param {Date} now
 * @returns {{ todayCount: number, weekCount: number }}
 */
export const buildConsultantScheduleSummary = (events, now) => {
  if (!Array.isArray(events) || events.length === 0) {
    return { todayCount: 0, weekCount: 0 };
  }
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 1);
  const weekStart = startOfLocalWeekMonday(now);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + DAYS_PER_WEEK);

  let todayCount = 0;
  let weekCount = 0;
  events.forEach((event) => {
    if (!isCountableEvent(event)) {
      return;
    }
    const start = resolveEventStart(event);
    if (!start) {
      return;
    }
    if (start >= todayStart && start < tomorrowStart) {
      todayCount += 1;
    }
    if (start >= weekStart && start < weekEnd) {
      weekCount += 1;
    }
  });
  return { todayCount, weekCount };
};
