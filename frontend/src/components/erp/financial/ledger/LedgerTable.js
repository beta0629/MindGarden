/**
 * LedgerTable — 일시 / 내용(카테고리·주문·결제 secondary) / 들어온 / 나간 / 작업(상세 + ⋮)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import EmptyState from '../../../common/EmptyState';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';
import { formatKrw, FINANCIAL_CARD_MERCHANT_FEE_LABEL, FINANCIAL_CARD_NET_DEPOSIT_LABEL } from '../../../../utils/erpFinancialAmountStack';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import {
  formatLedgerDateTime,
  localizePaymentMethodParens,
  resolveLedgerShopIdentifiers,
  isLedgerRefundOrRevenueCancelRow
} from '../../../../utils/erpFinanceDisplay';
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
        <colgroup>
          <col className="operator-ledger-table__col-date" />
          <col className="operator-ledger-table__col-desc" />
          <col className="operator-ledger-table__col-income" />
          <col className="operator-ledger-table__col-expense" />
          <col className="operator-ledger-table__col-actions" />
        </colgroup>
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
            const desc = localizePaymentMethodParens(
              toDisplayString(tx.description, FM_SUMMARY.DASH)
            );
            const categoryLabel = getCategoryDisplayLabel(tx.category);
            const { orderPublicId, paymentId } = resolveLedgerShopIdentifiers(tx);
            const isRefundRow = isLedgerRefundOrRevenueCancelRow(tx);
            const rowKey = tx.id != null ? String(tx.id) : `${desc}-${tx.transactionDate}`;
            const datetimeLabel = formatLedgerDateTime(tx);
            return (
              <tr
                key={rowKey}
                className={isRefundRow ? 'operator-ledger-table__row--refund' : undefined}
                data-refund-row={isRefundRow ? 'true' : undefined}
              >
                <td>{datetimeLabel}</td>
                <td className="operator-ledger-table__col--desc">
                  <div className="operator-ledger-table__desc">
                    <button
                      type="button"
                      className={
                        isRefundRow
                          ? 'operator-ledger-table__desc-primary operator-ledger-table__desc-primary--refund'
                          : 'operator-ledger-table__desc-primary'
                      }
                      onClick={() => onView?.(tx)}
                    >
                      {isRefundRow ? (
                        <span className="operator-ledger-table__refund-chip" aria-hidden="true">
                          {FM_TX_TABLE_LABELS.REFUND_BADGE}
                        </span>
                      ) : null}
                      {desc}
                    </button>
                    {categoryLabel && categoryLabel !== '-' ? (
                      <span className="operator-ledger-table__desc-secondary">{categoryLabel}</span>
                    ) : null}
                    {orderPublicId ? (
                      <span className="operator-ledger-table__desc-secondary">
                        {FM_TX_TABLE_LABELS.ORDER_ID}
                        {' '}
                        {orderPublicId}
                      </span>
                    ) : null}
                    {paymentId ? (
                      <span className="operator-ledger-table__desc-secondary">
                        {FM_TX_TABLE_LABELS.PAYMENT_ID}
                        {' '}
                        {paymentId}
                      </span>
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
                    <span
                      className={
                        isRefundRow
                          ? 'operator-ledger-table__amount--expense operator-ledger-table__amount--refund'
                          : 'operator-ledger-table__amount--expense'
                      }
                    >
                      {formatKrw(amount)}
                    </span>
                  ) : (
                    <span className="operator-ledger-table__dash">{FM_SUMMARY.DASH}</span>
                  )}
                </td>
                <td>
                  <div className="operator-ledger-table__actions" role="group" aria-label={FM_ROW_ACTIONS.GROUP}>
                    <MGButton
                      type="button"
                      variant="primary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => onView?.(tx)}
                      aria-label={FM_ROW_ACTIONS.VIEW}
                      preventDoubleClick={false}
                    >
                      {FM_ROW_ACTIONS.VIEW}
                    </MGButton>
                    <EntityRowActions
                      layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
                      ariaLabel={FM_ROW_ACTIONS.MORE}
                      items={[
                        {
                          id: 'edit',
                          label: FM_ROW_ACTIONS.EDIT,
                          onClick: () => onEdit?.(tx)
                        },
                        {
                          id: 'delete',
                          label: FM_ROW_ACTIONS.DELETE,
                          onClick: () => onDelete?.(tx),
                          variant: 'destructive'
                        }
                      ]}
                    />
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
