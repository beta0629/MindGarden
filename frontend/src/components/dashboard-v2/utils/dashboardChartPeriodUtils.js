/**
 * 관리자 대시보드 차트 rolling 기간·라벨 유틸 (KST 기준).
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import { DEFAULT_VALUES } from '../../../constants/magicNumbers';
import { FILTER_OPTIONS } from '../../../constants/charts';
import { toSafeNumber } from '../../../utils/safeDisplay';

export const DASHBOARD_CHART_ROLLING_DAYS = 14;
export const DASHBOARD_CHART_ROLLING_WEEKS = 6;
export const DASHBOARD_CHART_ROLLING_MONTHS = 6;
export const DASHBOARD_CHART_ROLLING_YEARS = 5;

export const DASHBOARD_CHART_PERIOD = Object.freeze({
  DAILY: FILTER_OPTIONS.TIME_PERIOD.DAILY,
  WEEKLY: FILTER_OPTIONS.TIME_PERIOD.WEEKLY,
  MONTHLY: FILTER_OPTIONS.TIME_PERIOD.MONTHLY,
  YEARLY: FILTER_OPTIONS.TIME_PERIOD.YEARLY
});

const KST_TIMEZONE = DEFAULT_VALUES.DEFAULT_TIMEZONE;

const EMPTY_TREND_COUNTS = Object.freeze({
  bookedCount: 0,
  inProgressCount: 0,
  completedCount: 0
});

/**
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
 * @param {number} year
 * @param {number} month 1-12
 * @param {number} deltaMonths
 * @returns {{ year: number, month: number }}
 */
function addMonths(year, month, deltaMonths) {
  let nextMonth = month + deltaMonths;
  let nextYear = year;
  while (nextMonth <= 0) {
    nextMonth += 12;
    nextYear -= 1;
  }
  while (nextMonth > 12) {
    nextMonth -= 12;
    nextYear += 1;
  }
  return { year: nextYear, month: nextMonth };
}

/**
 * @param {string} period
 * @returns {{ period: string, bookedCount: number, inProgressCount: number, completedCount: number }}
 */
function emptyTrendRow(period) {
  return {
    period,
    ...EMPTY_TREND_COUNTS
  };
}

/**
 * 차트용 rolling 최근 N일 빈 데이터.
 *
 * @param {number} [days=DASHBOARD_CHART_ROLLING_DAYS]
 * @param {Date} [refDate]
 * @returns {Array<{ period: string, bookedCount: number, inProgressCount: number, completedCount: number }>}
 */
export function getEmptyDailyChartData(
  days = DASHBOARD_CHART_ROLLING_DAYS,
  refDate = new Date()
) {
  const kstToday = getKstDateParts(refDate);
  const baseMs = Date.UTC(kstToday.year, kstToday.month - 1, kstToday.day);
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(baseMs - i * 24 * 60 * 60 * 1000);
    const parts = getKstDateParts(d);
    result.push(emptyTrendRow(
      `${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`
    ));
  }
  return result;
}

/**
 * 차트용 rolling 최근 N주 빈 데이터.
 *
 * @param {number} [weeks=DASHBOARD_CHART_ROLLING_WEEKS]
 * @param {Date} [refDate]
 * @returns {Array<{ period: string, bookedCount: number, inProgressCount: number, completedCount: number }>}
 */
export function getEmptyWeeklyChartData(
  weeks = DASHBOARD_CHART_ROLLING_WEEKS,
  refDate = new Date()
) {
  const kstToday = getKstDateParts(refDate);
  const baseMs = Date.UTC(kstToday.year, kstToday.month - 1, kstToday.day);
  const result = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(baseMs - i * 7 * 24 * 60 * 60 * 1000);
    const parts = getKstDateParts(d);
    result.push(emptyTrendRow(
      `${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`
    ));
  }
  return result;
}

/**
 * 차트용 rolling 최근 N개월 빈 데이터.
 *
 * @param {number} [months=DASHBOARD_CHART_ROLLING_MONTHS]
 * @param {Date} [refDate]
 * @returns {Array<{ period: string, bookedCount: number, inProgressCount: number, completedCount: number }>}
 */
export function getEmptyMonthlyChartData(
  months = DASHBOARD_CHART_ROLLING_MONTHS,
  refDate = new Date()
) {
  const { year, month } = getKstDateParts(refDate);
  const result = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const { year: y, month: m } = addMonths(year, month, -i);
    result.push(emptyTrendRow(`${y}-${String(m).padStart(2, '0')}`));
  }
  return result;
}

/**
 * 차트용 rolling 최근 N년 빈 데이터.
 *
 * @param {number} [years=DASHBOARD_CHART_ROLLING_YEARS]
 * @param {Date} [refDate]
 * @returns {Array<{ period: string, bookedCount: number, inProgressCount: number, completedCount: number }>}
 */
export function getEmptyYearlyChartData(
  years = DASHBOARD_CHART_ROLLING_YEARS,
  refDate = new Date()
) {
  const { year } = getKstDateParts(refDate);
  const result = [];
  for (let i = years - 1; i >= 0; i -= 1) {
    result.push(emptyTrendRow(String(year - i)));
  }
  return result;
}

/**
 * period 객체를 차트 라벨 문자열로 변환.
 *
 * @param {object} p
 * @returns {string}
 */
export function chartPeriodObjectToLabel(p) {
  const { label, value, month, year } = p;
  if (typeof label === 'string') return label;
  if (typeof value === 'string') return value;
  if (typeof month === 'string' && typeof year === 'string') return `${year}-${month}`;
  if (typeof month === 'string') return month;
  if (typeof year === 'string') return year;
  if (label != null) return String(label);
  if (value != null) return String(value);
  try {
    return JSON.stringify(p);
  } catch {
    return '';
  }
}

/**
 * 차트 X축 라벨용.
 *
 * @param {object} d
 * @returns {string}
 */
export function formatChartPeriodLabel(d) {
  const p = d?.period;
  if (p == null) return '';
  if (typeof p !== 'object') return String(p);
  return chartPeriodObjectToLabel(p);
}

/**
 * API trend row에서 rolling 최근 N개만 사용. 없으면 KST 빈 데이터.
 *
 * @param {Array<object>|null|undefined} rows
 * @param {number} count
 * @param {() => Array<object>} emptyFactory
 * @returns {Array<object>}
 */
export function resolveRollingChartRows(rows, count, emptyFactory) {
  if (Array.isArray(rows) && rows.length > 0) {
    return rows.length > count ? rows.slice(-count) : rows;
  }
  return emptyFactory(count);
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {number} [count=DASHBOARD_CHART_ROLLING_DAYS]
 * @returns {Array<object>}
 */
export function resolveRollingDailyChartRows(rows, count = DASHBOARD_CHART_ROLLING_DAYS) {
  return resolveRollingChartRows(rows, count, () => getEmptyDailyChartData(count));
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {number} [count=DASHBOARD_CHART_ROLLING_WEEKS]
 * @returns {Array<object>}
 */
export function resolveRollingWeeklyChartRows(rows, count = DASHBOARD_CHART_ROLLING_WEEKS) {
  return resolveRollingChartRows(rows, count, () => getEmptyWeeklyChartData(count));
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {number} [count=DASHBOARD_CHART_ROLLING_MONTHS]
 * @returns {Array<object>}
 */
export function resolveRollingMonthlyChartRows(rows, count = DASHBOARD_CHART_ROLLING_MONTHS) {
  return resolveRollingChartRows(rows, count, () => getEmptyMonthlyChartData(count));
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {number} [count=DASHBOARD_CHART_ROLLING_YEARS]
 * @returns {Array<object>}
 */
export function resolveRollingYearlyChartRows(rows, count = DASHBOARD_CHART_ROLLING_YEARS) {
  return resolveRollingChartRows(rows, count, () => getEmptyYearlyChartData(count));
}

/**
 * 기간 키에 맞는 rolling trend rows 해석.
 *
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period
 * @param {{ dailyData?: Array, weeklyData?: Array, monthlyData?: Array, yearlyData?: Array }|null|undefined} stats
 * @returns {Array<object>}
 */
export function resolveTrendRowsByPeriod(period, stats) {
  switch (period) {
    case DASHBOARD_CHART_PERIOD.DAILY:
      return resolveRollingDailyChartRows(stats?.dailyData, DASHBOARD_CHART_ROLLING_DAYS);
    case DASHBOARD_CHART_PERIOD.WEEKLY:
      return resolveRollingWeeklyChartRows(stats?.weeklyData, DASHBOARD_CHART_ROLLING_WEEKS);
    case DASHBOARD_CHART_PERIOD.YEARLY:
      return resolveRollingYearlyChartRows(stats?.yearlyData, DASHBOARD_CHART_ROLLING_YEARS);
    case DASHBOARD_CHART_PERIOD.MONTHLY:
    default:
      return resolveRollingMonthlyChartRows(stats?.monthlyData, DASHBOARD_CHART_ROLLING_MONTHS);
  }
}

/**
 * trend rows에서 시리즈별 합계.
 *
 * @param {Array<object>|null|undefined} rows
 * @returns {{ booked: number, inProgress: number, completed: number, total: number }}
 */
export function sumTrendSeriesCounts(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { booked: 0, inProgress: 0, completed: 0, total: 0 };
  }
  let booked = 0;
  let inProgress = 0;
  let completed = 0;
  rows.forEach((row) => {
    booked += toSafeNumber(row?.bookedCount ?? row?.scheduledCount, 0);
    inProgress += toSafeNumber(row?.inProgressCount, 0);
    completed += toSafeNumber(row?.completedCount, 0);
  });
  return {
    booked,
    inProgress,
    completed,
    total: booked + inProgress + completed
  };
}

/**
 * 시리즈 값이 모두 0인지.
 *
 * @param {Array<object>|null|undefined} rows
 * @returns {boolean}
 */
export function isTrendSeriesAllZero(rows) {
  const sums = sumTrendSeriesCounts(rows);
  return sums.total === 0;
}
