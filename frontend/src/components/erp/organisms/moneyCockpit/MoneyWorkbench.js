/**
 * MoneyWorkbench — LEFT mix(7) | RIGHT todo(5). 빈 패널 생략.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import MoneyOutflowMix from './MoneyOutflowMix';
import MoneyTodoList from './MoneyTodoList';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, amount: number }>} props.mixItems
 * @param {number|null} props.pendingConsultation
 * @param {number|null} props.pendingSalary
 * @param {number|null} props.refundAmount
 */
const MoneyWorkbench = ({
  mixItems = [],
  pendingConsultation = null,
  pendingSalary = null,
  refundAmount = null
}) => {
  const hasMix = Array.isArray(mixItems) && mixItems.length > 0;
  const hasTodo =
    (pendingConsultation != null && pendingConsultation > 0)
    || (pendingSalary != null && pendingSalary > 0)
    || (refundAmount != null && refundAmount > 0);

  if (!hasMix && !hasTodo) {
    return null;
  }

  const single = (hasMix && !hasTodo) || (!hasMix && hasTodo);

  return (
    <div
      className={`money-workbench${single ? ' money-workbench--single' : ''}`}
      data-testid="money-workbench"
    >
      {hasMix ? <MoneyOutflowMix items={mixItems} /> : null}
      {hasTodo ? (
        <MoneyTodoList
          pendingConsultation={pendingConsultation}
          pendingSalary={pendingSalary}
          refundAmount={refundAmount}
        />
      ) : null}
    </div>
  );
};

MoneyWorkbench.propTypes = {
  mixItems: PropTypes.array,
  pendingConsultation: PropTypes.number,
  pendingSalary: PropTypes.number,
  refundAmount: PropTypes.number
};


export default MoneyWorkbench;
