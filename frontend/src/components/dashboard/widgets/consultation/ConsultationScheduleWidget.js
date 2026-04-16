/**
 * Consultation Schedule Widget - 표준화된 위젯
/**
 * 상담 일정 위젯
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

import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ConsultationScheduleWidget.css';
import SafeText from '../../../common/SafeText';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
const ConsultationScheduleWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => ({
    type: 'api',
    url: '/api/v1/consultation-schedules',
    method: 'GET',
    params: { 
      limit: widget.config?.maxItems || 5,
      date: new Date().toISOString().split('T')[0],
      ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
    },
    refreshInterval: 60000,
    cache: true
  });

  const transform = (rawData) => {
    if (!rawData) return { schedules: [], hasData: false };
    return {
      schedules: Array.isArray(rawData) ? rawData : [],
      hasData: Array.isArray(rawData) && rawData.length > 0
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: { ...widget.config, dataSource: getDataSourceConfig(), transform }
  };

  const { data, loading, error, hasData, refresh } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true
  });

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="schedule-empty-state">
          <div className="empty-icon-wrapper" />
          <h3 className="empty-title">오늘 일정 없음</h3>
          <p className="empty-description">새로운 상담 일정을 추가하세요.</p>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false
            })}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/schedules/new')}
          >
            일정 추가
          </MGButton>
        </div>
      );
    }

    const { schedules } = data;

    return (
      <div className="schedule-content">
        <div className="schedule-list">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-time">
                
                <span><SafeText>{formatTime(schedule.startTime)}</SafeText></span>
              </div>
              <div className="schedule-info">
                <SafeText tag="div" className="schedule-title" fallback="상담 세션">{schedule.title}</SafeText>
                <div className="schedule-client">
                  
                  <span><SafeText>{schedule.clientName}</SafeText></span>
                </div>
              </div>
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'schedule-view-btn'
                })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => navigate(`/schedules/${schedule.id}`)}
                title="상세 보기"
                preventDoubleClick={false}
              >
                보기
              </MGButton>
            </div>
          ))}
        </div>
        <div className="schedule-actions">
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/schedules')}
          >
            전체 일정 보기
          </MGButton>
        </div>
      </div>
    );
  };

  const headerConfig = {
    subtitle: '오늘의 상담 일정',
    actions: [
      { icon: 'REFRESH_CW', label: '새로고침', onClick: refresh },
      { icon: 'PLUS', label: '일정 추가', onClick: () => navigate('/schedules/new') }
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
      className="consultation-schedule-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ConsultationScheduleWidget;