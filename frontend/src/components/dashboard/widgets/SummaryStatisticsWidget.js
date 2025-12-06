/**
 * Summary Statistics Widget - 표준화된 위젯
/**
 * 통계 요약 패널을 표시하는 범용 위젯
/**
 * SummaryPanels를 기반으로 범용화 (상담소 특화 기능 제거)
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-30
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import './Widget.css';
import '../SummaryPanels.css';

const SummaryStatisticsWidget = ({ widget, user }) => {
  const config = widget.config || {};
  const statistics = config.statistics || []; // 통계 항목 목록
  
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });
  
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
  
  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      className="summary-statistics-widget"
    >
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
    </BaseWidget>
  );
};

export default SummaryStatisticsWidget;



