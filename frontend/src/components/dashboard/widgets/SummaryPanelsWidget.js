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

import BaseWidget from './BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../constants/roles';
import { getStatusLabel } from '../../../utils/colorUtils';
import { SUMMARY_PANELS_CSS } from '../../../constants/css';
import { DASHBOARD_ICONS, DASHBOARD_LABELS, DASHBOARD_MESSAGES } from '../../../constants/dashboard';
import { useWidget } from '../../../hooks/useWidget';
import './SummaryPanelsWidget.css';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import '../SummaryPanels.css';
import { SCHEDULE_API } from '../../../constants/api';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_SCHEDULES_ADMIN_STATISTICS = '/api/v1/schedules/admin/statistics';

const SummaryPanelsWidget = ({ widget, user }) => {
  const { t } = useTranslation();
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
        url: SCHEDULE_API.SCHEDULES,
        params: { ...baseConfig.params, userRole: USER_ROLES.CONSULTANT }
      };
    } else if (RoleUtils.isAdmin(user)) {
      return {
        ...baseConfig,
        url: API_SCHEDULES_ADMIN_STATISTICS,
        params: { ...baseConfig.params, userRole: USER_ROLES.ADMIN }
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
    immediate: RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true,
    retryCount: 3
  });

  // 4종 SSOT: ADMIN(레거시 HQ_MASTER 포함) 또는 CONSULTANT 만 표시
  if (!RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  // 전문 분야 영어를 한글로 변환
  const convertSpecialtyToKorean = (specialty) => {
    if (!specialty) return t('common:dashboard.SummaryPanelsWidget.t_59e54ed1');
    
    const specialtyMap = {
      'DEPRESSION': t('common:dashboard.SummaryPanelsWidget.t_ab01081f'),
      'ANXIETY': t('common:dashboard.SummaryPanelsWidget.t_dc470840'),
      'TRAUMA': t('common:dashboard.SummaryPanelsWidget.t_a7f0acf4'),
      'RELATIONSHIP': t('common:dashboard.SummaryPanelsWidget.t_5f7b31c3'),
      'FAMILY': t('common:dashboard.SummaryPanelsWidget.t_aaa928a6'),
      'COUPLE': t('common:dashboard.SummaryPanelsWidget.t_62b69843'),
      'CHILD': t('common:dashboard.SummaryPanelsWidget.t_a3a0c008'),
      'ADOLESCENT': t('common:dashboard.SummaryPanelsWidget.t_62dd9bfa'),
      'ADDICTION': t('common:dashboard.SummaryPanelsWidget.t_e00f86f0'),
      'EATING_DISORDER': t('common:dashboard.SummaryPanelsWidget.t_eadeca31'),
      'PERSONALITY': t('common:dashboard.SummaryPanelsWidget.t_64289520'),
      'BIPOLAR': t('common:dashboard.SummaryPanelsWidget.t_06ce7165'),
      'OCD': t('common:dashboard.SummaryPanelsWidget.t_d6006d9e'),
      'PTSD': t('common:dashboard.SummaryPanelsWidget.t_85fa51cf'),
      'GRIEF': t('common:dashboard.SummaryPanelsWidget.t_62d41eac'),
      'CAREER': t('common:dashboard.SummaryPanelsWidget.t_a9676d11'),
      'STRESS': t('common:dashboard.SummaryPanelsWidget.t_15a15b24'),
      'SLEEP': t('common:dashboard.SummaryPanelsWidget.t_4af66e7c'),
      'ANGER': t('common:dashboard.SummaryPanelsWidget.t_53166452'),
      'SELF_ESTEEM': t('common:dashboard.SummaryPanelsWidget.t_1544ba61')
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
            title: t('common:dashboard.SummaryPanelsWidget.t_8302c271')
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
                <div className="summary-icon" />
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
                            <MGButton
                              type="button"
                              variant="outline"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'md',
                                loading: false,
                                className: 'summary-more-btn'
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() => navigate('/consultant/schedule')}
                              preventDoubleClick={false}
                            >
                              +{upcomingCount - 3}건 더 보기 →
                            </MGButton>
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
                <div className="summary-icon" />
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
            title: t('common:dashboard.SummaryPanelsWidget.t_c835853c')
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
                <div className="summary-icon" />
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.THIS_MONTH_CONSULTATIONS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{monthlyCount}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon" />
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
            title: t('common:dashboard.SummaryPanelsWidget.t_95e52069')
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
                <div className="summary-icon" />
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.TOTAL_USERS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{totalUsers}</span>
                    <span className="summary-value-unit">명</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon" />
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
            title: t('common:dashboard.SummaryPanelsWidget.t_8ca36d98')
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
                <div className="summary-icon" />
                <div className="summary-info">
                  <div className="summary-label">{DASHBOARD_LABELS.PENDING_APPROVALS}</div>
                  <div className="summary-value">
                    <span className="summary-value-number">{pendingMappings}</span>
                    <span className="summary-value-unit">건</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon" />
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
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  loading: false,
                  className: 'mapping-manage-btn'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleMappingManagement}
                preventDoubleClick={false}
              >
                {t('admin.labels.mappingManagement')}
              </MGButton>
            </div>
          </div>
        </BaseWidget>
      )}
    </div>
  );
};

export default SummaryPanelsWidget;