/**
 * MindGarden 디자인 시스템 v2.0 - Stat Card Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Stat Cards 섹션)
 * @reference /design-system (StatsDashboard)
 */

import React from 'react';

/**
 * 통계 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 아이콘 컴포넌트
 * @param {string|number} props.value - 통계 값
 * @param {string} props.label - 통계 라벨
 * @param {string} [props.change] - 변화율 (예: "+12.5%")
 * @param {string} [props.changeType] - 변화 타입 ('positive'|'negative')
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <StatCard
 *   icon={<Users />}
 *   value={2543}
 *   label="총 사용자"
 *   change="+12.5%"
 *   changeType="positive"
 * />
 */
const StatCard = ({
  icon,
  value,
  label,
  change,
  changeType,
  className = '',
  ...props
}) => {
  return (
    <div className={`mg-dashboard-stat-card ${className}`.trim()} {...props}>
      {icon && (
        <div className="mg-dashboard-stat-icon">
          {icon}
        </div>
      )}
      <div className="mg-dashboard-stat-content">
        <div className="mg-dashboard-stat-value">{value}</div>
        <div className="mg-dashboard-stat-label">{label}</div>
        {change && (
          <div className={`mg-dashboard-stat-change ${changeType || ''}`.trim()}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

