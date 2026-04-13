/**
 * ERP 대시보드 — 최근 거래 테이블
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import { useNavigate } from 'react-router-dom';
import {
  buildRecentTransactionRowKey,
  formatRecentTransactionDate
} from '../../../utils/erpFinanceDisplay';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';
import { ErpSafeNumber, ErpSafeText } from '../common';

const ERP_FINANCIAL_LIST_PATH = '/erp/financial';
const ERP_FINANCIAL_DATE_RANGE_QUERY = 'dateRange';
const ERP_FINANCIAL_DATE_RANGE_MONTH = 'MONTH';

/**
 * @param {object} props
 * @param {boolean} props.financeLoading
 * @param {Array<object>} props.recentTransactions
 * @param {string} props.recentTransactionsSubtitle
 * @param {string} props.recentTransactionsPeriodChipLabel
 */
const ErpRecentTransactionsTable = ({
  financeLoading,
  recentTransactions,
  recentTransactionsSubtitle,
  recentTransactionsPeriodChipLabel
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate(`${ERP_FINANCIAL_LIST_PATH}?${ERP_FINANCIAL_DATE_RANGE_QUERY}=${ERP_FINANCIAL_DATE_RANGE_MONTH}`);
  };

  const handlePeriodChipClick = (e) => {
    e.preventDefault();
  };

  return (
    <section
      className="erp-finance-tx"
      aria-labelledby="erp-finance-tx-heading"
      aria-label="최근 거래 목록"
      aria-busy={financeLoading}
    >
      <div className="erp-finance-tx__header">
        <div className="erp-finance-tx__header-text">
          <h3 id="erp-finance-tx-heading" className="erp-finance__section-title erp-finance-tx__title">
            최근 거래
          </h3>
          <p className="erp-finance-tx__subtitle">{recentTransactionsSubtitle}</p>
        </div>
        <div className="erp-finance-tx__header-actions">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            tabIndex={0}
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className:
                'erp-finance-tx__period-chip mg-erp-filter-badge mg-erp-filter-badge--selected'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handlePeriodChipClick}
            preventDoubleClick={false}
            aria-label={`조회 기간: ${recentTransactionsPeriodChipLabel} (읽기 전용)`}
          >
            {recentTransactionsPeriodChipLabel}
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleViewAll}
            preventDoubleClick={false}
            aria-label="재무 관리에서 전체 거래 보기"
          >
            전체 보기
          </MGButton>
        </div>
      </div>
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
};

export default ErpRecentTransactionsTable;
