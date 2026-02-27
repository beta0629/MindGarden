/**
 * Chart Widget - 표준화된 위젯
/**
 * 차트를 표시하는 위젯
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

const ChartWidget = ({ widget, user }) => {
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

  const config = widget.config || {};
  const chartType = config.chartType || 'line';

  // 차트 렌더링
  const renderChart = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 차트 데이터가 없습니다.
        </div>
      );
    }
    
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    // 간단한 차트 플레이스홀더 (실제 차트 라이브러리 연동 필요)
    return (
      <div className="chart-container">
        <div className="chart-placeholder">
          <i className="bi bi-bar-chart-line"></i>
          <p>📊 {chartType.toUpperCase()} 차트</p>
          <p className="chart-data-info">
            데이터 포인트: {Array.isArray(data) ? data.length : '1'}개
          </p>
          {/* TODO: 실제 차트 라이브러리 (Chart.js, D3.js 등) 연동 */}
          <div className="chart-mock">
            {Array.isArray(data) ? (
              <div className="data-preview">
                {data.slice(0, 3).map((item, index) => (
                  <div key={index} className="data-item">
                    <span className="data-label">{item.label || `항목 ${index + 1}`}</span>
                    <span className="data-value">{formatValue(item.value || item)}</span>
                  </div>
                ))}
                {data.length > 3 && <div className="data-more">외 {data.length - 3}개 항목...</div>}
              </div>
            ) : (
              <div className="single-data">
                <span className="data-value">{formatValue(data)}</span>
              </div>
            )}
          </div>
        </div>
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
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.CHART}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderChart()}
      </div>
    </BaseWidget>
  );
};

export default ChartWidget;