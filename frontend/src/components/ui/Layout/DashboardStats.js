/**
 * MindGarden 디자인 시스템 v2.0 - Dashboard Stats Grid Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';

/**
 * 대시보드 통계 그리드 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.stats - 통계 데이터 배열
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * const stats = [
 *   { icon: <Users />, value: '2,543', label: '총 사용자', change: '+12.5%', positive: true },
 *   { icon: <Calendar />, value: '1,234', label: '예약된 상담', change: '+8.2%', positive: true }
 * ];
 * 
 * <DashboardStats stats={stats} />
 */
const DashboardStats = ({ stats, className = '' }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className={`mg-dashboard-stats ${className}`.trim()}>
      {stats.map((stat, index) => (
        <div key={index} className="mg-dashboard-stat-card">
          {stat.icon && (
            <div className="mg-dashboard-stat-icon">
              {stat.icon}
            </div>
          )}
          <div className="mg-dashboard-stat-content">
            <div className="mg-dashboard-stat-value">{stat.value}</div>
            <div className="mg-dashboard-stat-label">{stat.label}</div>
            {stat.change && (
              <div className={`mg-dashboard-stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.change}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;

