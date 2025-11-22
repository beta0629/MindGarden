/**
 * Calendar Widget
 * 캘린더를 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';

const CalendarWidget = ({ widget, user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const view = config.view || 'month';
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        // 응답에서 이벤트 배열 추출 (응답 구조에 따라 조정 필요)
        const items = Array.isArray(response) ? response : 
                     (response.data || response.events || []);
        setEvents(items);
      }
    } catch (err) {
      console.error('CalendarWidget 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="widget widget-calendar">
        <div className="widget-title">{config.title || '캘린더'}</div>
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="widget widget-calendar widget-error">
        <div className="widget-title">{config.title || '캘린더'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-calendar">
      <div className="widget-header">
        <div className="widget-title">{config.title || '캘린더'}</div>
      </div>
      <div className="widget-body">
        <div className="calendar-placeholder">
          <p>캘린더 뷰: {view}</p>
          <p>이벤트 수: {events.length}</p>
          <small>캘린더 라이브러리 통합 필요 (react-big-calendar, fullcalendar 등)</small>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;

