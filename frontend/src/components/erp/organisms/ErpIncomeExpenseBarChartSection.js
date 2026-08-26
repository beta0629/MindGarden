/**
 * ERP 대시보드 — 수입·지출 막대 차트 (clinic-OS)
 *
 * 실데이터만 사용: financialData.totalIncome / totalExpense (이번 달).
 * 월별 시리즈를 생성하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useMemo } from 'react';
import MGChart from '../../common/MGChart';
import UnifiedLoading from '../../common/UnifiedLoading';

const ERP_INCOME_EXPENSE_CHART_CSS_TOKENS = {
  INCOME_FILL: '--mg-primary-500',
  INCOME_BORDER: '--mg-primary-700',
  EXPENSE_FILL: '--mg-color-error',
  EXPENSE_BORDER: '--mg-error-700',
  GRID: '--mg-color-border-main',
  TICK: '--mg-color-text-secondary'
};

const ERP_INCOME_EXPENSE_CHART_EMPTY_MESSAGE =
  '이번 달 등록된 수입·지출 거래 내역이 없습니다.';

const ERP_INCOME_EXPENSE_CHART_HEIGHT = 240;
const ERP_INCOME_EXPENSE_MAX_BAR_THICKNESS = 48;
const ERP_INCOME_EXPENSE_BAR_BORDER_RADIUS = 6;
const ERP_INCOME_EXPENSE_CATEGORY_PERCENTAGE = 0.55;
const ERP_INCOME_EXPENSE_BAR_PERCENTAGE = 0.7;

const ERP_INCOME_EXPENSE_LABEL_INCOME = '수입';
const ERP_INCOME_EXPENSE_LABEL_EXPENSE = '지출';

/**
 * Chart.js Canvas는 var(--token) 문자열을 해석하지 못함 → :root 계산값으로 해석.
 * @returns {{
 *   incomeFill: string,
 *   incomeBorder: string,
 *   expenseFill: string,
 *   expenseBorder: string,
 *   grid: string,
 *   tick: string
 * }}
 */
function readIncomeExpenseChartColorsFromTokens() {
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
  const pick = (varName) =>
    getComputedStyle(root).getPropertyValue(varName).trim() || '';
  return {
    incomeFill: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.INCOME_FILL),
    incomeBorder: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.INCOME_BORDER),
    expenseFill: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.EXPENSE_FILL),
    expenseBorder: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.EXPENSE_BORDER),
    grid: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.GRID),
    tick: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.TICK)
  };
}

/**
 * Y축 눈금 — K / 만 / 억 가독성.
 * @param {number} value
 * @returns {string|number}
 */
function formatIncomeExpenseAxisTick(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return value;
  }
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
 * @param {boolean} props.financeLoading
 * @param {{ totalIncome?: number, totalExpense?: number }|null} props.financialData
 */
const ErpIncomeExpenseBarChartSection = ({ financeLoading, financialData }) => {
  const chartColors = useMemo(() => readIncomeExpenseChartColorsFromTokens(), []);

  const hasFinancialPayload = financialData != null
    && (financialData.totalIncome != null || financialData.totalExpense != null);

  const income = Number(financialData?.totalIncome) || 0;
  const expense = Number(financialData?.totalExpense) || 0;

  const incomeExpenseChartData = useMemo(() => ({
    labels: [ERP_INCOME_EXPENSE_LABEL_INCOME, ERP_INCOME_EXPENSE_LABEL_EXPENSE],
    datasets: [
      {
        label: '금액',
        data: [income, expense],
        backgroundColor: [chartColors.incomeFill, chartColors.expenseFill],
        borderColor: [chartColors.incomeBorder, chartColors.expenseBorder],
        borderWidth: 1,
        borderRadius: {
          topLeft: ERP_INCOME_EXPENSE_BAR_BORDER_RADIUS,
          topRight: ERP_INCOME_EXPENSE_BAR_BORDER_RADIUS,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: 'bottom',
        maxBarThickness: ERP_INCOME_EXPENSE_MAX_BAR_THICKNESS,
        categoryPercentage: ERP_INCOME_EXPENSE_CATEGORY_PERCENTAGE,
        barPercentage: ERP_INCOME_EXPENSE_BAR_PERCENTAGE
      }
    ]
  }), [income, expense, chartColors]);

  const chartOptions = useMemo(() => ({
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          color: chartColors.tick,
          generateLabels: () => [
            {
              text: ERP_INCOME_EXPENSE_LABEL_INCOME,
              fillStyle: chartColors.incomeFill,
              strokeStyle: chartColors.incomeBorder,
              lineWidth: 1,
              hidden: false,
              index: 0,
              datasetIndex: 0
            },
            {
              text: ERP_INCOME_EXPENSE_LABEL_EXPENSE,
              fillStyle: chartColors.expenseFill,
              strokeStyle: chartColors.expenseBorder,
              lineWidth: 1,
              hidden: false,
              index: 1,
              datasetIndex: 0
            }
          ]
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = ctx.parsed?.y;
            if (raw == null || Number.isNaN(raw)) {
              return null;
            }
            const category = ctx.label || '';
            const formatted = Number(raw).toLocaleString('ko-KR');
            return `${category}: ${formatted}원`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: chartColors.tick
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.grid,
          drawBorder: false
        },
        ticks: {
          color: chartColors.tick,
          callback: formatIncomeExpenseAxisTick
        }
      }
    }
  }), [chartColors]);

  return (
    <section
      className="erp-finance-chart"
      aria-labelledby="erp-finance-chart-heading"
      aria-label="수입·지출 차트"
      aria-busy={financeLoading}
    >
      <h3 id="erp-finance-chart-heading" className="erp-finance__section-title">
        수입·지출 비교
      </h3>
      <div className="erp-finance-chart__grid">
        <figure className="erp-finance-chart__item">
          {financeLoading ? (
            <UnifiedLoading
              type="inline"
              text="데이터를 불러오는 중..."
              className="erp-finance-chart__placeholder"
            />
          ) : !hasFinancialPayload ? (
            <p className="erp-finance-chart__empty" role="status">
              {ERP_INCOME_EXPENSE_CHART_EMPTY_MESSAGE}
            </p>
          ) : (
            <div className="erp-finance-chart__plot">
              <MGChart
                type="bar"
                height={ERP_INCOME_EXPENSE_CHART_HEIGHT}
                loading={false}
                error={null}
                data={incomeExpenseChartData}
                options={chartOptions}
              />
            </div>
          )}
          <figcaption className="erp-finance-chart__caption">이번 달 수입·지출</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default ErpIncomeExpenseBarChartSection;
