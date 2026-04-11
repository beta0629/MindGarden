/**
 * Calendar Widget - 표준화된 위젯
/**
 * 캘린더를 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import MGButton from '../../common/MGButton';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';

const CalendarWidget = ({ widget, user }) => {
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
    immediate: !!(user && user.id),
    cache: true,
    retryCount: 3
  });

  // 캘린더 렌더링
  const renderCalendar = () => {
    if (isEmpty) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 일정이 없습니다.
        </div>
      );
    }

    // 간단한 캘린더 플레이스홀더 (실제 캘린더 라이브러리 연동 필요)
    const today = new Date();
    const currentMonth = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h4 className="calendar-month">{currentMonth}</h4>
          <div className="calendar-nav">
            <MGButton className="nav-btn prev" variant="outline" type="button" title="이전 달">
              <i className="bi bi-chevron-left"></i>
            </MGButton>
            <MGButton className="nav-btn next" variant="outline" type="button" title="다음 달">
              <i className="bi bi-chevron-right"></i>
            </MGButton>
          </div>
        </div>
        
        <div className="calendar-placeholder">
          <i className="bi bi-calendar3"></i>
          <p>📅 캘린더 위젯</p>
          <p className="calendar-info">
            {hasData && Array.isArray(data) ? `${data.length}개의 일정` : '일정 없음'}
          </p>
          {/* TODO: 실제 캘린더 라이브러리 (FullCalendar, react-calendar 등) 연동 */}
          
          {hasData && Array.isArray(data) && (
            <div className="events-preview">
              <h5>최근 일정</h5>
              {data.slice(0, 3).map((event, index) => (
                <div key={index} className="event-item">
                  <div className="event-date">
                    {event.date ? new Date(event.date).toLocaleDateString('ko-KR') : '날짜 미정'}
                  </div>
                  <div className="event-title">{event.title || event.name || `일정 ${index + 1}`}</div>
                </div>
              ))}
              {data.length > 3 && (
                <div className="events-more">외 {data.length - 3}개 일정...</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.CALENDAR}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderCalendar()}
      </div>
    </BaseWidget>
  );
};

export default CalendarWidget;