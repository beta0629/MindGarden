/**
 * MoneyLedgerStrip — 최근 돈 움직임 (일자·내용·들어옴·나감)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  OFD_LEDGER,
  OFD_LINKS,
  OFD_LOADING
} from '../../../../constants/operatorFinanceDashboardStrings';
import {
  buildRecentTransactionRowKey,
  formatRecentTransactionDate
} from '../../../../utils/erpFinanceDisplay';
import { formatWonDisplay, isIncomeTransaction } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import UnifiedLoading from '../../../common/UnifiedLoading';
import MGButton from '../../../common/MGButton';
import { ErpSafeText } from '../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {Array<object>} props.transactions
 */
const MoneyLedgerStrip = ({ loading = false, transactions = [] }) => {
  const navigate = useNavigate();
  const rows = Array.isArray(transactions)
    ? transactions.slice(0, OFD_LEDGER.MAX_ROWS)
    : [];

  return (
    <section
      className="money-ledger"
      data-testid="money-ledger-strip"
      aria-label={OFD_LEDGER.ARIA}
      aria-busy={loading}
    >
      <div className="money-ledger__header">
        <h2 className="money-ledger__title">{OFD_LEDGER.TITLE}</h2>
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'money-ledger__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => navigate(OFD_LINKS.FINANCIAL.path)}
          preventDoubleClick={false}
        >
          {OFD_LEDGER.VIEW_MORE}
        </MGButton>
      </div>
      <div className="money-ledger__table-wrap">
        {loading ? (
          <UnifiedLoading type="inline" text={OFD_LOADING.FINANCE} />
        ) : rows.length === 0 ? (
          <p className="money-ledger__empty" role="status">
            {OFD_LEDGER.EMPTY}
          </p>
        ) : (
          <table className="money-ledger__table" aria-label={OFD_LEDGER.ARIA}>
            <thead>
              <tr>
                <th scope="col">{OFD_LEDGER.COL_DATE}</th>
                <th scope="col">{OFD_LEDGER.COL_DESC}</th>
                <th scope="col" className="money-ledger__amount">
                  {OFD_LEDGER.COL_IN}
                </th>
                <th scope="col" className="money-ledger__amount">
                  {OFD_LEDGER.COL_OUT}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const income = isIncomeTransaction(tx);
                const amount = toSafeNumber(tx?.amount);
                const amountText = formatWonDisplay(amount);
                return (
                  <tr key={buildRecentTransactionRowKey(tx)}>
                    <td>
                      <ErpSafeText value={formatRecentTransactionDate(tx)} />
                    </td>
                    <td className="money-ledger__desc">
                      <ErpSafeText
                        value={tx.description ?? tx.memo ?? tx.remarks}
                        fallback={OFD_LEDGER.DASH}
                      />
                    </td>
                    <td
                      className={
                        income
                          ? 'money-ledger__amount money-ledger__amount--in'
                          : 'money-ledger__amount'
                      }
                    >
                      {income ? amountText : OFD_LEDGER.DASH}
                    </td>
                    <td
                      className={
                        !income
                          ? 'money-ledger__amount money-ledger__amount--out'
                          : 'money-ledger__amount'
                      }
                    >
                      {!income ? amountText : OFD_LEDGER.DASH}
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

MoneyLedgerStrip.propTypes = {
  loading: PropTypes.bool,
  transactions: PropTypes.arrayOf(PropTypes.object)
};


export default MoneyLedgerStrip;
