/**
 * Consultation Stats Widget
 * 상담소 특화 통계 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { apiGet } from '../../../../utils/ajax';
import '../Widget.css';

const ConsultationStatsWidget = ({ widget, user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadStats();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadStats, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.stats) {
      setStats(config.stats);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 API 엔드포인트: /api/v1/consultations/statistics/overall
      // 또는 /api/admin/statistics/overall
      const url = dataSource.url || '/api/v1/consultations/statistics/overall';
      const params = dataSource.params || {};
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        // StatisticsController 응답 형식: { data: {...} }
        setStats(response.data || response);
      } else if (response) {
        // 다른 응답 형식 지원
        setStats(response);
      } else {
        setStats(config.stats || {});
      }
    } catch (err) {
      console.error('ConsultationStatsWidget 데이터 로드 실패:', err);
      setError(err.message);
      setStats(config.stats || {});
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !stats) {
    return (
      <div className="widget widget-consultation-stats">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && !stats) {
    return (
      <div className="widget widget-consultation-stats widget-error">
        <div className="widget-title">{config.title || '상담 통계'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  const statsData = stats || {};
  
  return (
    <div className="widget widget-consultation-stats">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-graph-up"></i>
          {config.title || '상담 통계'}
        </div>
      </div>
      <div className="widget-body">
        <div className="consultation-stats-grid">
          {config.metrics && config.metrics.map((metric, index) => {
            const value = statsData[metric.key] || 0;
            const formattedValue = metric.format === 'number' 
              ? value.toLocaleString() 
              : metric.format === 'percentage'
              ? `${value}%`
              : value;
            
            return (
              <div key={index} className="consultation-stat-item">
                <div className="stat-icon">
                  {metric.icon && <i className={`bi ${metric.icon}`}></i>}
                </div>
                <div className="stat-content">
                  <div className="stat-label">{metric.label}</div>
                  <div className="stat-value">{formattedValue}</div>
                  {metric.trend && (
                    <div className={`stat-trend trend-${metric.trend.direction}`}>
                      {metric.trend.direction === 'up' ? '↑' : '↓'} {metric.trend.value}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConsultationStatsWidget;

