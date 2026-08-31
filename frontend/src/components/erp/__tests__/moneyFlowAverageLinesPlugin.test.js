/**
 * moneyFlowAverageLinesPlugin 단위 테스트
 * 레이아웃 계약: 평균 라벨은 chartArea.right 거터, 점선은 plot edge까지.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  MONEY_FLOW_AVG_LINES_PLUGIN_ID,
  moneyFlowAverageLinesPlugin
} from '../organisms/moneyCockpit/moneyFlowAverageLinesPlugin';
import { formatWonDisplay } from '../organisms/moneyCockpit/moneyCockpitData';
import {
  AVG_LINE_LABEL_FONT_SIZE,
  MONEY_FLOW_CHART_RIGHT_PADDING
} from '../organisms/moneyCockpit/moneyFlowStageLayout';
import { OFD_CHART } from '../../../constants/operatorFinanceDashboardStrings';

/**
 * @param {object} [overrides]
 * @returns {{ fillText: jest.Mock, lineTo: jest.Mock, moveTo: jest.Mock, chart: object, ctx: object }}
 */
function makeAvgLineFixture(overrides = {}) {
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
  const chartArea = overrides.chartArea || { left: 40, right: 400, top: 10, bottom: 200 };
  const getPixelForValue = overrides.getPixelForValue || jest.fn((v) => {
    if (v === 5000000) return 80;
    if (v === 3000000) return 120;
    return 0;
  });
  const chart = {
    ctx,
    chartArea,
    scales: { y: { getPixelForValue } }
  };
  return { fillText, lineTo, moveTo, chart, ctx, getPixelForValue, chartArea };
}

describe('moneyFlowAverageLinesPlugin', () => {
  test('id 및 descriptors', () => {
    expect(moneyFlowAverageLinesPlugin.id).toBe(MONEY_FLOW_AVG_LINES_PLUGIN_ID);
    expect(moneyFlowAverageLinesPlugin.descriptors._scriptable('formatter')).toBe(false);
    expect(moneyFlowAverageLinesPlugin.descriptors._scriptable('incomeAvg')).toBe(true);
  });

  test('afterDatasetsDraw(chart, args, opts) — 평균 점선·라벨 (3번째 opts)', () => {
    const { fillText, chart, getPixelForValue } = makeAvgLineFixture();
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

  test('레이아웃 계약: 라벨은 chartArea.right 거터, 점선은 plot edge, 정수 원', () => {
    const chartArea = { left: 0, right: 800, top: 10, bottom: 200 };
    const incomeAvg = 1234567.4;
    const expenseAvg = 987654.4;
    const { fillText, lineTo, moveTo, chart } = makeAvgLineFixture({
      chartArea,
      getPixelForValue: jest.fn((v) => {
        if (v === incomeAvg) return 80;
        if (v === expenseAvg) return 120;
        return 0;
      })
    });
    const opts = {
      enabled: true,
      incomeAvg,
      expenseAvg,
      incomeColor: 'teal',
      expenseColor: 'rose',
      formatter: formatWonDisplay,
      labelPrefix: OFD_CHART.AVG_PREFIX,
      fontSize: AVG_LINE_LABEL_FONT_SIZE
    };

    moneyFlowAverageLinesPlugin.afterDatasetsDraw(chart, {}, opts);

    expect(moveTo).toHaveBeenCalledWith(chartArea.left, 80);
    expect(moveTo).toHaveBeenCalledWith(chartArea.left, 120);
    expect(lineTo).toHaveBeenCalledWith(chartArea.right, 80);
    expect(lineTo).toHaveBeenCalledWith(chartArea.right, 120);

    expect(fillText).toHaveBeenCalledTimes(2);
    fillText.mock.calls.forEach(([label, x]) => {
      expect(x).toBeGreaterThanOrEqual(chartArea.right);
      expect(label).not.toMatch(/\.\d+원/);
      expect(label).toMatch(/원$/);
    });
    expect(fillText.mock.calls[0][0]).toBe(`${OFD_CHART.AVG_PREFIX} 1,234,567원`);
    expect(fillText.mock.calls[1][0]).toBe(`${OFD_CHART.AVG_PREFIX} 987,654원`);
  });

  test('MoneyFlowStage 레이아웃 SSOT — right padding ≥ 96, avg font 12', () => {
    expect(MONEY_FLOW_CHART_RIGHT_PADDING).toBeGreaterThanOrEqual(96);
    expect(AVG_LINE_LABEL_FONT_SIZE).toBe(12);
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
