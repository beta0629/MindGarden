/**
 * Chart.js 막대 상단 수치 라벨 플러그인 (datalabels 대체).
 * 값이 0이면 라벨 숨김. peakIndex는 굵게 강조.
 * chartArea가 있으면 좌우 클리핑. 라벨은 항상 막대 위(바깥)에 두고 막대 fill 안으로 넣지 않음.
 *
 * Chart.js ^4.5: `chart.options.plugins[id]` 는 scriptable PROXY.
 * formatter를 그 경로에서 읽으면 함수가 호출되어 문자열이 되므로,
 * 반드시 훅 3번째 인자(pluginOpts, scriptable:false)를 사용한다.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import { Chart as ChartJS } from 'chart.js';
import { toSafeNumber } from '../../../utils/safeDisplay';

export const MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID = 'mgVizBarValueLabels';

/** body 스케일 (~14px). caption 12 gray 지양 */
const DEFAULT_FONT_SIZE = 14;

/**
 * @type {import('chart.js').Plugin}
 */
export const mgVizBarValueLabelsPlugin = {
  id: MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID,
  /**
   * Chart.js options proxy가 formatter를 호출하지 않도록 제외.
   * 훅 3번째 인자는 이미 scriptable:false 이지만, chart.options.plugins 경로 보호용.
   */
  descriptors: {
    _scriptable: (name) => name !== 'formatter',
    _indexable: false
  },
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || opts.enabled === false) {
      return;
    }
    const format = typeof opts.formatter === 'function' ? opts.formatter : null;
    const { ctx } = chart;
    const color = opts.color || 'var(--mg-v2-color-text-primary)';
    const peakColor = opts.peakColor || 'var(--mg-v2-color-text-primary)';
    const peakIndex = opts.peakIndex != null ? Number(opts.peakIndex) : -1;
    const fontSize = toSafeNumber(opts.fontSize, DEFAULT_FONT_SIZE);
    const area = chart.chartArea;

    chart.data.datasets.forEach((_dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden || !Array.isArray(meta.data)) {
        return;
      }
      meta.data.forEach((element, index) => {
        const raw = chart.data.datasets[datasetIndex]?.data?.[index];
        const value = toSafeNumber(raw, 0);
        if (value <= 0) {
          return;
        }
        const props = element.getProps(['x', 'y'], true);
        const { x, y } = props;
        const isPeak = peakIndex === index;
        const labelText = format ? format(value) : String(value);
        ctx.save();
        ctx.font = `${isPeak ? '600' : '400'} ${fontSize}px sans-serif`;
        ctx.fillStyle = isPeak ? peakColor : color;

        let drawX = x;
        let drawY = y - 2;
        let textAlign = 'center';
        const textBaseline = 'bottom';

        if (area && Number.isFinite(area.left) && Number.isFinite(area.right)) {
          const textWidth = typeof ctx.measureText === 'function'
            ? ctx.measureText(labelText).width
            : 0;
          const half = textWidth / 2;
          const minX = area.left + half + 2;
          const maxX = area.right - half - 2;
          if (maxX >= minX) {
            drawX = Math.min(Math.max(x, minX), maxX);
          } else {
            textAlign = x > (area.left + area.right) / 2 ? 'right' : 'left';
            drawX = textAlign === 'right' ? area.right - 2 : area.left + 2;
          }

          // 짧은 막대도 fill 안으로 뒤집지 않음. chartArea.top과 겹치면
          // 막대 위 패딩 안에서만 클램프(바깥 유지).
          if (drawY - fontSize < area.top) {
            drawY = Math.min(area.top + fontSize, y - 2);
          }
        }

        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.fillText(labelText, drawX, drawY);
        ctx.restore();
      });
    });
  }
};

let registered = false;

/**
 * Chart.js에 수치 라벨 플러그인을 1회 등록한다.
 */
export function ensureMgVizBarValueLabelsPlugin() {
  if (registered) {
    return;
  }
  const existing = ChartJS.registry?.plugins?.get?.(MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID);
  if (!existing) {
    ChartJS.register(mgVizBarValueLabelsPlugin);
  }
  registered = true;
}
