/**
 * 상담사 휴가 D-2 선행일 — BE AVAILABILITY_MIN_LEAD_DAYS / Asia/Seoul 과 동기.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

/** BE ConsultantAvailabilityConstants.AVAILABILITY_MIN_LEAD_DAYS 와 동일 */
export const VACATION_MIN_LEAD_DAYS = 2;

const SEOUL_TIME_ZONE = 'Asia/Seoul';

/**
 * Asia/Seoul 캘린더 연·월·일.
 */
export function getSeoulDateParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

/**
 * Asia/Seoul today + leadDays → YYYY-MM-DD.
 */
export function getVacationMinSelectableDateYmd(
  leadDays: number = VACATION_MIN_LEAD_DAYS,
  now: Date = new Date(),
): string {
  const { year, month, day } = getSeoulDateParts(now);
  const d = new Date(year, month - 1, day + leadDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * YYYY-MM-DD 가 Seoul today+leadDays 미만이면 true (거부 대상).
 */
export function isVacationDateBeforeMinLead(
  dateYmd: string,
  leadDays: number = VACATION_MIN_LEAD_DAYS,
  now: Date = new Date(),
): boolean {
  if (!dateYmd) {
    return true;
  }
  return dateYmd < getVacationMinSelectableDateYmd(leadDays, now);
}
