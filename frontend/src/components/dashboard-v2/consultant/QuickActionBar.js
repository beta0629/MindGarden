import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { ContentSection } from '../content';
import {
  CONSULTANT_DASHBOARD_ROUTES,
  CONSULTANT_DASHBOARD_QUERY,
  CONSULTANT_DASHBOARD_QUICK_ACTIONS
} from '../../../constants/consultantDashboardConstants';

export const buildConsultantQuickActionItems = () => [
  {
    id: CONSULTANT_DASHBOARD_QUICK_ACTIONS.SCHEDULE_CREATE.id,
    label: CONSULTANT_DASHBOARD_QUICK_ACTIONS.SCHEDULE_CREATE.label,
    ariaLabel: CONSULTANT_DASHBOARD_QUICK_ACTIONS.SCHEDULE_CREATE.ariaLabel,
    path: `${CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}?${CONSULTANT_DASHBOARD_QUERY.SCHEDULE_CREATE}`,
    variant: 'primary'
  },
  {
    id: CONSULTANT_DASHBOARD_QUICK_ACTIONS.MESSAGE_COMPOSE.id,
    label: CONSULTANT_DASHBOARD_QUICK_ACTIONS.MESSAGE_COMPOSE.label,
    ariaLabel: CONSULTANT_DASHBOARD_QUICK_ACTIONS.MESSAGE_COMPOSE.ariaLabel,
    path: `${CONSULTANT_DASHBOARD_ROUTES.MESSAGES}?${CONSULTANT_DASHBOARD_QUERY.MESSAGE_COMPOSE}`,
    variant: 'outline'
  },
  {
    id: CONSULTANT_DASHBOARD_QUICK_ACTIONS.CLIENT_ADD.id,
    label: CONSULTANT_DASHBOARD_QUICK_ACTIONS.CLIENT_ADD.label,
    ariaLabel: CONSULTANT_DASHBOARD_QUICK_ACTIONS.CLIENT_ADD.ariaLabel,
    path: `${CONSULTANT_DASHBOARD_ROUTES.CLIENTS}?${CONSULTANT_DASHBOARD_QUERY.CLIENT_ADD}`,
    variant: 'outline'
  }
];

const QuickActionButtons = ({ onNavigate, className = '', testId = '' }) => {
  const actions = useMemo(() => buildConsultantQuickActionItems(), []);

  return (
    <div
      className={`consultant-quick-action-bar__actions ${className}`.trim()}
      data-testid={testId || undefined}
    >
      {actions.map((action) => (
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
          aria-label={toDisplayString(action.ariaLabel || action.label)}
        >
          <SafeText tag="span">{action.label}</SafeText>
        </MGButton>
      ))}
    </div>
  );
};

QuickActionButtons.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string,
  testId: PropTypes.string
};

/**
 * 빠른 액션 — ContentHeader actions(inline) 또는 레거시 ContentSection 래퍼
 */
const QuickActionBar = ({ onNavigate, className = '', layout = 'section' }) => {
  if (layout === 'inline') {
    return (
      <QuickActionButtons
        onNavigate={onNavigate}
        className={`consultant-quick-action-bar__actions--header ${className}`.trim()}
        testId="consultant-dashboard-quick-action-bar"
      />
    );
  }

  return (
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
        <QuickActionButtons onNavigate={onNavigate} />
      </div>
    </ContentSection>
  );
};

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string,
  layout: PropTypes.oneOf(['section', 'inline'])
};

export default QuickActionBar;
