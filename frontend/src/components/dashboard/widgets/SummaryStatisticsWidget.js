/**
 * Summary Statistics Widget
 * 통계 요약 패널을 표시하는 범용 위젯
 * SummaryPanels를 기반으로 범용화 (상담소 특화 기능 제거)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';
import '../SummaryPanels.css';

const SummaryStatisticsWidget = ({ widget, user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const statistics = config.statistics || []; // 통계 항목 목록
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
      
      // 자동 새로고침 설정
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.data) {
      // 정적 데이터 사용
      setData(config.data);
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
        setData(response);
      } else {
        setData(config.data || {});
      }
    } catch (err) {
      console.error('SummaryStatisticsWidget 데이터 로드 실패:', err);
      setError(err.message);
      setData(config.data || {});
    } finally {
      setLoading(false);
    }
  };
  
  const getStatValue = (statKey) => {
    if (!data) return 0;
    
    // data에서 statKey에 해당하는 값 추출
    // 예: statKey가 "totalUsers"이면 data.totalUsers 또는 data[statKey]
    return data[statKey] || data[statKey.toLowerCase()] || 0;
  };
  
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';
    
    if (format === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : value;
    } else if (format === 'currency') {
      return typeof value === 'number' ? `₩${value.toLocaleString()}` : value;
    } else if (format === 'percentage') {
      return typeof value === 'number' ? `${value}%` : value;
    }
    
    return value;
  };
  
  if (loading && !data) {
    return (
      <div className="widget widget-summary-statistics">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && !data) {
    return (
      <div className="widget widget-summary-statistics widget-error">
        <div className="widget-title">{config.title || '통계 요약'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-summary-statistics">
      <div className="widget-header">
        {config.icon && (
          <div className="widget-icon">
            <i className={`bi ${config.icon}`}></i>
          </div>
        )}
        <div className="widget-title">{config.title || '통계 요약'}</div>
      </div>
      <div className="widget-body">
        <div className="summary-panels-container">
          {statistics.map((stat, index) => {
            const value = getStatValue(stat.key);
            const displayValue = formatValue(value, stat.format || 'number');
            
            return (
              <div key={index} className="summary-panel-item">
                <div className="summary-item-icon">
                  {stat.icon && <i className={`bi ${stat.icon}`}></i>}
                </div>
                <div className="summary-item-info">
                  <div className="summary-item-label">{stat.label}</div>
                  <div className="summary-item-value">{displayValue}</div>
                  {stat.suffix && (
                    <div className="summary-item-suffix">{stat.suffix}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {config.viewMoreUrl && (
          <div className="summary-panels-more">
            <a href={config.viewMoreUrl} className="mg-v2-link">
              자세히 보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryStatisticsWidget;

