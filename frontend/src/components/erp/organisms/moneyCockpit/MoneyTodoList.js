/**
 * MoneyTodoList — 지금 손볼 일 (최대 3행, 값 없으면 생략)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { OFD_LINKS, OFD_WORKBENCH } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatWonAmount } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { ErpSafeText } from '../../common';

/**
 * @param {object} props
 * @param {number|null|undefined} props.pendingConsultation
 * @param {number|null|undefined} props.pendingSalary
 * @param {number|null|undefined} props.refundAmount
 */
const MoneyTodoList = ({
  pendingConsultation = null,
  pendingSalary = null,
  refundAmount = null
}) => {
  const navigate = useNavigate();

  const rows = [];
  if (pendingConsultation != null && toSafeNumber(pendingConsultation) > 0) {
    rows.push({
      id: 'pending-consultation',
      label: OFD_WORKBENCH.PENDING_CONSULTATION,
      amount: toSafeNumber(pendingConsultation),
      linkPath: OFD_LINKS.FINANCIAL.path,
      linkLabel: OFD_LINKS.FINANCIAL.label
    });
  }
  if (pendingSalary != null && toSafeNumber(pendingSalary) > 0) {
    rows.push({
      id: 'pending-salary',
      label: OFD_WORKBENCH.PENDING_SALARY,
      amount: toSafeNumber(pendingSalary),
      linkPath: OFD_LINKS.SALARY.path,
      linkLabel: OFD_LINKS.SALARY.label
    });
  }
  if (refundAmount != null && toSafeNumber(refundAmount) > 0) {
    rows.push({
      id: 'refund',
      label: OFD_WORKBENCH.REFUND,
      amount: toSafeNumber(refundAmount),
      linkPath: OFD_LINKS.FINANCIAL.path,
      linkLabel: OFD_LINKS.FINANCIAL.label
    });
  }

  const limited = rows.slice(0, 3);
  if (limited.length === 0) {
    return null;
  }

  return (
    <section
      className="money-workbench__panel"
      data-testid="money-todo-list"
      aria-label={OFD_WORKBENCH.TODO_ARIA}
    >
      <h2 className="money-workbench__title">{OFD_WORKBENCH.TODO_TITLE}</h2>
      <ul className="money-todo-list">
        {limited.map((row) => (
          <li key={row.id} className="money-todo-list__row">
            <div>
              <span className="money-todo-list__label">
                <ErpSafeText value={row.label} />
              </span>
              {' '}
              <button
                type="button"
                className="money-todo-list__link"
                onClick={() => navigate(row.linkPath)}
              >
                {row.linkLabel}
              </button>
            </div>
            <span className="money-todo-list__amount">
              {formatWonAmount(row.amount)}원
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

MoneyTodoList.propTypes = {
  pendingConsultation: PropTypes.number,
  pendingSalary: PropTypes.number,
  refundAmount: PropTypes.number
};


export default MoneyTodoList;
