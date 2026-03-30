import React from 'react';
import './MGStatistics.css';

/**
 * Core Solution 통계 컴포넌트
/**
 * 다양한 통계 표시를 위한 컴포넌트
 */
const MGStatistics = ({
  title = '',
  value = '',
  change = '',
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon = null,
  color = 'primary', // 'primary', 'success', 'warning', 'danger', 'info'
  variant = 'default', // 'default', 'card', 'minimal', 'large'
  loading = false,
  className = '',
  onClick = null,
  ...props
}) => {
  const getStatisticsClasses = () => {
    return [
      'mg-statistics',
      `mg-statistics--${variant}`,
      `mg-statistics--${color}`,
      loading ? 'mg-statistics--loading' : '',
      onClick ? 'mg-statistics--clickable' : '',
      className
    ].filter(Boolean).join(' ');
  };

  const getChangeClasses = () => {
    return [
      'mg-statistics__change',
      `mg-statistics__change--${changeType}`
    ].filter(Boolean).join(' ');
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗️';
      case 'negative':
        return '↘️';
      default:
        return '';
    }
  };

  return (
    <div
      className={getStatisticsClasses()}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="mg-statistics__loading">
          <div className="mg-statistics__spinner"></div>
        </div>
      )}
      
      {icon && (
        <div className="mg-statistics__icon">
          {icon}
        </div>
      )}
      
      <div className="mg-statistics__content">
        {title && (
          <div className="mg-statistics__title">
            {title}
          </div>
        )}
        
        <div className="mg-statistics__value">
          {value}
        </div>
        
        {change && (
          <div className={getChangeClasses()}>
            {getChangeIcon()} {change}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 통계 그리드 컴포넌트
 */
export const MGStatisticsGrid = ({
  children,
  cols = 4,
  gap = 'medium',
  className = '',
  ...props
}) => {
  const getGridClasses = () => {
    return [
      'mg-statistics-grid',
      `mg-statistics-grid--cols-${cols}`,
      `mg-statistics-grid--gap-${gap}`,
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={getGridClasses()} {...props}>
      {children}
    </div>
  );
};

/**
 * 통계 차트 컴포넌트
 */
export const MGStatisticsChart = ({
  title = '',
  data = [],
  type = 'line', // 'line', 'bar', 'area'
  height = 200,
  loading = false,
  className = '',
  ...props
}) => {
  const getChartClasses = () => {
    return [
      'mg-statistics-chart',
      loading ? 'mg-statistics-chart--loading' : '',
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={getChartClasses()} style={{ '--chart-height': `${height}px` }} {...props}>
      {title && (
        <div className="mg-statistics-chart__title">
          {title}
        </div>
      )}
      
      {loading && (
        <div className="mg-statistics-chart__loading">
          <div className="mg-statistics-chart__spinner"></div>
        </div>
      )}
      
      <div className="mg-statistics-chart__content">
        {/* 여기에 차트 구현 */}
        <div className="mg-statistics-chart__placeholder">
          <span className="mg-statistics-chart__placeholder-icon">📊</span>
          <span className="mg-statistics-chart__placeholder-text">차트 데이터</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 통계 카드 컴포넌트
 */
export const MGStatisticsCard = ({
  title = '',
  children,
  actions = null,
  loading = false,
  className = '',
  ...props
}) => {
  const getCardClasses = () => {
    return [
      'mg-statistics-card',
      loading ? 'mg-statistics-card--loading' : '',
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className={getCardClasses()} {...props}>
      {loading && (
        <div className="mg-statistics-card__loading">
          <div className="mg-statistics-card__spinner"></div>
        </div>
      )}
      
      {(title || actions) && (
        <div className="mg-statistics-card__header">
          {title && (
            <h3 className="mg-statistics-card__title">
              {title}
            </h3>
          )}
          {actions && (
            <div className="mg-statistics-card__actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="mg-statistics-card__content">
        {children}
      </div>
    </div>
  );
};

export default MGStatistics;



