/**
 * 주·일 캘린더(timeGrid) 시간축 범위 — 기본 범위에 실제 일정 시각을 더해 일정이 잘리지 않게 한다.
 * 관리자·상담사 캘린더 공통.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  CALENDAR_SLOT_TIME_RANGE,
  STATUS
} from '../constants/schedule';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAY_END_MINUTES = HOURS_PER_DAY * MINUTES_PER_HOUR;
const TIME_PART_SEPARATOR = ':';
const DATE_TIME_SEPARATOR = 'T';
const TIME_PAD_LENGTH = 2;
const SLOT_SECONDS_SUFFIX = ':00';

const pad = (value) => String(value).padStart(TIME_PAD_LENGTH, '0');

/** 'HH:mm' 또는 'HH:mm:ss' → 분 */
const hmToMinutes = (hm) => {
  const [hours, minutes] = String(hm).split(TIME_PART_SEPARATOR);
  return Number(hours) * MINUTES_PER_HOUR + Number(minutes || 0);
};

/** 분 → FullCalendar slot 시각 'HH:mm:ss' (24:00:00 허용) */
const minutesToSlotTime = (minutes) => (
  `${pad(Math.floor(minutes / MINUTES_PER_HOUR))}${TIME_PART_SEPARATOR}${pad(minutes % MINUTES_PER_HOUR)}${SLOT_SECONDS_SUFFIX}`
);

/**
 * 이벤트 시각 → { dateKey, minutes }. 문자열('YYYY-MM-DDTHH:mm[:ss]')은 표시 그대로(벽시계) 해석한다.
 * @returns {{ dateKey: string, minutes: number }|null}
 */
const toWallClock = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return {
      dateKey: `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`,
      minutes: value.getHours() * MINUTES_PER_HOUR + value.getMinutes()
    };
  }
  const [datePart, timePart] = String(value).split(DATE_TIME_SEPARATOR);
  if (!timePart) {
    return null;
  }
  const minutes = hmToMinutes(timePart);
  return Number.isNaN(minutes) ? null : { dateKey: datePart, minutes };
};

const isTimedScheduleEvent = (event) => {
  if (!event || event.allDay || event.display === 'background') {
    return false;
  }
  const props = event.extendedProps || {};
  return props.type !== CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY
    && props.type !== CALENDAR_EXTENDED_TYPE_VACATION
    && props.status !== STATUS.VACATION;
};

/**
 * @param {Array<{ start?: string|Date, end?: string|Date, allDay?: boolean, display?: string,
 *   extendedProps?: { type?: string, status?: string } }>} events
 * @param {{ min?: string, max?: string }} [base] 기본 범위(HH:mm)
 * @returns {{ slotMinTime: string, slotMaxTime: string }}
 */
export const resolveCalendarSlotTimeRange = (events, base = {}) => {
  let minMinutes = hmToMinutes(base.min || CALENDAR_SLOT_TIME_RANGE.MIN);
  let maxMinutes = hmToMinutes(base.max || CALENDAR_SLOT_TIME_RANGE.MAX);

  (events || []).forEach((event) => {
    if (!isTimedScheduleEvent(event)) {
      return;
    }
    const start = toWallClock(event.start);
    if (!start) {
      return;
    }
    const end = toWallClock(event.end);
    const endMinutes = end && end.dateKey === start.dateKey ? end.minutes : DAY_END_MINUTES;
    const effectiveEnd = end ? endMinutes : start.minutes;
    minMinutes = Math.min(minMinutes, Math.floor(start.minutes / MINUTES_PER_HOUR) * MINUTES_PER_HOUR);
    maxMinutes = Math.max(
      maxMinutes,
      Math.min(DAY_END_MINUTES, Math.ceil(Math.max(effectiveEnd, start.minutes + 1) / MINUTES_PER_HOUR) * MINUTES_PER_HOUR)
    );
  });

  return {
    slotMinTime: minutesToSlotTime(minMinutes),
    slotMaxTime: minutesToSlotTime(maxMinutes)
  };
};
