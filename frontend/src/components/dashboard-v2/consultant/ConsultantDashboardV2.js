import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  MessageSquare,
  Star,
  Clock,
  Bell,
  BarChart3,
  ChevronRight,
  UserPlus,
  FileText
} from 'lucide-react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API, RATING_API } from '../../../constants/api';
import './ConsultantDashboard.css';

const TENANT_ERROR_MESSAGE = '테넌트 정보를 불러올 수 없습니다. 로그아웃 후 다시 로그인해 주세요.';

const ConsultantDashboardV2 = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todaySchedules: 0,
      newClients: 0,
      unreadMessages: 0,
      averageRating: 0,
      totalRatingCount: 0
    },
    todaySchedules: [],
    upcomingSchedules: [],
    recentNotifications: [],
    weeklyStats: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    // API 호출 전 세션 한 번 갱신 후 최신 user 사용
    if (typeof window !== 'undefined' && window.sessionManager?.checkSession) {
      await window.sessionManager.checkSession(true);
    }
    const sessionManager = typeof window !== 'undefined' ? window.sessionManager : null;
    const currentUser = sessionManager?.getUser?.() ?? user;
    const tenantId = currentUser?.tenantId ?? sessionManager?.getSessionInfo?.()?.tenantId ?? null;

    if (!tenantId) {
      console.warn('⚠️ [상담사 대시보드] tenantId 없음 - 스케줄/통계 API 호출 생략. user.tenantId=', currentUser?.tenantId);
      setDashboardError(TENANT_ERROR_MESSAGE);
      setLoading(false);
        setDashboardData(prev => ({
          ...prev,
          stats: {
            todaySchedules: 0,
            newClients: 0,
            unreadMessages: 0,
            averageRating: 0,
            totalRatingCount: 0
          },
          todaySchedules: []
        }));
      return;
    }

    setDashboardError('');
    setLoading(true);
    try {
      // 1. 통계 데이터 조회 (apiGet이 { success, data }면 data만 반환)
      let statsResponse;
      try {
        statsResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS, {
          userRole: 'CONSULTANT'
        });
      } catch (statsErr) {
        const isTenantError = (statsErr?.status === 400 || statsErr?.response?.status === 400) && /테넌트/.test(statsErr?.response?.data?.message || statsErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 통계 API 실패, 기본값 사용:', statsErr?.message || statsErr);
        statsResponse = null;
      }

      // 1-1. 평가 통계 조회 (하트 점수)
      let ratingStatsResponse;
      try {
        ratingStatsResponse = await StandardizedApi.get(RATING_API.CONSULTANT_STATS(currentUser.id));
      } catch (ratingErr) {
        console.warn('평가 통계 API 실패, 기본값 사용:', ratingErr?.message || ratingErr);
        ratingStatsResponse = null;
      }

      // 2. 오늘의 일정 조회
      let scheduleResponse;
      try {
        scheduleResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: currentUser.id,
          userRole: 'CONSULTANT'
        });
      } catch (scheduleErr) {
        const isTenantError = (scheduleErr?.status === 400 || scheduleErr?.response?.status === 400) && /테넌트/.test(scheduleErr?.response?.data?.message || scheduleErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 스케줄 API 실패, 빈 목록 사용:', scheduleErr?.message || scheduleErr);
        scheduleResponse = { schedules: [] };
      }

      // 데이터 가공: 오늘·어제 포함 (테넌트 조회는 백엔드 TenantContextHolder로 적용됨)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let rawSchedules = [];
      if (scheduleResponse) {
        if (Array.isArray(scheduleResponse)) {
          rawSchedules = scheduleResponse;
        } else if (scheduleResponse.schedules && Array.isArray(scheduleResponse.schedules)) {
          rawSchedules = scheduleResponse.schedules;
        } else if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
          rawSchedules = scheduleResponse.data;
        }
      }

      const formatTimeStr = (timeData) => {
        if (!timeData) return '00:00:00';
        if (Array.isArray(timeData)) {
            const h = String(timeData[0] || 0).padStart(2, '0');
            const m = String(timeData[1] || 0).padStart(2, '0');
            const s = String(timeData[2] || 0).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }
        return (String(timeData).includes('T') ? String(timeData).split('T')[1] : String(timeData)).split('.')[0];
      };

      const schedules = rawSchedules.map(schedule => {
        let fullStartTime = schedule.startTime;
        let fullEndTime = schedule.endTime;

        if (schedule.date) {
            let dateStr = '';
            if (Array.isArray(schedule.date)) {
                const y = schedule.date[0];
                const m = String(schedule.date[1] || 1).padStart(2, '0');
                const d = String(schedule.date[2] || 1).padStart(2, '0');
                dateStr = `${y}-${m}-${d}`;
            } else {
                dateStr = String(schedule.date).includes('T') ? String(schedule.date).split('T')[0] : String(schedule.date);
            }
            const timeStr = formatTimeStr(schedule.startTime);
            const endTimeStr = formatTimeStr(schedule.endTime);
            fullStartTime = `${dateStr}T${timeStr}`;
            fullEndTime = `${dateStr}T${endTimeStr}`;
        } else if (Array.isArray(schedule.startTime)) {
            const todayStr = today.toISOString().split('T')[0];
            fullStartTime = `${todayStr}T${formatTimeStr(schedule.startTime)}`;
        }

        return {
            ...schedule,
            startTime: fullStartTime,
            endTime: fullEndTime
        };
      }).filter(schedule => {
        if (!schedule.startTime) return false;
        const scheduleDate = new Date(schedule.startTime);
        if (isNaN(scheduleDate.getTime())) return false;
        scheduleDate.setHours(0, 0, 0, 0);
        const isToday = scheduleDate.getTime() === today.getTime();
        const isYesterday = scheduleDate.getTime() === yesterday.getTime();
        return isToday || isYesterday;
      }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const todayOnlyCount = schedules.filter(s => {
        const d = new Date(s.startTime);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }).length;

      // apiGet이 ApiResponse면 data만 반환하므로 statsResponse가 이미 통계 객체
      const stats = statsResponse && typeof statsResponse === 'object' ? statsResponse : {};
      const todaySchedulesFromStats = stats.totalToday ?? stats.todaySchedules;

      // 주간 통계 및 최근 알림 연동
      const mockWeeklyStats = [
        { day: '월', count: 0 }, { day: '화', count: 0 }, { day: '수', count: 0 },
        { day: '목', count: 0 }, { day: '금', count: 0 }, { day: '토', count: 0 }, { day: '일', count: 0 }
      ];
      const weeklyStatsData = [...mockWeeklyStats];
      if (stats?.weeklyStats?.length > 0) {
        stats.weeklyStats.forEach(s => {
            const dateStr = s.period; // "MM/dd"
            let dayName = '';
            if (dateStr) {
               const parts = dateStr.split('/');
               if (parts.length === 2) {
                 const year = new Date().getFullYear();
                 const tempDate = new Date(`${year}-${parts[0]}-${parts[1]}`);
                 const days = ['일', '월', '화', '수', '목', '금', '토'];
                 if (!isNaN(tempDate.getTime())) dayName = days[tempDate.getDay()];
               }
            }
            const targetDay = dayName || s.period;
            const existingIndex = weeklyStatsData.findIndex(w => w.day === targetDay);
            if (existingIndex !== -1) {
              weeklyStatsData[existingIndex].count = s.completedCount || 0;
            } else if (targetDay) {
              // 요일 매칭이 안되는 경우 추가 (예: 날짜 형식)
              weeklyStatsData.push({ day: targetDay, count: s.completedCount || 0 });
            }
        });
      }

      let activeNotifications = [];
      try {
        const notiRes = await StandardizedApi.get('/api/v1/system-notifications/active');
        if (notiRes && Array.isArray(notiRes)) {
          activeNotifications = notiRes.slice(0, 3).map(n => ({
            id: n.id,
            text: n.title,
            time: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '최근',
            isRead: n.isRead
          }));
        }
      } catch (err) {
        console.warn('알림 API 호출 실패:', err);
      }

      // 4. 다가오는 상담 조회
      let upcomingResponse;
      try {
        const todayDate = new Date();
        const endDate = new Date(todayDate);
        endDate.setDate(endDate.getDate() + 7);
        
        upcomingResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES, {
          userId: currentUser.id,
          userRole: 'CONSULTANT',
          startDate: todayDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 5
        });
      } catch (upcomingErr) {
        console.warn('다가오는 상담 API 실패, 빈 목록 사용:', upcomingErr?.message || upcomingErr);
        upcomingResponse = { schedules: [] };
      }

      let upcomingSchedules = [];
      if (upcomingResponse) {
        if (Array.isArray(upcomingResponse)) {
          upcomingSchedules = upcomingResponse;
        } else if (upcomingResponse.schedules && Array.isArray(upcomingResponse.schedules)) {
          upcomingSchedules = upcomingResponse.schedules;
        } else if (upcomingResponse.data && Array.isArray(upcomingResponse.data)) {
          upcomingSchedules = upcomingResponse.data;
        }
      }

      upcomingSchedules = upcomingSchedules.sort((a, b) => {
        const dateA = Array.isArray(a.date) 
          ? new Date(a.date[0], a.date[1] - 1, a.date[2]) 
          : new Date(a.date);
        const dateB = Array.isArray(b.date) 
          ? new Date(b.date[0], b.date[1] - 1, b.date[2]) 
          : new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        
        const getTimeValue = (time) => {
          if (Array.isArray(time)) return time[0] * 60 + time[1];
          if (typeof time === 'string') {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
          }
          return 0;
        };
        
        return getTimeValue(a.startTime) - getTimeValue(b.startTime);
      });

      // 평가 통계 데이터 추출
      const ratingStats = ratingStatsResponse && typeof ratingStatsResponse === 'object' ? ratingStatsResponse : {};
      const averageHeartScore = ratingStats.averageHeartScore ?? 0;
      const totalRatingCount = ratingStats.totalRatingCount ?? 0;

      setDashboardData({
        stats: {
          todaySchedules: todayOnlyCount ?? todaySchedulesFromStats ?? 0,
          newClients: stats.newClients ?? 0,
          unreadMessages: stats.unreadMessages ?? 0,
          averageRating: averageHeartScore,
          totalRatingCount: totalRatingCount
        },
        todaySchedules: schedules,
        upcomingSchedules: upcomingSchedules,
        recentNotifications: activeNotifications,
        weeklyStats: weeklyStatsData
      });
    } catch (error) {
      const isTenantError = (error?.status === 400 || error?.response?.status === 400) && /테넌트/.test(error?.response?.data?.message || error?.message || '');
      if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
      console.error('대시보드 데이터 로드 실패:', error);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          todaySchedules: prev.stats?.todaySchedules ?? 0,
          newClients: prev.stats?.newClients ?? 0,
          unreadMessages: prev.stats?.unreadMessages ?? 0,
          averageRating: prev.stats?.averageRating ?? 0,
          totalRatingCount: prev.stats?.totalRatingCount ?? 0
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return { time: '', meridiem: '' };
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return { time: `${hours}:${minutes}`, meridiem };
  };

  const formatUpcomingSchedule = (schedule) => {
    if (!schedule.date || !schedule.startTime) {
      return { dateStr: '', weekday: '', timeStr: '' };
    }
    
    let dateObj;
    if (Array.isArray(schedule.date)) {
      const [year, month, day] = schedule.date;
      dateObj = new Date(year, month - 1, day);
    } else if (typeof schedule.date === 'string') {
      dateObj = new Date(schedule.date);
    } else {
      dateObj = new Date();
    }
    
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${month}/${day}`;
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[dateObj.getDay()];
    
    let timeStr = '';
    if (Array.isArray(schedule.startTime)) {
      const [hours, minutes] = schedule.startTime;
      timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else if (typeof schedule.startTime === 'string') {
      const timePart = schedule.startTime.includes('T') 
        ? schedule.startTime.split('T')[1] 
        : schedule.startTime;
      timeStr = timePart.substring(0, 5);
    }
    
    return { dateStr, weekday, timeStr };
  };

  const handleScheduleClick = (scheduleId) => {
    if (!scheduleId) return;
    navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`);
  };

  const maxChartValue = Math.max(...(dashboardData.weeklyStats.map(s => s.count) || [1]));

  const renderSchedules = () => {
    if (loading) {
      return (
        <div className="empty-state">
          <div className="mg-v2-spinner"></div>
          <span className="empty-state-text">일정을 불러오는 중...</span>
        </div>
      );
    }
    
    if (dashboardData.todaySchedules.length > 0) {
      return (
        <div className="schedule-list">
          {dashboardData.todaySchedules.slice(0, 5).map((schedule, idx) => {
            const { time, meridiem } = formatTime(schedule.startTime);
            return (
              <div key={schedule.id || `schedule-${idx}`} className="schedule-item">
                <div className="schedule-time">
                  <span>{time}</span>
                  <span className="schedule-time-meridiem">{meridiem}</span>
                </div>
                <div className="schedule-details">
                  <div className="schedule-client">{schedule.clientName || '내담자'}</div>
                  <div className="schedule-type">
                    <Users size={12} />
                    {schedule.consultationType || '개인상담'}
                  </div>
                </div>
                <div className={`schedule-status ${schedule.status === 'CONFIRMED' ? 'status-confirmed' : 'status-pending'}`}>
                  {schedule.status === 'CONFIRMED' ? '확정' : '대기'}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="empty-state">
        <Calendar size={32} className="empty-state-icon" />
        <span className="empty-state-text">오늘·어제 예정된 일정이 없습니다.</span>
      </div>
    );
  };

  const renderUpcomingSchedules = () => {
    if (loading) {
      return (
        <div className="empty-state">
          <div className="mg-v2-spinner"></div>
          <span className="empty-state-text">일정을 불러오는 중...</span>
        </div>
      );
    }
    
    if (dashboardData.upcomingSchedules && dashboardData.upcomingSchedules.length > 0) {
      return (
        <div className="upcoming-schedule-list">
          {dashboardData.upcomingSchedules.slice(0, 5).map((schedule, idx) => {
            const isHighlighted = idx === 0;
            const { dateStr, weekday, timeStr } = formatUpcomingSchedule(schedule);
            
            return (
              <button 
                key={schedule.id || `upcoming-schedule-${idx}`} 
                className={`upcoming-schedule-item ${isHighlighted ? 'upcoming-schedule-item--highlighted' : ''}`}
                onClick={() => handleScheduleClick(schedule.id)}
                type="button"
                aria-label={`${dateStr} ${timeStr} ${schedule.clientName} ${schedule.consultationType} ${schedule.status === 'CONFIRMED' ? '확정' : '대기'}`}
              >
                <div className="upcoming-schedule-date">
                  <span className="upcoming-schedule-date__day">{dateStr}</span>
                  <span className="upcoming-schedule-date__weekday">{weekday}</span>
                  <span className="upcoming-schedule-date__time">{timeStr}</span>
                </div>
                
                <div className="upcoming-schedule-details">
                  <div className="upcoming-schedule-details__client">
                    {schedule.clientName || '내담자'}
                  </div>
                  <div className="upcoming-schedule-details__meta">
                    <Users size={12} />
                    {schedule.consultationType || '개인상담'}
                    {schedule.sessionNumber && ` · ${schedule.sessionNumber}회기`}
                  </div>
                </div>
                
                <div className={`schedule-status ${schedule.status === 'CONFIRMED' ? 'status-confirmed' : 'status-pending'}`}>
                  {schedule.status === 'CONFIRMED' ? '확정' : '대기'}
                </div>
              </button>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="empty-state">
        <Calendar size={32} className="empty-state-icon" />
        <span className="empty-state-text">다가오는 상담이 없습니다.</span>
      </div>
    );
  };

  const todayDateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <AdminCommonLayout title="상담사 대시보드">
      <div className="consultant-dashboard-v2">
        
        {/* 웰컴 메시지 영역 */}
        <div className="dashboard-welcome-section mg-v2-content-card" style={{ marginBottom: '24px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--mg-white)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mg-gray-900)', margin: '0 0 8px 0' }}>
              {user?.name || '상담사'} 선생님, 환영합니다.
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--mg-gray-600)', margin: 0 }}>
              오늘({todayDateStr}) 하루도 화이팅하세요!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="mg-v2-badge mg-v2-badge--primary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px' }}>
              오늘의 예약: {dashboardData.stats.todaySchedules}건
            </div>
            <button 
              className="mg-v2-btn mg-v2-btn-outline mg-v2-btn-md"
              onClick={() => navigate('/consultant/consultation-records')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} /> 상담일지 조회
            </button>
          </div>
        </div>

        {/* 테넌트 미설정 안내 배너 */}
        {dashboardError && (
          <div className="consultant-dashboard-tenant-alert" role="alert">
            {dashboardError}
          </div>
        )}

        {/* Hero Area: 주요 통계 */}
        <section className="consultant-hero-grid">
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper primary">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">오늘의 상담</span>
              <span className="stat-value">{dashboardData.stats.todaySchedules}건</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper success">
              <UserPlus size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">신규 내담자</span>
              <span className="stat-value">{dashboardData.stats.newClients}명</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper warning">
              <MessageSquare size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">안읽은 메시지</span>
              <span className="stat-value">{dashboardData.stats.unreadMessages}건</span>
            </div>
          </div>
          
          <div className="consultant-stat-card">
            <div className="stat-icon-wrapper info">
              <Star size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">평균 평점</span>
              <span className="stat-value">
                {dashboardData.stats.averageRating > 0 
                  ? dashboardData.stats.averageRating.toFixed(1) 
                  : '-'}
              </span>
              {dashboardData.stats.totalRatingCount > 0 && (
                <span className="stat-sublabel">({dashboardData.stats.totalRatingCount}개 평가)</span>
              )}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="consultant-main-grid">
          
          {/* Section A: 최근 일정 (오늘·어제) - 테넌트별 조회는 백엔드 TenantContextHolder 적용 */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <Clock size={18} className="card-title-icon" />
                최근 일정 (오늘·어제)
              </h2>
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/consultant/schedule')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body">
              {renderSchedules()}
            </div>
          </div>

          {/* Section B: 다가오는 상담 (신규) */}
          <section className="dashboard-card" aria-label="다가오는 상담">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={18} className="card-title-icon" />
                다가오는 상담
              </h2>
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/consultant/schedule')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body">
              {renderUpcomingSchedules()}
            </div>
          </section>

          {/* Section C: 최근 알림 */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <Bell size={18} className="card-title-icon" />
                최근 알림
              </h2>
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/notifications')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-body">
              {dashboardData.recentNotifications.length > 0 ? (
                <div className="notification-list">
                  {dashboardData.recentNotifications.map((noti) => (
                    <div key={noti.id} className="notification-item">
                      <div className="notification-icon">
                        <Bell size={16} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-text">{noti.text}</div>
                        <div className="notification-time">{noti.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Bell size={32} className="empty-state-icon" />
                  <span className="empty-state-text">새로운 알림이 없습니다.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section D: 주간 상담 현황 (전체 너비) */}
          <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h2 className="card-title">
                <BarChart3 size={18} className="card-title-icon" />
                주간 상담 현황
              </h2>
            </div>
            <div className="card-body">
              <div className="chart-container">
                {dashboardData.weeklyStats.map((stat, idx) => {
                  const heightPercent = maxChartValue > 0 ? (stat.count / maxChartValue) * 100 : 0;
                  const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1);
                  
                  return (
                    <div key={`stat-${stat.day}`} className="chart-bar-wrapper">
                      <div 
                        className={`chart-bar ${isToday ? 'active' : ''}`} 
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        title={`${stat.count}건`}
                      ></div>
                      <span className="chart-label">{stat.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </section>
      </div>
    </AdminCommonLayout>
  );
};

ConsultantDashboardV2.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string
  })
};

export default ConsultantDashboardV2;
