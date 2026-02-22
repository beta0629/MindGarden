import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSync, FaTrash, FaDownload } from 'react-icons/fa';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ApiPerformanceWidget from './widgets/ApiPerformanceWidget';
import PerformanceWidget from './widgets/PerformanceWidget';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import { ApiPerformanceReportGenerator } from '../../utils/apiPerformanceUtils';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import notificationManager from '../../utils/notification';
import './ApiPerformanceMonitoring.css';

/**
 * API 성능 모니터링 페이지
/**
 * 종합적인 API 성능 분석 및 모니터링 대시보드
 */
const ApiPerformanceMonitoring = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // 전체 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    // 모든 위젯이 새로고침되도록 이벤트 발생
    window.dispatchEvent(new CustomEvent('refreshPerformanceWidgets'));
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // 통계 초기화
  const handleClearStats = async () => {
    const messages = WIDGET_CONSTANTS.API_PERFORMANCE_WIDGET.MESSAGES;
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(messages.CLEAR_CONFIRM, resolve);
    });
    if (!confirmed) return;
    
    try {
      const response = await fetch(WIDGET_CONSTANTS.API_PERFORMANCE_WIDGET.API_ENDPOINTS.CLEAR_STATS, { 
        method: 'DELETE' 
      });
      if (response.ok) {
        notificationManager.success(messages.CLEAR_SUCCESS);
        handleRefresh();
      } else {
        notificationManager.error(messages.CLEAR_ERROR);
      }
    } catch (error) {
      console.error('통계 초기화 오류:', error);
      notificationManager.error(messages.CLEAR_ERROR);
    }
  };

  // 성능 보고서 다운로드
  const handleDownloadReport = async () => {
    try {
      const response = await fetch(WIDGET_CONSTANTS.API_PERFORMANCE_WIDGET.API_ENDPOINTS.STATS);
      if (response.ok) {
        const data = await response.json();
        const reportData = ApiPerformanceReportGenerator.generateReportData(data.data || {});
        ApiPerformanceReportGenerator.downloadJsonReport(reportData);
      }
    } catch (error) {
      console.error('보고서 다운로드 오류:', error);
      notificationManager.error(WIDGET_CONSTANTS.API_PERFORMANCE_WIDGET.MESSAGES.DOWNLOAD_ERROR);
    }
  };

  return (
    <AdminCommonLayout title="API 성능 모니터링" loading={false}>
      <div className="api-performance-monitoring">
        <div className="page-header">
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
              <h1>API 성능 모니터링</h1>
              <p>실시간 API 응답 시간 및 성능 지표 분석</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="mg-button"
              variant="outline"
              size="small"
              onClick={handleDownloadReport}
              disabled={refreshing}
            >
              <FaDownload />
              보고서 다운로드
            </button>
            
            <button className="mg-button"
              variant="outline"
              size="small"
              onClick={handleClearStats}
              disabled={refreshing}
              className="danger-button"
            >
              <FaTrash />
              통계 초기화
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

        <div className="performance-dashboard">
          <div className="dashboard-grid">
            {/* 시스템 성능 위젯 */}
            <div className="widget-container">
              <PerformanceWidget 
                title="시스템 성능 개요"
                refreshInterval={10000}
                className="system-performance-widget"
              />
            </div>

            {/* API 성능 위젯 */}
            <div className="widget-container wide">
              <ApiPerformanceWidget 
                title="API 성능 분석"
                refreshInterval={15000}
                className="api-performance-widget"
              />
            </div>

            {/* 추가 성능 지표 위젯들 */}
            <div className="widget-container">
              <div className="performance-tips">
                <h3>성능 최적화 팁</h3>
                <div className="tips-list">
                  <div className="tip-item">
                    <div className="tip-icon">🚀</div>
                    <div className="tip-content">
                      <h4>캐시 활용</h4>
                      <p>자주 사용되는 데이터는 캐시를 통해 응답 속도를 향상시키세요.</p>
                    </div>
                  </div>
                  
                  <div className="tip-item">
                    <div className="tip-icon">📊</div>
                    <div className="tip-content">
                      <h4>쿼리 최적화</h4>
                      <p>데이터베이스 쿼리를 최적화하여 응답 시간을 단축하세요.</p>
                    </div>
                  </div>
                  
                  <div className="tip-item">
                    <div className="tip-icon">⚡</div>
                    <div className="tip-content">
                      <h4>비동기 처리</h4>
                      <p>무거운 작업은 비동기로 처리하여 사용자 경험을 개선하세요.</p>
                    </div>
                  </div>
                  
                  <div className="tip-item">
                    <div className="tip-icon">🔍</div>
                    <div className="tip-content">
                      <h4>모니터링</h4>
                      <p>지속적인 모니터링을 통해 성능 이슈를 조기에 발견하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ApiPerformanceMonitoring;
