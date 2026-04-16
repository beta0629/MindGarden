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

import { useWidget } from '../../../../hooks/useWidget';
import BaseWidget from '../BaseWidget';
import { RoleUtils, USER_ROLES } from '../../../../constants/roles';
import './ScheduleRegistrationWidget.css';
import SafeText from '../../../common/SafeText';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
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
        return null;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'IN_PROGRESS':
        return null;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'CANCELLED':
        return null;
      case 'UPCOMING':
        return null;
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'PENDING':
        return null;
      default:
        return null;
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
          <div className="empty-icon-wrapper" />
          <h3 className="empty-title">등록된 일정이 없습니다</h3>
          <p className="empty-description">
            {widget.config?.emptyMessage || '새로운 상담 일정을 등록해보세요.'}
          </p>
          {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
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
              onClick={handleCreateSchedule}
            >
              새 일정 등록
            </MGButton>
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
                
                {widget.config?.showTodayOnly !== false ? '오늘 일정' : '전체 일정'}
              </h4>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total" />
                <div className="stat-info">
                  <div className="stat-number">{todayStats.total}</div>
                  <div className="stat-label">총 일정</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed" />
                <div className="stat-info">
                  <div className="stat-number">{todayStats.completed}</div>
                  <div className="stat-label">완료</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon in-progress" />
                <div className="stat-info">
                  <div className="stat-number">{todayStats.inProgress}</div>
                  <div className="stat-label">진행중</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon upcoming" />
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
              onClick={handleViewAll}
            >
              전체 보기
            </MGButton>
          </div>
          <div className="schedule-items">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-info">
                  <div className="schedule-header">
                    <div className="schedule-time-info">
                      <div className="schedule-time">
                        
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
                      <span className="status-text"><SafeText>{getStatusLabel(schedule.status)}</SafeText></span>
                    </div>
                  </div>
                  <div className="schedule-details">
                    <SafeText tag="div" className="schedule-title" fallback="제목 없음">{schedule.title}</SafeText>
                    <div className="schedule-participants">
                      {schedule.consultantName && (
                        <div className="participant consultant">
                          <span className="participant-label">상담사:</span>
                          <span className="participant-name"><SafeText>{schedule.consultantName}</SafeText></span>
                        </div>
                      )}
                      {schedule.clientName && (
                        <div className="participant client">
                          <span className="participant-label">내담자:</span>
                          <span className="participant-name"><SafeText>{schedule.clientName}</SafeText></span>
                        </div>
                      )}
                    </div>
                    {schedule.location && (
                      <div className="schedule-location">
                        <span className="location-label">장소:</span>
                        <span className="location-value"><SafeText>{schedule.location}</SafeText></span>
                      </div>
                    )}
                    {schedule.notes && (
                      <div className="schedule-notes">
                        <span className="notes-label">메모:</span>
                        <span className="notes-value"><SafeText>{schedule.notes}</SafeText></span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="schedule-actions">
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'sm',
                      loading: false,
                      className: 'action-btn view-btn'
                    })}
                    loading={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleViewSchedule(schedule.id)}
                    title="상세 보기"
                    preventDoubleClick={false}
                  >
                    보기
                  </MGButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 액션 */}
        {(RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) && (
          <div className="schedule-quick-actions">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false
              })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleCreateSchedule}
            >
              새 일정 등록
            </MGButton>
          </div>
        )}
      </div>
    );
  };

  const headerConfig = {
    subtitle: '상담 일정 관리',
    actions: [
      {
        icon: 'REFRESH_CW',
        label: '새로고침',
        onClick: refresh
      },
      ...((RoleUtils.isAdmin(user) || RoleUtils.isConsultant(user)) ? [{
        icon: 'CALENDAR_PLUS',
        label: '새 일정',
        onClick: handleCreateSchedule
      }] : []),
      {
        icon: 'EXTERNAL_LINK',
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