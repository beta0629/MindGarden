/**
 * Consultation Summary Widget - 표준화된 위젯
/**
 * 상담 요약 통계 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Calendar, Users, Clock, Target, FileText } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ConsultationSummaryWidget.css';

const ConsultationSummaryWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 데이터 소스 설정
  const getDataSourceConfig = () => {
    const period = widget.config?.period || 'month';
    
    return {
      type: 'multi-api',
      endpoints: {
        summary: {
          url: '/api/v1/consultations/summary',
          method: 'GET',
          params: { 
            period,
            // 상담사인 경우 자신의 상담만 조회
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        },
        trends: {
          url: '/api/v1/consultations/trends',
          method: 'GET',
          params: {
            period,
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        }
      },
      refreshInterval: widget.config?.refreshInterval || 300000, // 5분마다 새로고침
      cache: true,
      cacheDuration: 300000
    };
  };

  // Transform 함수
  const transform = (rawData) => {
    if (!rawData) return { summary: null, trends: null, hasData: false };

    const { summary, trends } = rawData;

    return {
      summary: summary || {
        totalSessions: 0,
        completedSessions: 0,
        activateClients: 0,
        averageRating: 0,
        totalDuration: 0,
        successRate: 0
      },
      trends: trends || {
        sessionGrowth: 0,
        clientGrowth: 0,
        ratingTrend: 0
      },
      hasData: summary && summary.totalSessions > 0
    };
  };

  // 위젯 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig(),
      transform
    }
  };

  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER),
    cache: true
  });

  // 권한 확인: 관리자와 상담사만 접근 가능
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
    return null;
  }

  // 성장률 색상
  const getTrendColor = (value) => {
    if (value > 0) return 'trend-positive';
    if (value < 0) return 'trend-negative';
    return 'trend-neutral';
  };

  // 성장률 아이콘
  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="trend-icon" />;
    if (value < 0) return <TrendingUp className="trend-icon rotate-180" />;
    return <TrendingUp className="trend-icon" />;
  };

  // 상세보기
  const handleViewReports = () => {
    navigate('/reports/consultations');
  };

  // 시간 포맷팅
  const formatDuration = (minutes) => {
    if (!minutes) return '0분';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  // 렌더링 내용
  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="summary-empty-state">
          <div className="empty-icon-wrapper">
            <BarChart3 className="empty-icon" />
          </div>
          <h3 className="empty-title">상담 데이터가 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '상담 완료 후 통계가 표시됩니다.'}
          </p>
        </div>
      );
    }

    const { summary, trends } = data;

    return (
      <div className="summary-content">
        {/* 주요 지표 */}
        <div className="summary-metrics">
          <div className="metric-card">
            <div className="metric-icon sessions">
              <Calendar />
            </div>
            <div className="metric-info">
              <div className="metric-number">{summary.totalSessions}</div>
              <div className="metric-label">총 세션</div>
              {trends && (
                <div className={`metric-trend ${getTrendColor(trends.sessionGrowth)}`}>
                  {getTrendIcon(trends.sessionGrowth)}
                  <span>{Math.abs(trends.sessionGrowth)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon clients">
              <Users />
            </div>
            <div className="metric-info">
              <div className="metric-number">{summary.activateClients}</div>
              <div className="metric-label">활성 내담자</div>
              {trends && (
                <div className={`metric-trend ${getTrendColor(trends.clientGrowth)}`}>
                  {getTrendIcon(trends.clientGrowth)}
                  <span>{Math.abs(trends.clientGrowth)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon duration">
              <Clock />
            </div>
            <div className="metric-info">
              <div className="metric-number">{formatDuration(summary.totalDuration)}</div>
              <div className="metric-label">총 상담시간</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon rating">
              <Target />
            </div>
            <div className="metric-info">
              <div className="metric-number">{summary.averageRating?.toFixed(1) || '0.0'}</div>
              <div className="metric-label">평균 평점</div>
              {trends && (
                <div className={`metric-trend ${getTrendColor(trends.ratingTrend)}`}>
                  {getTrendIcon(trends.ratingTrend)}
                  <span>{Math.abs(trends.ratingTrend)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 성과 지표 */}
        <div className="performance-section">
          <h4 className="section-title">성과 지표</h4>
          <div className="performance-grid">
            <div className="performance-item">
              <div className="performance-label">완료율</div>
              <div className="performance-value">
                {summary.totalSessions > 0 
                  ? ((summary.completedSessions / summary.totalSessions) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>
            <div className="performance-item">
              <div className="performance-label">성공률</div>
              <div className="performance-value">{summary.successRate?.toFixed(1) || 0}%</div>
            </div>
            <div className="performance-item">
              <div className="performance-label">세션당 평균시간</div>
              <div className="performance-value">
                {summary.totalSessions > 0 
                  ? formatDuration(Math.round(summary.totalDuration / summary.totalSessions))
                  : '0분'}
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="summary-actions">
          <button 
            className="mg-btn mg-btn-primary mg-btn-sm"
            onClick={handleViewReports}
          >
            <FileText className="btn-icon" />
            상세 보고서 보기
          </button>
        </div>
      </div>
    );
  };

  // 헤더 설정
  const headerConfig = {
    icon: <BarChart3 className="widget-header-icon" />,
    subtitle: '상담 성과 요약',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      {
        icon: 'FileText',
        label: '상세 보고서',
        onClick: handleViewReports
      }
    ]
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="consultation-summary-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultationSummaryWidget;