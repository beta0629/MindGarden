import React, { useState, useEffect, useCallback } from 'react';
import { FaRocket, FaTachometerAlt, FaExclamationTriangle, FaClock, FaChartArea } from 'react-icons/fa';
import { PerformanceUtils } from '../../../utils/performanceUtils';
import { ApiPerformanceProcessor, ApiPerformanceAnalyzer } from '../../../utils/apiPerformanceUtils';
import { WIDGET_CONSTANTS, API_PERFORMANCE_WIDGET } from '../../../constants/widgetConstants';
import './ApiPerformanceWidget.css';

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

  // 요약 뷰 렌더링
  const renderSummaryView = () => (
    <div className="performance-summary">
      <div className="summary-metrics">
        <div className={`summary-metric ${getPerformanceGrade(performanceData.summary.averageResponseTime)}`}>
          <div className="metric-icon">
            <FaTachometerAlt />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              {API_PERFORMANCE_WIDGET.METRIC_LABELS.AVERAGE_RESPONSE_TIME}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatDuration(performanceData.summary.averageResponseTime)}
            </div>
          </div>
        </div>

        <div className="summary-metric">
          <div className="metric-icon">
            <FaRocket />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              {API_PERFORMANCE_WIDGET.METRIC_LABELS.TOTAL_REQUESTS}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatNumber(performanceData.summary.totalRequests)}
            </div>
          </div>
        </div>

        <div className={`summary-metric ${getErrorRateGrade(performanceData.summary.overallErrorRate)}`}>
          <div className="metric-icon">
            <FaExclamationTriangle />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              {API_PERFORMANCE_WIDGET.METRIC_LABELS.OVERALL_ERROR_RATE}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatPercentage(performanceData.summary.overallErrorRate)}
            </div>
          </div>
        </div>

        <div className="summary-metric">
          <div className="metric-icon">
            <FaClock />
          </div>
          <div className="metric-content">
            <div className="metric-label">
              {API_PERFORMANCE_WIDGET.METRIC_LABELS.SLOWEST_REQUEST}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatDuration(performanceData.summary.slowestRequest)}
            </div>
            <div className="metric-detail">
              {performanceData.summary.slowestEndpoint}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 느린 API 뷰 렌더링
  const renderSlowApisView = () => (
    <div className="slow-apis-list">
      {Object.keys(performanceData.slowApis).length === 0 ? (
        <div className="no-data">
          <FaRocket />
          <p>{API_PERFORMANCE_WIDGET.MESSAGES.NO_SLOW_APIS}</p>
        </div>
      ) : (
        Object.entries(performanceData.slowApis).slice(0, 5).map(([endpoint, stats]) => (
          <div key={endpoint} className="api-item slow-api">
            <div className="api-endpoint">{endpoint}</div>
            <div className="api-stats">
              <span className="stat-item">
                평균: {PerformanceUtils.formatDuration(stats.averageDuration)}
              </span>
              <span className="stat-item">
                최대: {PerformanceUtils.formatDuration(stats.maxDuration)}
              </span>
              <span className="stat-item">
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
    <div className="error-prone-apis-list">
      {Object.keys(performanceData.errorProneApis).length === 0 ? (
        <div className="no-data">
          <FaExclamationTriangle />
          <p>{API_PERFORMANCE_WIDGET.MESSAGES.NO_ERROR_APIS}</p>
        </div>
      ) : (
        Object.entries(performanceData.errorProneApis).slice(0, 5).map(([endpoint, stats]) => (
          <div key={endpoint} className="api-item error-api">
            <div className="api-endpoint">{endpoint}</div>
            <div className="api-stats">
              <span className="stat-item error-rate">
                에러율: {PerformanceUtils.formatPercentage(stats.errorRate)}
              </span>
              <span className="stat-item">
                에러: {PerformanceUtils.formatNumber(stats.errorCount)}
              </span>
              <span className="stat-item">
                총 요청: {PerformanceUtils.formatNumber(stats.totalRequests)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`api-performance-widget ${className}`} {...props}>
      <div className="widget-header">
        <div className="widget-title">
          <FaChartArea className="widget-icon" />
          <h3>{title}</h3>
        </div>
        <div className="view-selector">
          <button 
            className={`view-button ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY ? 'active' : ''}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY)}
          >
            요약
          </button>
          <button 
            className={`view-button ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW ? 'active' : ''}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW)}
          >
            느린 API
          </button>
          <button 
            className={`view-button ${selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS ? 'active' : ''}`}
            onClick={() => setSelectedView(API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS)}
          >
            에러 API
          </button>
        </div>
      </div>

      <div className="widget-content">
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SUMMARY && renderSummaryView()}
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.SLOW && renderSlowApisView()}
        {selectedView === API_PERFORMANCE_WIDGET.VIEW_TYPES.ERRORS && renderErrorProneApisView()}
      </div>

      <div className="widget-footer">
        {loading && (
          <div className="loading-indicator">
            {API_PERFORMANCE_WIDGET.MESSAGES.LOADING}
          </div>
        )}
        {lastUpdated && !loading && (
          <div className="last-updated">
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiPerformanceWidget;
