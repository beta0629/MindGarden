/**
 * LedgerSummaryStrip — 들어온 돈 / 나간 돈 / 남은 돈 (KpiNumeral + caption)
 * Visual SSOT: MoneyHeroBand — vertical dividers, surface-secondary, captions.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import KpiNumeral from '../../../dashboard-v2/atoms/KpiNumeral';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { FM_SUMMARY, FM_LOADING } from '../../../../constants/financialManagementStrings';
import { formatWonAmount } from '../../organisms/moneyCockpit/moneyCockpitData';

/**
 * @param {object} props
 * @param {boolean} [props.loading]
 * @param {number} props.totalIncome
 * @param {number} props.totalExpense
 * @param {number} props.remaining
 * @param {string} [props.incomeCaption]
 * @param {string} [props.expenseCaption]
 * @param {string} [props.remainingCaption]
 */
const LedgerSummaryStrip = ({
  loading = false,
  totalIncome = 0,
  totalExpense = 0,
  remaining = 0,
  incomeCaption = '',
  expenseCaption = '',
  remainingCaption = ''
}) => {
  const cells = [
    {
      id: 'income',
      label: FM_SUMMARY.INCOME_LABEL,
      caption: incomeCaption,
      value: totalIncome,
      cellModifier: 'operator-ledger-summary__cell--income'
    },
    {
      id: 'expense',
      label: FM_SUMMARY.EXPENSE_LABEL,
      caption: expenseCaption,
      value: totalExpense,
      cellModifier: 'operator-ledger-summary__cell--expense'
    },
    {
      id: 'remaining',
      label: FM_SUMMARY.REMAINING_LABEL,
      caption: remainingCaption,
      value: remaining,
      cellModifier: 'operator-ledger-summary__cell--remaining'
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
        <article
          key={cell.id}
          className={`operator-ledger-summary__cell ${cell.cellModifier}`}
        >
          <p className="operator-ledger-summary__label">{cell.label}</p>
          <div
            className="operator-ledger-summary__amount"
            data-testid={`ledger-summary-${cell.id}`}
          >
            {loading ? (
              <UnifiedLoading type="inline" text={FM_LOADING.INLINE} />
            ) : (
              <KpiNumeral
                value={formatWonAmount(toSafeNumber(cell.value))}
                unit={FM_SUMMARY.UNIT}
              />
            )}
          </div>
          {cell.caption ? (
            <p className="operator-ledger-summary__caption">{cell.caption}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
};

LedgerSummaryStrip.propTypes = {
  loading: PropTypes.bool,
  totalIncome: PropTypes.number,
  totalExpense: PropTypes.number,
  remaining: PropTypes.number,
  incomeCaption: PropTypes.string,
  expenseCaption: PropTypes.string,
  remainingCaption: PropTypes.string
};

export default LedgerSummaryStrip;
