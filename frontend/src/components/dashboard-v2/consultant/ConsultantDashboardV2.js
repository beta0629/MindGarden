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
  UserPlus
} from 'lucide-react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection, ContentKpiRow } from '../content';
import UnifiedLoading from '../../common/UnifiedLoading';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API, RATING_API } from '../../../constants/api';
import QuickActionBar from './QuickActionBar';
import IncompleteRecordsAlert from './IncompleteRecordsAlert';
import NextConsultationCard from './NextConsultationCard';
import UrgentClientsSection from './UrgentClientsSection';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import SafeText from '../../common/SafeText';
import '../../../styles/unified-design-tokens.css';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantDashboard.css';

const TENANT_ERROR_MESSAGE = '테넌트 정보를 불러올 수 없습니다. 로그아웃 후 다시 로그인해 주세요.';
const CONSULTANT_DASHBOARD_TITLE_ID = 'consultant-dashboard-v2-page-title';

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

  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });
  const [urgentClients, setUrgentClients] = useState([]);
  const [nextConsultation, setNextConsultation] = useState(null);
  const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    // API 호출 전 세션 갱신 (30초 이내 최근 체크 시 스킵 - 무한루프 방지)
    if (typeof window !== 'undefined' && window.sessionManager?.checkSession) {
      const lastCheck = window.sessionManager.getLastCheckTime?.() || 0;
      if (!lastCheck || Date.now() - lastCheck > 30000) {
        await window.sessionManager.checkSession(true);
      }
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

      await fetchPhase1Content(currentUser.id);
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

  const fetchPhase1Content = async (consultantId) => {
    if (!consultantId) return;

    try {
      const [incompleteRes, urgentRes, preparationRes] = await Promise.allSettled([
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_INCOMPLETE_RECORDS(consultantId)),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_HIGH_PRIORITY_CLIENTS(consultantId)),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_PREPARATION(consultantId))
      ]);

      if (incompleteRes.status === 'fulfilled' && incompleteRes.value) {
        const data = incompleteRes.value;
        setIncompleteRecords({
          count: data.count ?? 0,
          schedules: data.schedules ?? []
        });
      }

      if (urgentRes.status === 'fulfilled' && urgentRes.value) {
        const data = urgentRes.value;
        setUrgentClients(data.clients ?? []);
      }

      if (preparationRes.status === 'fulfilled' && preparationRes.value) {
        const data = preparationRes.value;
        if (data.consultation) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const consultationDate = new Date(data.consultation.startTime);
          consultationDate.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const isToday = consultationDate.getTime() === today.getTime();
          const isTomorrow = consultationDate.getTime() === tomorrow.getTime();
          
          if (isToday || isTomorrow) {
            setNextConsultation({
              ...data.consultation,
              isToday
            });
          }
        }
      }
    } catch (error) {
      console.warn('Phase 1 컨텐츠 로드 실패:', error);
    }
  };

  const handleScheduleClick = (scheduleId) => {
    if (!scheduleId) return;
    navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`);
  };

  const handleIncompleteRecordsAction = () => {
    if (incompleteRecords.schedules.length > 0) {
      const firstSchedule = incompleteRecords.schedules[0];
      setSelectedSchedule({
        id: firstSchedule.scheduleId,
        clientName: firstSchedule.clientName,
        sessionDate: firstSchedule.consultationDate
      });
      setShowConsultationLogModal(true);
    } else {
      navigate('/consultant/consultation-records?filter=incomplete');
    }
  };

  const handleViewPreviousRecords = (clientId) => {
    navigate(`/consultant/consultation-records?clientId=${clientId}`);
  };

  const handleViewDetails = (scheduleId) => {
    navigate(`/consultant/consultation-records?scheduleId=${scheduleId}`);
  };

  const handleViewAllClients = () => {
    navigate('/consultant/clients?filter=urgent');
  };

  const handleViewClientDetails = (clientId) => {
    navigate(`/consultant/clients/${clientId}`);
  };

  const handleConsultationLogSave = () => {
    setShowConsultationLogModal(false);
    setSelectedSchedule(null);
    fetchDashboardData();
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

  const dashboardShell = (mainBody) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="상담사 대시보드">
          <ContentHeader
            title="상담 대시보드"
            subtitle={`${user?.name || '상담사'} 선생님, 환영합니다. 오늘(${todayDateStr}) 일정·알림·내담 현황을 한곳에서 확인하세요.`}
            titleId={CONSULTANT_DASHBOARD_TITLE_ID}
            actions={<QuickActionBar onNavigate={navigate} />}
          />
          <main aria-labelledby={CONSULTANT_DASHBOARD_TITLE_ID}>
            {mainBody}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (loading && user?.id) {
    return (
      <AdminCommonLayout title="상담사 대시보드">
        {dashboardShell(
          <UnifiedLoading type="page" text="대시보드를 불러오는 중..." />
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="상담사 대시보드">
      {dashboardShell(
        <div className="consultant-dashboard-v2">
        {/* 테넌트 미설정 안내 배너 */}
        {dashboardError && (
          <div className="consultant-dashboard-tenant-alert" role="alert">
            {dashboardError}
          </div>
        )}

        {/* Phase 1 컨텐츠: 미작성 상담일지 알림 */}
        <IncompleteRecordsAlert
          count={incompleteRecords.count}
          schedules={incompleteRecords.schedules}
          onAction={handleIncompleteRecordsAction}
        />

        {/* Phase 1 컨텐츠: 다음 상담 준비 카드 */}
        <NextConsultationCard
          consultation={nextConsultation}
          onViewPreviousRecords={handleViewPreviousRecords}
          onViewDetails={handleViewDetails}
        />

        {/* Hero Area: 주요 통계 */}
        <ContentKpiRow items={[
          {
            id: 'todaySchedules',
            icon: <Calendar size={28} />,
            label: '오늘의 상담',
            value: `${dashboardData.stats.todaySchedules}건`,
            iconVariant: 'blue'
          },
          {
            id: 'newClients',
            icon: <UserPlus size={28} />,
            label: '신규 내담자',
            value: `${dashboardData.stats.newClients}명`,
            iconVariant: 'green'
          },
          {
            id: 'unreadMessages',
            icon: <MessageSquare size={28} />,
            label: '안읽은 메시지',
            value: `${dashboardData.stats.unreadMessages}건`,
            iconVariant: 'orange'
          },
          {
            id: 'averageRating',
            icon: <Star size={28} />,
            label: '평균 평점',
            value: dashboardData.stats.averageRating > 0 ? dashboardData.stats.averageRating.toFixed(1) : '-',
            subtitle: dashboardData.stats.totalRatingCount > 0 ? `(${dashboardData.stats.totalRatingCount}개 평가)` : undefined,
            iconVariant: 'gray'
          }
        ]} />

        {/* Main Content Grid */}
        <div className="mg-v2-content-growth-row">
          
          {/* Section A: 최근 일정 (오늘·어제) - 테넌트별 조회는 백엔드 TenantContextHolder 적용 */}
          <ContentSection
            title="최근 일정 (오늘·어제)"
            titleIcon={<Clock size={18} />}
            actions={
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/consultant/schedule')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            }
          >
            <div className="card-body">
              {renderSchedules()}
            </div>
          </ContentSection>

          {/* Section B: 다가오는 상담 (신규) */}
          <ContentSection
            title="다가오는 상담"
            titleIcon={<Calendar size={18} />}
            actions={
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/consultant/schedule')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            }
          >
            <div className="card-body">
              {renderUpcomingSchedules()}
            </div>
          </ContentSection>

          {/* Section C: 최근 알림 */}
          <ContentSection
            title="최근 알림"
            titleIcon={<Bell size={18} />}
            actions={
              <button 
                className="mg-v2-btn mg-v2-btn-ghost mg-v2-btn-sm"
                onClick={() => navigate('/notifications')}
              >
                전체보기 <ChevronRight size={16} />
              </button>
            }
          >
            <div className="card-body">
              {dashboardData.recentNotifications.length > 0 ? (
                <div className="notification-list">
                  {dashboardData.recentNotifications.map((noti) => (
                    <div key={noti.id} className="notification-item">
                      <div className="notification-icon">
                        <Bell size={16} />
                      </div>
                      <div className="notification-content">
                        <SafeText className="notification-text" tag="div">{noti.text}</SafeText>
                        <SafeText className="notification-time" tag="div">{noti.time}</SafeText>
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
          </ContentSection>

          {/* Section D: 주간 상담 현황 (전체 너비) */}
          <ContentSection
            title="주간 상담 현황"
            titleIcon={<BarChart3 size={18} />}
            className="mg-v2-content-section--full"
          >
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
          </ContentSection>

        </div>

        {/* Phase 1 컨텐츠: 긴급 확인 필요 내담자 */}
        <UrgentClientsSection
          clients={urgentClients}
          onViewAllClients={handleViewAllClients}
          onViewClientDetails={handleViewClientDetails}
        />
        </div>
      )}

      {/* 상담일지 작성 모달 */}
      {showConsultationLogModal && selectedSchedule && (
        <ConsultationLogModal
          isOpen={showConsultationLogModal}
          onClose={() => {
            setShowConsultationLogModal(false);
            setSelectedSchedule(null);
          }}
          scheduleData={selectedSchedule}
          onSave={handleConsultationLogSave}
        />
      )}
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
