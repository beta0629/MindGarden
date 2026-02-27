/**
 * Statistics Widget - 표준화된 위젯
/**
 * 통계 정보를 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const StatisticsWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: !!(user && user.id),
    cache: true,
    retryCount: 3
  });

  // 위젯 내용 렌더링
  const renderContent = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 통계가 없습니다.
        </div>
      );
    }
    
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    // 단일 값 통계
    if (typeof data === 'number' || data.value !== undefined) {
      const value = data.value !== undefined ? data.value : data;
      return (
        <div className="single-stat">
          <div className="stat-value">{formatValue(value, widget.config?.format)}</div>
          {data.label && <div className="stat-label">{data.label}</div>}
          {data.change && (
            <div className={`stat-change ${data.change > 0 ? 'positive' : 'negative'}`}>
              <i className={`bi bi-arrow-${data.change > 0 ? 'up' : 'down'}`}></i>
              {Math.abs(data.change)}%
            </div>
          )}
        </div>
      );
    }

    // 다중 통계
    if (Array.isArray(data)) {
      return (
        <div className="multi-stats">
          {data.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{formatValue(stat.value, widget.config?.format)}</div>
              <div className="stat-label">{stat.label}</div>
              {stat.change && (
                <div className={`stat-change ${stat.change > 0 ? 'positive' : 'negative'}`}>
                  <i className={`bi bi-arrow-${stat.change > 0 ? 'up' : 'down'}`}></i>
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // 객체 형태 통계
    return (
      <div className="object-stats">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="stat-item">
            <div className="stat-value">{formatValue(value, widget.config?.format)}</div>
            <div className="stat-label">{key}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.STATISTICS}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderContent()}
      </div>
    </BaseWidget>
  );
};

export default StatisticsWidget;