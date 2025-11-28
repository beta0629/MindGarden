/**
 * Consultation Stats Widget - 표준화된 위젯
 * 상담소 특화 통계 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (표준화 업그레이드)
 * @since 2025-11-22
 */

import React from 'react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { WIDGET_CONSTANTS } from '../../../../constants/widgetConstants';
import '../Widget.css';

const ConsultationStatsWidget = ({ widget, user }) => {
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
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const config = widget.config || {};
  const metrics = config.metrics || [];

  // 통계 메트릭 렌더링
  const renderMetric = (metric, value, index) => {
    const { key, label, icon, format, color } = metric;
    const formattedValue = formatValue(value, format);

    return (
      <div key={index} className={`consultation-metric ${color ? `metric-${color}` : ''}`}>
        <div className="metric-icon">
          <i className={`bi ${icon || 'bi-bar-chart'}`}></i>
        </div>
        <div className="metric-content">
          <div className="metric-value">{formattedValue}</div>
          <div className="metric-label">{label}</div>
        </div>
      </div>
    );
  };

  // 상담 통계 렌더링
  const renderConsultationStats = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 상담 통계가 없습니다.
        </div>
      );
    }
    
    if (!hasData) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    // 메트릭이 정의된 경우 해당 메트릭만 표시
    if (metrics.length > 0) {
      return (
        <div className="consultation-metrics-grid">
          {metrics.map((metric, index) => {
            const value = data[metric.key];
            return renderMetric(metric, value, index);
          })}
        </div>
      );
    }

    // 메트릭이 정의되지 않은 경우 모든 데이터 표시
    const defaultMetrics = [
      { key: 'totalConsultations', label: '총 상담 수', icon: 'bi-chat-dots', format: 'number' },
      { key: 'activeConsultations', label: '진행 중인 상담', icon: 'bi-clock', format: 'number', color: 'warning' },
      { key: 'completedConsultations', label: '완료된 상담', icon: 'bi-check-circle', format: 'number', color: 'success' },
      { key: 'pendingConsultations', label: '대기 중인 상담', icon: 'bi-hourglass-split', format: 'number', color: 'info' },
      { key: 'cancelledConsultations', label: '취소된 상담', icon: 'bi-x-circle', format: 'number', color: 'danger' }
    ];

    return (
      <div className="consultation-metrics-grid">
        {defaultMetrics.map((metric, index) => {
          const value = data[metric.key];
          if (value !== undefined && value !== null) {
            return renderMetric(metric, value, index);
          }
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  // 추가 통계 정보 렌더링 (차트, 트렌드 등)
  const renderAdditionalStats = () => {
    if (!hasData || !data.trends) return null;

    return (
      <div className="consultation-trends">
        <h5>📈 상담 트렌드</h5>
        <div className="trends-container">
          {data.trends.map((trend, index) => (
            <div key={index} className="trend-item">
              <span className="trend-label">{trend.label}</span>
              <span className={`trend-value ${trend.change > 0 ? 'positive' : trend.change < 0 ? 'negative' : 'neutral'}`}>
                {trend.change > 0 && '+'}
                {trend.change}%
              </span>
            </div>
          ))}
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
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.CONSULTATION_STATS}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderConsultationStats()}
        {renderAdditionalStats()}
      </div>
    </BaseWidget>
  );
};

export default ConsultationStatsWidget;