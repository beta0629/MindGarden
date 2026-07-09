import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { ContentSection } from '../content';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../../constants/consultantDashboardConstants';

/**
 * 빠른 액션 바 — ContentSection + G2-08 flat UI
 */
const QuickActionBar = ({ onNavigate, className = '' }) => {
  const actions = [
    {
      id: 'create-record',
      label: '상담일지 작성',
      path: `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?action=create`,
      variant: 'primary'
    },
    {
      id: 'view-schedule',
      label: '일정 조회',
      path: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
      variant: 'outline'
    },
    {
      id: 'view-clients',
      label: '내담자 관리',
      path: CONSULTANT_DASHBOARD_ROUTES.CLIENTS,
      variant: 'outline'
    }
  ];

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
        <div className="consultant-quick-action-bar__actions">
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
              aria-label={toDisplayString(action.label)}
            >
              <SafeText tag="span">{action.label}</SafeText>
            </MGButton>
          ))}
        </div>
      </div>
    </ContentSection>
  );
};

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default QuickActionBar;
