/**
 * Schedule Registration Widget
 * 상담소 특화 일정 등록 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../../utils/ajax';
import UnifiedLoading from '../../../common/UnifiedLoading';
import '../Widget.css';

const ScheduleRegistrationWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  
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
      calculateTodayStats(config.schedules);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || (showTodayOnly ? '/api/schedules/today/statistics' : '/api/schedules');
      const params = {
        ...dataSource.params,
        ...(showTodayOnly && { date: new Date().toISOString().split('T')[0] }),
        ...(user?.id && { userId: user.id }),
        ...(user?.role && { userRole: user.role })
      };
      
      const response = await apiGet(url, params);
      
      if (response && response.data) {
        const schedulesList = Array.isArray(response.data) ? response.data : [];
        setSchedules(schedulesList.slice(0, maxItems));
        calculateTodayStats(schedulesList);
      }
    } catch (err) {
      console.error('ScheduleRegistrationWidget 데이터 로드 실패:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTodayStats = (schedulesList) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = schedulesList.filter(s => 
      s.scheduledDate && s.scheduledDate.startsWith(today)
    );
    
    setTodayStats({
      total: todaySchedules.length,
      completed: todaySchedules.filter(s => s.status === 'COMPLETED').length,
      inProgress: todaySchedules.filter(s => s.status === 'IN_PROGRESS').length,
      cancelled: todaySchedules.filter(s => s.status === 'CANCELLED').length
    });
  };
  
  const handleScheduleClick = (schedule) => {
    if (config.scheduleUrl) {
      navigate(config.scheduleUrl.replace('{scheduleId}', schedule.id));
    } else {
      navigate(`/admin/schedules?scheduleId=${schedule.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/admin/schedules');
    }
  };
  
  const handleCreateSchedule = () => {
    if (config.createUrl) {
      navigate(config.createUrl);
    } else {
      navigate('/admin/schedules?action=create');
    }
  };
  
  const handleAutoComplete = async () => {
    try {
      const response = await fetch('/api/admin/schedules/auto-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('✅ 스케줄 자동 완료 처리 완료');
        loadSchedules();
      }
    } catch (err) {
      console.error('❌ 스케줄 자동 완료 처리 실패:', err);
    }
  };
  
  if (loading && schedules.length === 0) {
    return (
      <div className="widget widget-schedule-registration">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-schedule-registration">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-calendar-event"></i>
          {config.title || (showTodayOnly ? '오늘의 일정' : '일정 관리')}
        </div>
        <div className="widget-actions">
          <button className="widget-btn widget-btn-sm" onClick={handleViewAll}>
            전체보기
          </button>
          <button className="widget-btn widget-btn-primary widget-btn-sm" onClick={handleCreateSchedule}>
            <i className="bi bi-plus-circle"></i> 일정 등록
          </button>
        </div>
      </div>
      
      {showTodayOnly && (
        <div className="widget-stats">
          <div className="stat-item">
            <div className="stat-label">전체</div>
            <div className="stat-value">{todayStats.total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">완료</div>
            <div className="stat-value text-success">{todayStats.completed}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">진행중</div>
            <div className="stat-value text-info">{todayStats.inProgress}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">취소</div>
            <div className="stat-value text-danger">{todayStats.cancelled}</div>
          </div>
        </div>
      )}
      
      {config.showAutoComplete && (
        <div className="widget-actions-bar">
          <button 
            className="widget-btn widget-btn-warning widget-btn-sm"
            onClick={handleAutoComplete}
          >
            <i className="bi bi-check-circle"></i> 지난 일정 자동 완료
          </button>
        </div>
      )}
      
      <div className="widget-body">
        {schedules.length > 0 ? (
          <div className="schedule-list">
            {schedules.map((schedule, index) => (
              <div
                key={schedule.id || index}
                className="schedule-item"
                onClick={() => handleScheduleClick(schedule)}
              >
                <div className="schedule-info">
                  <div className="schedule-header">
                    <div className="schedule-time">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <div className={`schedule-status status-${schedule.status?.toLowerCase()}`}>
                      {schedule.status}
                    </div>
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-client">{schedule.clientName || schedule.client?.name}</div>
                    {schedule.consultantName && (
                      <div className="schedule-consultant">상담사: {schedule.consultantName}</div>
                    )}
                    {schedule.location && (
                      <div className="schedule-location">
                        <i className="bi bi-geo-alt"></i> {schedule.location}
                      </div>
                    )}
                  </div>
                </div>
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

export default ScheduleRegistrationWidget;

