import React, { useState, useEffect, useCallback } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import { FaDatabase, FaChartLine, FaClock, FaMemory, FaSync } from 'react-icons/fa';
import { DataTransformer, PerformanceUtils } from '../../utils/performanceUtils';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import notificationManager from '../../utils/notification';
import './CacheMonitoringDashboard.css';

const CacheMonitoringDashboard = () => {
  const [cacheStats, setCacheStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.DEFAULT_REFRESH_INTERVAL);

  // 캐시 통계 조회
  const fetchCacheStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.API_ENDPOINTS.STATS);
      if (response.ok) {
        const result = await response.json();
        const transformedData = DataTransformer.transformCacheStatsToPerformanceData(result);
        setCacheStats(transformedData.rawData || {});
        setLastUpdated(new Date());
      } else {
        console.error('캐시 통계 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('캐시 통계 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모든 캐시 클리어
  const clearAllCaches = async () => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.CLEAR_CONFIRM, resolve);
    });
    if (!confirmed) return;
    
    try {
      const response = await fetch(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.API_ENDPOINTS.CLEAR_ALL, { method: 'DELETE' });
      if (response.ok) {
        notificationManager.success(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.CLEAR_SUCCESS);
        fetchCacheStats();
      } else {
        notificationManager.error(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.CLEAR_ERROR);
      }
    } catch (error) {
      console.error('캐시 삭제 오류:', error);
      notificationManager.error(WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.MESSAGES.CLEAR_ERROR);
    }
  };

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchCacheStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchCacheStats]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  // 캐시 효율성 계산
  const calculateEfficiency = (stats) => {
    if (!stats || typeof stats !== 'object') return 0;
    const hits = Number(stats.hits) || 0;
    const misses = Number(stats.misses) || 0;
    const totalRequests = hits + misses;
    
    if (totalRequests === 0) return 0;
    return PerformanceUtils.formatPercentage((hits / totalRequests) * 100, 1).replace('%', '');
  };

  // 효율성에 따른 CSS 클래스 결정
  const getEfficiencyClass = (efficiency) => {
    const efficiencyNum = Number(efficiency);
    const thresholds = WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET.EFFICIENCY_THRESHOLDS;
    
    if (efficiencyNum >= thresholds.EXCELLENT) return 'efficiency-excellent';
    if (efficiencyNum >= thresholds.GOOD) return 'efficiency-good';
    return 'efficiency-poor';
  };

  return (
    <AdminCommonLayout title="캐시 성능 모니터링" loading={loading} loadingText="캐시 통계를 불러오는 중...">
      <div className="cache-monitoring-dashboard">
      <div className="dashboard-header">
        <h2>
          <FaDatabase className="header-icon" />
          캐시 성능 모니터링
        </h2>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="refresh-interval-select"
          >
            <option value={WIDGET_CONSTANTS.REFRESH_INTERVALS.FAST}>1초</option>
            <option value={WIDGET_CONSTANTS.REFRESH_INTERVALS.DEFAULT}>5초</option>
            <option value={WIDGET_CONSTANTS.REFRESH_INTERVALS.NORMAL}>10초</option>
            <option value={WIDGET_CONSTANTS.REFRESH_INTERVALS.SLOW}>30초</option>
          </select>
          <button
            onClick={fetchCacheStats}
            disabled={loading}
            className="refresh-button"
          >
            <FaSync className={loading ? 'spinning' : ''} />
            새로고침
          </button>
          <button
            onClick={clearAllCaches}
            className="clear-cache-button"
          >
            캐시 삭제
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          <FaClock />
          마지막 업데이트: {lastUpdated.toLocaleString()}
        </div>
      )}

      <div className="cache-stats-grid">
        {Object.entries(cacheStats).map(([cacheName, stats]) => (
          <div key={cacheName} className="cache-stat-card">
            <div className="cache-card-header">
              <h3>{cacheName}</h3>
              <div className="cache-efficiency">
                <FaChartLine />
                {calculateEfficiency(stats)}% 효율
              </div>
            </div>
            
            <div className="cache-metrics">
              <div className="metric">
                <FaMemory className="metric-icon" />
                <div className="metric-info">
                  <span className="metric-label">캐시 크기</span>
                  <span className="metric-value">{stats.size || 0}</span>
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-info">
                  <span className="metric-label">히트</span>
                  <span className="metric-value hit-count">{stats.hits || 0}</span>
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-info">
                  <span className="metric-label">미스</span>
                  <span className="metric-value miss-count">{stats.misses || 0}</span>
                </div>
              </div>
              
              <div className="metric">
                <div className="metric-info">
                  <span className="metric-label">총 요청</span>
                  <span className="metric-value">{(stats.hits || 0) + (stats.misses || 0)}</span>
                </div>
              </div>
            </div>

            <div className="cache-progress-bar">
              <div 
                className={`cache-progress-fill ${getEfficiencyClass(calculateEfficiency(stats))}`}
                style={{ width: `${calculateEfficiency(stats)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {Object.keys(cacheStats).length === 0 && !loading && (
        <div className="no-cache-data">
          <FaDatabase size={48} />
          <p>캐시 데이터가 없습니다.</p>
          <button onClick={fetchCacheStats} className="retry-button">
            다시 시도
          </button>
        </div>
      )}
      </div>
    </AdminCommonLayout>
  );
};

export default CacheMonitoringDashboard;
