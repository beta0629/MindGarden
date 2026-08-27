/**
 * chartBarValueLabelPlugin — Chart.js ^4.5 scriptable proxy 회귀 테스트
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  ensureMgVizBarValueLabelsPlugin,
  MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID,
  mgVizBarValueLabelsPlugin
} from '../chartBarValueLabelPlugin';
import { formatWonDisplay } from '../../../erp/organisms/moneyCockpit/moneyCockpitData';
import { OFD_LEDGER } from '../../../../constants/operatorFinanceDashboardStrings';

/**
 * Chart.js scriptable PROXY 모사:
 * function 옵션을 읽으면 `{ chart, type: 'chart' }` 로 즉시 호출한다.
 * @param {object} target
 * @param {object} chart
 * @returns {Proxy}
 */
function createScriptablePluginOptsProxy(target, chart) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      if (typeof value === 'function') {
        return value({ chart, type: 'chart' });
      }
      return value;
    }
  });
}

/**
 * @param {object} pluginOpts
 * @returns {{ fillText: jest.Mock, chart: object, opts: object }}
 */
function makeChartFixture(pluginOpts) {
  const fillText = jest.fn();
  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    fillText,
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    font: ''
  };
  const chart = {
    options: {
      plugins: {
        [MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID]: pluginOpts
      }
    },
    ctx,
    data: {
      datasets: [{ data: [6000000, 0, 1200000] }]
    },
    getDatasetMeta: () => ({
      hidden: false,
      data: [
        { getProps: () => ({ x: 10, y: 20 }) },
        { getProps: () => ({ x: 30, y: 40 }) },
        { getProps: () => ({ x: 50, y: 60 }) }
      ]
    })
  };
  return { fillText, chart, opts: pluginOpts };
}

describe('chartBarValueLabelPlugin', () => {
  test('id 및 등록', () => {
    expect(mgVizBarValueLabelsPlugin.id).toBe(MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID);
    expect(() => ensureMgVizBarValueLabelsPlugin()).not.toThrow();
    expect(() => ensureMgVizBarValueLabelsPlugin()).not.toThrow();
  });

  test('afterDatasetsDraw(chart, args, opts) — 3번째 opts.formatter로 포맷', () => {
    const { fillText, chart, opts } = makeChartFixture({
      enabled: true,
      formatter: formatWonDisplay
    });
    mgVizBarValueLabelsPlugin.afterDatasetsDraw(chart, {}, opts);
    expect(fillText).toHaveBeenCalledWith('6,000,000원', 10, 18);
    expect(fillText).toHaveBeenCalledWith('1,200,000원', 50, 58);
    expect(fillText).toHaveBeenCalledTimes(2);
  });

  test('formatter 없으면 String(value)', () => {
    const { fillText, chart, opts } = makeChartFixture({ enabled: true });
    mgVizBarValueLabelsPlugin.afterDatasetsDraw(chart, {}, opts);
    expect(fillText).toHaveBeenCalledWith('6000000', 10, 18);
    expect(fillText).toHaveBeenCalledWith('1200000', 50, 58);
    expect(fillText).toHaveBeenCalledTimes(2);
  });

  test('scriptable PROXY로 formatter를 읽으면 dash — 고정 플러그인은 3번째 opts를 쓴다', () => {
    const plainOpts = {
      enabled: true,
      formatter: formatWonDisplay
    };
    const { fillText, chart } = makeChartFixture(plainOpts);
    const proxied = createScriptablePluginOptsProxy(plainOpts, chart);
    chart.options.plugins[MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID] = proxied;

    // PROXY 경로: formatter getter가 객체를 넘기므로 formatWonDisplay → dash(문자열)
    expect(typeof proxied.formatter).toBe('string');
    expect(proxied.formatter).toBe(OFD_LEDGER.DASH);

    // 수정된 플러그인은 3번째 인자(plainOpts)를 사용 → 포맷 유지
    mgVizBarValueLabelsPlugin.afterDatasetsDraw(chart, {}, plainOpts);
    expect(fillText).toHaveBeenCalledWith('6,000,000원', 10, 18);
    expect(fillText).toHaveBeenCalledWith('1,200,000원', 50, 58);
    expect(fillText).toHaveBeenCalledTimes(2);
  });

  test('descriptors — formatter는 scriptable 제외', () => {
    expect(mgVizBarValueLabelsPlugin.descriptors._scriptable('formatter')).toBe(false);
    expect(mgVizBarValueLabelsPlugin.descriptors._scriptable('color')).toBe(true);
    expect(mgVizBarValueLabelsPlugin.descriptors._indexable).toBe(false);
  });
});
