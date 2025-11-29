/**
 * Consultation Schedule Widget - 표준화된 위젯
 * 상담 일정 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
 * @since 2025-11-29
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Eye, Users, CalendarCheck } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ConsultationScheduleWidget.css';

const ConsultationScheduleWidget = ({ widget, user }) => {
  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)) {
    return null;
  }

  const navigate = useNavigate();

  const getDataSourceConfig = () => ({
    type: 'api',
    url: '/api/consultation-schedules',
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
    immediate: true,
    cache: true
  });

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
          <div className="empty-icon-wrapper">
            <CalendarCheck className="empty-icon" />
          </div>
          <h3 className="empty-title">오늘 일정 없음</h3>
          <p className="empty-description">새로운 상담 일정을 추가하세요.</p>
          <button className="mg-btn mg-btn-primary" onClick={() => navigate('/schedules/new')}>
            <Plus className="btn-icon" />
            일정 추가
          </button>
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
                <Clock className="time-icon" />
                <span>{formatTime(schedule.startTime)}</span>
              </div>
              <div className="schedule-info">
                <div className="schedule-title">{schedule.title || '상담 세션'}</div>
                <div className="schedule-client">
                  <Users className="client-icon" />
                  <span>{schedule.clientName}</span>
                </div>
              </div>
              <button 
                className="schedule-view-btn" 
                onClick={() => navigate(`/schedules/${schedule.id}`)}
              >
                <Eye className="view-icon" />
              </button>
            </div>
          ))}
        </div>
        <div className="schedule-actions">
          <button className="mg-btn mg-btn-ghost mg-btn-sm" onClick={() => navigate('/schedules')}>
            전체 일정 보기
          </button>
        </div>
      </div>
    );
  };

  const headerConfig = {
    icon: <Calendar className="widget-header-icon" />,
    subtitle: '오늘의 상담 일정',
    actions: [
      { icon: 'RefreshCw', label: '새로고침', onClick: refresh },
      { icon: 'Plus', label: '일정 추가', onClick: () => navigate('/schedules/new') }
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