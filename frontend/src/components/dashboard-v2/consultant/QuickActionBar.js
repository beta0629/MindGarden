import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTANT_DASHBOARD_QUICK_ACTIONS } from '../../../constants/consultantDashboardRoutes';

/**
 * 빠른 액션 — Clinic-OS MGButton 행 (ghost + solid primary 하나)
 * onActionClick이 있으면 path navigate 대신 액션 객체를 전달한다.
 */
const QuickActionBar = ({ onNavigate, onActionClick, className = '' }) => (
  <section
    className={`consultant-quick-action-bar ${className}`.trim()}
    aria-label="빠른 액션"
    data-testid="consultant-dashboard-quick-action-bar"
  >
    <h2 className="consultant-quick-action-bar__title">
      <SafeText tag="span">빠른 액션</SafeText>
    </h2>
    <div className="consultant-quick-action-bar__actions">
      {CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((action) => {
        const isPrimary = action.variant === 'primary';
        const variant = isPrimary ? 'primary' : 'ghost';
        return (
          <MGButton
            key={action.id}
            type="button"
            variant={variant}
            size="medium"
            className={buildErpMgButtonClassName({
              variant,
              size: 'md',
              loading: false,
              className: `consultant-quick-action-bar__btn${isPrimary ? ' consultant-quick-action-bar__btn--primary' : ''}`
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => {
              if (typeof onActionClick === 'function') {
                onActionClick(action);
                return;
              }
              onNavigate(action.path);
            }}
            preventDoubleClick={false}
            aria-label={toDisplayString(action.label)}
          >
            <SafeText tag="span">{action.label}</SafeText>
          </MGButton>
        );
      })}
    </div>
  </section>
);

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onActionClick: PropTypes.func,
  className: PropTypes.string
};

export default QuickActionBar;
