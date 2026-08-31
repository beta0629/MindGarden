/**
 * MoneyWorkbench — LEFT income+expense mix 스택 | RIGHT todo. null만 생략.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { OFD_WORKBENCH } from '../../../../constants/operatorFinanceDashboardStrings';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import MoneyOutflowMix from './MoneyOutflowMix';
import MoneyTodoList from './MoneyTodoList';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, amount: number }>} [props.incomeMixItems]
 * @param {Array<{ id: string, label: string, amount: number }>} [props.expenseMixItems]
 * @param {Array<{ id: string, label: string, amount: number }>} [props.mixItems] 하위 호환(지출)
 * @param {number|null} props.pendingConsultation
 * @param {number|null} props.pendingSalary
 * @param {number|null} props.refundAmount
 * @param {string[]} [props.denseFacts]
 */
const MoneyWorkbench = ({
  incomeMixItems = [],
  expenseMixItems,
  mixItems,
  pendingConsultation = null,
  pendingSalary = null,
  refundAmount = null,
  denseFacts = []
}) => {
  const incomeItems = Array.isArray(incomeMixItems) ? incomeMixItems : [];
  const expenseItems = Array.isArray(expenseMixItems)
    ? expenseMixItems
    : (Array.isArray(mixItems) ? mixItems : []);

  const hasIncomeMix = incomeItems.length > 0;
  const hasExpenseMix = expenseItems.length > 0;
  const hasMix = hasIncomeMix || hasExpenseMix;
  const hasTodo =
    (pendingConsultation != null && toSafeNumber(pendingConsultation) !== 0)
    || (pendingSalary != null && pendingSalary > 0)
    || (refundAmount != null && toSafeNumber(refundAmount) !== 0)
    || (Array.isArray(denseFacts) && denseFacts.length > 0);

  if (!hasMix && !hasTodo) {
    return null;
  }

  const single = (hasMix && !hasTodo) || (!hasMix && hasTodo);

  return (
    <div
      className={`money-workbench${single ? ' money-workbench--single' : ''}`}
      data-testid="money-workbench"
    >
      {hasMix ? (
        <div className="money-workbench__left" data-testid="money-workbench-left">
          {hasIncomeMix ? (
            <MoneyOutflowMix
              items={incomeItems}
              polarity="income"
              title={OFD_WORKBENCH.INCOME_MIX_TITLE}
              ariaLabel={OFD_WORKBENCH.INCOME_MIX_ARIA}
              testId="money-income-mix"
            />
          ) : null}
          {hasExpenseMix ? (
            <MoneyOutflowMix
              items={expenseItems}
              polarity="expense"
              title={OFD_WORKBENCH.EXPENSE_MIX_TITLE}
              ariaLabel={OFD_WORKBENCH.EXPENSE_MIX_ARIA}
              testId="money-outflow-mix"
            />
          ) : null}
        </div>
      ) : null}
      {hasTodo ? (
        <MoneyTodoList
          pendingConsultation={pendingConsultation}
          pendingSalary={pendingSalary}
          refundAmount={refundAmount}
          denseFacts={denseFacts}
        />
      ) : null}
    </div>
  );
};

MoneyWorkbench.propTypes = {
  incomeMixItems: PropTypes.array,
  expenseMixItems: PropTypes.array,
  mixItems: PropTypes.array,
  pendingConsultation: PropTypes.number,
  pendingSalary: PropTypes.number,
  refundAmount: PropTypes.number,
  denseFacts: PropTypes.arrayOf(PropTypes.string)
};


export default MoneyWorkbench;
