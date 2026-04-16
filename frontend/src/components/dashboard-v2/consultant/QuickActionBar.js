import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 빠른 액션 바 컴포넌트
 * 
 * @description 상담사가 자주 사용하는 동작을 1클릭으로 접근할 수 있는 바
 * @param {Function} onNavigate - 네비게이션 함수
 * @param {string} className - 추가 CSS 클래스
 */
const QuickActionBar = ({ onNavigate, className = '' }) => {
  const actions = [
    {
      id: 'create-record',
      label: '상담일지 작성',
      path: '/consultant/consultation-records?action=create',
      variant: 'primary'
    },
    {
      id: 'view-schedule',
      label: '일정 조회',
      path: '/consultant/schedule',
      variant: 'outline'
    },
    {
      id: 'view-clients',
      label: '내담자 조회',
      path: '/consultant/clients',
      variant: 'outline'
    },
    {
      id: 'check-messages',
      label: '메시지 확인',
      path: '/consultant/messages',
      variant: 'outline'
    }
  ];

  return (
    <div className={`mg-v2-quick-action-bar ${className}`}>
      <div className="mg-v2-quick-action-bar__title">
        <Icon name="ZAP" size="MD" color="TRANSPARENT" aria-hidden />
        빠른 액션
      </div>
      <div className="mg-v2-quick-action-bar__actions">
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
  );
};

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default QuickActionBar;
