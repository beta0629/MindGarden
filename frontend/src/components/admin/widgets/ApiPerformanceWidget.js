import React, { useState, useEffect, useCallback } from 'react';
import { FaRocket, FaTachometerAlt, FaExclamationTriangle, FaClock, FaChartArea } from 'react-icons/fa';
import { PerformanceUtils } from '../../../utils/performanceUtils';
import { ApiPerformanceProcessor, ApiPerformanceAnalyzer } from '../../../utils/apiPerformanceUtils';
import { WIDGET_CONSTANTS, API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';
import '../../../styles/unified-design-tokens.css';

/**
 * API 성능 모니터링 위젯
 * 실시간 API 응답 시간 및 성능 지표 표시
 */
const ApiPerformanceWidget = ({ 
  title = API_PERFORMANCE_WIDGET.DEFAULT_TITLE, 
  refreshInterval = API_PERFORMANCE_WIDGET.DEFAULT_REFRESH_INTERVAL,
  className = "",
  ...props 
}) => {
  const [performanceData, setPerformanceData] = useState({
    summary: {
      totalApiEndpoints: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      overallErrorRate: 0,
      slowestRequest: 0,
      slowestEndpoint: ''
    },
    slowApis: {},
    errorProneApis: {}
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedView, setSelectedView] = useState(API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY);

  // API 성능 데이터 조회
  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = API_PERFORMANCE_WIDGET.API_ENDPOINTS;
      const thresholds = API_PERFORMANCE_WIDGET.THRESHOLDS;
      
      // 전체 성능 통계 조회
      const statsResponse = await fetch(endpoints.STATS);
      const transformedStats = ApiPerformanceProcessor.transformApiStatsResponse(
        statsResponse.ok ? await statsResponse.json() : null
      );

      // 느린 API 목록 조회
      const slowApisResponse = await fetch(`${endpoints.SLOW_APIS}?thresholdMs=${thresholds.SLOW_API_MS}`);
      const transformedSlowApis = ApiPerformanceProcessor.transformSlowApisResponse(
        slowApisResponse.ok ? await slowApisResponse.json() : null
      );

      // 에러율 높은 API 목록 조회
      const errorProneResponse = await fetch(`${endpoints.ERROR_PRONE_APIS}?errorRateThreshold=${thresholds.ERROR_RATE_PERCENT}`);
      const transformedErrorApis = ApiPerformanceProcessor.transformErrorProneApisResponse(
        errorProneResponse.ok ? await errorProneResponse.json() : null
      );

      setPerformanceData({
        summary: transformedStats.summary,
        slowApis: transformedSlowApis.slowApis,
        errorProneApis: transformedErrorApis.errorProneApis
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('API 성능 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 자동 새로고침 설정
  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPerformanceData, refreshInterval]);

  // 성능 등급 결정 (비즈니스 로직 유틸리티 사용)
  const getPerformanceGrade = (responseTime) => {
    return ApiPerformanceAnalyzer.calculateResponseTimeGrade(responseTime);
  };

  // 에러율 등급 결정 (비즈니스 로직 유틸리티 사용)
  const getErrorRateGrade = (errorRate) => {
    return ApiPerformanceAnalyzer.calculateErrorRateGrade(errorRate);
  };

  // 성능 상태 등급 색상 결정
  const getGradeColor = (grade) => {
    if (grade === 'excellent') return 'var(--mg-success-500)';
    if (grade === 'poor') return 'var(--mg-error-500)';
    return 'var(--mg-info-500)';
  };

  // 요약 뷰 렌더링
  const renderSummaryView = () => (
    <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-gray-600)', alignItems: 'center' }}>
          <FaTachometerAlt style={{ marginRight: 'var(--mg-spacing-4)' }} />
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.AVERAGE_RESPONSE_TIME}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ color: getGradeColor(getPerformanceGrade(performanceData.summary.averageResponseTime)), marginTop: 'var(--mg-spacing-4)' }}>
          {PerformanceUtils.formatDuration(performanceData.summary.averageResponseTime)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-gray-600)', alignItems: 'center' }}>
          <FaRocket style={{ marginRight: 'var(--mg-spacing-4)' }} />
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.TOTAL_REQUESTS}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ marginTop: 'var(--mg-spacing-4)' }}>
          {PerformanceUtils.formatNumber(performanceData.summary.totalRequests)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-gray-600)', alignItems: 'center' }}>
          <FaExclamationTriangle style={{ marginRight: 'var(--mg-spacing-4)' }} />
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.OVERALL_ERROR_RATE}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ color: getGradeColor(getErrorRateGrade(performanceData.summary.overallErrorRate)), marginTop: 'var(--mg-spacing-4)' }}>
          {PerformanceUtils.formatPercentage(performanceData.summary.overallErrorRate)}
        </span>
      </div>

      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex" style={{ color: 'var(--mg-gray-600)', alignItems: 'center' }}>
          <FaClock style={{ marginRight: 'var(--mg-spacing-4)' }} />
          {API_PERFORMANCE_WIDGET.METRIC_LABELS.SLOWEST_REQUEST}
        </span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ marginTop: 'var(--mg-spacing-4)' }}>
          {PerformanceUtils.formatDuration(performanceData.summary.slowestRequest)}
        </span>
        <div className="mg-v2-ad-b0kla__text--xs" style={{ color: 'var(--mg-gray-500)', marginTop: '2px', wordBreak: 'break-all' }}>
          {performanceData.summary.slowestEndpoint}
        </div>
      </div>
    </div>
  );

  // 느린 API 뷰 렌더링
  const renderSlowApisView = () => (
    <div className="mg-v2-ad-b0kla__flex-col">
      {Object.keys(performanceData.slowApis).length === 0 ? (
        <div className="mg-v2-ad-b0kla__flex mg-v2-ad-b0kla__flex-col mg-v2-ad-b0kla__align-center" style={{ padding: 'var(--mg-spacing-32) 0' }}>
          <FaRocket size={48} style={{ color: 'var(--mg-gray-300)' }} />
          <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-500)', marginTop: 'var(--mg-spacing-16)' }}>
            {API_PERFORMANCE_WIDGET.MESSAGES.NO_SLOW_APIS}
          </p>
        </div>
      ) : (
        Object.entries(performanceData.slowApis).slice(0, 5).map(([endpoint, stats]) => (
          <div key={endpoint} className="mg-v2-ad-b0kla__flex-between" style={{ padding: '12px', borderBottom: '1px solid var(--mg-gray-200)' }}>
            <span className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--sm" style={{ wordBreak: 'break-all', flex: 1, paddingRight: '16px' }}>{endpoint}</span>
            <div className="mg-v2-ad-b0kla__flex" style={{ gap: 'var(--mg-spacing-8)', flexShrink: 0 }}>
              <span className="mg-v2-tag mg-v2-tag--warning">
                평균: {PerformanceUtils.formatDuration(stats.averageDuration)}
              </span>
              <span className="mg-v2-tag mg-v2-tag--warning">
                최대: {PerformanceUtils.formatDuration(stats.maxDuration)}
              </span>
              <span className="mg-v2-tag">
                요청: {PerformanceUtils.formatNumber(stats.totalRequests)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // 에러 많은 API 뷰 렌더링
  const renderErrorProneApisView = () => (
    <div className="mg-v2-ad-b0kla__flex-col">
      {Object.keys(performanceData.errorProneApis).length === 0 ? (
        <div className="mg-v2-ad-b0kla__flex mg-v2-ad-b0kla__flex-col mg-v2-ad-b0kla__align-center" style={{ padding: 'var(--mg-spacing-32) 0' }}>
          <FaExclamationTriangle size={48} style={{ color: 'var(--mg-gray-300)' }} />
          <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-500)', marginTop: 'var(--mg-spacing-16)' }}>
            {API_PERFORMANCE_WIDGET.MESSAGES.NO_ERROR_APIS}
          </p>
        </div>
      ) : (
        Object.entries(performanceData.errorProneApis).slice(0, 5).map(([endpoint, stats]) => (
          <div key={endpoint} className="mg-v2-ad-b0kla__flex-between" style={{ padding: '12px', borderBottom: '1px solid var(--mg-gray-200)' }}>
            <span className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--sm" style={{ wordBreak: 'break-all', flex: 1, paddingRight: '16px' }}>{endpoint}</span>
            <div className="mg-v2-ad-b0kla__flex" style={{ gap: 'var(--mg-spacing-8)', flexShrink: 0 }}>
              <span className="mg-v2-tag mg-v2-tag--error">
                에러율: {PerformanceUtils.formatPercentage(stats.errorRate)}
              </span>
              <span className="mg-v2-tag mg-v2-tag--error">
                에러: {PerformanceUtils.formatNumber(stats.errorCount)}
              </span>
              <span className="mg-v2-tag">
                요청: {PerformanceUtils.formatNumber(stats.totalRequests)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`mg-v2-ad-b0kla__card ${className}`} {...props}>
      {/* Header */}
      <div className="mg-v2-ad-b0kla__card-header mg-v2-ad-b0kla__flex-between">
        <div className="mg-v2-ad-b0kla__flex">
          <FaChartArea className="mg-v2-ad-b0kla__icon" style={{ marginRight: 'var(--mg-spacing-8)' }} />
          <span className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--lg">{title}</span>
        </div>
        <div className="mg-v2-ad-b0kla__flex" style={{ gap: 'var(--mg-spacing-8)' }}>
          <button 
            className={`mg-button mg-button--sm ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY ? 'mg-button--primary' : 'mg-button--outline'}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY)}
          >
            요약
          </button>
          <button 
            className={`mg-button mg-button--sm ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW ? 'mg-button--primary' : 'mg-button--outline'}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW)}
          >
            느린 API
          </button>
          <button 
            className={`mg-button mg-button--sm ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS ? 'mg-button--primary' : 'mg-button--outline'}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS)}
          >
            에러 API
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mg-v2-ad-b0kla__card-body">
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY && renderSummaryView()}
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW && renderSlowApisView()}
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS && renderErrorProneApisView()}
      </div>

      {/* Footer */}
      {(loading || lastUpdated) && (
        <div className="mg-v2-ad-b0kla__card-footer" style={{ borderTop: '1px solid var(--mg-gray-200)', paddingTop: 'var(--mg-spacing-12)', marginTop: 'var(--mg-spacing-16)' }}>
          {loading && (
            <div className="mg-v2-ad-b0kla__flex" style={{ justifyContent: 'center' }}>
              <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-500)' }}>
                {API_PERFORMANCE_WIDGET.MESSAGES.LOADING}
              </span>
            </div>
          )}
          {lastUpdated && !loading && (
            <div className="mg-v2-ad-b0kla__text--xs mg-v2-text-muted" style={{ textAlign: 'right' }}>
              마지막 업데이트: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiPerformanceWidget;
