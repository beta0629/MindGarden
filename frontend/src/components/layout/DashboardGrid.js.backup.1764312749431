/**
 * 대시보드 그리드 컴포넌트
 * Phase 3: 공통 레이아웃 컴포넌트
 * 
 * 일관된 그리드 레이아웃 제공
 */

import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './DashboardGrid.css';

const DashboardGrid = ({ 
  children, 
  cols = 'auto',
  gap = 'md',
  className = ''
}) => {
  return (
    <div className={`dashboard-grid dashboard-grid-${cols} dashboard-grid-gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;

