/**
 * Statistics Grid Widget
 * 통계 카드 그리드를 표시하는 위젯
 * StatCard 그룹을 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const StatisticsGridWidget = ({ widget, user }) => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const columns = config.columns || 4;
  const statisticsList = config.statistics || [];
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadStatistics();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadStatistics, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (statisticsList.length > 0) {
      setStatistics(statisticsList);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || '/api/admin/statistics/summary';
      const response = await apiGet(url);
      
      if (response && response.data) {
        const stats = Array.isArray(response.data) ? response.data : [];
        setStatistics(stats);
      }
    } catch (err) {
      console.error('StatisticsGridWidget 데이터 로드 실패:', err);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `₩${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return value;
    }
  };
  
  if (loading && statistics.length === 0) {
    return (
      <div className="widget widget-statistics-grid">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-statistics-grid">
      {config.title && (
        <div className="widget-header">
          <div className="widget-title">
            <i className="bi bi-bar-chart"></i>
            {config.title}
          </div>
        </div>
      )}
      <div className="widget-body">
        <div className={`statistics-grid statistics-grid-${columns}`}>
          {statistics.map((stat, index) => (
            <div key={stat.id || index} className="stat-card">
              {stat.icon && (
                <div className="stat-card-icon">
                  <i className={`bi ${stat.icon}`}></i>
                </div>
              )}
              <div className="stat-card-content">
                <div className="stat-card-value">
                  {formatValue(stat.value, stat.format)}
                </div>
                <div className="stat-card-label">{stat.label}</div>
                {stat.change !== undefined && (
                  <div className={`stat-card-change ${stat.changeType || 'neutral'}`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsGridWidget;

