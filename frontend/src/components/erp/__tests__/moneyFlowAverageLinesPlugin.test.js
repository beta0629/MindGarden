/**
 * moneyFlowAverageLinesPlugin 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  MONEY_FLOW_AVG_LINES_PLUGIN_ID,
  moneyFlowAverageLinesPlugin
} from '../organisms/moneyCockpit/moneyFlowAverageLinesPlugin';
import { formatWonDisplay } from '../organisms/moneyCockpit/moneyCockpitData';
import { OFD_CHART } from '../../../constants/operatorFinanceDashboardStrings';

describe('moneyFlowAverageLinesPlugin', () => {
  test('id 및 descriptors', () => {
    expect(moneyFlowAverageLinesPlugin.id).toBe(MONEY_FLOW_AVG_LINES_PLUGIN_ID);
    expect(moneyFlowAverageLinesPlugin.descriptors._scriptable('formatter')).toBe(false);
    expect(moneyFlowAverageLinesPlugin.descriptors._scriptable('incomeAvg')).toBe(true);
  });

  test('afterDatasetsDraw(chart, args, opts) — 평균 점선·라벨 (3번째 opts)', () => {
    const fillText = jest.fn();
    const stroke = jest.fn();
    const moveTo = jest.fn();
    const lineTo = jest.fn();
    const beginPath = jest.fn();
    const setLineDash = jest.fn();
    const ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      fillText,
      stroke,
      moveTo,
      lineTo,
      beginPath,
      setLineDash,
      textAlign: '',
      textBaseline: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: ''
    };
    const getPixelForValue = jest.fn((v) => {
      if (v === 5000000) return 80;
      if (v === 3000000) return 120;
      return 0;
    });
    const chart = {
      ctx,
      chartArea: { left: 40, right: 400, top: 10, bottom: 200 },
      scales: { y: { getPixelForValue } }
    };
    const opts = {
      enabled: true,
      incomeAvg: 5000000,
      expenseAvg: 3000000,
      incomeColor: 'teal',
      expenseColor: 'rose',
      formatter: formatWonDisplay,
      labelPrefix: OFD_CHART.AVG_PREFIX,
      fontSize: 12
    };

    moneyFlowAverageLinesPlugin.afterDatasetsDraw(chart, {}, opts);

    expect(getPixelForValue).toHaveBeenCalledWith(5000000);
    expect(getPixelForValue).toHaveBeenCalledWith(3000000);
    expect(setLineDash).toHaveBeenCalledWith([5, 4]);
    expect(fillText).toHaveBeenCalledWith(
      `${OFD_CHART.AVG_PREFIX} 5,000,000원`,
      404,
      80
    );
    expect(fillText).toHaveBeenCalledWith(
      `${OFD_CHART.AVG_PREFIX} 3,000,000원`,
      404,
      120
    );
    expect(fillText).toHaveBeenCalledTimes(2);
  });

  test('enabled:false 이면 그리지 않음', () => {
    const fillText = jest.fn();
    const chart = {
      ctx: { fillText, save: jest.fn(), restore: jest.fn() },
      chartArea: { left: 0, right: 100, top: 0, bottom: 100 },
      scales: { y: { getPixelForValue: jest.fn() } }
    };
    moneyFlowAverageLinesPlugin.afterDatasetsDraw(chart, {}, { enabled: false });
    expect(fillText).not.toHaveBeenCalled();
  });
});
