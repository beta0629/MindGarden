import React from 'react';
import { PerformanceUtils } from '../../../utils/performanceUtils';
import { ApiPerformanceAnalyzer } from '../../../utils/apiPerformanceUtils';
import { API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';
import './ApiPerformanceWidget.css';

/**
 * API 성능 모니터링 요약 위젯 (Top Section)
 */
const ApiPerformanceWidget = ({ 
  summary,
  className = "",
  ...props 
}) => {
  if (!summary) return null;

  // 성능 등급 결정
  const getPerformanceGrade = (responseTime) => {
    return ApiPerformanceAnalyzer.calculateResponseTimeGrade(responseTime);
  };

  // 에러율 등급 결정
  const getErrorRateGrade = (errorRate) => {
    return ApiPerformanceAnalyzer.calculateErrorRateGrade(errorRate);
  };

  // 성능 상태 등급 색상 결정
  const getGradeColor = (grade) => {
    if (grade === 'excellent') return 'var(--mg-success-500)';
    if (grade === 'poor') return 'var(--mg-error-500)';
    return 'var(--mg-info-500)';
  };

  return (
    <div className={`mg-v2-ad-b0kla__grid api-perf-summary ${className}`} {...props}>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.AVERAGE_RESPONSE_TIME}
        </span>
        <span
          className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
          style={{ color: getGradeColor(getPerformanceGrade(summary.averageResponseTime)) }}
        >
          {PerformanceUtils.formatDuration(summary.averageResponseTime)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.OVERALL_ERROR_RATE}
        </span>
        <span
          className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
          style={{ color: getGradeColor(getErrorRateGrade(summary.overallErrorRate)) }}
        >
          {PerformanceUtils.formatPercentage(summary.overallErrorRate)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
          전체 캐시 히트율
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value api-perf-summary__value--neutral">
          78%
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.TOTAL_REQUESTS}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value api-perf-summary__value--neutral">
          {PerformanceUtils.formatNumber(summary.totalRequests)}건
        </span>
      </div>
    </div>
  );
};

export default ApiPerformanceWidget;
