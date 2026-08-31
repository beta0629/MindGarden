/**
 * MoneyOutflowMix — 들어온 곳 / 나간 곳 카테고리 가로 바 리스트
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { OFD_WORKBENCH } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatWonDisplay } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { ErpSafeText } from '../../common';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, amount: number }>} props.items
 * @param {'income'|'expense'} [props.polarity]
 * @param {string} [props.title]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.testId]
 */
const MoneyOutflowMix = ({
  items = [],
  polarity = 'expense',
  title = OFD_WORKBENCH.EXPENSE_MIX_TITLE,
  ariaLabel = OFD_WORKBENCH.EXPENSE_MIX_ARIA,
  testId = 'money-outflow-mix'
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const maxAmount = Math.max(...items.map((item) => toSafeNumber(item.amount)), 1);
  const polarityMod = polarity === 'income'
    ? 'money-outflow-mix--income'
    : 'money-outflow-mix--expense';

  return (
    <section
      className={`money-workbench__panel money-outflow-mix ${polarityMod}`}
      data-testid={testId}
      data-polarity={polarity}
      aria-label={ariaLabel}
    >
      <h2 className="money-workbench__title">{title}</h2>
      <ul className="money-outflow-mix__list">
        {items.map((item) => {
          const amount = toSafeNumber(item.amount);
          const pct = Math.min(100, Math.round((amount / maxAmount) * 100));
          return (
            <li key={item.id} className="money-outflow-mix__row">
              <span className="money-outflow-mix__label">
                <ErpSafeText value={item.label} />
              </span>
              <span className="money-outflow-mix__track" aria-hidden="true">
                <span
                  className="money-outflow-mix__fill"
                  style={{ '--money-outflow-pct': `${pct}%` }}
                />
              </span>
              <span className="money-outflow-mix__amount">
                {formatWonDisplay(amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

MoneyOutflowMix.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ),
  polarity: PropTypes.oneOf(['income', 'expense']),
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  testId: PropTypes.string
};


export default MoneyOutflowMix;
