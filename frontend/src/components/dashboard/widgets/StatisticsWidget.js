/**
 * Statistics Widget
 * 통계 정보를 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';

const StatisticsWidget = ({ widget, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
      
      // 자동 새로고침 설정
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.value !== undefined) {
      // 정적 값 사용
      setData({ value: config.value });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        // 응답에서 value 추출 (응답 구조에 따라 조정 필요)
        const value = response.value || response.count || response.total || response;
        setData({ value });
      } else {
        setData({ value: config.value || 0 });
      }
    } catch (err) {
      console.error('StatisticsWidget 데이터 로드 실패:', err);
      setError(err.message);
      setData({ value: config.value || 0 }); // 폴백 값
    } finally {
      setLoading(false);
    }
  };
  
  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };
  
  const getColorClass = () => {
    const color = config.color || 'primary';
    return `widget-statistics-color-${color}`;
  };
  
  const renderTrend = () => {
    if (!config.trend || !config.trend.enabled) {
      return null;
    }
    
    const { value, direction } = config.trend;
    const trendClass = direction === 'up' ? 'trend-up' : 'trend-down';
    const trendIcon = direction === 'up' ? '↑' : '↓';
    
    return (
      <div className={`widget-statistics-trend ${trendClass}`}>
        <span className="trend-icon">{trendIcon}</span>
        <span className="trend-value">{value}%</span>
      </div>
    );
  };
  
  if (loading && !data) {
    return (
      <div className="widget widget-statistics">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && !data) {
    return (
      <div className="widget widget-statistics widget-error">
        <div className="widget-title">{config.title || '통계'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  const displayValue = data?.value !== undefined ? data.value : config.value;
  
  return (
    <div className={`widget widget-statistics ${getColorClass()}`}>
      <div className="widget-header">
        {config.icon && (
          <div className="widget-icon">
            <i className={`icon-${config.icon}`}></i>
          </div>
        )}
        <div className="widget-title">{config.title || '통계'}</div>
      </div>
      <div className="widget-body">
        <div className="widget-statistics-value">
          {formatValue(displayValue)}
        </div>
        {renderTrend()}
      </div>
    </div>
  );
};

export default StatisticsWidget;

