/**
 * LedgerSummaryStrip — 들어온 합 / 나간 합 / 남은 돈 (formatKrw)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { formatKrw } from '../../../../utils/erpFinancialAmountStack';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { FM_SUMMARY, FM_LOADING } from '../../../../constants/financialManagementStrings';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalIncome
 * @param {number} props.totalExpense
 * @param {number} props.remaining
 */
const LedgerSummaryStrip = ({
  loading = false,
  totalIncome = 0,
  totalExpense = 0,
  remaining = 0
}) => {
  const remainingNum = toSafeNumber(remaining);
  const remainingClass =
    remainingNum < 0
      ? 'operator-ledger-summary__amount operator-ledger-summary__amount--remaining-negative'
      : 'operator-ledger-summary__amount operator-ledger-summary__amount--remaining-positive';

  const cells = [
    {
      id: 'income',
      label: FM_SUMMARY.INCOME_LABEL,
      amount: formatKrw(toSafeNumber(totalIncome)),
      className: 'operator-ledger-summary__amount'
    },
    {
      id: 'expense',
      label: FM_SUMMARY.EXPENSE_LABEL,
      amount: formatKrw(toSafeNumber(totalExpense)),
      className: 'operator-ledger-summary__amount'
    },
    {
      id: 'remaining',
      label: FM_SUMMARY.REMAINING_LABEL,
      amount: formatKrw(remainingNum),
      className: remainingClass
    }
  ];

  return (
    <section
      className="operator-ledger-summary"
      data-testid="operator-ledger-summary"
      aria-label={FM_SUMMARY.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article key={cell.id} className="operator-ledger-summary__cell">
          <p className="operator-ledger-summary__label">{cell.label}</p>
          {loading ? (
            <UnifiedLoading type="inline" text={FM_LOADING.INLINE} />
          ) : (
            <p className={cell.className} data-testid={`ledger-summary-${cell.id}`}>
              {cell.amount}
            </p>
          )}
        </article>
      ))}
    </section>
  );
};

LedgerSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalIncome: PropTypes.number,
  totalExpense: PropTypes.number,
  remaining: PropTypes.number
};

export default LedgerSummaryStrip;
