import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ApiPerformanceWidget from './widgets/ApiPerformanceWidget';
import { ResponseTimeLineChart, StatusCodeDoughnutChart, CacheHitBarChart } from './widgets/ApiPerformanceChart';
import MGButton from '../../components/common/MGButton';
import { ApiPerformanceReportGenerator } from '../../utils/apiPerformanceUtils';
import { API_PERFORMANCE_WIDGET } from '../../constants/widgetConstants';
import notificationManager from '../../utils/notification';

// Mock Data
const MOCK_CHART_DATA = {
  lineChart: {
    labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    values: [120, 110, 105, 95, 140, 210, 250, 230, 190, 180, 150, 130]
  },
  doughnutChart: {
    success: 85,
    clientError: 10,
    serverError: 5
  },
  cacheHit: {
    hitRate: 78
  },
  summary: {
    averageResponseTime: 145,
    overallErrorRate: 2.5,
    totalRequests: 154200,
    slowestRequest: 1250,
    slowestEndpoint: '/api/v1/reports/financial'
  },
  slowApis: {
    '/api/v1/reports/financial': { averageDuration: 850, maxDuration: 1250, totalRequests: 320 },
    '/api/v1/users/export': { averageDuration: 720, maxDuration: 980, totalRequests: 150 },
    '/api/v1/dashboard/summary': { averageDuration: 640, maxDuration: 890, totalRequests: 5400 }
  }
};

/**
 * API 성능 모니터링 페이지
 * 종합적인 API 성능 분석 및 모니터링 대시보드
 */
const ApiPerformanceMonitoring = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  
  // 상태 관리
  const [dashboardData, setDashboardData] = useState(MOCK_CHART_DATA);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    // 실제 환경에서는 API 호출을 통해 데이터를 가져옵니다.
    // 현재는 Mock 데이터로 시뮬레이션합니다.
    setTimeout(() => {
      setDashboardData({
        ...MOCK_CHART_DATA,
        summary: {
          ...MOCK_CHART_DATA.summary,
          totalRequests: MOCK_CHART_DATA.summary.totalRequests + Math.floor(Math.random() * 1000)
        }
      });
      setRefreshing(false);
    }, 800);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 통계 초기화
  const handleClearStats = async () => {
    const messages = API_PERFORMANCE_WIDGET.MESSAGES;
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(messages.CLEAR_CONFIRM, resolve);
    });
    if (!confirmed) return;
    
    setClearLoading(true);
    try {
      // Mock 동작
      setTimeout(() => {
        notificationManager.success(messages.CLEAR_SUCCESS);
        fetchDashboardData();
        setClearLoading(false);
      }, 800);
    } catch (error) {
      console.error('통계 초기화 오류:', error);
      notificationManager.error(messages.CLEAR_ERROR);
      setClearLoading(false);
    }
  };

  // 성능 보고서 다운로드
  const handleDownloadReport = async () => {
    setDownloadLoading(true);
    try {
      // Mock 동작
      setTimeout(() => {
        const reportData = ApiPerformanceReportGenerator.generateReportData(dashboardData || {});
        ApiPerformanceReportGenerator.downloadJsonReport(reportData);
        setDownloadLoading(false);
      }, 800);
    } catch (error) {
      console.error('보고서 다운로드 오류:', error);
      notificationManager.error(API_PERFORMANCE_WIDGET.MESSAGES.DOWNLOAD_ERROR);
      setDownloadLoading(false);
    }
  };

  return (
    <AdminCommonLayout 
      title="API 성능 및 트래픽 모니터링" 
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
            통계 초기화
          </MGButton>
          
          <MGButton
            variant="primary"
            size="small"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            {refreshing ? '새로고침 중...' : '새로고침'}
          </MGButton>
        </div>
      }
    >
      <div className="mg-v2-ad-b0kla__container" style={{ padding: 'var(--mg-spacing-24) var(--mg-spacing-32)' }}>
        
        {/* Top Section: 요약 지표 카드 4종 */}
        <ApiPerformanceWidget summary={dashboardData.summary} />

        {/* Middle Section: 메인 차트 2종 */}
        <div className="mg-v2-ad-b0kla__grid-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: '7fr 3fr', 
          gap: 'var(--mg-spacing-16)', 
          marginTop: 'var(--mg-spacing-24)' 
        }}>
          {/* 응답 시간 트렌드 */}
          <div className="mg-v2-ad-b0kla__chart-section" style={{
            backgroundColor: 'var(--mg-color-surface-main)',
            border: '1px solid var(--mg-color-border-main)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div className="mg-v2-ad-b0kla__section-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span className="mg-v2-ad-b0kla__accent-bar" style={{ width: '4px', height: '16px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '2px', marginRight: '8px' }}></span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--mg-color-text-main)', margin: 0 }}>응답 시간 트렌드</h3>
            </div>
            <div className="mg-v2-ad-b0kla__canvas-wrapper" style={{ position: 'relative', height: '300px', width: '100%' }}>
              <ResponseTimeLineChart data={dashboardData.lineChart} />
            </div>
          </div>

          {/* 상태 코드 비율 */}
          <div className="mg-v2-ad-b0kla__chart-section" style={{
            backgroundColor: 'var(--mg-color-surface-main)',
            border: '1px solid var(--mg-color-border-main)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div className="mg-v2-ad-b0kla__section-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span className="mg-v2-ad-b0kla__accent-bar" style={{ width: '4px', height: '16px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '2px', marginRight: '8px' }}></span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--mg-color-text-main)', margin: 0 }}>상태 코드 비율</h3>
            </div>
            <div className="mg-v2-ad-b0kla__canvas-wrapper" style={{ position: 'relative', height: '300px', width: '100%' }}>
              <StatusCodeDoughnutChart data={dashboardData.doughnutChart} />
            </div>
          </div>
        </div>

        {/* Bottom Section: 상세 지표 및 리스트 */}
        <div className="mg-v2-ad-b0kla__grid-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 'var(--mg-spacing-16)', 
          marginTop: 'var(--mg-spacing-24)' 
        }}>
          {/* 가장 느린 API 리스트 */}
          <div className="mg-v2-ad-b0kla__chart-section" style={{
            backgroundColor: 'var(--mg-color-surface-main)',
            border: '1px solid var(--mg-color-border-main)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div className="mg-v2-ad-b0kla__section-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span className="mg-v2-ad-b0kla__accent-bar" style={{ width: '4px', height: '16px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '2px', marginRight: '8px' }}></span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--mg-color-text-main)', margin: 0 }}>가장 느린 API Top 5</h3>
            </div>
            <div className="mg-v2-ad-b0kla__list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(dashboardData.slowApis).map(([endpoint, stats]) => (
                <div key={endpoint} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--mg-color-border-main)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--mg-color-text-main)' }}>{endpoint}</span>
                    <span style={{ fontSize: '12px', color: 'var(--mg-color-text-secondary)', marginTop: '4px' }}>요청 수: {stats.totalRequests.toLocaleString()}건</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--mg-color-error-main, #ef4444)' }}>{stats.averageDuration}ms</div>
                    <div style={{ fontSize: '12px', color: 'var(--mg-color-text-secondary)', marginTop: '4px' }}>최대 {stats.maxDuration}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 캐시 히트율 상세 */}
          <div className="mg-v2-ad-b0kla__chart-section" style={{
            backgroundColor: 'var(--mg-color-surface-main)',
            border: '1px solid var(--mg-color-border-main)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div className="mg-v2-ad-b0kla__section-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span className="mg-v2-ad-b0kla__accent-bar" style={{ width: '4px', height: '16px', backgroundColor: 'var(--mg-color-primary-main)', borderRadius: '2px', marginRight: '8px' }}></span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--mg-color-text-main)', margin: 0 }}>캐시 히트 상태</h3>
            </div>
            <div className="mg-v2-ad-b0kla__canvas-wrapper" style={{ position: 'relative', height: '100px', width: '100%', display: 'flex', alignItems: 'center' }}>
              <CacheHitBarChart data={dashboardData.cacheHit} />
            </div>
          </div>
        </div>

      </div>
    </AdminCommonLayout>
  );
};

export default ApiPerformanceMonitoring;
