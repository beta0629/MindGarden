/**
 * MindGarden 통계 카드 컴포넌트
 * v0.dev 디자인 시스템 기반의 고급 통계 카드
 */

import React from 'react';
import './MGStats.css';

const MGStats = ({
  title,
  value,
  change,
  changeType = 'increase', // 'increase', 'decrease'
  icon,
  color = 'blue', // 'blue', 'orange', 'green', 'purple'
  sparklineData,
  className = '',
  onClick,
  ...props
}) => {
  const isPositive = changeType === 'increase';

  return (
    <div 
      className={`mg-stats mg-stats--${color} ${className} ${onClick ? 'mg-stats--clickable' : ''}`}
      onClick={onClick}
      {...props}
    >
      <div className="mg-stats__content">
        <div className="mg-stats__header">
          {/* Icon */}
          <div className={`mg-stats__icon mg-stats__icon--${color}`}>
            {icon}
          </div>

          {/* Trend Indicator */}
          {change !== undefined && (
            <div className={`mg-stats__trend mg-stats__trend--${isPositive ? 'positive' : 'negative'}`}>
              <span className="mg-stats__trend-icon">
                {isPositive ? '↗' : '↘'}
              </span>
              <span className="mg-stats__trend-value">{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="mg-stats__main">
          <h3 className="mg-stats__value">{value}</h3>
          <p className="mg-stats__title">{title}</p>
        </div>

        {/* Optional Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mg-stats__sparkline">
            <svg 
              className="mg-stats__sparkline-svg" 
              viewBox={`0 0 100 50`} 
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mg-stats__sparkline-line mg-stats__sparkline-line--${color}`}
                points={sparklineData
                  .map((value, index) => {
                    const x = (index / (sparklineData.length - 1)) * 100
                    const y = 50 - (value / Math.max(...sparklineData)) * 40
                    return `${x},${y}`
                  })
                  .join(" ")}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

// 통계 그리드 컴포넌트
export const MGStatsGrid = ({ 
  children, 
  cols = 4,
  gap = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`mg-stats-grid mg-stats-grid--cols-${cols} mg-stats-grid--gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default MGStats;
