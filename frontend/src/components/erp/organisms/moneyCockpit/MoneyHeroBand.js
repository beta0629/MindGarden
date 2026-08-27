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
 */
const MoneyHeroBand = ({ loading = false, income = 0, expense = 0, remaining = 0 }) => {
  const cells = [
    {
      id: 'income',
      label: OFD_HERO.INCOME_LABEL,
      caption: OFD_HERO.INCOME_CAPTION,
      value: income,
      remainingTone: false
    },
    {
      id: 'expense',
      label: OFD_HERO.EXPENSE_LABEL,
      caption: OFD_HERO.EXPENSE_CAPTION,
      value: expense,
      remainingTone: false
    },
    {
      id: 'remaining',
      label: OFD_HERO.REMAINING_LABEL,
      caption: OFD_HERO.REMAINING_CAPTION,
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
          <p className="money-hero-band__caption">{cell.caption}</p>
        </article>
      ))}
    </section>
  );
};

MoneyHeroBand.propTypes = {
  loading: PropTypes.bool,
  income: PropTypes.number,
  expense: PropTypes.number,
  remaining: PropTypes.number
};


export default MoneyHeroBand;
