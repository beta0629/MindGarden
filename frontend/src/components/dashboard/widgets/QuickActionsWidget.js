/**
 * Quick Actions Widget
/**
 * 빠른 액션 버튼들을 표시하는 범용 위젯
/**
 * QuickActions를 기반으로 범용화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-22
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { RoleUtils } from '../../../constants/roles';
import ConsultantApplicationModal from '../../common/ConsultantApplicationModal';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import './Widget.css';

const QuickActionsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [showConsultantApplicationModal, setShowConsultantApplicationModal] = useState(false);
  
  const config = widget.config || {};
  const actions = config.actions || [];
  
  // 디버깅 로그 (개발용)
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 QuickActionsWidget 렌더링:', {
      widget: widget.id,
      actionsLength: actions.length,
      userRole: user?.role
    });
  }
  
  const handleActionClick = (action) => {
    if (action.url) {
      navigate(action.url);
    } else if (action.onClick) {
      if (typeof action.onClick === 'function') {
        action.onClick(user);
      } else if (typeof action.onClick === 'string') {
        // 특별한 액션 처리
        if (action.onClick.startsWith('MODAL:')) {
          const modalType = action.onClick.replace('MODAL:', '');
          handleModalAction(modalType);
        } else {
          // 일반 URL로 네비게이션
          navigate(action.onClick);
        }
      }
    }
  };

  // 모달 액션 처리
  const handleModalAction = (modalType) => {
    switch (modalType) {
      case 'consultant-application':
        setShowConsultantApplicationModal(true);
        break;
      default:
        console.warn('알 수 없는 모달 타입:', modalType);
        break;
    }
  };

  // 상담사 신청 성공 핸들러
  const handleConsultantApplicationSuccess = (result) => {
    console.log('상담사 신청 성공:', result);
    setShowConsultantApplicationModal(false);
    // 페이지 새로고침 또는 사용자 정보 업데이트
    window.location.reload();
  };
  
  const shouldShowAction = (action) => {
    // 역할 기반 필터링
    if (action.roles && action.roles.length > 0) {
      return action.roles.some(role => RoleUtils.hasRole(user, role));
    }
    
    // 조건 기반 필터링 (향후 확장 가능)
    if (action.condition) {
      // TODO: 조건 평가 로직 구현
    }
    
    return true;
  };
  
  const visibleActions = actions.filter(shouldShowAction);
  
  // 필터링 결과 로그 (개발용)
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 QuickActionsWidget 필터링:', {
      original: actions.length,
      visible: visibleActions.length
    });
  }
  
  return (
    <>
      <div className="widget widget-quick-actions">
        <div className="widget-header">
          <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
            <Zap size={20} className="finance-icon-inline" />
            <SafeText tag="h3" className="mg-h4 mg-mb-0" fallback="빠른 액션">{config.title}</SafeText>
          </div>
        </div>
        <div className="widget-body">
          <div className="mg-card-body">
            <div className="quick-actions-grid">
              {visibleActions.map((action, index) => (
                <button
                  key={action.id || index}
                  className="quick-action-btn"
                  onClick={() => handleActionClick(action)}
                  title={toDisplayString(action.tooltip || action.label)}
                >
                  {action.icon && (
                    typeof action.icon === 'string' ? (
                      <i className={`bi ${action.icon}`}></i>
                    ) : (
                      action.icon
                    )
                  )}
                  <span><SafeText>{action.label}</SafeText></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 상담사 신청 모달 */}
      <ConsultantApplicationModal
        isOpen={showConsultantApplicationModal}
        onClose={() => setShowConsultantApplicationModal(false)}
        userId={user?.id}
        user={user}
        onSuccess={handleConsultantApplicationSuccess}
      />
    </>
  );
};

export default QuickActionsWidget;



