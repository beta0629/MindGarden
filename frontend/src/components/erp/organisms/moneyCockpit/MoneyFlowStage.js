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
import { OFD_CHART } from '../../../../constants/operatorFinanceDashboardStrings';
import { toSafeNumber } from '../../../../utils/safeDisplay';

/** 데스크톱 차트 기준 높이(px) — CSS clamp가 실제 레이아웃을 지배 */
const MONEY_FLOW_CHART_HEIGHT_PX = 480;

const CHART_TOKEN_VARS = {
  INCOME_FILL: '--mg-primary-500',
  INCOME_BORDER: '--mg-primary-700',
  EXPENSE_FILL: '--mg-color-error',
  EXPENSE_BORDER: '--mg-error-700',
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
 * @param {number} value
 * @returns {string|number}
 */
function formatAxisTick(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n >= 100000000) {
    return `${(n / 100000000).toFixed(n % 100000000 === 0 ? 0 : 1)}억`;
  }
  if (n >= 10000) {
    return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(0)}K`;
  }
  return n;
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
            return `${ctx.dataset?.label || ''}: ${Number(raw).toLocaleString('ko-KR')}원`;
          }
        }
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
  }), [colors]);

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
        <div className="money-flow-stage__plot" data-testid="money-flow-stage-plot">
          <MGChart
            type="bar"
            height={MONEY_FLOW_CHART_HEIGHT_PX}
            variant="minimal"
            loading={false}
            error={null}
            data={chartData}
            options={chartOptions}
          />
        </div>
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
      expense: PropTypes.number
    })
  )
};


export default MoneyFlowStage;
