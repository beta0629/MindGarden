/**
 * Consultation Schedule Widget
 * 상담소 특화 일정 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../../common/UnifiedLoading';
import { apiGet } from '../../../../utils/ajax';
import { getStatusLabel } from '../../../../utils/colorUtils';
import '../Widget.css';

const ConsultationScheduleWidget = ({ widget, user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 10;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadSchedules();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadSchedules, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.schedules && Array.isArray(config.schedules)) {
      setSchedules(config.schedules.slice(0, maxItems));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiGet(dataSource.url, dataSource.params || {});
      
      if (response) {
        const scheduleList = response.schedules || response.data || response || [];
        setSchedules(Array.isArray(scheduleList) ? scheduleList.slice(0, maxItems) : []);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('ConsultationScheduleWidget 데이터 로드 실패:', err);
      setError(err.message);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && schedules.length === 0) {
    return (
      <div className="widget widget-consultation-schedule">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  if (error && schedules.length === 0) {
    return (
      <div className="widget widget-consultation-schedule widget-error">
        <div className="widget-title">{config.title || '상담 일정'}</div>
        <div className="widget-error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="widget widget-consultation-schedule">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-calendar"></i>
          {config.title || '상담 일정'}
        </div>
        {config.viewAllUrl && (
          <a href={config.viewAllUrl} className="widget-view-all">
            전체보기 →
          </a>
        )}
      </div>
      <div className="widget-body">
        <div className="consultation-schedule-list">
          {schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <div key={schedule.id || index} className="consultation-schedule-item">
                <div className="schedule-date">
                  {new Date(schedule.date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="schedule-time">
                  {schedule.startTime} - {schedule.endTime}
                </div>
                <div className="schedule-info">
                  <div className="schedule-client">
                    {schedule.clientName || schedule.client?.name || '고객'}
                  </div>
                  <div 
                    className="schedule-status"
                    data-status={schedule.status}
                  >
                    {getStatusLabel(schedule.status)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-schedules">
              <i className="bi bi-inbox"></i>
              <p>{config.emptyMessage || '예정된 상담이 없습니다'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationScheduleWidget;

