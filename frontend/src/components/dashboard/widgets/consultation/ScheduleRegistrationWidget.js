/**
 * Schedule Registration Widget - 표준화된 위젯
/**
 * 상담소 특화 일정 등록 위젯
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
import { Calendar, Clock, Plus, Eye, CheckCircle, XCircle, AlertCircle, Users, CalendarPlus } from 'lucide-react';
import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ScheduleRegistrationWidget.css';

const ScheduleRegistrationWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  const getDataSourceConfig = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return {
      type: 'multi-api',
      endpoints: {
        schedules: {
          url: '/api/v1/schedules',
          method: 'GET',
          params: { 
            limit: widget.config?.maxItems || 10,
            ...(widget.config?.showTodayOnly !== false && { date: today }),
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        },
        todayStats: {
          url: '/api/v1/schedules/today-stats',
          method: 'GET',
          params: {
            ...(RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user) && { consultantId: user.id })
          }
        }
      },
      refreshInterval: widget.config?.refreshInterval || 30000, // 30초마다 새로고침
      cache: true,
      cacheDuration: 30000
    };
  };

  const transform = (rawData) => {
    if (!rawData) return { schedules: [], todayStats: null, hasData: false };

    const { schedules, todayStats } = rawData;

    return {
      schedules: Array.isArray(schedules) ? schedules.slice(0, widget.config?.maxItems || 10) : [],
      todayStats: todayStats || {
        total: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0,
        upcoming: 0
      },
      hasData: Array.isArray(schedules) && schedules.length > 0
    };
  };

  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig(),
      transform
    }
  };

  const {
    data,
    loading,
    error,
    hasData,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user),
    cache: true
  });

  if (!RoleUtils.isAdmin(user) && !RoleUtils.isConsultant(user) && !RoleUtils.isAdmin(user)) {
    return null;
  }

  const getStatusClass = (status) => {
    const statusMap = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': 'status-completed',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': 'status-in-progress',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': 'status-cancelled',
      'UPCOMING': 'status-upcoming',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': 'status-pending'
    };
    return statusMap[status] || 'status-unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'COMPLETED':
        return <CheckCircle className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'IN_PROGRESS':
        return <Users className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'CANCELLED':
        return <XCircle className="status-icon" />;
      case 'UPCOMING':
        return <Calendar className="status-icon" />;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return <Clock className="status-icon" />;
      default:
        return <AlertCircle className="status-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'COMPLETED': '완료',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'IN_PROGRESS': '진행중',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'CANCELLED': '취소',
      'UPCOMING': '예정',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      'PENDING': '대기'
    };
    return statusLabels[status] || '미지정';
  };

  const handleViewSchedule = (scheduleId) => {
    navigate(`/schedules/${scheduleId}`);
  };

  const handleCreateSchedule = () => {
    navigate('/schedules/new');
  };

  const handleViewAll = () => {
    navigate('/schedules');
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (dateString) => {
    const today = new Date().toDateString();
    const targetDate = new Date(dateString).toDateString();
    return today === targetDate;
  };

  const renderContent = () => {
    if (!hasData) {
      return (
        <div className="schedule-empty-state">
          <div className="empty-icon-wrapper">
            <Calendar className="empty-icon" />
          </div>
          <h3 className="empty-title">등록된 일정이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '새로운 상담 일정을 등록해보세요.'}
          </p>
          {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
            <button 
              className="mg-btn mg-btn-primary"
              onClick={handleCreateSchedule}
            >
              <Plus className="btn-icon" />
              새 일정 등록
            </button>
          )}
        </div>
      );
    }

    const { schedules, todayStats } = data;

    return (
      <div className="schedule-content">
        {/* 오늘 통계 섹션 */}
        {widget.config?.showStats !== false && todayStats && (
          <div className="today-stats">
            <div className="stats-header">
              <h4 className="stats-title">
                <Calendar className="stats-icon" />
                {widget.config?.showTodayOnly !== false ? '오늘 일정' : '전체 일정'}
              </h4>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total">
                  <Calendar />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{todayStats.total}</div>
                  <div className="stat-label">총 일정</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed">
                  <CheckCircle />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{todayStats.completed}</div>
                  <div className="stat-label">완료</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon in-progress">
                  <Users />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{todayStats.inProgress}</div>
                  <div className="stat-label">진행중</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon upcoming">
                  <Clock />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{todayStats.upcoming}</div>
                  <div className="stat-label">예정</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 일정 목록 */}
        <div className="schedule-list">
          <div className="list-header">
            <h4 className="list-title">
              {widget.config?.showTodayOnly !== false ? '오늘의 일정' : '최근 일정'}
            </h4>
            <button 
              className="mg-btn mg-btn-ghost mg-btn-sm"
              onClick={handleViewAll}
            >
              전체 보기
            </button>
          </div>
          <div className="schedule-items">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-info">
                  <div className="schedule-header">
                    <div className="schedule-time-info">
                      <div className="schedule-time">
                        <Clock className="time-icon" />
                        {formatDateTime(schedule.startTime)}
                        {schedule.endTime && (
                          <span className="time-separator">~{formatTime(schedule.endTime)}</span>
                        )}
                      </div>
                      {isToday(schedule.startTime) && (
                        <div className="today-badge">오늘</div>
                      )}
                    </div>
                    <div className={`schedule-status ${getStatusClass(schedule.status)}`}>
                      {getStatusIcon(schedule.status)}
                      <span className="status-text">{getStatusLabel(schedule.status)}</span>
                    </div>
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-title">{schedule.title || '제목 없음'}</div>
                    <div className="schedule-participants">
                      {schedule.consultantName && (
                        <div className="participant consultant">
                          <span className="participant-label">상담사:</span>
                          <span className="participant-name">{schedule.consultantName}</span>
                        </div>
                      )}
                      {schedule.clientName && (
                        <div className="participant client">
                          <span className="participant-label">내담자:</span>
                          <span className="participant-name">{schedule.clientName}</span>
                        </div>
                      )}
                    </div>
                    {schedule.location && (
                      <div className="schedule-location">
                        <span className="location-label">장소:</span>
                        <span className="location-value">{schedule.location}</span>
                      </div>
                    )}
                    {schedule.notes && (
                      <div className="schedule-notes">
                        <span className="notes-label">메모:</span>
                        <span className="notes-value">{schedule.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="schedule-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewSchedule(schedule.id)}
                    title="상세 보기"
                  >
                    <Eye className="action-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
          <div className="schedule-quick-actions">
            <button 
              className="mg-btn mg-btn-primary mg-btn-sm"
              onClick={handleCreateSchedule}
            >
              <CalendarPlus className="btn-icon" />
              새 일정 등록
            </button>
          </div>
        )}
      </div>
    );
  };

  const headerConfig = {
    icon: <Calendar className="widget-header-icon" />,
    subtitle: '상담 일정 관리',
    actions: [
      {
        icon: 'RefreshCw',
        label: '새로고침',
        onClick: refresh
      },
      ...((RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) ? [{
        icon: 'CalendarPlus',
        label: '새 일정',
        onClick: handleCreateSchedule
      }] : []),
      {
        icon: 'ExternalLink',
        label: '전체 보기',
        onClick: handleViewAll
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
      className="schedule-registration-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ScheduleRegistrationWidget;