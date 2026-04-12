/**
 * ERP 대시보드 — 최근 거래 테이블
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import {
  buildRecentTransactionRowKey,
  formatRecentTransactionDate
} from '../../../utils/erpFinanceDisplay';
import UnifiedLoading from '../../common/UnifiedLoading';
import { ErpSafeNumber, ErpSafeText } from '../common';

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
    aria-busy={financeLoading}
  >
    <h3 id="erp-finance-tx-heading" className="erp-finance__section-title">
      최근 거래
    </h3>
    <div className="erp-finance-tx__table-wrap">
      {financeLoading ? (
        <UnifiedLoading
          type="inline"
          text="데이터를 불러오는 중..."
          className="erp-finance-tx__empty"
        />
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
              const rowKey = buildRecentTransactionRowKey(tx);
              return (
                <tr key={rowKey}>
                  <td>
                    <ErpSafeText value={formatRecentTransactionDate(tx)} />
                  </td>
                  <td>
                    <ErpSafeText value={isIncome ? '수입' : '지출'} />
                  </td>
                  <td
                    className={
                      isIncome ? 'erp-finance-tx__amount--income' : 'erp-finance-tx__amount--expense'
                    }
                  >
                    <ErpSafeNumber value={tx.amount ?? 0} />
                  </td>
                  <td>
                    <ErpSafeText
                      value={tx.description ?? tx.memo ?? tx.remarks}
                      fallback="—"
                    />
                  </td>
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
