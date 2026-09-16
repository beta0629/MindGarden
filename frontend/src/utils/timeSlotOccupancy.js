/**
 * 시간 슬롯 점유·충돌 순수 유틸.
 * TimeSlotGrid 충돌 검사 SSOT. API 시간 포맷·캘린더 힌트 병합을 한곳에서 처리한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  BREAK_TIME_MINUTES,
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  DEFAULT_INFERRED_SCHEDULE_DURATION_MINUTES,
  DATE_YMD_PART_COUNT,
  DATE_YMD_SEPARATOR,
  TIME_SLOT_HM_SEPARATOR,
  isScheduleStatusOccupyingTimeSlotForConflict,
  resolveScheduleStatusCodeForConflict
} from '../constants/schedule';
import { formatLocalDateYmd } from './erpFinanceDisplay';

const PAD_2 = 2;
const PAD_ZERO = '0';
const ISO_TIME_MARKER = 'T';
const TIMEZONE_SUFFIX_RE = /[zZ]|[+-]\d{2}:?\d{2}$/;
const ISO_HM_RE = /T(\d{1,2}):(\d{2})/;
const HM_PREFIX_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;
const YMD_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/**
 * 시·분을 2자리 HH:mm으로 맞춘다.
 *
 * @param {number|string} hour
 * @param {number|string} minute
 * @returns {string}
 */
function toPaddedHm(hour, minute) {
  const h = String(Number(hour)).padStart(PAD_2, PAD_ZERO);
  const m = String(Number(minute)).padStart(PAD_2, PAD_ZERO);
  return `${h}${TIME_SLOT_HM_SEPARATOR}${m}`;
}

/**
 * API LocalTime / 배열 / 객체 / ISO / start_time 별칭을 슬롯 비교용 HH:mm으로 정규화한다.
 *
 * @param {*} raw 시간 값
 * @returns {string} HH:mm 또는 빈 문자열
 */
export function normalizeTimeStringForSlotCompare(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toPaddedHm(raw.getHours(), raw.getMinutes());
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.includes(ISO_TIME_MARKER) && TIMEZONE_SUFFIX_RE.test(trimmed)) {
      const dt = new Date(trimmed);
      if (!Number.isNaN(dt.getTime())) {
        return toPaddedHm(dt.getHours(), dt.getMinutes());
      }
    }
    const isoHm = trimmed.match(ISO_HM_RE);
    if (isoHm) {
      return toPaddedHm(isoHm[1], isoHm[2]);
    }
    const hm = trimmed.match(HM_PREFIX_RE);
    if (!hm) {
      return '';
    }
    return toPaddedHm(hm[1], hm[2]);
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    return toPaddedHm(raw[0], raw[1]);
  }
  if (typeof raw === 'object') {
    if (raw.hour != null) {
      return toPaddedHm(raw.hour, raw.minute != null ? raw.minute : 0);
    }
  }
  return '';
}

/**
 * YYYY-MM-DD 로컬 달력일. Date는 로컬, TZ 없는 ISO는 접두, Z/offset는 Date 파싱 후 로컬.
 *
 * @param {*} value
 * @returns {string}
 */
export function toOccupancyLocalDateYmd(value) {
  if (value == null || value === '') {
    return '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateYmd(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes(ISO_TIME_MARKER) && TIMEZONE_SUFFIX_RE.test(trimmed)) {
      const dt = new Date(trimmed);
      if (!Number.isNaN(dt.getTime())) {
        return formatLocalDateYmd(dt);
      }
    }
    const ymd = trimmed.match(YMD_PREFIX_RE);
    if (ymd) {
      return ymd[1];
    }
    return '';
  }
  if (Array.isArray(value) && value.length >= DATE_YMD_PART_COUNT) {
    const year = Number(value[0]);
    const month = Number(value[1]);
    const day = Number(value[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return '';
    }
    return `${year}${DATE_YMD_SEPARATOR}${String(month).padStart(PAD_2, PAD_ZERO)}${DATE_YMD_SEPARATOR}${String(day).padStart(PAD_2, PAD_ZERO)}`;
  }
  if (typeof value === 'object') {
    const year = value.year;
    const month = value.monthValue != null ? value.monthValue : value.month;
    const day = value.day;
    if (year != null && month != null && day != null) {
      return `${Number(year)}${DATE_YMD_SEPARATOR}${String(Number(month)).padStart(PAD_2, PAD_ZERO)}${DATE_YMD_SEPARATOR}${String(Number(day)).padStart(PAD_2, PAD_ZERO)}`;
    }
  }
  return '';
}

/**
 * 그리드 선택일을 YYYY-MM-DD로 만든다.
 *
 * @param {Date|string|null|undefined} selectedDate
 * @returns {string}
 */
export function resolveSelectedDateYmd(selectedDate) {
  if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) {
    return formatLocalDateYmd(selectedDate);
  }
  return toOccupancyLocalDateYmd(selectedDate);
}

/**
 * HH:mm에 분을 더한다 (24시 순환).
 *
 * @param {string} hm HH:mm
 * @param {number} minutes
 * @returns {string}
 */
export function addMinutesToHm(hm, minutes) {
  const normalized = normalizeTimeStringForSlotCompare(hm);
  if (!normalized) {
    return '';
  }
  const parts = normalized.split(TIME_SLOT_HM_SEPARATOR);
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(minutes)) {
    return '';
  }
  const total = hour * MINUTES_PER_HOUR + minute + minutes;
  const wrapped = ((total % (HOURS_PER_DAY * MINUTES_PER_HOUR)) + (HOURS_PER_DAY * MINUTES_PER_HOUR))
    % (HOURS_PER_DAY * MINUTES_PER_HOUR);
  const endHour = Math.floor(wrapped / MINUTES_PER_HOUR);
  const endMinute = wrapped % MINUTES_PER_HOUR;
  return toPaddedHm(endHour, endMinute);
}

function pickRawStart(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return null;
  }
  return schedule.startTime
    ?? schedule.start_time
    ?? schedule.start
    ?? schedule.beginTime
    ?? schedule.begin_time
    ?? null;
}

function pickRawEnd(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return null;
  }
  return schedule.endTime
    ?? schedule.end_time
    ?? schedule.end
    ?? schedule.finishTime
    ?? schedule.finish_time
    ?? null;
}

function resolveDurationMinutes(schedule, fallbackMinutes) {
  if (!schedule || typeof schedule !== 'object') {
    return fallbackMinutes;
  }
  const raw = schedule.durationMinutes ?? schedule.duration ?? schedule.sessionDuration;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) {
    return n;
  }
  return fallbackMinutes;
}

/**
 * 일정의 비교용 시작·종료 HH:mm. end가 없으면 start + duration(기본 50분)으로 추론한다.
 *
 * @param {object} schedule
 * @param {number} [fallbackDurationMinutes]
 * @returns {{ startHm: string, endHm: string }|null}
 */
export function resolveScheduleStartEndHm(
  schedule,
  fallbackDurationMinutes = DEFAULT_INFERRED_SCHEDULE_DURATION_MINUTES
) {
  const startHm = normalizeTimeStringForSlotCompare(pickRawStart(schedule));
  if (!startHm) {
    return null;
  }
  let endHm = normalizeTimeStringForSlotCompare(pickRawEnd(schedule));
  if (!endHm) {
    endHm = addMinutesToHm(startHm, resolveDurationMinutes(schedule, fallbackDurationMinutes));
  }
  if (!endHm) {
    return null;
  }
  return { startHm, endHm };
}

/**
 * 두 HH:mm 구간의 분 차이(절댓값).
 *
 * @param {string} time1
 * @param {string} time2
 * @returns {number}
 */
export function getMinutesDifference(time1, time2) {
  const a = normalizeTimeStringForSlotCompare(time1);
  const b = normalizeTimeStringForSlotCompare(time2);
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  const [h1, m1] = a.split(TIME_SLOT_HM_SEPARATOR).map(Number);
  const [h2, m2] = b.split(TIME_SLOT_HM_SEPARATOR).map(Number);
  return Math.abs((h2 * MINUTES_PER_HOUR + m2) - (h1 * MINUTES_PER_HOUR + m1));
}

/**
 * 구간 겹침 (start < otherEnd && otherStart < end).
 *
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @returns {boolean}
 */
export function isTimeOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * 세션 사이 휴식(기본 10분)보다 간격이 짧으면 충돌. 기존 TimeSlotGrid `gap < break` 와 동일.
 *
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @param {number} [breakMinutes]
 * @returns {boolean}
 */
export function isTimeTooClose(start1, end1, start2, end2, breakMinutes = BREAK_TIME_MINUTES) {
  if (end1 <= start2) {
    return getMinutesDifference(end1, start2) < breakMinutes;
  }
  if (end2 <= start1) {
    return getMinutesDifference(end2, start1) < breakMinutes;
  }
  return false;
}

/**
 * 점유 상태 + 미삭제만 true. CANCELLED/AVAILABLE/VACATION 제외, COMPLETED 포함.
 *
 * @param {object} schedule
 * @returns {boolean}
 */
export function isOccupyingScheduleForSlot(schedule) {
  const code = resolveScheduleStatusCodeForConflict(schedule);
  return isScheduleStatusOccupyingTimeSlotForConflict(code);
}

function notExcluded(schedule, excludeScheduleId) {
  if (excludeScheduleId == null || excludeScheduleId === '') {
    return true;
  }
  if (!schedule || schedule.id == null || schedule.id === '') {
    return true;
  }
  return String(schedule.id) !== String(excludeScheduleId);
}

function resolveEventLocalDateYmd(event) {
  const props = event.extendedProps && typeof event.extendedProps === 'object'
    ? event.extendedProps
    : {};
  const fromDateField = toOccupancyLocalDateYmd(event.date ?? props.date ?? event.scheduleDate);
  if (fromDateField) {
    return fromDateField;
  }
  return toOccupancyLocalDateYmd(event.start ?? props.startTime ?? props.start);
}

/**
 * FullCalendar 이벤트를 동일 상담사·당일만 점유 일정 형태로 변환한다. 다른 상담사는 null.
 *
 * @param {object} event
 * @param {string|number|null|undefined} consultantId
 * @param {string} dateYmd
 * @returns {object|null}
 */
export function mapCalendarEventToOccupancySchedule(event, consultantId, dateYmd) {
  if (!event || typeof event !== 'object') {
    return null;
  }
  const props = event.extendedProps && typeof event.extendedProps === 'object'
    ? event.extendedProps
    : {};
  const type = props.type ?? event.type;
  if (type === CALENDAR_EXTENDED_TYPE_VACATION || type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
    return null;
  }
  const eventConsultantId = props.consultantId ?? event.consultantId;
  if (consultantId == null || eventConsultantId == null) {
    return null;
  }
  if (String(eventConsultantId) !== String(consultantId)) {
    return null;
  }
  const eventDateYmd = resolveEventLocalDateYmd(event);
  if (!dateYmd || !eventDateYmd || eventDateYmd !== dateYmd) {
    return null;
  }
  if (event.allDay === true || props.allDay === true) {
    return null;
  }
  return {
    id: event.id ?? props.id,
    startTime: event.start ?? props.startTime ?? props.start_time,
    endTime: event.end ?? props.endTime ?? props.end_time,
    status: props.status ?? event.status,
    statusCode: props.statusCode ?? event.statusCode,
    isDeleted: props.isDeleted ?? event.isDeleted,
    deletedAt: props.deletedAt ?? event.deletedAt,
    consultantId: eventConsultantId,
    durationMinutes: props.durationMinutes ?? event.durationMinutes,
    title: event.title ?? props.title
  };
}

function looksLikeCalendarEvent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }
  if (item.extendedProps) {
    return true;
  }
  if (item.start instanceof Date) {
    return true;
  }
  return typeof item.start === 'string' && item.start.includes(ISO_TIME_MARKER);
}

function mapHintToSchedule(hint, consultantId, dateYmd) {
  if (!hint || typeof hint !== 'object') {
    return null;
  }
  if (looksLikeCalendarEvent(hint)) {
    return mapCalendarEventToOccupancySchedule(hint, consultantId, dateYmd);
  }
  const hintConsultant = hint.consultantId;
  if (hintConsultant != null && consultantId != null && String(hintConsultant) !== String(consultantId)) {
    return null;
  }
  const hintDate = toOccupancyLocalDateYmd(hint.date ?? hint.scheduleDate);
  if (hintDate && dateYmd && hintDate !== dateYmd) {
    return null;
  }
  return hint;
}

function hasParseableStart(schedule) {
  return Boolean(normalizeTimeStringForSlotCompare(pickRawStart(schedule)));
}

/**
 * 날짜 API 일정 + 캘린더 힌트를 병합한다. 다른 상담사 이벤트는 넣지 않는다.
 *
 * @param {object} params
 * @param {Array} [params.schedules]
 * @param {Array} [params.occupyingHints]
 * @param {Array} [params.calendarEvents]
 * @param {string|number|null|undefined} params.consultantId
 * @param {Date|string|null|undefined} params.selectedDate
 * @param {string|number|null|undefined} [params.excludeScheduleId]
 * @returns {Array}
 */
export function mergeOccupancySchedules({
  schedules = [],
  occupyingHints,
  calendarEvents,
  consultantId,
  selectedDate,
  excludeScheduleId
} = {}) {
  const dateYmd = resolveSelectedDateYmd(selectedDate);
  const base = (Array.isArray(schedules) ? schedules : []).filter((item) => notExcluded(item, excludeScheduleId));
  const hintSources = [
    ...(Array.isArray(occupyingHints) ? occupyingHints : []),
    ...(Array.isArray(calendarEvents) ? calendarEvents : [])
  ];
  const extras = [];
  hintSources.forEach((raw) => {
    const mapped = mapHintToSchedule(raw, consultantId, dateYmd);
    if (mapped && notExcluded(mapped, excludeScheduleId)) {
      extras.push(mapped);
    }
  });

  const byId = new Map();
  base.forEach((item) => {
    if (item && item.id != null && item.id !== '') {
      byId.set(String(item.id), item);
    }
  });
  const starts = new Set();
  base.forEach((item) => {
    const hm = normalizeTimeStringForSlotCompare(pickRawStart(item));
    if (hm) {
      starts.add(hm);
    }
  });

  const merged = [...base];
  extras.forEach((extra) => {
    const extraId = extra.id != null && extra.id !== '' ? String(extra.id) : null;
    const extraStart = normalizeTimeStringForSlotCompare(pickRawStart(extra));
    if (extraId && byId.has(extraId)) {
      const existing = byId.get(extraId);
      if (!hasParseableStart(existing) && extraStart) {
        const patched = {
          ...existing,
          startTime: extra.startTime ?? existing.startTime,
          endTime: extra.endTime ?? existing.endTime,
          status: existing.status ?? extra.status,
          statusCode: existing.statusCode ?? extra.statusCode
        };
        const idx = merged.indexOf(existing);
        if (idx >= 0) {
          merged[idx] = patched;
        }
        byId.set(extraId, patched);
        starts.add(extraStart);
      }
      return;
    }
    if (extraStart && starts.has(extraStart)) {
      return;
    }
    merged.push(extra);
    if (extraId) {
      byId.set(extraId, extra);
    }
    if (extraStart) {
      starts.add(extraStart);
    }
  });
  return merged;
}

/**
 * 슬롯(HH:mm + duration/end)과 점유 일정의 겹침·10분 근접 충돌.
 *
 * @param {object} params
 * @param {string} params.slotTime
 * @param {string} [params.slotEndTime]
 * @param {number} [params.durationMinutes]
 * @param {Array} [params.schedules]
 * @param {string|number|null|undefined} [params.excludeScheduleId]
 * @param {Array} [params.occupyingHints]
 * @param {Array} [params.calendarEvents]
 * @param {string|number|null|undefined} params.consultantId
 * @param {Date|string|null|undefined} params.selectedDate
 * @returns {{ conflict: boolean, occupyingStartHm: string|null }}
 */
export function checkTimeSlotConflict({
  slotTime,
  slotEndTime,
  durationMinutes,
  schedules = [],
  excludeScheduleId,
  occupyingHints,
  calendarEvents,
  consultantId,
  selectedDate
} = {}) {
  const merged = mergeOccupancySchedules({
    schedules,
    occupyingHints,
    calendarEvents,
    consultantId,
    selectedDate,
    excludeScheduleId
  });
  const slotStart = normalizeTimeStringForSlotCompare(slotTime);
  let slotEnd = normalizeTimeStringForSlotCompare(slotEndTime);
  if (!slotEnd && slotStart) {
    const dur = Number(durationMinutes);
    const inferred = Number.isFinite(dur) && dur > 0
      ? dur
      : DEFAULT_INFERRED_SCHEDULE_DURATION_MINUTES;
    slotEnd = addMinutesToHm(slotStart, inferred);
  }
  if (!slotStart || !slotEnd) {
    return { conflict: false, occupyingStartHm: null };
  }

  let occupyingStartHm = null;
  const conflict = merged.some((schedule) => {
    if (!isOccupyingScheduleForSlot(schedule)) {
      return false;
    }
    const range = resolveScheduleStartEndHm(schedule);
    if (!range) {
      return false;
    }
    const hit = isTimeOverlapping(slotStart, slotEnd, range.startHm, range.endHm)
      || isTimeTooClose(slotStart, slotEnd, range.startHm, range.endHm, BREAK_TIME_MINUTES);
    if (hit && occupyingStartHm == null) {
      occupyingStartHm = range.startHm;
    }
    return hit;
  });
  return { conflict, occupyingStartHm };
}

/**
 * 기존 스케줄 목록용 `HH:mm - HH:mm` (객체/배열도 스칼라).
 *
 * @param {object} schedule
 * @returns {string}
 */
export function formatOccupyingScheduleTimeRange(schedule) {
  const range = resolveScheduleStartEndHm(schedule);
  if (!range) {
    return '';
  }
  return `${range.startHm} - ${range.endHm}`;
}

/**
 * 충돌 칸 힌트 문구. 라벨·시각은 호출측 상수와 조합한다.
 *
 * @param {string|null|undefined} occupyingStartHm
 * @param {string} label
 * @returns {string}
 */
export function formatOccupyingStartHint(occupyingStartHm, label) {
  const hm = normalizeTimeStringForSlotCompare(occupyingStartHm);
  if (!hm) {
    return '';
  }
  const prefix = label == null || label === '' ? '' : `${label} `;
  return `${prefix}${hm}`;
}
