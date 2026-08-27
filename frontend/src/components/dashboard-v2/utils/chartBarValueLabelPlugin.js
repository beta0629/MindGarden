/**
 * Chart.js 막대 상단 수치 라벨 플러그인 (datalabels 대체).
 * 값이 0이면 라벨 숨김. peakIndex는 굵게 강조.
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
  afterDatasetsDraw(chart) {
    const opts = chart.options?.plugins?.[MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID];
    if (!opts || opts.enabled === false) {
      return;
    }
    const { ctx } = chart;
    const color = opts.color || 'var(--mg-v2-color-text-primary)';
    const peakColor = opts.peakColor || 'var(--mg-v2-color-text-primary)';
    const peakIndex = opts.peakIndex != null ? Number(opts.peakIndex) : -1;
    const fontSize = toSafeNumber(opts.fontSize, DEFAULT_FONT_SIZE);

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
        const { x, y } = element.getProps(['x', 'y'], true);
        const isPeak = peakIndex === index;
        const labelText = typeof opts.formatter === 'function'
          ? opts.formatter(value)
          : String(value);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = isPeak ? peakColor : color;
        ctx.font = `${isPeak ? '600' : '400'} ${fontSize}px sans-serif`;
        ctx.fillText(labelText, x, y - 2);
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
