/**
 * ERP 대시보드 — 수입·지출 요약 KPI (B0KlA 카드)
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatUtils';

/**
 * @param {object} props
 * @param {string|null} props.financeError
 * @param {boolean} props.financeLoading
 * @param {{ totalIncome?: number, totalExpense?: number, netProfit?: number }|null} props.financialData
 */
const ErpIncomeExpenseSummarySection = ({ financeError, financeLoading, financialData }) => {
  const isNetProfitNegative = financialData != null && (financialData.netProfit ?? 0) < 0;

  return (
    <section
      className="erp-finance-summary"
      aria-labelledby="erp-finance-summary-heading"
      aria-label="수입·지출 요약"
    >
      <h2 id="erp-finance-summary-heading" className="erp-finance__section-title">
        수입·지출 요약
      </h2>
      {financeError && (
        <div className="erp-finance-summary__error" role="alert">
          {financeError}
        </div>
      )}
      {!financeError && (
        <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--summary">
          <article className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
            <div className="mg-v2-ad-b0kla__chart-header">
              <span className="mg-v2-erp-dashboard-kpi-label">수입</span>
              <TrendingUp
                size={24}
                aria-hidden
                className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success"
              />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className="mg-v2-erp-dashboard-kpi-value">
                {financeLoading
                  ? '—'
                  : financialData != null
                    ? formatCurrency(financialData.totalIncome ?? 0)
                    : '0원'}
              </div>
              <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
            </div>
          </article>
          <article className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
            <div className="mg-v2-ad-b0kla__chart-header">
              <span className="mg-v2-erp-dashboard-kpi-label">지출</span>
              <TrendingDown
                size={24}
                aria-hidden
                className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--error"
              />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className="mg-v2-erp-dashboard-kpi-value">
                {financeLoading
                  ? '—'
                  : financialData != null
                    ? formatCurrency(financialData.totalExpense ?? 0)
                    : '0원'}
              </div>
              <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
            </div>
          </article>
          <article
            className={`mg-v2-ad-b0kla__card ${isNetProfitNegative ? 'mg-v2-ad-b0kla__card--accent-error' : 'mg-v2-ad-b0kla__card--accent-primary'}`}
          >
            <div className="mg-v2-ad-b0kla__chart-header">
              <span className="mg-v2-erp-dashboard-kpi-label">순이익</span>
              <BarChart3
                size={24}
                aria-hidden
                className={`mg-v2-erp-dashboard-kpi-icon ${isNetProfitNegative ? 'mg-v2-erp-dashboard-kpi-icon--error' : 'mg-v2-erp-dashboard-kpi-icon--primary'}`}
              />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className="mg-v2-erp-dashboard-kpi-value">
                {financeLoading
                  ? '—'
                  : financialData != null
                    ? formatCurrency(Math.abs(financialData.netProfit ?? 0))
                    : '0원'}
              </div>
              <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

export default ErpIncomeExpenseSummarySection;
