/**
 * MoneyFlowStage — 들어옴/나감 월 평균 수평 점선 플러그인.
 *
 * Chart.js ^4.5: formatter는 훅 3번째 인자(opts)에서만 읽는다.
 * chart.options.plugins[id] scriptable PROXY 경로 사용 금지.
 *
 * 라벨은 chartArea 오른쪽 거터(layout.padding.right)에 두고,
 * 점선은 plot 오른쪽 가장자리까지만 그려 막대 라벨과 겹치지 않게 한다.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { toSafeNumber } from '../../../../utils/safeDisplay';

export const MONEY_FLOW_AVG_LINES_PLUGIN_ID = 'mgMoneyFlowAvgLines';

/** caption 스케일(12) — 4-step type SSOT, 막대 라벨과 충돌 최소화 */
const DEFAULT_FONT_SIZE = 12;

/** 점선 패턴 [dash, gap] */
const DASH_PATTERN = [5, 4];

/** plot 오른쪽 → 거터 라벨까지 간격(px) */
const LABEL_GUTTER = 4;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   y: number,
 *   left: number,
 *   right: number,
 *   color: string,
 *   label: string,
 *   fontSize: number,
 *   labelOffsetY?: number
 * }} params
 */
function drawAverageLine(ctx, params) {
  const {
    y,
    left,
    right,
    color,
    label,
    fontSize,
    labelOffsetY = 0
  } = params;
  if (!Number.isFinite(y)) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(DASH_PATTERN);
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `400 ${fontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, right + LABEL_GUTTER, y + labelOffsetY);
  ctx.restore();
}

/**
 * @type {import('chart.js').Plugin}
 */
export const moneyFlowAverageLinesPlugin = {
  id: MONEY_FLOW_AVG_LINES_PLUGIN_ID,
  descriptors: {
    _scriptable: (name) => name !== 'formatter',
    _indexable: false
  },
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts || opts.enabled === false) {
      return;
    }
    const yScale = chart.scales?.y;
    const area = chart.chartArea;
    if (!yScale || !area) {
      return;
    }
    const format = typeof opts.formatter === 'function' ? opts.formatter : null;
    const prefix = typeof opts.labelPrefix === 'string' ? opts.labelPrefix : '';
    const fontSize = toSafeNumber(opts.fontSize, DEFAULT_FONT_SIZE);
    const { left, right } = area;
    const { ctx } = chart;

    const incomeAvg = toSafeNumber(opts.incomeAvg, NaN);
    const expenseAvg = toSafeNumber(opts.expenseAvg, NaN);
    const incomeColor = opts.incomeColor || '';
    const expenseColor = opts.expenseColor || '';

    const buildLabel = (value) => {
      const amountText = format ? format(value) : String(value);
      return prefix ? `${prefix} ${amountText}` : amountText;
    };

    const incomeY = Number.isFinite(incomeAvg) ? yScale.getPixelForValue(incomeAvg) : NaN;
    const expenseY = Number.isFinite(expenseAvg) ? yScale.getPixelForValue(expenseAvg) : NaN;
    const closeTogether = Number.isFinite(incomeY)
      && Number.isFinite(expenseY)
      && Math.abs(incomeY - expenseY) < fontSize + 4;
    let incomeOffset = 0;
    let expenseOffset = 0;
    if (closeTogether) {
      incomeOffset = -Math.ceil(fontSize / 2);
      expenseOffset = Math.ceil(fontSize / 2) + 2;
    }

    if (Number.isFinite(incomeAvg) && incomeColor) {
      drawAverageLine(ctx, {
        y: incomeY,
        left,
        right,
        color: incomeColor,
        label: buildLabel(incomeAvg),
        fontSize,
        labelOffsetY: incomeOffset
      });
    }
    if (Number.isFinite(expenseAvg) && expenseColor) {
      drawAverageLine(ctx, {
        y: expenseY,
        left,
        right,
        color: expenseColor,
        label: buildLabel(expenseAvg),
        fontSize,
        labelOffsetY: expenseOffset
      });
    }
  }
};
