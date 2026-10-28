/**
 * 상담사 태블릿 일정 v2 — 아젠다/주간 리스트 행 빌드 (UI 전용, API 변경 없음)
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  STATUS
} from '../constants/schedule';
import { resolveScheduleStatusDisplayLabel } from './scheduleStatusLabel';
import { toDisplayString } from './safeDisplay';

const MS_PER_MINUTE = 60000;
const META_SEP = ' · ';
const TIME_PAD = 2;

/**
 * @param {Date|string|null|undefined} value
 * @returns {Date|null}
 */
export const toValidDate = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * @param {Date} date
 * @returns {string} HH:mm
 */
export const formatAgendaClock = (date) => {
  const hours = String(date.getHours()).padStart(TIME_PAD, '0');
  const minutes = String(date.getMinutes()).padStart(TIME_PAD, '0');
  return `${hours}:${minutes}`;
};

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD (local)
 */
export const formatAgendaDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(TIME_PAD, '0');
  const d = String(date.getDate()).padStart(TIME_PAD, '0');
  return `${y}-${m}-${d}`;
};

/**
 * @param {Object} event
 * @returns {boolean}
 */
const isAgendaEligibleEvent = (event) => {
  if (!event || event.display === 'background') {
    return false;
  }
  const type = event.extendedProps?.type;
  if (type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY || type === CALENDAR_EXTENDED_TYPE_VACATION) {
    return false;
  }
  return Boolean(toValidDate(event.start));
};

/**
 * @param {Date} start
 * @param {Date|null} end
 * @param {Date} now
 * @returns {boolean}
 */
export const isAgendaInProgress = (start, end, now) => {
  if (!start || !end) {
    return false;
  }
  return start.getTime() <= now.getTime() && now.getTime() < end.getTime();
};

/**
 * @param {string|null|undefined} status
 * @returns {boolean}
 */
export const isAgendaCompletedStatus = (status) => {
  return String(status || '').trim().toUpperCase() === STATUS.COMPLETED;
};

/**
 * @param {Date} start
 * @param {Date|null} end
 * @returns {number|null} minutes
 */
export const resolveAgendaDurationMinutes = (start, end) => {
  if (!start || !end) {
    return null;
  }
  const minutes = Math.round((end.getTime() - start.getTime()) / MS_PER_MINUTE);
  return minutes > 0 ? minutes : null;
};

/**
 * @param {Object} event
 * @param {{ now?: Date, translate?: Function, scheduleStatusOptions?: Array, inProgressLabel?: string, durationLabel?: Function }} options
 * @returns {Object|null}
 */
export const buildTabletAgendaItem = (event, options = {}) => {
  if (!isAgendaEligibleEvent(event)) {
    return null;
  }
  const now = options.now instanceof Date ? options.now : new Date();
  const start = toValidDate(event.start);
  const end = toValidDate(event.end);
  const status = event.extendedProps?.status;
  const statusClass = status ? `status-${String(status).toLowerCase()}` : '';
  const inProgress = isAgendaInProgress(start, end, now);
  const completed = isAgendaCompletedStatus(status);
  const clientName = toDisplayString(
    event.extendedProps?.clientName,
    toDisplayString(event.title, '')
  );
  const statusLabel = inProgress && options.inProgressLabel
    ? options.inProgressLabel
    : resolveScheduleStatusDisplayLabel(status, {
      codes: options.scheduleStatusOptions,
      translate: options.translate
    });
  const durationMinutes = resolveAgendaDurationMinutes(start, end);
  const metaParts = [];
  if (inProgress && options.inProgressMeta) {
    metaParts.push(options.inProgressMeta);
  } else if (durationMinutes != null && typeof options.durationLabel === 'function') {
    metaParts.push(options.durationLabel(durationMinutes));
  } else if (durationMinutes != null) {
    metaParts.push(`${durationMinutes}`);
  }
  const consultationType = toDisplayString(event.extendedProps?.consultationType, '');
  if (consultationType) {
    metaParts.push(consultationType);
  }
  return {
    id: event.id,
    event,
    start,
    end,
    dayKey: formatAgendaDayKey(start),
    startLabel: formatAgendaClock(start),
    endLabel: end ? formatAgendaClock(end) : '',
    clientName,
    meta: metaParts.filter(Boolean).join(META_SEP),
    statusLabel,
    statusClass,
    inProgress,
    completed,
    className: ['schedule-event', statusClass].filter(Boolean).join(' ')
  };
};

/**
 * @param {Array<Object>} events
 * @param {Date|null} rangeStart
 * @param {Date|null} rangeEnd
 * @param {Object} [options]
 * @returns {Array<Object>}
 */
export const buildTabletAgendaItems = (events, rangeStart, rangeEnd, options = {}) => {
  const startBound = toValidDate(rangeStart);
  const endBound = toValidDate(rangeEnd);
  const list = Array.isArray(events) ? events : [];
  return list
    .map((event) => buildTabletAgendaItem(event, options))
    .filter((item) => {
      if (!item) {
        return false;
      }
      if (startBound && item.start < startBound) {
        return false;
      }
      if (endBound && item.start >= endBound) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
};

/**
 * @param {Array<Object>} items buildTabletAgendaItems 결과
 * @returns {Array<{ dayKey: string, items: Array<Object> }>}
 */
export const groupTabletAgendaByDay = (items) => {
  const groups = [];
  const indexByKey = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = item.dayKey;
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({ dayKey: key, items: [] });
    }
    groups[indexByKey.get(key)].items.push(item);
  });
  return groups;
};
