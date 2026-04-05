/**
 * ERP 대시보드 — 수입·지출 막대 차트
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useMemo } from 'react';
import MGChart from '../../common/MGChart';
import { ERP_INCOME_EXPENSE_CHART_HEX } from '../../../constants/charts';

/**
 * @param {object} props
 * @param {boolean} props.financeLoading
 * @param {{ totalIncome?: number, totalExpense?: number }|null} props.financialData
 */
const ErpIncomeExpenseBarChartSection = ({ financeLoading, financialData }) => {
  const incomeExpenseChartData = useMemo(() => {
    const income = financialData?.totalIncome ?? 0;
    const expense = financialData?.totalExpense ?? 0;
    return {
      labels: ['수입', '지출'],
      datasets: [
        {
          label: '금액',
          data: [income, expense],
          backgroundColor: [
            ERP_INCOME_EXPENSE_CHART_HEX.INCOME_FILL,
            ERP_INCOME_EXPENSE_CHART_HEX.EXPENSE_FILL
          ],
          borderColor: [
            ERP_INCOME_EXPENSE_CHART_HEX.INCOME_BORDER,
            ERP_INCOME_EXPENSE_CHART_HEX.EXPENSE_BORDER
          ],
          borderWidth: 1
        }
      ]
    };
  }, [financialData?.totalIncome, financialData?.totalExpense]);

  return (
    <section
      className="erp-finance-chart"
      aria-labelledby="erp-finance-chart-heading"
      aria-label="수입·지출 차트"
    >
      <h3 id="erp-finance-chart-heading" className="erp-finance__section-title">
        수입·지출 비교
      </h3>
      <div className="erp-finance-chart__grid">
        <figure className="erp-finance-chart__item">
          {financeLoading ? (
            <div className="erp-finance-chart__placeholder">차트를 불러오는 중...</div>
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
