/**
 * ERP 대시보드 — 최근 거래 테이블
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { formatCurrency } from '../../../utils/formatUtils';
import {
  buildRecentTransactionRowKey,
  formatRecentTransactionDate
} from '../../../utils/erpFinanceDisplay';

/**
 * @param {object} props
 * @param {boolean} props.financeLoading
 * @param {Array<object>} props.recentTransactions
 */
const ErpRecentTransactionsTable = ({ financeLoading, recentTransactions }) => (
  <section
    className="erp-finance-tx"
    aria-labelledby="erp-finance-tx-heading"
    aria-label="최근 거래 목록"
  >
    <h3 id="erp-finance-tx-heading" className="erp-finance__section-title">
      최근 거래
    </h3>
    <div className="erp-finance-tx__table-wrap">
      {financeLoading ? (
        <p className="erp-finance-tx__empty">불러오는 중...</p>
      ) : recentTransactions.length === 0 ? (
        <p className="erp-finance-tx__empty">최근 거래 내역이 없습니다.</p>
      ) : (
        <table className="erp-finance-tx__table" aria-label="최근 거래 목록">
          <thead>
            <tr>
              <th scope="col">날짜</th>
              <th scope="col">구분</th>
              <th scope="col">금액</th>
              <th scope="col">적요</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx) => {
              const isIncome =
                tx.type === 'INCOME' ||
                tx.type === 'income' ||
                tx.transactionType === 'INCOME' ||
                tx.transactionType === 'income';
              const descText = tx.description ?? tx.memo ?? tx.remarks;
              let descDisplay = '—';
              if (descText != null) {
                descDisplay =
                  typeof descText === 'object' ? JSON.stringify(descText) : String(descText);
              }
              const rowKey = buildRecentTransactionRowKey(tx);
              return (
                <tr key={rowKey}>
                  <td>{formatRecentTransactionDate(tx)}</td>
                  <td>{isIncome ? '수입' : '지출'}</td>
                  <td
                    className={
                      isIncome ? 'erp-finance-tx__amount--income' : 'erp-finance-tx__amount--expense'
                    }
                  >
                    {formatCurrency(tx.amount ?? 0)}
                  </td>
                  <td>{descDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  </section>
);

export default ErpRecentTransactionsTable;
