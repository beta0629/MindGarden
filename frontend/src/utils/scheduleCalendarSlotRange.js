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
import { DEFAULT_ZONE, formatDateTimeKeyInZone } from './zonedDateTime';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAY_END_MINUTES = HOURS_PER_DAY * MINUTES_PER_HOUR;
const TIME_PART_SEPARATOR = ':';
const DATE_TIME_SEPARATOR = 'T';
const TIME_PAD_LENGTH = 2;
const SLOT_SECONDS_SUFFIX = ':00';
/** 지금선 기준 초기 스크롤 — 현재 시각보다 이만큼 앞 */
const SCROLL_TIME_LEAD_HOURS = 2;

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

/**
 * FullCalendar scrollTime — Asia/Seoul 현재시에서 leadHours 앞, slotMinTime 이상으로 클램프.
 *
 * @param {Date} [now]
 * @param {string} [slotMinTime] 'HH:mm:ss' 또는 'HH:mm'
 * @param {string} [timeZone]
 * @param {number} [leadHours]
 * @returns {string} 'HH:mm:ss'
 */
export const resolveCalendarScrollTime = (
  now = new Date(),
  slotMinTime = CALENDAR_SLOT_TIME_RANGE.MIN,
  timeZone = DEFAULT_ZONE,
  leadHours = SCROLL_TIME_LEAD_HOURS
) => {
  const dateTimeKey = formatDateTimeKeyInZone(now, timeZone);
  const timePart = dateTimeKey.split(DATE_TIME_SEPARATOR)[1] || '00:00';
  const currentMinutes = hmToMinutes(timePart);
  const leadMinutes = Math.max(0, Number(leadHours) || 0) * MINUTES_PER_HOUR;
  const minMinutes = hmToMinutes(slotMinTime);
  const scrollMinutes = Math.max(minMinutes, currentMinutes - leadMinutes);
  return minutesToSlotTime(scrollMinutes);
};
