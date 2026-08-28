/**
 * MoneyHeroBand — 들어온 돈 / 나간 돈 / 남은 돈 (KpiNumeral h1)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import KpiNumeral from '../../../dashboard-v2/atoms/KpiNumeral';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { OFD_HERO, OFD_LOADING } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatWonAmount } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {number} props.income
 * @param {number} props.expense
 * @param {number} props.remaining
 * @param {string} [props.incomeCaption]
 * @param {string} [props.expenseCaption]
 * @param {string} [props.remainingCaption]
 */
const MoneyHeroBand = ({
  loading = false,
  income = 0,
  expense = 0,
  remaining = 0,
  incomeCaption = '',
  expenseCaption = '',
  remainingCaption = ''
}) => {
  const cells = [
    {
      id: 'income',
      label: OFD_HERO.INCOME_LABEL,
      caption: incomeCaption,
      value: income,
      remainingTone: false
    },
    {
      id: 'expense',
      label: OFD_HERO.EXPENSE_LABEL,
      caption: expenseCaption,
      value: expense,
      remainingTone: false
    },
    {
      id: 'remaining',
      label: OFD_HERO.REMAINING_LABEL,
      caption: remainingCaption,
      value: remaining,
      remainingTone: true
    }
  ];

  return (
    <section
      className="money-hero-band"
      data-testid="money-hero-band"
      aria-label={OFD_HERO.BAND_ARIA}
      aria-busy={loading}
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className={`money-hero-band__cell${cell.remainingTone ? ' money-hero-band__cell--remaining' : ''}`}
        >
          <p className="money-hero-band__label">{cell.label}</p>
          <div className="money-hero-band__amount">
            {loading ? (
              <UnifiedLoading type="inline" text={OFD_LOADING.FINANCE} />
            ) : (
              <KpiNumeral
                value={formatWonAmount(toSafeNumber(cell.value))}
                unit={OFD_HERO.UNIT}
              />
            )}
          </div>
          {cell.caption ? (
            <p className="money-hero-band__caption">{cell.caption}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
};

MoneyHeroBand.propTypes = {
  loading: PropTypes.bool,
  income: PropTypes.number,
  expense: PropTypes.number,
  remaining: PropTypes.number,
  incomeCaption: PropTypes.string,
  expenseCaption: PropTypes.string,
  remainingCaption: PropTypes.string
};


export default MoneyHeroBand;
