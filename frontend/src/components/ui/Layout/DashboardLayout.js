/**
 * MindGarden 디자인 시스템 v2.0 - Dashboard Layout Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Dashboard Layout 섹션)
 * @reference /design-system (DashboardLayoutShowcase)
 */

import React from 'react';

/**
 * 통일된 대시보드 레이아웃 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 대시보드 내용
 * @param {string} props.title - 대시보드 제목
 * @param {string} [props.subtitle] - 대시보드 부제목
 * @param {React.ReactNode} [props.icon] - 제목 옆 아이콘
 * @param {React.ReactNode} [props.actions] - 헤더 우측 액션 버튼들
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <DashboardLayout
 *   title="관리자 대시보드"
 *   subtitle="시스템 전체 현황"
 *   icon={<LayoutDashboard />}
 *   actions={<>
 *     <button className="mg-dashboard-icon-btn"><Bell /></button>
 *     <button className="mg-dashboard-icon-btn"><Settings /></button>
 *   </>}
 * >
 *   {children}
 * </DashboardLayout>
 */
const DashboardLayout = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div className={`mg-dashboard-layout ${className}`.trim()} {...props}>
      {/* Dashboard Header */}
      <div className="mg-dashboard-header">
        <div className="mg-dashboard-header-content">
          <div className="mg-dashboard-header-left">
            {icon}
            <div>
              <h1 className="mg-dashboard-title">{title}</h1>
              {subtitle && <p className="mg-dashboard-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && (
            <div className="mg-dashboard-header-right">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      {children}
    </div>
  );
};

export default DashboardLayout;

