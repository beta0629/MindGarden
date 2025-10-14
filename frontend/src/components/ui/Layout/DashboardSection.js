/**
 * MindGarden 디자인 시스템 v2.0 - Dashboard Section Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';

/**
 * 대시보드 섹션 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 섹션 내용
 * @param {string} [props.title] - 섹션 제목
 * @param {React.ReactNode} [props.headerRight] - 헤더 우측 요소 (예: "모두 보기" 링크)
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <DashboardSection
 *   title="최근 활동"
 *   headerRight={<Link to="/all">모두 보기</Link>}
 * >
 *   {content}
 * </DashboardSection>
 */
const DashboardSection = ({
  children,
  title,
  headerRight,
  className = '',
  ...props
}) => {
  return (
    <div className={`mg-dashboard-section ${className}`.trim()} {...props}>
      {(title || headerRight) && (
        <div className="mg-dashboard-section-header">
          {title && <h3 className="mg-dashboard-section-title">{title}</h3>}
          {headerRight}
        </div>
      )}
      <div className="mg-dashboard-section-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardSection;

