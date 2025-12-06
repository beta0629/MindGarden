import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSync, FaDownload, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
// import SimpleLayout from '../layout/SimpleLayout';
import SecurityMonitoringWidget from './widgets/SecurityMonitoringWidget';
import PerformanceWidget from './widgets/PerformanceWidget';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import { SecurityDataManager } from '../../utils/securityUtils';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import notificationManager from '../../utils/notification';
import './SecurityMonitoringDashboard.css';

/**
 * 보안 모니터링 대시보드 페이지
/**
 * 종합적인 보안 상태 분석 및 모니터링
 */
const SecurityMonitoringDashboard = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [securitySummary, setSecuritySummary] = useState({
    overallStatus: WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.SECURE,
    securityScore: 100,
    activeThreats: 0,
    blockedIPs: 0
  });

  // 전체 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // 캐시 클리어
    SecurityDataManager.clearCache();
    
    // 모든 위젯이 새로고침되도록 이벤트 발생
    window.dispatchEvent(new CustomEvent('refreshSecurityWidgets'));
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // 보안 보고서 다운로드
  const handleDownloadReport = async () => {
    try {
      const response = await fetch(WIDGET_CONSTANTS.SECURITY_WIDGET.API_ENDPOINTS.AUDIT_REPORT);
      if (response.ok) {
        const data = await response.json();
        
        // JSON 데이터를 파일로 다운로드
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-audit-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('보안 보고서 다운로드 오류:', error);
      notificationManager.error(WIDGET_CONSTANTS.SECURITY_WIDGET.MESSAGES.ERROR);
    }
  };

  // 보안 요약 데이터 조회
  const fetchSecuritySummary = async () => {
    try {
      const response = await fetch(WIDGET_CONSTANTS.SECURITY_WIDGET.API_ENDPOINTS.STATUS);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        
        setSecuritySummary({
          overallStatus: data.status || WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.SECURE,
          securityScore: data.securityScore || 100,
          activeThreats: data.activeThreats || 0,
          blockedIPs: data.blockedIPs || 0
        });
      }
    } catch (error) {
      console.error('보안 요약 데이터 조회 실패:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchSecuritySummary();
    const interval = setInterval(fetchSecuritySummary, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // 보안 상태에 따른 헤더 스타일 결정
  const getHeaderStatusClass = () => {
    const statuses = WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS;
    switch (securitySummary.overallStatus) {
      case statuses.SECURE: return 'header-secure';
      case statuses.MONITORING: return 'header-monitoring';
      case statuses.WARNING: return 'header-warning';
      case statuses.ALERT: return 'header-alert';
      default: return 'header-secure';
    }
  };

  return (
    <SimpleLayout title="보안 모니터링 대시보드" loading={false}>
      <div className="security-monitoring-dashboard">
        <div className={`page-header ${getHeaderStatusClass()}`}>
          <div className="header-left">
            <button className="mg-button"
              variant="outline"
              size="small"
              onClick={() => navigate('/admin')}
              className="back-button"
            >
              <FaArrowLeft />
              관리자 대시보드
            </button>
            <div className="page-title">
              <div className="title-with-status">
                <h1>보안 모니터링</h1>
                <div className="security-status-badge">
                  {securitySummary.overallStatus === WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.SECURE ? (
                    <FaShieldAlt className="status-icon secure" />
                  ) : (
                    <FaExclamationTriangle className="status-icon warning" />
                  )}
                  <span>{securitySummary.overallStatus}</span>
                </div>
              </div>
              <p>실시간 보안 위협 탐지 및 시스템 보안 상태 모니터링</p>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="security-summary">
              <div className="summary-item">
                <span className="summary-label">보안 점수</span>
                <span className="summary-value">{Math.round(securitySummary.securityScore)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">활성 위협</span>
                <span className="summary-value threat-count">{securitySummary.activeThreats}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">차단된 IP</span>
                <span className="summary-value">{securitySummary.blockedIPs}</span>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="mg-button"
                variant="outline"
                size="small"
                onClick={handleDownloadReport}
                disabled={refreshing}
              >
                <FaDownload />
                보안 보고서
              </button>
              
              <button className="mg-button"
                variant="primary"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSync className={refreshing ? 'spinning' : ''} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        <div className="security-dashboard">
          <div className="dashboard-grid">
            {/* 보안 모니터링 위젯 */}
            <div className="widget-container wide">
              <SecurityMonitoringWidget 
                title="보안 상태 모니터링"
                refreshInterval={15000}
                className="main-security-widget"
              />
            </div>

            {/* 시스템 성능 위젯 */}
            <div className="widget-container">
              <PerformanceWidget 
                title="시스템 성능"
                refreshInterval={20000}
                className="performance-widget"
              />
            </div>

            {/* 보안 가이드 위젯 */}
            <div className="widget-container">
              <div className="security-guide">
                <h3>보안 모범 사례</h3>
                <div className="guide-list">
                  <div className="guide-item">
                    <div className="guide-icon">🔐</div>
                    <div className="guide-content">
                      <h4>강력한 비밀번호</h4>
                      <p>최소 12자 이상의 복잡한 비밀번호를 사용하세요.</p>
                    </div>
                  </div>
                  
                  <div className="guide-item">
                    <div className="guide-icon">🔄</div>
                    <div className="guide-content">
                      <h4>정기적인 업데이트</h4>
                      <p>시스템과 소프트웨어를 최신 상태로 유지하세요.</p>
                    </div>
                  </div>
                  
                  <div className="guide-item">
                    <div className="guide-icon">🛡️</div>
                    <div className="guide-content">
                      <h4>방화벽 설정</h4>
                      <p>적절한 방화벽 규칙을 설정하고 관리하세요.</p>
                    </div>
                  </div>
                  
                  <div className="guide-item">
                    <div className="guide-icon">📊</div>
                    <div className="guide-content">
                      <h4>지속적인 모니터링</h4>
                      <p>보안 이벤트를 실시간으로 모니터링하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default SecurityMonitoringDashboard;
