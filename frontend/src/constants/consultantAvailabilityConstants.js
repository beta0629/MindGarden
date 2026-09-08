/**
 * 상담사 상담 가능 시간(availability) FE 상수.
 * BE ConsultantAvailabilityConstants.AVAILABILITY_MIN_LEAD_DAYS 와 동기.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { DEFAULT_VALUES } from './magicNumbers';

/** Asia/Seoul 캘린더 기준 가능 시간 설정 최소 선행일수 (today + N). D-0·D-1 불가. */
export const AVAILABILITY_MIN_LEAD_DAYS = 2;

/**
 * Asia/Seoul 기준 연·월·일 (Intl en-CA).
 * BE ConsultantAvailabilityLeadDaysGuard(Clock.system(Asia/Seoul)) 와 동일 캘린더.
 *
 * @param {Date} [date=new Date()]
 * @returns {{ year: number, month: number, day: number }}
 */
const getSeoulDateParts = (date = new Date()) => {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_VALUES.DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
};

/**
 * Asia/Seoul 캘린더 기준 today + leadDays 의 Date.
 * 반환 Date의 로컬 Y/M/D 는 해당 Seoul 캘린더 최소일과 같다
 * (`formatLocalDateYmd` / `<input type="date" min>` 과 정합).
 *
 * @param {number} [leadDays=AVAILABILITY_MIN_LEAD_DAYS]
 * @param {Date} [now=new Date()] 기준 시각 (테스트용)
 * @returns {Date}
 */
export const getAvailabilityMinSelectableDate = (
  leadDays = AVAILABILITY_MIN_LEAD_DAYS,
  now = new Date()
) => {
  const { year, month, day } = getSeoulDateParts(now);
  return new Date(year, month - 1, day + leadDays);
};
