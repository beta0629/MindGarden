/**
 * ERP 대시보드 — 수입·지출 막대 차트
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useMemo } from 'react';
import MGChart from '../../common/MGChart';
import UnifiedLoading from '../../common/UnifiedLoading';

const ERP_INCOME_EXPENSE_CHART_CSS_TOKENS = {
  INCOME_FILL: '--mg-success-400',
  INCOME_BORDER: '--mg-success-600',
  EXPENSE_FILL: '--mg-error-500',
  EXPENSE_BORDER: '--mg-error-600'
};

/**
 * Chart.js Canvas는 var(--token) 문자열을 해석하지 못함 → :root 계산값으로 해석.
 * @returns {{ incomeFill: string, incomeBorder: string, expenseFill: string, expenseBorder: string }}
 */
function readIncomeExpenseChartColorsFromTokens() {
  if (typeof document === 'undefined') {
    return {
      incomeFill: '',
      incomeBorder: '',
      expenseFill: '',
      expenseBorder: ''
    };
  }
  const root = document.documentElement;
  const pick = (varName) =>
    getComputedStyle(root).getPropertyValue(varName).trim() || '';
  return {
    incomeFill: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.INCOME_FILL),
    incomeBorder: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.INCOME_BORDER),
    expenseFill: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.EXPENSE_FILL),
    expenseBorder: pick(ERP_INCOME_EXPENSE_CHART_CSS_TOKENS.EXPENSE_BORDER)
  };
}

/**
 * @param {object} props
 * @param {boolean} props.financeLoading
 * @param {{ totalIncome?: number, totalExpense?: number }|null} props.financialData
 */
const ErpIncomeExpenseBarChartSection = ({ financeLoading, financialData }) => {
  const chartColors = useMemo(() => readIncomeExpenseChartColorsFromTokens(), []);

  const incomeExpenseChartData = useMemo(() => {
    const income = financialData?.totalIncome ?? 0;
    const expense = financialData?.totalExpense ?? 0;
    return {
      labels: ['수입', '지출'],
      datasets: [
        {
          label: '금액',
          data: [income, expense],
          backgroundColor: [chartColors.incomeFill, chartColors.expenseFill],
          borderColor: [chartColors.incomeBorder, chartColors.expenseBorder],
          borderWidth: 1
        }
      ]
    };
  }, [financialData?.totalIncome, financialData?.totalExpense, chartColors]);

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
          ) : (
            <MGChart
              type="bar"
              height={280}
              loading={false}
              error={null}
              data={incomeExpenseChartData}
              options={{
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (v) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(0)}M`
                          : v >= 1000
                            ? `${(v / 1000).toFixed(0)}K`
                            : v
                    }
                  }
                }
              }}
            />
          )}
          <figcaption className="erp-finance-chart__caption">이번 달 수입·지출</figcaption>
        </figure>
      </div>
    </section>
  );
};

export default ErpIncomeExpenseBarChartSection;
