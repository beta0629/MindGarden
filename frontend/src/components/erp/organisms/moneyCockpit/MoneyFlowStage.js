/**
 * MoneyFlowStage — 롤링 12개월 들어옴 vs 나감 grouped bars
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import MGChart from '../../../common/MGChart';
import EmptyState from '../../../common/EmptyState';
import UnifiedLoading from '../../../common/UnifiedLoading';
import {
  MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID,
  mgVizBarValueLabelsPlugin
} from '../../../dashboard-v2/utils/chartBarValueLabelPlugin';
import { OFD_CHART } from '../../../../constants/operatorFinanceDashboardStrings';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import {
  computeSeriesMonthlyAverages,
  formatAxisTick,
  formatWonDisplay
} from './moneyCockpitData';
import {
  MONEY_FLOW_AVG_LINES_PLUGIN_ID,
  moneyFlowAverageLinesPlugin
} from './moneyFlowAverageLinesPlugin';

/** 데스크톱 차트 기준 높이(px) — CSS clamp가 실제 레이아웃을 지배 */
const MONEY_FLOW_CHART_HEIGHT_PX = 480;

/** Chart.js plugins — 모듈 스코프 고정 (매 렌더 새 배열 → MGChart 재생성 방지) */
const MONEY_FLOW_CHART_PLUGINS = [mgVizBarValueLabelsPlugin, moneyFlowAverageLinesPlugin];

/** caption 스케일 — 막대 라벨 최소 12 (축소 금지) */
const BAR_VALUE_LABEL_FONT_SIZE = 12;

/** 평균 점선 라벨 — 막대 라벨보다 한 단계 작게 */
const AVG_LINE_LABEL_FONT_SIZE = 12;

const CHART_TOKEN_VARS = {
  INCOME_FILL: '--mg-color-error',
  INCOME_BORDER: '--mg-error-700',
  EXPENSE_FILL: '--mg-v2-color-semantic-info',
  EXPENSE_BORDER: '--mg-v2-color-semantic-info-dark',
  GRID: '--mg-color-border-main',
  TICK: '--mg-color-text-secondary'
};

/**
 * @returns {{
 *   incomeFill: string,
 *   incomeBorder: string,
 *   expenseFill: string,
 *   expenseBorder: string,
 *   grid: string,
 *   tick: string
 * }}
 */
function readChartColors() {
  if (typeof document === 'undefined') {
    return {
      incomeFill: '',
      incomeBorder: '',
      expenseFill: '',
      expenseBorder: '',
      grid: '',
      tick: ''
    };
  }
  const root = document.documentElement;
  const pick = (name) => getComputedStyle(root).getPropertyValue(name).trim() || '';
  return {
    incomeFill: pick(CHART_TOKEN_VARS.INCOME_FILL),
    incomeBorder: pick(CHART_TOKEN_VARS.INCOME_BORDER),
    expenseFill: pick(CHART_TOKEN_VARS.EXPENSE_FILL),
    expenseBorder: pick(CHART_TOKEN_VARS.EXPENSE_BORDER),
    grid: pick(CHART_TOKEN_VARS.GRID),
    tick: pick(CHART_TOKEN_VARS.TICK)
  };
}

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {Array<{ label: string, income: number, expense: number }>} props.series
 */
const MoneyFlowStage = ({ loading = false, series = [] }) => {
  const colors = useMemo(() => readChartColors(), []);

  const hasAnyAmount = Array.isArray(series)
    && series.some(
      (row) => toSafeNumber(row?.income) > 0 || toSafeNumber(row?.expense) > 0
    );

  const monthlyAverages = useMemo(
    () => computeSeriesMonthlyAverages(series),
    [series]
  );

  const chartData = useMemo(() => {
    const labels = (series || []).map((row) => row.label);
    return {
      labels,
      datasets: [
        {
          label: OFD_CHART.SERIES_INCOME,
          data: (series || []).map((row) => toSafeNumber(row.income)),
          backgroundColor: colors.incomeFill,
          borderColor: colors.incomeBorder,
          borderWidth: 1,
          maxBarThickness: 28
        },
        {
          label: OFD_CHART.SERIES_EXPENSE,
          data: (series || []).map((row) => toSafeNumber(row.expense)),
          backgroundColor: colors.expenseFill,
          borderColor: colors.expenseBorder,
          borderWidth: 1,
          maxBarThickness: 28
        }
      ]
    };
  }, [series, colors]);

  const chartOptions = useMemo(() => ({
    layout: {
      padding: {
        top: 20,
        right: 96,
        left: 4,
        bottom: 4
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          color: colors.tick
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.parsed?.y;
            if (raw == null || Number.isNaN(raw)) return null;
            return `${ctx.dataset?.label || ''}: ${formatWonDisplay(raw)}`;
          }
        }
      },
      [MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID]: {
        enabled: true,
        formatter: formatWonDisplay,
        fontSize: BAR_VALUE_LABEL_FONT_SIZE,
        color: colors.tick
      },
      [MONEY_FLOW_AVG_LINES_PLUGIN_ID]: {
        enabled: true,
        incomeAvg: monthlyAverages.incomeAvg,
        expenseAvg: monthlyAverages.expenseAvg,
        incomeColor: colors.incomeBorder || colors.incomeFill,
        expenseColor: colors.expenseBorder || colors.expenseFill,
        formatter: formatWonDisplay,
        labelPrefix: OFD_CHART.AVG_PREFIX,
        fontSize: AVG_LINE_LABEL_FONT_SIZE
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: colors.tick }
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid, drawBorder: false },
        ticks: { color: colors.tick, callback: formatAxisTick }
      }
    }
  }), [colors, monthlyAverages]);

  const incomeAvgCaption = `${OFD_CHART.SERIES_INCOME} ${OFD_CHART.AVG_PREFIX} ${formatWonDisplay(monthlyAverages.incomeAvg)}`;
  const expenseAvgCaption = `${OFD_CHART.SERIES_EXPENSE} ${OFD_CHART.AVG_PREFIX} ${formatWonDisplay(monthlyAverages.expenseAvg)}`;

  return (
    <section
      className="money-flow-stage"
      data-testid="money-flow-stage"
      aria-label={OFD_CHART.SECTION_ARIA}
      aria-busy={loading}
    >
      <h2 className="money-flow-stage__title">{OFD_CHART.SECTION_TITLE}</h2>
      {loading ? (
        <div className="money-flow-stage__empty" aria-busy="true">
          <UnifiedLoading type="inline" text={OFD_CHART.LOADING} />
        </div>
      ) : !hasAnyAmount ? (
        <div className="money-flow-stage__empty" data-testid="money-flow-stage-empty">
          <EmptyState title={OFD_CHART.EMPTY} />
        </div>
      ) : (
        <>
          <div className="money-flow-stage__plot" data-testid="money-flow-stage-plot">
            <MGChart
              type="bar"
              height={MONEY_FLOW_CHART_HEIGHT_PX}
              variant="minimal"
              loading={false}
              error={null}
              data={chartData}
              options={chartOptions}
              plugins={MONEY_FLOW_CHART_PLUGINS}
            />
          </div>
          <p
            className="money-flow-stage__avg-caption"
            data-testid="money-flow-stage-avg-caption"
            aria-label={OFD_CHART.AVG_CAPTION_ARIA}
          >
            <span className="money-flow-stage__avg-caption-income">{incomeAvgCaption}</span>
            <span className="money-flow-stage__avg-caption-sep" aria-hidden="true"> · </span>
            <span className="money-flow-stage__avg-caption-expense">{expenseAvgCaption}</span>
          </p>
        </>
      )}
    </section>
  );
};

MoneyFlowStage.propTypes = {
  loading: PropTypes.bool,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      income: PropTypes.number,
      expense: PropTypes.number,
      year: PropTypes.number,
      month: PropTypes.number
    })
  )
};


export default MoneyFlowStage;
