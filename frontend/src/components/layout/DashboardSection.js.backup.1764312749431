/**
 * 대시보드 섹션 컴포넌트
 * Phase 3: 공통 레이아웃 컴포넌트
 * 
 * 모든 대시보드에서 일관된 섹션 스타일 제공
 */

import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './DashboardSection.css';

const DashboardSection = ({ 
  title, 
  icon, 
  actions, 
  children,
  collapsible = false,
  defaultCollapsed = false,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <section className={`dashboard-section ${className}`}>
      <div className="dashboard-section-header">
        <div className="dashboard-section-title-wrapper">
          {icon && <span className="dashboard-section-icon">{icon}</span>}
          <h2 className="dashboard-section-title">{title}</h2>
          {collapsible && (
            <button 
              className="dashboard-section-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? '펼치기' : '접기'}
            >
              <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
            </button>
          )}
        </div>
        {actions && <div className="dashboard-section-actions">{actions}</div>}
      </div>
      
      {!isCollapsed && (
        <div className="dashboard-section-content">
          {children}
        </div>
      )}
    </section>
  );
};

export default DashboardSection;

