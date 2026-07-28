/**
 * dashboardChartPeriodUtils rolling 기간 테스트.
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import {
  DASHBOARD_CHART_PERIOD,
  DASHBOARD_CHART_ROLLING_MONTHS,
  getEmptyDailyChartData,
  getEmptyMonthlyChartData,
  getEmptyWeeklyChartData,
  getEmptyYearlyChartData,
  getKstDateParts,
  isTrendSeriesAllZero,
  resolveRollingDailyChartRows,
  resolveRollingMonthlyChartRows,
  resolveRollingWeeklyChartRows,
  resolveRollingYearlyChartRows,
  resolveTrendRowsByPeriod,
  sumTrendSeriesCounts
} from '../dashboardChartPeriodUtils';

describe('dashboardChartPeriodUtils — rolling chart periods', () => {
  const july2026 = new Date('2026-07-02T12:00:00.000Z');
  const june2026 = new Date('2026-06-30T12:00:00.000Z');

  test('getKstDateParts는 KST 기준 날짜를 반환한다', () => {
    expect(getKstDateParts(july2026)).toEqual({ year: 2026, month: 7, day: 2 });
  });

  test('7월 기준 빈 월간 데이터는 2~7월 rolling 6개월', () => {
    const rows = getEmptyMonthlyChartData(DASHBOARD_CHART_ROLLING_MONTHS, july2026);
    expect(rows.map((row) => row.period)).toEqual([
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07'
    ]);
    expect(rows.every((row) => row.inProgressCount === 0 && row.bookedCount === 0)).toBe(true);
  });

  test('6월 기준 빈 월간 데이터는 1~6월 rolling 6개월', () => {
    const rows = getEmptyMonthlyChartData(DASHBOARD_CHART_ROLLING_MONTHS, june2026);
    expect(rows.map((row) => row.period)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06'
    ]);
  });

  test('resolveRollingMonthlyChartRows는 앞쪽(과거) 구간을 버리고 최근 N개월만 사용', () => {
    const apiRows = [
      { period: '2026-01', completedCount: 1 },
      { period: '2026-02', completedCount: 2 },
      { period: '2026-03', completedCount: 3 },
      { period: '2026-04', completedCount: 4 },
      { period: '2026-05', completedCount: 5 },
      { period: '2026-06', completedCount: 6 },
      { period: '2026-07', completedCount: 7 }
    ];
    const resolved = resolveRollingMonthlyChartRows(apiRows, 6);
    expect(resolved.map((row) => row.period)).toEqual([
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07'
    ]);
  });

  test('API 데이터가 없으면 KST rolling 빈 월간 데이터를 사용', () => {
    const resolved = resolveRollingMonthlyChartRows([]);
    expect(resolved).toHaveLength(6);
    expect(resolved.every((row) => row.completedCount === 0)).toBe(true);
    expect(resolved.every((row) => /^\d{4}-\d{2}$/.test(row.period))).toBe(true);
  });

  test('resolveRollingWeeklyChartRows는 최근 N주만 유지', () => {
    const apiRows = Array.from({ length: 8 }, (_, index) => ({
      period: `W${index + 1}`,
      completedCount: index + 1
    }));
    const resolved = resolveRollingWeeklyChartRows(apiRows, 6);
    expect(resolved).toHaveLength(6);
    expect(resolved[0].period).toBe('W3');
    expect(resolved[5].period).toBe('W8');
  });

  test('주간 빈 데이터는 6개 포인트를 반환', () => {
    const rows = getEmptyWeeklyChartData(6, july2026);
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => typeof row.period === 'string' && row.completedCount === 0)).toBe(true);
  });

  test('일간 빈 데이터는 14개 포인트와 inProgressCount를 포함한다', () => {
    const rows = getEmptyDailyChartData(14, july2026);
    expect(rows).toHaveLength(14);
    expect(rows.every((row) => row.inProgressCount === 0)).toBe(true);
    expect(rows[rows.length - 1].period).toMatch(/^\d{2}\/\d{2}$/);
  });

  test('연간 빈 데이터는 최근 5년', () => {
    const rows = getEmptyYearlyChartData(5, july2026);
    expect(rows.map((row) => row.period)).toEqual(['2022', '2023', '2024', '2025', '2026']);
  });

  test('resolveRollingDailyChartRows / Yearly 는 최근 N개만 유지', () => {
    const daily = resolveRollingDailyChartRows(
      Array.from({ length: 20 }, (_, i) => ({ period: `D${i}`, completedCount: i })),
      14
    );
    expect(daily).toHaveLength(14);
    expect(daily[0].period).toBe('D6');

    const yearly = resolveRollingYearlyChartRows(
      Array.from({ length: 8 }, (_, i) => ({ period: String(2019 + i), completedCount: i })),
      5
    );
    expect(yearly.map((r) => r.period)).toEqual(['2022', '2023', '2024', '2025', '2026']);
  });

  test('resolveTrendRowsByPeriod는 기간 키에 맞는 소스를 사용', () => {
    const stats = {
      dailyData: [{ period: '07/01', bookedCount: 1, inProgressCount: 0, completedCount: 0 }],
      weeklyData: [{ period: '07/07', bookedCount: 2, inProgressCount: 1, completedCount: 1 }],
      monthlyData: [{ period: '2026-07', bookedCount: 3, inProgressCount: 0, completedCount: 2 }],
      yearlyData: [{ period: '2026', bookedCount: 4, inProgressCount: 0, completedCount: 3 }]
    };
    expect(resolveTrendRowsByPeriod(DASHBOARD_CHART_PERIOD.DAILY, stats)[0].bookedCount).toBe(1);
    expect(resolveTrendRowsByPeriod(DASHBOARD_CHART_PERIOD.WEEKLY, stats)[0].inProgressCount).toBe(1);
    expect(resolveTrendRowsByPeriod(DASHBOARD_CHART_PERIOD.MONTHLY, stats)[0].completedCount).toBe(2);
    expect(resolveTrendRowsByPeriod(DASHBOARD_CHART_PERIOD.YEARLY, stats)[0].bookedCount).toBe(4);
  });

  test('sumTrendSeriesCounts / isTrendSeriesAllZero', () => {
    const rows = [
      { bookedCount: 2, inProgressCount: 1, completedCount: 3 },
      { bookedCount: 1, inProgressCount: 0, completedCount: 1 }
    ];
    expect(sumTrendSeriesCounts(rows)).toEqual({
      booked: 3,
      inProgress: 1,
      completed: 4,
      total: 8
    });
    expect(isTrendSeriesAllZero(rows)).toBe(false);
    expect(isTrendSeriesAllZero([])).toBe(true);
  });
});
