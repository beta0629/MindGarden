/**
 * 통합 스케줄 월간 범례 건수.
 * 칩과 같은 필터가 적용된 events 를 세되, 호출측이 넘긴 range(표시 월 1일~말일) 안만 센다.
 * 가시 그리드 spill(이전·다음 달 셀)은 range 로 제외한다. 월별 COMPLETED API 와 섞지 않는다.
 * 공휴일(background)·휴무 칩은 상담 칩이 아니므로 제외.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  STATUS
} from '../../../constants/schedule';

/** ConsultantCountsBadgeList mode — 화면에 나온 일정 건수 */
export const CONSULTANT_COUNT_BASIS_SHOWN = 'shown';

/**
 * @param {object|null|undefined} event
 * @returns {boolean}
 */
export function isCountableConsultantScheduleEvent(event) {
  if (!event || event.display === 'background') {
    return false;
  }
  const extendedType = event.extendedProps?.type;
  if (extendedType === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
    return false;
  }
  if (extendedType === CALENDAR_EXTENDED_TYPE_VACATION) {
    return false;
  }
  if (event.extendedProps?.status === STATUS.VACATION) {
    return false;
  }
  const consultantId = event.extendedProps?.consultantId ?? event.consultantId;
  return consultantId != null && String(consultantId).trim() !== '';
}

/**
 * @param {object|null|undefined} event
 * @returns {string}
 */
export function scheduleEventDateKey(event) {
  const start = event?.start ?? event?.extendedProps?.date ?? '';
  if (start instanceof Date && !Number.isNaN(start.getTime())) {
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    return `${start.getFullYear()}-${month}-${day}`;
  }
  const text = String(start);
  if (text.length < 10) {
    return '';
  }
  return text.slice(0, 10);
}

/**
 * @param {string} dateKey
 * @param {{ startDate?: string, endDate?: string }|null|undefined} range inclusive
 * @returns {boolean}
 */
function isDateKeyInRange(dateKey, range) {
  if (!range || !range.startDate || !range.endDate) {
    return true;
  }
  if (!dateKey) {
    return false;
  }
  return dateKey >= range.startDate && dateKey <= range.endDate;
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
function sameConsultantId(left, right) {
  return left != null && right != null && String(left).trim() === String(right).trim();
}

/**
 * 활성 상담사는 0부터 채운다. 키는 목록의 id 를 유지해 lookupCount 와 맞춘다.
 *
 * @param {Array<object>|null|undefined} events 칩과 같은 필터를 거친 목록
 * @param {Array<object>|null|undefined} consultants
 * @param {{ startDate?: string, endDate?: string }|null} [range] 표시 월(또는 호출측 범위). 없으면 목록 전체
 * @returns {Map<number|string, number>}
 */
export function countVisibleConsultantScheduleEvents(events, consultants, range = null) {
  const active = (Array.isArray(consultants) ? consultants : [])
    .filter((consultant) => consultant && consultant.id != null && consultant.isActive !== false);
  const counts = new Map();
  active.forEach((consultant) => {
    counts.set(consultant.id, 0);
  });

  const list = Array.isArray(events) ? events : [];
  list.forEach((event) => {
    if (!isCountableConsultantScheduleEvent(event)) {
      return;
    }
    const dateKey = scheduleEventDateKey(event);
    if (!isDateKeyInRange(dateKey, range)) {
      return;
    }
    const rawId = event.extendedProps?.consultantId ?? event.consultantId;
    const matched = active.find((consultant) => sameConsultantId(consultant.id, rawId));
    const key = matched ? matched.id : rawId;
    const current = counts.has(key) ? counts.get(key) : 0;
    counts.set(key, current + 1);
  });

  return counts;
}

export default countVisibleConsultantScheduleEvents;
