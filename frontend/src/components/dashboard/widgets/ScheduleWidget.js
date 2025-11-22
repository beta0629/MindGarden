/**
 * Schedule Widget
 * 일정 목록을 표시하는 범용 위젯
 * ScheduleQuickAccess를 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const ScheduleWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  const showTodayOnly = config.showTodayOnly !== false;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadSchedules();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadSchedules, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.schedules && Array.isArray(config.schedules)) {
      setSchedules(config.schedules);
      setTodayCount(config.schedules.filter(s => isToday(s.date)).length);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/schedules/${user?.id}`;
      const params = { 
        ...dataSource.params, 
        userId: user?.id,
        ...(showTodayOnly && { date: new Date().toISOString().split('T')[0] })
      };
      
      const response = await apiGet(url, params);
      
      if (response) {
        const scheduleList = response.schedules || response.data || response || [];
        const filtered = showTodayOnly 
          ? scheduleList.filter(s => isToday(s.date))
          : scheduleList;
        setSchedules(Array.isArray(filtered) ? filtered.slice(0, maxItems) : []);
        setTodayCount(filtered.filter(s => isToday(s.date)).length);
      } else {
        setSchedules([]);
        setTodayCount(0);
      }
    } catch (err) {
      console.error('ScheduleWidget 데이터 로드 실패:', err);
      setSchedules([]);
      setTodayCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date().toISOString().split('T')[0];
    const scheduleDate = new Date(date).toISOString().split('T')[0];
    return today === scheduleDate;
  };
  
  const handleScheduleClick = (schedule) => {
    if (config.scheduleUrl) {
      navigate(config.scheduleUrl);
    } else {
      navigate('/schedule');
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/schedule');
    }
  };
  
  if (loading && schedules.length === 0) {
    return (
      <div className="widget widget-schedule">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-schedule">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-calendar"></i>
          {config.title || (showTodayOnly ? '오늘의 일정' : '일정')}
          {todayCount > 0 && (
            <span className="widget-badge">{todayCount}</span>
          )}
        </div>
        {config.viewAllUrl && (
          <button className="widget-view-all" onClick={handleViewAll}>
            전체보기 →
          </button>
        )}
      </div>
      <div className="widget-body">
        {schedules.length > 0 ? (
          <div className="schedule-list">
            {schedules.map((schedule, index) => (
              <div
                key={schedule.id || index}
                className="schedule-item"
                onClick={() => handleScheduleClick(schedule)}
              >
                <div className="schedule-time">
                  {schedule.startTime} - {schedule.endTime}
                </div>
                <div className="schedule-content">
                  <div className="schedule-title">{schedule.title || schedule.subject}</div>
                  {schedule.description && (
                    <div className="schedule-description">{schedule.description}</div>
                  )}
                  {schedule.location && (
                    <div className="schedule-location">
                      <i className="bi bi-geo-alt"></i> {schedule.location}
                    </div>
                  )}
                </div>
                {schedule.status && (
                  <div className={`schedule-status status-${schedule.status.toLowerCase()}`}>
                    {schedule.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <i className="bi bi-calendar-x"></i>
            <p>{config.emptyMessage || '일정이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleWidget;

