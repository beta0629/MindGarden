/**
 * LedgerTable — 일자 / 내용(카테고리 secondary) / 들어온 금액 / 나간 금액
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import EmptyState from '../../../common/EmptyState';
import { formatKrw, FINANCIAL_CARD_MERCHANT_FEE_LABEL, FINANCIAL_CARD_NET_DEPOSIT_LABEL } from '../../../../utils/erpFinancialAmountStack';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { formatLocalDateYmd } from '../../../../utils/erpFinanceDisplay';
import {
  FM_TX_TABLE_LABELS,
  FM_SUMMARY,
  FM_TX_LIST_SECTION,
  FM_ROW_ACTIONS,
  FM_RECORD_CTA,
  getCategoryDisplayLabel
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {string|Date|null|undefined} dateValue
 * @returns {string}
 */
function formatLedgerDate(dateValue) {
  if (!dateValue) {
    return FM_SUMMARY.DASH;
  }
  const raw = String(dateValue);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  try {
    return formatLocalDateYmd(new Date(dateValue));
  } catch {
    return FM_SUMMARY.DASH;
  }
}

/**
 * @param {object} props
 * @param {Array<object>} props.transactions
 * @param {boolean} [props.loading]
 * @param {boolean} [props.hasSearch]
 * @param {() => void} [props.onRecordClick]
 * @param {(tx: object) => void} [props.onEdit]
 * @param {(tx: object) => void} [props.onDelete]
 * @param {(tx: object) => void} [props.onView]
 */
const LedgerTable = ({
  transactions = [],
  loading = false,
  hasSearch = false,
  onRecordClick,
  onEdit,
  onDelete,
  onView
}) => {
  if (!loading && (!transactions || transactions.length === 0)) {
    return (
      <div className="operator-ledger-empty" data-testid="operator-ledger-empty">
        <EmptyState
          title={hasSearch ? FM_TX_LIST_SECTION.EMPTY_SEARCH : FM_TX_LIST_SECTION.EMPTY}
        />
        {!hasSearch && onRecordClick ? (
          <p className="operator-ledger-empty__text">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onRecordClick}
              preventDoubleClick={false}
            >
              {FM_TX_LIST_SECTION.EMPTY_CTA || FM_RECORD_CTA}
            </MGButton>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="operator-ledger-table-wrap" data-testid="operator-ledger-table">
      <table className="operator-ledger-table">
        <thead>
          <tr>
            <th scope="col">{FM_TX_TABLE_LABELS.TRANSACTION_DATE}</th>
            <th scope="col">{FM_TX_TABLE_LABELS.DESCRIPTION}</th>
            <th scope="col" className="operator-ledger-table__col--amount">
              {FM_TX_TABLE_LABELS.INCOME_AMOUNT}
            </th>
            <th scope="col" className="operator-ledger-table__col--amount">
              {FM_TX_TABLE_LABELS.EXPENSE_AMOUNT}
            </th>
            <th scope="col">{FM_TX_TABLE_LABELS.ACTIONS}</th>
          </tr>
        </thead>
        <tbody>
          {(transactions || []).map((tx) => {
            const isIncome = String(tx.transactionType || '').toUpperCase() === 'INCOME';
            const amount = toSafeNumber(tx.amount);
            const fee = toSafeNumber(tx.cardMerchantFeeAmount);
            const netDeposit = tx.cardNetDepositAmount != null
              ? toSafeNumber(tx.cardNetDepositAmount)
              : (fee > 0 ? amount - fee : null);
            const desc = toDisplayString(tx.description, FM_SUMMARY.DASH);
            const categoryLabel = getCategoryDisplayLabel(tx.category);
            return (
              <tr key={tx.id != null ? String(tx.id) : `${desc}-${tx.transactionDate}`}>
                <td>{formatLedgerDate(tx.transactionDate)}</td>
                <td>
                  <div className="operator-ledger-table__desc">
                    <button
                      type="button"
                      className="operator-ledger-table__desc-primary"
                      onClick={() => onView?.(tx)}
                    >
                      {desc}
                    </button>
                    {categoryLabel && categoryLabel !== '-' ? (
                      <span className="operator-ledger-table__desc-secondary">{categoryLabel}</span>
                    ) : null}
                  </div>
                </td>
                <td className="operator-ledger-table__col--amount">
                  {isIncome ? (
                    <div className="operator-ledger-table__amount-stack">
                      <span className="operator-ledger-table__amount--income">{formatKrw(amount)}</span>
                      {fee > 0 ? (
                        <>
                          <span className="operator-ledger-table__amount-meta">
                            {FINANCIAL_CARD_MERCHANT_FEE_LABEL}
                            {' '}
                            {formatKrw(fee)}
                          </span>
                          {netDeposit != null ? (
                            <span className="operator-ledger-table__amount-meta">
                              {FINANCIAL_CARD_NET_DEPOSIT_LABEL}
                              {' '}
                              {formatKrw(netDeposit)}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <span className="operator-ledger-table__dash">{FM_SUMMARY.DASH}</span>
                  )}
                </td>
                <td className="operator-ledger-table__col--amount">
                  {!isIncome ? (
                    <span className="operator-ledger-table__amount--expense">{formatKrw(amount)}</span>
                  ) : (
                    <span className="operator-ledger-table__dash">{FM_SUMMARY.DASH}</span>
                  )}
                </td>
                <td>
                  <div className="operator-ledger-table__actions" role="group" aria-label={FM_ROW_ACTIONS.GROUP}>
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => onEdit?.(tx)}
                      aria-label={FM_ROW_ACTIONS.EDIT}
                      preventDoubleClick={false}
                    >
                      {FM_ROW_ACTIONS.EDIT}
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => onDelete?.(tx)}
                      aria-label={FM_ROW_ACTIONS.DELETE}
                      preventDoubleClick={false}
                    >
                      {FM_ROW_ACTIONS.DELETE}
                    </MGButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

LedgerTable.propTypes = {
  transactions: PropTypes.array,
  loading: PropTypes.bool,
  hasSearch: PropTypes.bool,
  onRecordClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default LedgerTable;
