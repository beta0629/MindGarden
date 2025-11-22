/**
 * ERP Management Grid Widget
 * 빠른 액션 그리드를 표시하는 ERP 위젯
 * ErpDashboard의 빠른 액션 섹션을 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserPermissions, PermissionChecks } from '../../../../utils/permissionUtils';
import * as LucideIcons from 'lucide-react';
import '../Widget.css';
import './ErpWidget.css';

const ErpManagementGridWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = React.useState([]);
  
  const config = widget.config || {};
  const actions = config.actions || []; // 액션 목록 정의
  const columns = config.columns || 3;
  
  React.useEffect(() => {
    const loadPermissions = async () => {
      await fetchUserPermissions(setUserPermissions);
    };
    loadPermissions();
  }, []);
  
  const handleActionClick = (action) => {
    if (action.url) {
      navigate(action.url);
    } else if (action.onClick) {
      if (typeof action.onClick === 'function') {
        action.onClick(user);
      }
    }
  };
  
  const shouldShowAction = (action) => {
    // 권한 체크
    if (action.permission) {
      if (typeof action.permission === 'string') {
        return PermissionChecks.hasPermission(userPermissions, action.permission);
      } else if (typeof action.permission === 'function') {
        return action.permission(userPermissions);
      }
    }
    
    // 역할 필터링
    if (action.roles && user?.role) {
      return action.roles.includes(user.role);
    }
    
    return true;
  };
  
  const visibleActions = actions.filter(shouldShowAction);
  
  if (visibleActions.length === 0) {
    return (
      <div className="widget widget-erp-management-grid">
        <div className="widget-empty">
          <p>사용 가능한 액션이 없습니다.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-erp-management-grid">
      {config.title && (
        <div className="widget-header">
          <div className="widget-title">{config.title}</div>
        </div>
      )}
      <div className="widget-body">
        <div className={`mg-management-grid erp-management-grid erp-management-grid-${columns}`}>
          {visibleActions.map((action, index) => (
            <div
              key={action.id || index}
              className="mg-management-card erp-management-card"
              onClick={() => handleActionClick(action)}
            >
              <div className="mg-management-icon erp-management-icon">
                {action.icon && (() => {
                  // 문자열인 경우 lucide-react에서 찾기
                  if (typeof action.icon === 'string') {
                    const IconComponent = LucideIcons[action.icon];
                    return IconComponent ? <IconComponent size={24} /> : null;
                  }
                  // 컴포넌트인 경우 직접 렌더링
                  return React.createElement(action.icon, { size: 24 });
                })()}
              </div>
              <h3 className="erp-management-title">{action.title}</h3>
              {action.description && (
                <p className="mg-management-description erp-management-description">
                  {action.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErpManagementGridWidget;

