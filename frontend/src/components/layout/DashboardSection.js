/**
 * 대시보드 섹션 컴포넌트 (Organism)
 * 스펙: ADMIN_DASHBOARD_MONITORING_DESIGN_SPEC 2.3 — 헤더(아이콘·제목·서브타이틀·actions)
 *
 * @author CoreSolution
 * @since 2025-02-24
 */

import React, { useState } from 'react';
import './DashboardSection.css';

const DashboardSection = ({
  title,
  subtitle,
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
    <section className={`mg-dashboard-section mg-dashboard-section--card ${className}`.trim()}>
      <header className="mg-dashboard-section-header">
        <div className="mg-dashboard-section-title-wrap">
          {icon && <span className="mg-dashboard-section-icon" aria-hidden>{icon}</span>}
          <div>
            {title && <h2 className="mg-dashboard-section-title">{title}</h2>}
            {subtitle && <p className="mg-dashboard-section-subtitle">{subtitle}</p>}
          </div>
          {collapsible && (
            <button
              type="button"
              className="mg-dashboard-section-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? '펼치기' : '접기'}
            >
              <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`} aria-hidden />
            </button>
          )}
        </div>
        {actions && <div className="mg-dashboard-section-actions">{actions}</div>}
      </header>
      {!isCollapsed && (
        <div className="mg-dashboard-section-content">
          {children}
        </div>
      )}
    </section>
  );
};

export default DashboardSection;

