/**
 * 대시보드 그리드 컴포넌트
/**
 * Phase 3: 공통 레이아웃 컴포넌트
/**
 * 
/**
 * 일관된 그리드 레이아웃 제공
 */

import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import './DashboardGrid.css';

const DashboardGrid = ({ 
  children, 
  cols = 'auto',
  gap = 'md',
  className = ''
}) => {
  console.log('🎯 DashboardGrid 렌더링:', { 
    cols, 
    gap, 
    className,
    childrenCount: React.Children.count(children),
    finalClassName: `dashboard-grid dashboard-grid-${cols} dashboard-grid-gap-${gap} ${className}`
  });
  
  console.log('🎯 DashboardGrid 상세 정보:');
  console.log('   - cols 값:', cols);
  console.log('   - gap 값:', gap);
  console.log('   - className 값:', className);
  console.log('   - 자식 요소 개수:', React.Children.count(children));
  console.log('   - 최종 CSS 클래스:', `dashboard-grid dashboard-grid-${cols} dashboard-grid-gap-${gap} ${className}`);
  
  return (
    <div className={`dashboard-grid dashboard-grid-${cols} dashboard-grid-gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardGrid;

