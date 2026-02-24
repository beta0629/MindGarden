import React, { useState, useEffect } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown, FaClock, FaDatabase } from 'react-icons/fa';
import { PerformanceCalculator, DataTransformer, PerformanceUtils } from '../../../utils/performanceUtils';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './PerformanceWidget.css';

/**
 * 성능 모니터링 위젯
/**
 * 실시간 시스템 성능 지표를 표시
 */
const PerformanceWidget = ({ 
  title = WIDGET_CONSTANTS.PERFORMANCE_WIDGET.DEFAULT_TITLE, 
  refreshInterval = WIDGET_CONSTANTS.PERFORMANCE_WIDGET.DEFAULT_REFRESH_INTERVAL,
  className = "",
  ...props 
}) => {
  const [performanceData, setPerformanceData] = useState({
    [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME]: 0,
    [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE]: 0,
    [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.ACTIVE_USERS]: 0,
    [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD]: 0,
    trend: WIDGET_CONSTANTS.PERFORMANCE_WIDGET.TREND_TYPES.STABLE
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 성능 데이터 조회
  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // 캐시 통계 조회
      const cacheResponse = await fetch(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.API_ENDPOINTS.STATS);
      let cacheHitRate = 0;
      
      if (cacheResponse.ok) {
        const cacheResult = await cacheResponse.json();
        const transformedData = DataTransformer.transformCacheStatsToPerformanceData(cacheResult);
        cacheHitRate = transformedData.cacheHitRate;
      }

      // 모의 데이터 생성 (실제 환경에서는 실제 메트릭 API 호출)
      const mockResponseTime = generateMockValue(
        WIDGET_CONSTANTS.PERFORMANCE_WIDGET.MOCK_DATA_RANGES.API_RESPONSE_TIME
      );
      const mockActiveUsers = generateMockValue(
        WIDGET_CONSTANTS.PERFORMANCE_WIDGET.MOCK_DATA_RANGES.ACTIVE_USERS
      );
      const mockSystemLoad = generateMockValue(
        WIDGET_CONSTANTS.PERFORMANCE_WIDGET.MOCK_DATA_RANGES.SYSTEM_LOAD
      );

      const newData = {
        [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME]: mockResponseTime,
        [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE]: cacheHitRate,
        [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.ACTIVE_USERS]: mockActiveUsers,
        [WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD]: mockSystemLoad,
        trend: determineTrend(cacheHitRate)
      };

      setPerformanceData(newData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('성능 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모의 데이터 생성 헬퍼 함수
  const generateMockValue = (range) => {
    return Math.random() * (range.MAX - range.MIN) + range.MIN;
  };

  // 트렌드 결정 헬퍼 함수
  const determineTrend = (cacheHitRate) => {
    const thresholds = WIDGET_CONSTANTS.PERFORMANCE_WIDGET.THRESHOLDS.CACHE_HIT_RATE;
    if (cacheHitRate >= thresholds.EXCELLENT) return WIDGET_CONSTANTS.PERFORMANCE_WIDGET.TREND_TYPES.UP;
    if (cacheHitRate >= thresholds.GOOD) return WIDGET_CONSTANTS.PERFORMANCE_WIDGET.TREND_TYPES.STABLE;
    return WIDGET_CONSTANTS.PERFORMANCE_WIDGET.TREND_TYPES.DOWN;
  };

  // 자동 새로고침 설정
  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // 트렌드 아이콘 및 색상 결정
  const getTrendIcon = () => {
    const trendTypes = WIDGET_CONSTANTS.PERFORMANCE_WIDGET.TREND_TYPES;
    switch (performanceData.trend) {
      case trendTypes.UP: return <FaArrowUp className="trend-up" />;
      case trendTypes.DOWN: return <FaArrowDown className="trend-down" />;
      default: return <FaClock className="trend-stable" />;
    }
  };

  // 성능 상태 등급 결정
  const getPerformanceGrade = (value, metricType) => {
    return PerformanceCalculator.calculatePerformanceGrade(value, metricType);
  };

  return (
    <div className={`performance-widget ${className}`} {...props}>
      <div className="widget-header">
        <div className="widget-title">
          <FaChartLine className="widget-icon" />
          <h3>{title}</h3>
        </div>
        <div className="widget-trend">
          {getTrendIcon()}
        </div>
      </div>

      <div className="performance-metrics">
        <div className="metric-row">
          <div className={`metric-item ${getPerformanceGrade(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME], 'responseTime')}`}>
            <div className="metric-label">
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.API_RESPONSE_TIME}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatDuration(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME])}
            </div>
          </div>
          
          <div className={`metric-item ${getPerformanceGrade(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE], 'cacheHitRate')}`}>
            <div className="metric-label">
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.CACHE_HIT_RATE}
            </div>
            <div className="metric-value">
              <FaDatabase className="metric-icon" />
              {PerformanceUtils.formatPercentage(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE])}
            </div>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric-item">
            <div className="metric-label">
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.ACTIVE_USERS}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatNumber(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.ACTIVE_USERS])}
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_UNITS.ACTIVE_USERS}
            </div>
          </div>
          
          <div className={`metric-item ${getPerformanceGrade(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD], 'systemLoad')}`}>
            <div className="metric-label">
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.SYSTEM_LOAD}
            </div>
            <div className="metric-value">
              {PerformanceUtils.formatPercentage(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD])}
            </div>
          </div>
        </div>
      </div>

      <div className="widget-footer">
        {loading && (
          <div className="mg-loading-container mg-loading-container--centered">
            <div className="mg-loading-content">
              <div className="mg-loading-spinner" />
              <span className="mg-loading-text">{WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.LOADING}</span>
            </div>
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

export default PerformanceWidget;
