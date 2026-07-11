import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import ApiPerformanceWidget from './widgets/ApiPerformanceWidget';
import { ResponseTimeLineChart, StatusCodeDoughnutChart, CacheHitBarChart } from './widgets/ApiPerformanceChart';
import MGButton from '../../components/common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ApiPerformanceReportGenerator } from '../../utils/apiPerformanceUtils';
import { API_PERFORMANCE_WIDGET } from '../../constants/widgetConstants';
import { getAiUsageStats } from '../../api/admin/aiUsageApi';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import './ApiPerformanceMonitoring.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_REPORTS_FINANCIAL = '/api/v1/reports/financial';
const API_USERS_EXPORT = '/api/v1/users/export';
const API_DASHBOARD_SUMMARY = '/api/v1/dashboard/summary';


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
    slowestEndpoint: API_REPORTS_FINANCIAL
  },
  slowApis: {
    API_REPORTS_FINANCIAL: { averageDuration: 850, maxDuration: 1250, totalRequests: 320 },
    API_USERS_EXPORT: { averageDuration: 720, maxDuration: 980, totalRequests: 150 },
    API_DASHBOARD_SUMMARY: { averageDuration: 640, maxDuration: 890, totalRequests: 5400 }
  }
};

/**
 * API 성능 모니터링 페이지
 * 종합적인 API 성능 분석 및 모니터링 대시보드
 */

/**
 * AI 로그 모니터링 지표 위젯
 */
const AiLogMonitorWidget = ({ loading, error, stats }) => {
  if (loading) {
    return (
      <div className="mg-v2-ad-b0kla__kpi-row api-perf-summary" style={{ marginBottom: 0 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card" style={{ opacity: 0.5 }}>
            <div className="api-perf-summary__bar" />
            <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">데이터 로딩 중...</span>
            <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value">-</span>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mg-v2-ad-b0kla__stat-item" style={{ color: 'var(--mg-v2-color-error, var(--mg-color-error-main))', width: '100%', padding: 'var(--mg-v2-space-4, 16px)' }}>
        AI 로그 모니터링 데이터를 불러오지 못했습니다. <br />
        <span style={{ fontSize: 'var(--mg-v2-font-size-caption, 12px)', color: 'var(--mg-v2-color-text-secondary, var(--mg-color-text-secondary))' }}>연동 API: GET /api/v1/admin/ai/usage-stats</span>
      </div>
    );
  }

  return (
    <div className="mg-v2-ad-b0kla__kpi-row api-perf-summary" style={{ marginBottom: 0 }}>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">오늘 호출 건수</span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value">
          {stats.callsToday?.toLocaleString() || 0}건
        </span>
      </div>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">성공률</span>
        <span 
          className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
          style={{ color: stats.successRate >= 95 ? 'var(--mg-success-500, var(--mg-color-success-main))' : stats.successRate >= 80 ? 'var(--mg-warning-500, var(--mg-color-warning-main))' : 'var(--mg-error-500, var(--mg-color-error-main))' }}
        >
          {stats.successRate != null ? `${stats.successRate}%` : '-'}
        </span>
      </div>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">평균 응답 시간</span>
        <span 
          className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value"
          style={{ color: stats.averageDurationMs < 2000 ? 'var(--mg-success-500, var(--mg-color-success-main))' : stats.averageDurationMs < 5000 ? 'var(--mg-warning-500, var(--mg-color-warning-main))' : 'var(--mg-error-500, var(--mg-color-error-main))' }}
        >
          {stats.averageDurationMs != null ? `${stats.averageDurationMs}ms` : '-'}
        </span>
      </div>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col api-perf-summary__card">
        <div className="api-perf-summary__bar" />
        <span className="mg-v2-ad-b0kla__text--sm mg-v2-ad-b0kla__flex api-perf-summary__label">총 사용 토큰</span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold api-perf-summary__value api-perf-summary__value--neutral">
          {stats.totalTokens?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );
};

const ApiPerformanceMonitoring = () => {
  const navigate = useNavigate();
  const [confirm, ConfirmModal] = useConfirm();
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  
  // 상태 관리
  const [dashboardData, setDashboardData] = useState(MOCK_CHART_DATA);
  const [aiStats, setAiStats] = useState(null);
  const [aiStatsLoading, setAiStatsLoading] = useState(false);
  const [aiStatsError, setAiStatsError] = useState(false);

  const fetchDashboardData = useCallback(async() => {
    setRefreshing(true);
    setAiStatsLoading(true);
    setAiStatsError(false);

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

    // AI 로그 모니터링 데이터 (실제 API 호출)
    try {
      const stats = await getAiUsageStats('today');
      setAiStats(stats);
    } catch (error) {
      console.error('AI 통계 조회 오류:', error);
      setAiStatsError(true);
    } finally {
      setAiStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 통계 초기화
  const handleClearStats = async() => {
    const messages = API_PERFORMANCE_WIDGET.MESSAGES;
    const confirmed = await confirm({ message: messages.CLEAR_CONFIRM, variant: 'warning' });
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
  const handleDownloadReport = async() => {
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
    <AdminCommonLayout title="API 성능 모니터링">
      <ContentArea>
        <ContentHeader 
          title="API 성능 및 트래픽 모니터링" 
          subtitle="실시간 API 응답 시간, 상태 코드 비율 및 서버 성능 지표를 모니터링합니다."
          actions={
            <div className="mg-v2-ad-b0kla__flex api-perf-monitor__actions">
              <MGButton
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: downloadLoading
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleDownloadReport}
                loading={downloadLoading}
                disabled={refreshing}
                preventDoubleClick
              >
                보고서 다운로드
              </MGButton>
              
              <MGButton
                variant="danger"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'danger',
                  size: 'sm',
                  loading: clearLoading
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleClearStats}
                loading={clearLoading}
                disabled={refreshing}
                preventDoubleClick
              >
                통계 초기화
              </MGButton>
              
              <MGButton
                variant="primary"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'sm',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={fetchDashboardData}
                disabled={refreshing}
              >
                {refreshing ? '새로고침 중...' : '새로고침'}
              </MGButton>
            </div>
          }
        />

        {/* Top Section: 요약 지표 카드 4종 */}
        <ApiPerformanceWidget summary={dashboardData.summary} />

        {/* AI 로그 모니터링 섹션 */}
        <ContentSection title="로컬 AI 로그 모니터링 지표 (Today)" className="api-perf-monitor__section">
          <AiLogMonitorWidget loading={aiStatsLoading} error={aiStatsError} stats={aiStats} />
        </ContentSection>

        {/* Middle Section: 메인 차트 2종 */}
        <div className="mg-v2-ad-b0kla__grid-container api-perf-monitor__grid api-perf-monitor__grid--7-3">
          {/* 응답 시간 트렌드 */}
          <ContentSection title="응답 시간 트렌드" className="api-perf-monitor__section">
            <div className="mg-v2-ad-b0kla__canvas-wrapper api-perf-monitor__canvas-wrapper">
              <ResponseTimeLineChart data={dashboardData.lineChart} />
            </div>
          </ContentSection>

          {/* 상태 코드 비율 */}
          <ContentSection title="상태 코드 비율" className="api-perf-monitor__section">
            <div className="mg-v2-ad-b0kla__canvas-wrapper api-perf-monitor__canvas-wrapper">
              <StatusCodeDoughnutChart data={dashboardData.doughnutChart} />
            </div>
          </ContentSection>
        </div>

        {/* Bottom Section: 상세 지표 및 리스트 */}
        <div className="mg-v2-ad-b0kla__grid-container api-perf-monitor__grid api-perf-monitor__grid--1-1">
          {/* 가장 느린 API 리스트 */}
          <ContentSection title="가장 느린 API Top 5" className="api-perf-monitor__section">
            <div className="mg-v2-ad-b0kla__list-wrapper api-perf-monitor__list">
              {Object.entries(dashboardData.slowApis).map(([endpoint, stats]) => (
                <div key={endpoint} className="api-perf-monitor__list-row">
                  <div className="api-perf-monitor__list-col">
                    <span className="api-perf-monitor__list-endpoint">{endpoint}</span>
                    <span className="api-perf-monitor__list-meta">요청 수: {stats.totalRequests.toLocaleString()}건</span>
                  </div>
                  <div className="api-perf-monitor__list-right">
                    <div className="api-perf-monitor__list-duration">{stats.averageDuration}ms</div>
                    <div className="api-perf-monitor__list-meta">최대 {stats.maxDuration}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          {/* 캐시 히트율 상세 */}
          <ContentSection title="캐시 히트 상태" className="api-perf-monitor__section">
            <div className="mg-v2-ad-b0kla__canvas-wrapper api-perf-monitor__canvas-wrapper--cache">
              <CacheHitBarChart data={dashboardData.cacheHit} />
            </div>
          </ContentSection>
        </div>

      </ContentArea>
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default ApiPerformanceMonitoring;
