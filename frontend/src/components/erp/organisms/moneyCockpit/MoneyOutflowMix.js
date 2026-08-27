/**
 * MoneyOutflowMix — 이번 달 돈이 나간 곳 (가로 바 리스트)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { OFD_WORKBENCH } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatWonAmount } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { ErpSafeText } from '../../common';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, amount: number }>} props.items
 */
const MoneyOutflowMix = ({ items = [] }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const maxAmount = Math.max(...items.map((item) => toSafeNumber(item.amount)), 1);

  return (
    <section
      className="money-workbench__panel"
      data-testid="money-outflow-mix"
      aria-label={OFD_WORKBENCH.MIX_ARIA}
    >
      <h2 className="money-workbench__title">{OFD_WORKBENCH.MIX_TITLE}</h2>
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
                {formatWonAmount(amount)}원
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
  )
};


export default MoneyOutflowMix;
