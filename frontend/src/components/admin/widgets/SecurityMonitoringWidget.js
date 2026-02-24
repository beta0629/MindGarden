import React, { useState, useEffect, useCallback } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaBan, FaEye, FaChartPie } from 'react-icons/fa';
import { SecurityDataProcessor, SecurityAnalyzer, SecurityDataManager } from '../../../utils/securityUtils';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './SecurityMonitoringWidget.css';

/**
 * 보안 모니터링 위젯
/**
 * 실시간 보안 상태 및 위협 탐지 현황 표시
 */
const SecurityMonitoringWidget = ({ 
  title = WIDGET_CONSTANTS.SECURITY_WIDGET.DEFAULT_TITLE, 
  refreshInterval = WIDGET_CONSTANTS.SECURITY_WIDGET.DEFAULT_REFRESH_INTERVAL,
  className = "",
  ...props 
}) => {
  const [securityData, setSecurityData] = useState({
    securityScore: 100,
    threatLevel: WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.LOW,
    activeThreats: 0,
    blockedIPs: 0,
    status: WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.SECURE,
    recentEvents: []
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedView, setSelectedView] = useState(WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.OVERVIEW);

  // 보안 데이터 조회 (비즈니스 로직 분리)
  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = WIDGET_CONSTANTS.SECURITY_WIDGET.API_ENDPOINTS;
      
      // 캐시된 데이터 확인
      const cacheKey = 'security-widget-data';
      const cachedData = SecurityDataManager.getCachedData(cacheKey);
      if (cachedData) {
        setSecurityData(cachedData);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
      
      // 보안 상태 조회
      const statusResponse = await fetch(endpoints.STATUS);
      const transformedStatus = SecurityDataProcessor.transformSecurityStatusResponse(
        statusResponse.ok ? await statusResponse.json() : null
      );

      // 차단된 IP 목록 조회
      const blockedIPsResponse = await fetch(endpoints.BLOCKED_IPS);
      const transformedBlockedIPs = SecurityDataProcessor.transformBlockedIPsResponse(
        blockedIPsResponse.ok ? await blockedIPsResponse.json() : null
      );

      // 보안 통계 조회
      const statsResponse = await fetch(endpoints.STATS);
      const transformedEvents = SecurityDataProcessor.transformSecurityEventsResponse(
        statsResponse.ok ? await statsResponse.json() : null
      );

      const newSecurityData = {
        securityScore: transformedStatus.securityScore,
        threatLevel: transformedStatus.threatLevel,
        activeThreats: transformedStatus.activeThreats,
        blockedIPs: transformedBlockedIPs.count,
        status: transformedStatus.status,
        recentEvents: transformedEvents.recentEvents
      };

      // 캐시에 저장
      SecurityDataManager.setCachedData(cacheKey, newSecurityData);
      
      // 히스토리에 추가
      SecurityDataManager.addToHistory(newSecurityData);

      setSecurityData(newSecurityData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('보안 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 자동 새로고침 설정
  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchSecurityData, refreshInterval]);

  // 보안 분석 함수들 (비즈니스 로직 유틸리티 사용)
  const getSecurityGrade = (score) => {
    return SecurityAnalyzer.calculateSecurityGrade(score);
  };

  const getThreatLevelColor = (level) => {
    return SecurityAnalyzer.getThreatLevelColorClass(level);
  };

  const getStatusIcon = (status) => {
    const iconType = SecurityAnalyzer.getStatusIconType(status);
    const cssClass = SecurityAnalyzer.getStatusCssClass(status);
    
    switch (iconType) {
      case 'shield': return <FaShieldAlt className={cssClass} />;
      case 'eye': return <FaEye className={cssClass} />;
      case 'warning': return <FaExclamationTriangle className={cssClass} />;
      case 'ban': return <FaBan className={cssClass} />;
      default: return <FaShieldAlt className={cssClass} />;
    }
  };

  // 개요 뷰 렌더링
  const renderOverviewView = () => (
    <div className="security-overview">
      <div className="security-score-section">
        <div className={`security-score-circle ${getSecurityGrade(securityData.securityScore)}`}>
          <div className="score-value">{Math.round(securityData.securityScore)}</div>
          <div className="score-label">보안 점수</div>
        </div>
        <div className="security-status">
          {getStatusIcon(securityData.status)}
          <span className="status-text">{securityData.status}</span>
        </div>
      </div>

      <div className="security-metrics">
        <div className={`security-metric threat-level-${getThreatLevelColor(securityData.threatLevel)}`}>
          <div className="metric-icon">
            <FaExclamationTriangle />
          </div>
          <div className="metric-content">
            <div className="metric-label">위협 수준</div>
            <div className="metric-value">{securityData.threatLevel}</div>
          </div>
        </div>

        <div className="security-metric">
          <div className="metric-icon">
            <FaEye />
          </div>
          <div className="metric-content">
            <div className="metric-label">활성 위협</div>
            <div className="metric-value">{securityData.activeThreats}</div>
          </div>
        </div>

        <div className="security-metric">
          <div className="metric-icon">
            <FaBan />
          </div>
          <div className="metric-content">
            <div className="metric-label">차단된 IP</div>
            <div className="metric-value">{securityData.blockedIPs}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // 이벤트 뷰 렌더링
  const renderEventsView = () => (
    <div className="security-events">
      {securityData.recentEvents.length === 0 ? (
      <div className="no-events">
        <FaShieldAlt />
        <p>{WIDGET_CONSTANTS.SECURITY_WIDGET.MESSAGES.NO_RECENT_EVENTS}</p>
      </div>
      ) : (
        <div className="events-list">
          {securityData.recentEvents.map((event, index) => (
            <div key={index} className={`event-item event-${event.severity}`}>
              <div className="event-type">{event.eventType}</div>
              <div className="event-count">{event.count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`security-monitoring-widget ${className}`} {...props}>
      <div className="widget-header">
        <div className="widget-title">
          <FaShieldAlt className="widget-icon" />
          <h3>{title}</h3>
        </div>
        <div className="view-selector">
          <button 
            className={`view-button ${selectedView === WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.OVERVIEW ? 'active' : ''}`}
            onClick={() => setSelectedView(WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.OVERVIEW)}
          >
            개요
          </button>
          <button 
            className={`view-button ${selectedView === WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.EVENTS ? 'active' : ''}`}
            onClick={() => setSelectedView(WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.EVENTS)}
          >
            이벤트
          </button>
        </div>
      </div>

      <div className="widget-content">
        {selectedView === WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.OVERVIEW && renderOverviewView()}
        {selectedView === WIDGET_CONSTANTS.SECURITY_WIDGET.VIEW_TYPES.EVENTS && renderEventsView()}
      </div>

      <div className="widget-footer">
        {loading && (
          <div className="mg-loading-container mg-loading-container--centered">
            <div className="mg-loading-content">
              <div className="mg-loading-spinner" />
              <span className="mg-loading-text">{WIDGET_CONSTANTS.SECURITY_WIDGET.MESSAGES.LOADING}</span>
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

export default SecurityMonitoringWidget;
