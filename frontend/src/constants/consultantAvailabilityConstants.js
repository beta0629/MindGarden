/**
 * 상담사 상담 가능 시간(availability) FE 상수.
 * BE ConsultantAvailabilityConstants.AVAILABILITY_MIN_LEAD_DAYS 와 동기.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

/** Asia/Seoul·로컬 기준 가능 시간 설정 최소 선행일수 (today + N). D-0·D-1 불가. */
export const AVAILABILITY_MIN_LEAD_DAYS = 2;

/**
 * 로컬 캘린더 기준 today + leadDays 의 Date.
 *
 * @param {number} [leadDays=AVAILABILITY_MIN_LEAD_DAYS]
 * @returns {Date}
 */
export const getAvailabilityMinSelectableDate = (leadDays = AVAILABILITY_MIN_LEAD_DAYS) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + leadDays);
  return date;
};
