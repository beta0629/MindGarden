/**
 * 통계 카드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StatisticsCard.css';

const StatisticsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'var(--color-primary)', 
  loading = false, 
  error = false,
  onClick = null
}) => {
  return (
    <div 
      className={`statistics-card ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
      onClick={onClick}
      data-stats-color={color}
    >
      <div className="statistics-card-content">
        <div className="statistics-card-icon">
          <i className={icon}></i>
        </div>
        <div className="statistics-card-info">
          <div className="statistics-card-value">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : error ? (
              <span className="error-text">오류</span>
            ) : (
              value
            )}
          </div>
          <div className="statistics-card-title">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

StatisticsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  onClick: PropTypes.func
};

export default StatisticsCard;
