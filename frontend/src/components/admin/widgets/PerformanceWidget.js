import React, { useState, useEffect } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown, FaClock, FaDatabase } from 'react-icons/fa';
import { PerformanceCalculator, DataTransformer, PerformanceUtils } from '../../../utils/performanceUtils';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';

/**
 * 성능 모니터링 위젯
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
      case trendTypes.UP: return <FaArrowUp style={{ color: 'var(--mg-success-500)' }} />;
      case trendTypes.DOWN: return <FaArrowDown style={{ color: 'var(--mg-error-500)' }} />;
      default: return <FaClock style={{ color: 'var(--mg-info-500)' }} />;
    }
  };

  // 성능 상태 등급 색상 결정
  const getGradeColor = (value, metricType) => {
    const grade = PerformanceCalculator.calculatePerformanceGrade(value, metricType);
    if (grade === 'excellent') return 'var(--mg-success-500)';
    if (grade === 'poor') return 'var(--mg-error-500)';
    return 'var(--mg-info-500)';
  };

  return (
    <div className={`mg-v2-ad-b0kla__card ${className}`} {...props}>
      {/* Header */}
      <div className="mg-v2-ad-b0kla__card-header mg-v2-ad-b0kla__flex-between">
        <div className="mg-v2-ad-b0kla__flex">
          <FaChartLine className="mg-v2-ad-b0kla__icon" style={{ marginRight: 'var(--mg-spacing-8)' }} />
          <span className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--lg">{title}</span>
        </div>
        <div className="trend-icon">
          {getTrendIcon()}
        </div>
      </div>

      {/* Body */}
      <div className="mg-v2-ad-b0kla__card-body">
        <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          
          {/* API Response Time */}
          <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
            <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)' }}>
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.API_RESPONSE_TIME}
            </span>
            <span 
              className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" 
              style={{ color: getGradeColor(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME], 'responseTime'), marginTop: 'var(--mg-spacing-4)' }}
            >
              {PerformanceUtils.formatDuration(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.API_RESPONSE_TIME])}
            </span>
          </div>
          
          {/* Cache Hit Rate */}
          <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
            <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)' }}>
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.CACHE_HIT_RATE}
            </span>
            <span 
              className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__flex" 
              style={{ color: getGradeColor(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE], 'cacheHitRate'), alignItems: 'center', marginTop: 'var(--mg-spacing-4)' }}
            >
              <FaDatabase style={{ marginRight: 'var(--mg-spacing-4)', fontSize: '1rem' }} />
              {PerformanceUtils.formatPercentage(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.CACHE_HIT_RATE])}
            </span>
          </div>

          {/* Active Users */}
          <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
            <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)' }}>
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.ACTIVE_USERS}
            </span>
            <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ marginTop: 'var(--mg-spacing-4)' }}>
              {PerformanceUtils.formatNumber(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.ACTIVE_USERS])}
              <span className="mg-v2-ad-b0kla__text--sm" style={{ fontWeight: 'normal', marginLeft: '2px' }}>{WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_UNITS.ACTIVE_USERS}</span>
            </span>
          </div>
          
          {/* System Load */}
          <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
            <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)' }}>
              {WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_LABELS.SYSTEM_LOAD}
            </span>
            <span 
              className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" 
              style={{ color: getGradeColor(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD], 'systemLoad'), marginTop: 'var(--mg-spacing-4)' }}
            >
              {PerformanceUtils.formatPercentage(performanceData[WIDGET_CONSTANTS.PERFORMANCE_WIDGET.METRIC_TYPES.SYSTEM_LOAD])}
            </span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="mg-v2-ad-b0kla__card-footer" style={{ borderTop: '1px solid var(--mg-gray-200)', paddingTop: 'var(--mg-spacing-12)', marginTop: 'var(--mg-spacing-16)' }}>
        {loading && (
          <div className="mg-v2-ad-b0kla__flex" style={{ justifyContent: 'center' }}>
            <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-500)' }}>
              {WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.LOADING}
            </span>
          </div>
        )}
        {lastUpdated && !loading && (
          <div className="mg-v2-ad-b0kla__text--xs mg-v2-text-muted" style={{ textAlign: 'right' }}>
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceWidget;
