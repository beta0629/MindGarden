/**
 * 신규 내담자·요일별 정규화 / 수치 라벨 플러그인 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import {
  isCountSeriesAllZero,
  normalizeConsultationsByDayOfWeekItems,
  normalizeNewClientMonthlyItems
} from '../dashboardChartPeriodUtils';
import {
  ensureMgVizBarValueLabelsPlugin,
  MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID,
  mgVizBarValueLabelsPlugin
} from '../chartBarValueLabelPlugin';

describe('dashboard inflow/dow viz utils', () => {
  test('normalizeNewClientMonthlyItems — period/count/growthRate', () => {
    const result = normalizeNewClientMonthlyItems([
      { period: '2026-05', newClientCount: 10, growthRate: null },
      { period: '2026-06', newClientCount: 20, growthRate: 100 },
      { period: '2026-07', newClientCount: 25, growthRate: 25 }
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      period: '2026-07',
      newClientCount: 25,
      growthRate: 25
    });
  });

  test('normalizeConsultationsByDayOfWeekItems — 월~일 7칸 보장', () => {
    const result = normalizeConsultationsByDayOfWeekItems([
      { dayOfWeek: 3, label: '수요일', count: 32 },
      { dayOfWeek: 1, label: '월요일', count: 12 }
    ]);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ dayOfWeek: 1, label: '월요일', count: 12 });
    expect(result[1]).toEqual({ dayOfWeek: 2, label: '', count: 0 });
    expect(result[2]).toEqual({ dayOfWeek: 3, label: '수요일', count: 32 });
  });

  test('isCountSeriesAllZero', () => {
    expect(isCountSeriesAllZero([])).toBe(true);
    expect(isCountSeriesAllZero([0, 0])).toBe(true);
    expect(isCountSeriesAllZero([0, 1])).toBe(false);
  });

  test('chartBarValueLabelPlugin — id 및 등록', () => {
    expect(mgVizBarValueLabelsPlugin.id).toBe(MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID);
    expect(() => ensureMgVizBarValueLabelsPlugin()).not.toThrow();
    expect(() => ensureMgVizBarValueLabelsPlugin()).not.toThrow();
  });
});
