/**
 * Schedule Widget - 표준화된 위젯
 * 스케줄을 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 2.0.0 (표준화 업그레이드)
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const ScheduleWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  const config = widget.config || {};
  const viewType = config.viewType || 'list'; // list, calendar, timeline

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 스케줄 상태에 따른 스타일 클래스
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'schedule-confirmed';
      case 'pending': return 'schedule-pending';
      case 'cancelled': return 'schedule-cancelled';
      case 'completed': return 'schedule-completed';
      default: return 'schedule-default';
    }
  };

  // 리스트 뷰 렌더링
  const renderListView = () => {
    return (
      <div className="schedule-list">
        {data.map((schedule, index) => (
          <div key={index} className={`schedule-item ${getStatusClass(schedule.status)}`}>
            <div className="schedule-time">
              <div className="schedule-date">{formatDate(schedule.startTime || schedule.date)}</div>
              <div className="schedule-time-range">
                {formatTime(schedule.startTime)} 
                {schedule.endTime && ` - ${formatTime(schedule.endTime)}`}
              </div>
            </div>
            <div className="schedule-content">
              <div className="schedule-title">
                {schedule.title || schedule.name || `일정 ${index + 1}`}
              </div>
              {schedule.description && (
                <div className="schedule-description">
                  {schedule.description}
                </div>
              )}
              <div className="schedule-meta">
                {schedule.location && (
                  <span className="schedule-location">
                    <i className="bi bi-geo-alt"></i>
                    {schedule.location}
                  </span>
                )}
                {schedule.attendees && (
                  <span className="schedule-attendees">
                    <i className="bi bi-people"></i>
                    {Array.isArray(schedule.attendees) ? schedule.attendees.length : schedule.attendees}명
                  </span>
                )}
                {schedule.status && (
                  <span className={`schedule-status ${getStatusClass(schedule.status)}`}>
                    {schedule.status}
                  </span>
                )}
              </div>
            </div>
            <div className="schedule-actions">
              {config.showActions && (
                <>
                  <button className="schedule-action-btn view" title="상세보기">
                    <i className="bi bi-eye"></i>
                  </button>
                  <button className="schedule-action-btn edit" title="수정">
                    <i className="bi bi-pencil"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 캘린더 뷰 렌더링 (간단한 플레이스홀더)
  const renderCalendarView = () => {
    return (
      <div className="schedule-calendar">
        <div className="calendar-placeholder">
          <i className="bi bi-calendar3"></i>
          <p>📅 캘린더 뷰</p>
          <p>{data.length}개의 일정</p>
          {/* TODO: 실제 캘린더 컴포넌트 연동 */}
        </div>
      </div>
    );
  };

  // 타임라인 뷰 렌더링
  const renderTimelineView = () => {
    return (
      <div className="schedule-timeline">
        {data.map((schedule, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <div className="timeline-time">
                {formatTime(schedule.startTime)}
              </div>
              <div className="timeline-title">
                {schedule.title || schedule.name}
              </div>
              {schedule.description && (
                <div className="timeline-description">
                  {schedule.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 스케줄 렌더링
  const renderScheduleContent = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 일정이 없습니다.
        </div>
      );
    }
    
    if (!hasData || !Array.isArray(data)) {
      return null; // BaseWidget에서 빈 상태 처리
    }

    switch (viewType) {
      case 'calendar':
        return renderCalendarView();
      case 'timeline':
        return renderTimelineView();
      default:
        return renderListView();
    }
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.SCHEDULE}
      subtitle={widget.config?.subtitle || ''}
      headerActions={
        config.showViewToggle && (
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
              title="리스트 뷰"
            >
              <i className="bi bi-list"></i>
            </button>
            <button 
              className={`view-btn ${viewType === 'calendar' ? 'active' : ''}`}
              title="캘린더 뷰"
            >
              <i className="bi bi-calendar3"></i>
            </button>
            <button 
              className={`view-btn ${viewType === 'timeline' ? 'active' : ''}`}
              title="타임라인 뷰"
            >
              <i className="bi bi-clock-history"></i>
            </button>
          </div>
        )
      }
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderScheduleContent()}
      </div>
    </BaseWidget>
  );
};

export default ScheduleWidget;