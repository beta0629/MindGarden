import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSync, FaTrash, FaDownload } from 'react-icons/fa';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ApiPerformanceWidget from './widgets/ApiPerformanceWidget';
import PerformanceWidget from './widgets/PerformanceWidget';
import MGButton from '../../components/common/MGButton';
import { ApiPerformanceReportGenerator } from '../../utils/apiPerformanceUtils';
import { WIDGET_CONSTANTS, API_PERFORMANCE_WIDGET } from '../../constants/widgetConstants';
import notificationManager from '../../utils/notification';

/**
 * API 성능 모니터링 페이지
 * 종합적인 API 성능 분석 및 모니터링 대시보드
 */
const ApiPerformanceMonitoring = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

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
    const messages = API_PERFORMANCE_WIDGET.MESSAGES;
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(messages.CLEAR_CONFIRM, resolve);
    });
    if (!confirmed) return;
    
    setClearLoading(true);
    try {
      const response = await fetch(API_PERFORMANCE_WIDGET.API_ENDPOINTS.CLEAR_STATS, { 
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
    } finally {
      setClearLoading(false);
    }
  };

  // 성능 보고서 다운로드
  const handleDownloadReport = async () => {
    setDownloadLoading(true);
    try {
      const response = await fetch(API_PERFORMANCE_WIDGET.API_ENDPOINTS.STATS);
      if (response.ok) {
        const data = await response.json();
        const reportData = ApiPerformanceReportGenerator.generateReportData(data.data || {});
        ApiPerformanceReportGenerator.downloadJsonReport(reportData);
      }
    } catch (error) {
      console.error('보고서 다운로드 오류:', error);
      notificationManager.error(API_PERFORMANCE_WIDGET.MESSAGES.DOWNLOAD_ERROR);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <AdminCommonLayout 
      title="API 성능 모니터링" 
      loading={false}
      headerActions={
        <div className="mg-v2-ad-b0kla__flex" style={{ gap: 'var(--mg-spacing-8)' }}>
          <MGButton
            variant="outline"
            size="small"
            onClick={handleDownloadReport}
            loading={downloadLoading}
            loadingText="다운로드 중..."
            disabled={refreshing}
            preventDoubleClick
          >
            <FaDownload className="mg-v2-ad-b0kla__icon" style={{ marginRight: 'var(--mg-spacing-4)' }} />
            보고서 다운로드
          </MGButton>
          
          <MGButton
            variant="danger"
            size="small"
            onClick={handleClearStats}
            loading={clearLoading}
            loadingText="초기화 중..."
            disabled={refreshing}
            preventDoubleClick
          >
            <FaTrash className="mg-v2-ad-b0kla__icon" style={{ marginRight: 'var(--mg-spacing-4)' }} />
            통계 초기화
          </MGButton>
          
          <MGButton
            variant="primary"
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={`mg-v2-ad-b0kla__icon ${refreshing ? 'spinning' : ''}`} style={{ marginRight: 'var(--mg-spacing-4)' }} />
            새로고침
          </MGButton>
        </div>
      }
    >
      <div className="mg-v2-ad-b0kla__container">
        <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--mg-spacing-24)' }}>
          {/* 시스템 성능 위젯 */}
          <div style={{ gridColumn: 'span 12' }}>
            <PerformanceWidget 
              title="시스템 성능 개요"
              refreshInterval={10000}
            />
          </div>

          {/* API 성능 위젯 */}
          <div style={{ gridColumn: 'span 12' }}>
            <ApiPerformanceWidget 
              title="API 성능 분석"
              refreshInterval={15000}
            />
          </div>

          {/* 추가 성능 지표 위젯들 */}
          <div style={{ gridColumn: 'span 12' }}>
            <div className="mg-v2-ad-b0kla__card">
              <div className="mg-v2-ad-b0kla__card-header">
                <h3 className="mg-v2-ad-b0kla__text--lg mg-v2-ad-b0kla__text--bold">성능 최적화 팁</h3>
              </div>
              <div className="mg-v2-ad-b0kla__card-body mg-v2-ad-b0kla__flex mg-v2-ad-b0kla__flex-col" style={{ gap: 'var(--mg-spacing-16)' }}>
                <div className="mg-v2-ad-b0kla__flex" style={{ alignItems: 'flex-start' }}>
                  <div className="mg-v2-ad-b0kla__icon" style={{ fontSize: '1.5rem', marginRight: 'var(--mg-spacing-16)' }}>🚀</div>
                  <div>
                    <h4 className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--md">캐시 활용</h4>
                    <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)', marginTop: 'var(--mg-spacing-4)' }}>자주 사용되는 데이터는 캐시를 통해 응답 속도를 향상시키세요.</p>
                  </div>
                </div>
                
                <div className="mg-v2-ad-b0kla__flex" style={{ alignItems: 'flex-start' }}>
                  <div className="mg-v2-ad-b0kla__icon" style={{ fontSize: '1.5rem', marginRight: 'var(--mg-spacing-16)' }}>📊</div>
                  <div>
                    <h4 className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--md">쿼리 최적화</h4>
                    <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)', marginTop: 'var(--mg-spacing-4)' }}>데이터베이스 쿼리를 최적화하여 응답 시간을 단축하세요.</p>
                  </div>
                </div>
                
                <div className="mg-v2-ad-b0kla__flex" style={{ alignItems: 'flex-start' }}>
                  <div className="mg-v2-ad-b0kla__icon" style={{ fontSize: '1.5rem', marginRight: 'var(--mg-spacing-16)' }}>⚡</div>
                  <div>
                    <h4 className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--md">비동기 처리</h4>
                    <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)', marginTop: 'var(--mg-spacing-4)' }}>무거운 작업은 비동기로 처리하여 사용자 경험을 개선하세요.</p>
                  </div>
                </div>
                
                <div className="mg-v2-ad-b0kla__flex" style={{ alignItems: 'flex-start' }}>
                  <div className="mg-v2-ad-b0kla__icon" style={{ fontSize: '1.5rem', marginRight: 'var(--mg-spacing-16)' }}>🔍</div>
                  <div>
                    <h4 className="mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--md">모니터링</h4>
                    <p className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)', marginTop: 'var(--mg-spacing-4)' }}>지속적인 모니터링을 통해 성능 이슈를 조기에 발견하세요.</p>
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
