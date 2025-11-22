/**
 * Quick Actions Widget
 * 빠른 액션 버튼들을 표시하는 범용 위젯
 * QuickActions를 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import './Widget.css';

const QuickActionsWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  
  const config = widget.config || {};
  const actions = config.actions || [];
  
  const handleActionClick = (action) => {
    if (action.url) {
      navigate(action.url);
    } else if (action.onClick) {
      if (typeof action.onClick === 'function') {
        action.onClick(user);
      } else if (typeof action.onClick === 'string') {
        // 문자열인 경우 navigate로 처리
        navigate(action.onClick);
      }
    }
  };
  
  const shouldShowAction = (action) => {
    // 역할 기반 필터링
    if (action.roles && user?.role) {
      return action.roles.includes(user.role);
    }
    
    // 조건 기반 필터링 (향후 확장 가능)
    if (action.condition) {
      // TODO: 조건 평가 로직 구현
    }
    
    return true;
  };
  
  const visibleActions = actions.filter(shouldShowAction);
  
  return (
    <div className="widget widget-quick-actions">
      <div className="widget-header">
        <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
          <Zap size={20} className="finance-icon-inline" />
          <h3 className="mg-h4 mg-mb-0">{config.title || '빠른 액션'}</h3>
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
                title={action.tooltip || action.label}
              >
                {action.icon && (
                  typeof action.icon === 'string' ? (
                    <i className={`bi ${action.icon}`}></i>
                  ) : (
                    action.icon
                  )
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;

