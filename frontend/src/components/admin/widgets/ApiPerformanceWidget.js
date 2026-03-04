import React from 'react';
import { PerformanceUtils } from '../../../utils/performanceUtils';
import { ApiPerformanceAnalyzer } from '../../../utils/apiPerformanceUtils';
import { API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';

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
    <div className={`mg-v2-ad-b0kla__grid ${className}`} style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} {...props}>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col" style={{
        backgroundColor: 'var(--mg-color-surface-main)',
        border: '1px solid var(--mg-color-border-main)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '0 2px 2px 0' }}></div>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-color-text-secondary)', alignItems: 'center' }}>
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.AVERAGE_RESPONSE_TIME}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ color: getGradeColor(getPerformanceGrade(summary.averageResponseTime)), marginTop: 'var(--mg-spacing-8)', fontSize: '24px' }}>
          {PerformanceUtils.formatDuration(summary.averageResponseTime)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col" style={{
        backgroundColor: 'var(--mg-color-surface-main)',
        border: '1px solid var(--mg-color-border-main)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '0 2px 2px 0' }}></div>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-color-text-secondary)', alignItems: 'center' }}>
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.OVERALL_ERROR_RATE}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ color: getGradeColor(getErrorRateGrade(summary.overallErrorRate)), marginTop: 'var(--mg-spacing-8)', fontSize: '24px' }}>
          {PerformanceUtils.formatPercentage(summary.overallErrorRate)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col" style={{
        backgroundColor: 'var(--mg-color-surface-main)',
        border: '1px solid var(--mg-color-border-main)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '0 2px 2px 0' }}></div>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-color-text-secondary)', alignItems: 'center' }}>
          전체 캐시 히트율
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ marginTop: 'var(--mg-spacing-8)', fontSize: '24px', color: 'var(--mg-color-text-main)' }}>
          78%
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col" style={{
        backgroundColor: 'var(--mg-color-surface-main)',
        border: '1px solid var(--mg-color-border-main)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '0 2px 2px 0' }}></div>
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-color-text-secondary)', alignItems: 'center' }}>
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.TOTAL_REQUESTS}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ marginTop: 'var(--mg-spacing-8)', fontSize: '24px', color: 'var(--mg-color-text-main)' }}>
          {PerformanceUtils.formatNumber(summary.totalRequests)}건
        </span>
      </div>
    </div>
  );
};

export default ApiPerformanceWidget;
