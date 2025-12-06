/**
 * Summary Panels Widget - 표준화된 요약 패널 위젯
/**
 * SummaryPanels 컴포넌트를 위젯으로 변환 + 실제 API 연동
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
import { 
  Calendar, Clock, BarChart3, Users, Settings, 
  Link, Star, TrendingUp, CheckCircle 
} from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../constants/roles';
import { getStatusLabel } from '../../../utils/colorUtils';
import { SUMMARY_PANELS_CSS } from '../../../constants/css';
import { DASHBOARD_ICONS, DASHBOARD_LABELS, DASHBOARD_MESSAGES } from '../../../constants/dashboard';
import './SummaryPanelsWidget.css';
import '../SummaryPanels.css';

const SummaryPanelsWidget = ({ widget, user }) => {
  // 상담사, 관리자, HQ_MASTER만 표시
  if (!RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
    return null;
  }

  const navigate = useNavigate();

  // 역할별 API 엔드포인트 결정
  const getDataSourceConfig = () => {
    const baseConfig = {
      type: 'api',
      cache: true,
      refreshInterval: 60000, // 1분마다 새로고침
      params: {
        userId: user.id,
        userRole: user.role
      }
    };
    
    if (RoleUtils.isConsultant(user)) {
      return {
        ...baseConfig,
        url: '/api/schedules',
        params: { ...baseConfig.params, userRole: 'CONSULTANT' }
      };
    } else if (RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
      return {
        ...baseConfig,
        url: '/api/v1/schedules/admin/statistics',
        params: { ...baseConfig.params, userRole: 'ADMIN' }
      };
    }
    
    return { type: 'static' };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (상담/관리 데이터)
  const {
    data: consultationData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 전문 분야 영어를 한글로 변환
  const convertSpecialtyToKorean = (specialty) => {
    if (!specialty) return '전문 분야 미정';
    
    const specialtyMap = {
      'DEPRESSION': '우울증',
      'ANXIETY': '불안장애',
      'TRAUMA': '트라우마',
      'RELATIONSHIP': '관계상담',
      'FAMILY': '가족상담',
      'COUPLE': '부부상담',
      'CHILD': '아동상담',
      'ADOLESCENT': '청소년상담',
      'ADDICTION': '중독상담',
      'EATING_DISORDER': '섭식장애',
      'PERSONALITY': '성격장애',
      'BIPOLAR': '양극성장애',
      'OCD': '강박장애',
      'PTSD': '외상후스트레스장애',
      'GRIEF': '상실상담',
      'CAREER': '진로상담',
      'STRESS': '스트레스관리',
      'SLEEP': '수면장애',
      'ANGER': '분노조절',
      'SELF_ESTEEM': '자존감'
    };

    return specialty.split(',').map(s => {
      const trimmed = s.trim();
      return specialtyMap[trimmed] || trimmed;
    }).join(', ');
  };

  // 매핑 관리 핸들러
  const handleMappingManagement = () => {
    navigate('/admin/mapping-management');
  };

  // 데이터 추출
  const upcomingCount = consultationData?.upcomingConsultations?.length || 0;
  const weeklyCount = consultationData?.weeklyConsultations || 0;
  const monthlyCount = consultationData?.monthlyConsultations || 0;
  const todayCount = consultationData?.todayConsultations || 0;
  const totalUsers = consultationData?.totalUsers || 0;
  const pendingMappings = consultationData?.pendingMappings || 0;
  const activeMappings = consultationData?.activeMappings || 0;
  const consultantInfo = consultationData?.consultantInfo || {};
  const rating = consultationData?.rating || 0;

  return (
    <div className="summary-panels-widget-wrapper">
      {/* 상담 일정 요약 (상담사/관리자 전용) */}
      {(RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user)) && (
        <BaseWidget
          widget={{
            ...widget,
            id: `${widget.id}-schedule`,
            title: '상담 일정 요약'
          }}
          user={user}
          loading={loading}
          error={error}
          isEmpty={false}
          onRefresh={refresh}
        >
          <div className="summary-panel consultation-summary">
            <div className="summary-items">
              <div className="summary-item">
                <div className="summary-icon">
                  <Clock size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.UPCOMING_CONSULTATIONS}</div>
                  <div className="summary-value">
                    {upcomingCount > 0 ? (
                      <div>
                        <div className="summary-value-number">{upcomingCount}건</div>
                        {/* 최근 3일치 상담만 표시 */}
                        {consultationData?.upcomingConsultations?.slice(0, 3).map((schedule, index) => (
                          <div key={index} className="summary-schedule-item">
                            <div className="summary-schedule-datetime">
                              {new Date(schedule.date).toLocaleDateString('ko-KR')} {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div 
                              className={`summary-schedule-status status-${schedule.status?.toLowerCase()}`}
                            >
                              {getStatusLabel(schedule.status)}
                            </div>
                          </div>
                        ))}
                        
                        {/* 더 많은 상담이 있을 때 자세히 보기 링크 */}
                        {upcomingCount > 3 && (
                          <div className="summary-more-indicator">
                            <button 
                              onClick={() => navigate('/consultant/schedule')}
                              className="summary-more-btn"
                            >
                              +{upcomingCount - 3}건 더 보기 →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="summary-no-data">{DASHBOARD_MESSAGES.NO_UPCOMING}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <Calendar size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.THIS_WEEK_CONSULTATIONS}</div>
                  <div className="summary-value">
                    <div className="summary-value-count">{weeklyCount}건</div>
                    {weeklyCount > 0 && (
                      <div className="summary-value-detail">
                        이번 주 상담 일정
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseWidget>
      )}

      {/* 상담 통계 (상담사 전용) */}
      {RoleUtils.isConsultant(user) && (
        <BaseWidget
          widget={{
            ...widget,
            id: `${widget.id}-stats`,
            title: '상담 통계'
          }}
          user={user}
          loading={loading}
          error={error}
          isEmpty={false}
          onRefresh={refresh}
        >
          <div className="summary-panel consultation-stats">
            <div className="summary-items">
              <div className="summary-item">
                <div className="summary-icon">
                  <BarChart3 size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.THIS_MONTH_CONSULTATIONS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{monthlyCount}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <Star size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.RATING}</div>
                  <div className="summary-value">
                    <span className="rating-display">
                      {rating > 0 ? `${rating.toFixed(1)} / 5.0` : DASHBOARD_MESSAGES.NO_RATING}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseWidget>
      )}

      {/* 시스템 현황 (관리자 전용) */}
      {RoleUtils.isAdmin(user) && (
        <BaseWidget
          widget={{
            ...widget,
            id: `${widget.id}-system`,
            title: '시스템 현황'
          }}
          user={user}
          loading={loading}
          error={error}
          isEmpty={false}
          onRefresh={refresh}
        >
          <div className="summary-panel system-status">
            <div className="summary-items">
              <div className="summary-item">
                <div className="summary-icon">
                  <Users size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.TOTAL_USERS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{totalUsers}</span>
                    <span className="summary-value-unit">명</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <Calendar size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.TODAY_CONSULTATIONS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{todayCount}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseWidget>
      )}

      {/* 매핑 관리 (관리자 전용) */}
      {RoleUtils.isAdmin(user) && (
        <BaseWidget
          widget={{
            ...widget,
            id: `${widget.id}-mapping`,
            title: '매핑 관리'
          }}
          user={user}
          loading={loading}
          error={error}
          isEmpty={false}
          onRefresh={refresh}
        >
          <div className="summary-panel mapping-management">
            <div className="summary-items">
              <div className="summary-item">
                <div className="summary-icon">
                  <Clock size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.PENDING_APPROVALS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{pendingMappings}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.ACTIVE_MAPPINGS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{activeMappings}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mapping-actions">
              <button 
                className="mapping-manage-btn"
                onClick={handleMappingManagement}
              >
                <Settings size={16} />
                매핑 관리
              </button>
            </div>
          </div>
        </BaseWidget>
      )}
    </div>
  );
};

export default SummaryPanelsWidget;
