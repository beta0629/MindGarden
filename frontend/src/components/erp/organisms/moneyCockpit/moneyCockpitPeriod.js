/**
 * 머니 콕핏 기간·롤링 12개월 헬퍼
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { DEFAULT_VALUES } from '../../../../constants/magicNumbers';
import { OFD_PERIOD } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatLocalDateYmd } from '../../../../utils/erpFinanceDisplay';

const KST_TIMEZONE = DEFAULT_VALUES.DEFAULT_TIMEZONE;

/**
 * Asia/Seoul 기준 연·월·일 (Intl en-CA).
 * @param {Date} [date]
 * @returns {{ year: number, month: number, day: number }}
 */
export function getKstDateParts(date = new Date()) {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

/**
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getThisMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: formatLocalDateYmd(start), endDate: formatLocalDateYmd(end) };
}

/**
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getLastMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { startDate: formatLocalDateYmd(start), endDate: formatLocalDateYmd(end) };
}

/**
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getThisYearRange(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { startDate: formatLocalDateYmd(start), endDate: formatLocalDateYmd(end) };
}

/**
 * @param {string} periodKey
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getPeriodRange(periodKey, now = new Date()) {
  if (periodKey === OFD_PERIOD.LAST_MONTH) {
    return getLastMonthRange(now);
  }
  if (periodKey === OFD_PERIOD.THIS_YEAR) {
    return getThisYearRange(now);
  }
  return getThisMonthRange(now);
}

/**
 * 지지난달 범위 (LAST_MONTH 비교용)
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getMonthBeforeLastRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - 1, 0);
  return { startDate: formatLocalDateYmd(start), endDate: formatLocalDateYmd(end) };
}

/**
 * 이전 기간 비교용 범위. THIS_YEAR 등 비교 불가면 null.
 * THIS_MONTH → 지난달, LAST_MONTH → 그 전달.
 * @param {string} periodKey
 * @param {Date} [now]
 * @returns {{ startDate: string, endDate: string }|null}
 */
export function getPreviousComparableRange(periodKey, now = new Date()) {
  if (periodKey === OFD_PERIOD.THIS_MONTH) {
    return getLastMonthRange(now);
  }
  if (periodKey === OFD_PERIOD.LAST_MONTH) {
    return getMonthBeforeLastRange(now);
  }
  return null;
}

/**
 * 롤링 12개월 (오래된 달 → 최근 달). 차트 전용 — 기간 세그먼트와 무관.
 * 기준 시각은 Asia/Seoul 현재 연·월.
 *
 * @param {Date} [now]
 * @returns {Array<{ year: number, month: number, label: string }>}
 */
export function getRolling12MonthKeys(now = new Date()) {
  const { year: currentYear, month: currentMonth } = getKstDateParts(now);
  const keys = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    // UTC 달 산술로 KST 현재 월에서 offset개월 역산 (로컬 TZ 드리프트 방지)
    const anchor = new Date(Date.UTC(currentYear, currentMonth - 1 - offset, 1));
    const year = anchor.getUTCFullYear();
    const month = anchor.getUTCMonth() + 1;
    keys.push({
      year,
      month,
      label: `${month}월`
    });
  }
  return keys;
}
