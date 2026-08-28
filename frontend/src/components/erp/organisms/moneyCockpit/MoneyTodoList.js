/**
 * MoneyTodoList — 지금 손볼 일 (fetch 성공 시 0원 포함 표시, null만 생략)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../../common/MGButton';
import { OFD_LINKS, OFD_WORKBENCH } from '../../../../constants/operatorFinanceDashboardStrings';
import { formatWonDisplay } from './moneyCockpitData';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import { ErpSafeText } from '../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {number|null|undefined} props.pendingConsultation
 * @param {number|null|undefined} props.pendingSalary
 * @param {number|null|undefined} props.refundAmount
 * @param {string[]} [props.denseFacts]
 */
const MoneyTodoList = ({
  pendingConsultation = null,
  pendingSalary = null,
  refundAmount = null,
  denseFacts = []
}) => {
  const navigate = useNavigate();

  const rows = [];
  if (pendingConsultation != null) {
    rows.push({
      id: 'pending-consultation',
      label: OFD_WORKBENCH.PENDING_CONSULTATION,
      amount: toSafeNumber(pendingConsultation),
      linkPath: OFD_LINKS.FINANCIAL.path,
      linkLabel: OFD_LINKS.FINANCIAL.label
    });
  }
  if (pendingSalary != null) {
    rows.push({
      id: 'pending-salary',
      label: OFD_WORKBENCH.PENDING_SALARY,
      amount: toSafeNumber(pendingSalary),
      linkPath: OFD_LINKS.SALARY.path,
      linkLabel: OFD_LINKS.SALARY.label
    });
  }
  if (refundAmount != null) {
    rows.push({
      id: 'refund',
      label: OFD_WORKBENCH.REFUND,
      amount: toSafeNumber(refundAmount),
      linkPath: OFD_LINKS.FINANCIAL.path,
      linkLabel: OFD_LINKS.FINANCIAL.label
    });
  }

  const limited = rows.slice(0, 3);
  const facts = Array.isArray(denseFacts) ? denseFacts.filter(Boolean) : [];
  if (limited.length === 0 && facts.length === 0) {
    return null;
  }

  return (
    <section
      className="money-workbench__panel"
      data-testid="money-todo-list"
      aria-label={OFD_WORKBENCH.TODO_ARIA}
    >
      <h2 className="money-workbench__title">{OFD_WORKBENCH.TODO_TITLE}</h2>
      {limited.length > 0 ? (
        <ul className="money-todo-list">
          {limited.map((row) => (
            <li key={row.id} className="money-todo-list__row">
              <div className="money-todo-list__meta">
                <span className="money-todo-list__label">
                  <ErpSafeText value={row.label} />
                </span>
                <MGButton
                  type="button"
                  variant="ghost"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'ghost',
                    size: 'sm',
                    loading: false,
                    className: 'money-todo-list__action'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => navigate(row.linkPath)}
                  preventDoubleClick={false}
                >
                  {row.linkLabel}
                </MGButton>
              </div>
              <span className="money-todo-list__amount">
                {formatWonDisplay(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {facts.length > 0 ? (
        <ul className="money-workbench__facts" data-testid="money-dense-facts">
          {facts.map((fact) => (
            <li key={fact} className="money-workbench__fact">
              <ErpSafeText value={fact} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

MoneyTodoList.propTypes = {
  pendingConsultation: PropTypes.number,
  pendingSalary: PropTypes.number,
  refundAmount: PropTypes.number,
  denseFacts: PropTypes.arrayOf(PropTypes.string)
};


export default MoneyTodoList;
