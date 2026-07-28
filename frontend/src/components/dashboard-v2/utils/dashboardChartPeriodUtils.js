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

/**
 * 예약·완료만 모두 0인지 (진행 제외 — 차트 empty 판정용).
 *
 * @param {Array<object>|null|undefined} rows
 * @returns {boolean}
 */
export function isBookedCompletedAllZero(rows) {
  const sums = sumTrendSeriesCounts(rows);
  return sums.booked + sums.completed === 0;
}

/**
 * 직전 동기간 대비 증감률(%).
 * previous 없거나 비유한값·0 이하면 null(퍼센트 배지 불가 — fromZero는 resolveGrowthBadgeState).
 *
 * @param {number} current
 * @param {number|null|undefined} previous
 * @returns {number|null}
 */
export function calcGrowthRatePercent(current, previous) {
  if (previous == null || !Number.isFinite(Number(previous))) {
    return null;
  }
  const prev = Number(previous);
  if (prev <= 0) {
    return null;
  }
  return Math.round(((toSafeNumber(current, 0) - prev) / prev) * 100);
}

/**
 * @param {number|null|undefined} growthRate
 * @returns {'up'|'down'|'flat'|null}
 */
export function resolveGrowthTone(growthRate) {
  if (growthRate == null || !Number.isFinite(Number(growthRate))) {
    return null;
  }
  const rate = Number(growthRate);
  if (rate > 0) {
    return 'up';
  }
  if (rate < 0) {
    return 'down';
  }
  return 'flat';
}

/**
 * MoM 증감 배지 표시 상태.
 * - percent: 전기간 &gt; 0 이고 증감률 산출 가능
 * - fromZero: 전기간 0·현재 &gt; 0 (▲ 신규 등 — 퍼센트 불가)
 * - null: 버킷 1개·previous 없음·양쪽 0 등 미노출
 *
 * @param {number|null|undefined} growthRate
 * @param {number} current
 * @param {number|null|undefined} previous
 * @returns {{ tone: 'up'|'down'|'flat', kind: 'percent'|'fromZero', rate: number|null }|null}
 */
export function resolveGrowthBadgeState(growthRate, current, previous) {
  const tone = resolveGrowthTone(growthRate);
  if (tone != null) {
    return {
      tone,
      kind: 'percent',
      rate: Number(growthRate)
    };
  }
  if (
    previous != null
    && Number.isFinite(Number(previous))
    && Number(previous) === 0
    && toSafeNumber(current, 0) > 0
  ) {
    return {
      tone: 'up',
      kind: 'fromZero',
      rate: null
    };
  }
  return null;
}

/**
 * 최신 버킷 vs 직전 버킷(또는 API previous/growth/target) 비교 메트릭.
 *
 * @param {Array<object>|null|undefined} rows
 * @param {object|null|undefined} stats consultationStats (optional API fields)
 * @param {number} defaultTargetCompleted
 * @returns {{
 *   currentBooked: number,
 *   currentCompleted: number,
 *   previousBooked: number|null,
 *   previousCompleted: number|null,
 *   growthRateBooked: number|null,
 *   growthRateCompleted: number|null,
 *   targetCompleted: number
 * }}
 */
export function resolvePeriodComparisonMetrics(rows, stats, defaultTargetCompleted) {
  let currentBooked = 0;
  let currentCompleted = 0;
  let previousBooked = null;
  let previousCompleted = null;

  if (Array.isArray(rows) && rows.length > 0) {
    const last = rows[rows.length - 1];
    currentBooked = toSafeNumber(last?.bookedCount ?? last?.scheduledCount, 0);
    currentCompleted = toSafeNumber(last?.completedCount, 0);
    if (rows.length >= 2) {
      const prev = rows[rows.length - 2];
      previousBooked = toSafeNumber(prev?.bookedCount ?? prev?.scheduledCount, 0);
      previousCompleted = toSafeNumber(prev?.completedCount, 0);
    }
  }

  const apiPrevBooked = stats?.previousPeriodBooked
    ?? stats?.previousPeriodTotals?.booked;
  const apiPrevCompleted = stats?.previousPeriodCompleted
    ?? stats?.previousPeriodTotals?.completed;
  if (apiPrevBooked != null && Number.isFinite(Number(apiPrevBooked))) {
    previousBooked = toSafeNumber(apiPrevBooked, 0);
  }
  if (apiPrevCompleted != null && Number.isFinite(Number(apiPrevCompleted))) {
    previousCompleted = toSafeNumber(apiPrevCompleted, 0);
  }

  const apiGrowthBooked = stats?.growthRateBooked;
  const apiGrowthCompleted = stats?.growthRateCompleted;
  const growthRateBooked = apiGrowthBooked != null && Number.isFinite(Number(apiGrowthBooked))
    ? Math.round(Number(apiGrowthBooked))
    : calcGrowthRatePercent(currentBooked, previousBooked);
  const growthRateCompleted = apiGrowthCompleted != null
    && Number.isFinite(Number(apiGrowthCompleted))
    ? Math.round(Number(apiGrowthCompleted))
    : calcGrowthRatePercent(currentCompleted, previousCompleted);

  const apiTarget = stats?.targetCompleted;
  const targetCompleted = apiTarget != null && Number.isFinite(Number(apiTarget))
    && Number(apiTarget) > 0
    ? toSafeNumber(apiTarget, defaultTargetCompleted)
    : toSafeNumber(defaultTargetCompleted, 100);

  return {
    currentBooked,
    currentCompleted,
    previousBooked,
    previousCompleted,
    growthRateBooked,
    growthRateCompleted,
    targetCompleted
  };
}

/**
 * 목표 대비 달성률(%). target &lt;= 0 이면 0.
 *
 * @param {number} actual
 * @param {number} target
 * @returns {number}
 */
export function calcTargetAchievementPercent(actual, target) {
  const t = toSafeNumber(target, 0);
  if (t <= 0) {
    return 0;
  }
  return Math.round((toSafeNumber(actual, 0) / t) * 100);
}
