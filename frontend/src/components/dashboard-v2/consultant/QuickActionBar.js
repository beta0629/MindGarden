import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { ContentSection } from '../content';
import { CONSULTANT_DASHBOARD_QUICK_ACTIONS } from '../../../constants/consultantDashboardConstants';

/**
 * 빠른 액션 바 — v2.1 QuickAction 5 SSOT
 */
const QuickActionBar = ({ onNavigate, className = '' }) => (
  <ContentSection
    className={`consultant-quick-action-bar mg-v2-ad-b0kla__section ${className}`.trim()}
    noCard
    dataTestId="consultant-dashboard-quick-action-bar"
  >
    <div className="consultant-quick-action-bar__inner">
      <div className="consultant-quick-action-bar__title">
        <Icon name="ZAP" size="MD" color="TRANSPARENT" aria-hidden />
        <SafeText tag="span">빠른 액션</SafeText>
      </div>
      <div className="consultant-quick-action-bar__actions">
        {CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((action) => (
          <MGButton
            key={action.id}
            type="button"
            variant={action.variant === 'primary' ? 'primary' : 'outline'}
            size="medium"
            className={buildErpMgButtonClassName({
              variant: action.variant === 'primary' ? 'primary' : 'outline',
              size: 'md',
              loading: false,
              className: `mg-v2-btn mg-v2-btn-${action.variant} mg-v2-btn-md`
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => onNavigate(action.path)}
            preventDoubleClick={false}
            aria-label={toDisplayString(action.label)}
          >
            <SafeText tag="span">{action.label}</SafeText>
          </MGButton>
        ))}
      </div>
    </div>
  </ContentSection>
);

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default QuickActionBar;
