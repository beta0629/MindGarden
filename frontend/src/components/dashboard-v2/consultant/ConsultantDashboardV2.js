import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, MessageSquare, UserPlus } from 'lucide-react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import Icon from '../../ui/Icon/Icon';
import { ContentArea, ContentHeader, ContentSection, ContentKpiRow } from '../content';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API } from '../../../constants/api';
import QuickActionBar from './QuickActionBar';
import IncompleteRecordsAlert from './IncompleteRecordsAlert';
import NextConsultationCard from './NextConsultationCard';
import UrgentClientsSection from './UrgentClientsSection';
import ConsultantDashboardListSection from './ConsultantDashboardListSection';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CONSULTANT_DASHBOARD_TITLE_ID,
  CONSULTANT_DASHBOARD_PAGE_TEST_ID,
  CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID,
  CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL,
  CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL,
  CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL,
  CONSULTANT_DASHBOARD_LIST_ERROR_LABEL,
  CONSULTANT_DASHBOARD_KPI_RETRY_ARIA_LABEL,
  CONSULTANT_SCHEDULE_STATUS_LABELS
} from '../../../constants/consultantDashboardConstants';
import {
  CONSULTANT_DASHBOARD_ROUTES,
  CONSULTANT_DASHBOARD_KPI_ROUTES,
  buildConsultantClientDetailRoute,
  buildConsultantConsultationRecordRoute,
  buildConsultantConsultationRecordsRoute,
  buildConsultantClientsRoute
} from '../../../constants/consultantDashboardRoutes';
import '../../../styles/unified-design-tokens.css';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantDashboard.css';
import './ConsultantDashboardListSection.css';
import { USER_ROLES } from '../../../constants/roles';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTATION_MESSAGES_UNREAD_COUNT = '/api/v1/consultation-messages/unread-count';
const TENANT_ERROR_MESSAGE = '테넌트 정보를 불러올 수 없습니다. 로그아웃 후 다시 로그인해 주세요.';

const RECENT_SCHEDULE_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'timeLabel', label: '시간' },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

const UPCOMING_SCHEDULE_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'datetimeLabel', label: '일시' },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

const NOTIFICATION_COLUMNS = [
  { key: 'text', label: '알림' },
  { key: 'time', label: '일시', hideOnMobile: true }
];

/** KPI 좌측 아이콘: 부모 `.mg-v2-content-kpi-card__icon--*` 의 color → Lucide currentColor */
const kpiLucideProps = {
  className: 'mg-v2-content-kpi-card__lucide',
  size: 28,
  strokeWidth: 2,
  'aria-hidden': true
};

const ConsultantDashboardV2 = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todaySchedules: 0,
      newClients: 0,
      unreadMessages: 0
    },
    todaySchedules: [],
    upcomingSchedules: [],
    recentNotifications: [],
    weeklyStats: []
  });

  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });
  const [urgentClients, setUrgentClients] = useState([]);
  const [phase1Loading, setPhase1Loading] = useState(false);
  const [phase1Error, setPhase1Error] = useState('');
  const [nextConsultation, setNextConsultation] = useState(null);
  const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async() => {
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
          unreadMessages: 0
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
          userRole: USER_ROLES.CONSULTANT
        });
      } catch (statsErr) {
        const isTenantError = (statsErr?.status === 400 || statsErr?.response?.status === 400) && /테넌트/.test(statsErr?.response?.data?.message || statsErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 통계 API 실패, 기본값 사용:', statsErr?.message || statsErr);
        statsResponse = null;
      }

      // 2. 오늘의 일정 조회
      let scheduleResponse;
      try {
        scheduleResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: currentUser.id,
          userRole: USER_ROLES.CONSULTANT
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

      // 주간 추이: 백엔드는 주차 종료일(MM/dd)별 완료 건수 배열(최근 N주) — 요일 매핑 금지
      const weeklyStatsData = Array.isArray(stats?.weeklyStats) && stats.weeklyStats.length > 0
        ? stats.weeklyStats.map((s) => ({
            label: s.period != null && String(s.period).trim() !== '' ? String(s.period).trim() : '—',
            count: typeof s.completedCount === 'number' ? s.completedCount : (Number(s.completedCount) || 0)
          }))
        : [];

      let unreadMessages = stats.unreadMessages ?? 0;
      try {
        const unreadRes = await StandardizedApi.get(API_CONSULTATION_MESSAGES_UNREAD_COUNT, {
          userId: currentUser.id,
          userType: USER_ROLES.CONSULTANT,
          _t: Date.now()
        });
        if (unreadRes != null && typeof unreadRes.unreadCount === 'number') {
          unreadMessages = unreadRes.unreadCount;
        }
      } catch (unreadErr) {
        console.warn('안읽은 메시지 수(unread-count) 조회 실패, 통계 응답값 유지:', unreadErr?.message || unreadErr);
      }

      let activeNotifications = [];
      try {
        const notiRes = await StandardizedApi.get(API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE);
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
          userRole: USER_ROLES.CONSULTANT,
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

      // 평가 통계 제거 — KPI는 주간 상담·신규 내담자·미확인 메시지·작성 대기 일지 (ROLE-C-02)

      setDashboardData({
        stats: {
          todaySchedules: todayOnlyCount ?? todaySchedulesFromStats ?? 0,
          newClients: stats.newClients ?? 0,
          unreadMessages
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
          unreadMessages: prev.stats?.unreadMessages ?? 0
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

  const fetchPhase1Content = async(consultantId) => {
    if (!consultantId) return;

    setPhase1Loading(true);
    setPhase1Error('');
    try {
      const [incompleteRes, urgentRes, preparationRes] = await Promise.allSettled([
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_INCOMPLETE_RECORDS(consultantId)),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_HIGH_PRIORITY_CLIENTS(consultantId)),
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_PREPARATION(consultantId))
      ]);

      if (incompleteRes.status === 'fulfilled' && incompleteRes.value) {
        const data = incompleteRes.value;
        const list = Array.isArray(data.records)
          ? data.records
          : (Array.isArray(data.schedules) ? data.schedules : []);
        setIncompleteRecords({
          count: data.count ?? list.length ?? 0,
          schedules: list
        });
      }

      if (urgentRes.status === 'fulfilled' && urgentRes.value) {
        const data = urgentRes.value;
        setUrgentClients(data.clients ?? []);
      } else if (urgentRes.status === 'rejected') {
        setUrgentClients([]);
        setPhase1Error(CONSULTANT_DASHBOARD_LIST_ERROR_LABEL);
        console.warn('긴급 내담자 API 실패:', urgentRes.reason);
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
      setPhase1Error(CONSULTANT_DASHBOARD_LIST_ERROR_LABEL);
      console.warn('Phase 1 컨텐츠 로드 실패:', error);
    } finally {
      setPhase1Loading(false);
    }
  };

  const handleScheduleClick = (scheduleId) => {
    if (!scheduleId) return;
    navigate(buildConsultantConsultationRecordRoute(scheduleId));
  };

  const normalizeIncompleteSessionDate = (entry) => {
    const raw = entry?.sessionDate ?? entry?.consultationDate;
    if (raw == null || raw === '') return '';
    if (typeof raw === 'string') return raw.split('T')[0];
    if (Array.isArray(raw) && raw.length >= 3) {
      const y = raw[0];
      const m = String(raw[1] ?? 1).padStart(2, '0');
      const d = String(raw[2] ?? 1).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  const handleIncompleteRecordsAction = () => {
    if (incompleteRecords.schedules.length > 0) {
      const firstSchedule = incompleteRecords.schedules[0];
      const sid = firstSchedule.scheduleId;
      if (sid == null || sid === '') {
        navigate(buildConsultantConsultationRecordsRoute({ filter: 'incomplete' }));
        return;
      }
      const sessionDateStr = normalizeIncompleteSessionDate(firstSchedule);
      const rawClientId = firstSchedule.clientId;
      const clientIdParsed = rawClientId != null && rawClientId !== ''
        ? (typeof rawClientId === 'number' ? rawClientId : parseInt(String(rawClientId), 10))
        : null;
      setSelectedSchedule({
        id: sid != null ? `schedule-${sid}` : '',
        consultantId: user?.id,
        clientId: Number.isFinite(clientIdParsed) ? clientIdParsed : undefined,
        clientName: firstSchedule.clientName,
        sessionDate: sessionDateStr || undefined,
        sessionNumber: firstSchedule.sessionNumber
      });
      setShowConsultationLogModal(true);
    } else {
      navigate(buildConsultantConsultationRecordsRoute({ filter: 'incomplete' }));
    }
  };

  const handleViewPreviousRecords = (clientId) => {
    navigate(buildConsultantConsultationRecordsRoute({ clientId }));
  };

  const handleViewDetails = (scheduleId) => {
    navigate(buildConsultantConsultationRecordRoute(scheduleId));
  };

  const handleViewAllClients = () => {
    navigate(buildConsultantClientsRoute({ filter: 'urgent' }));
  };

  const handleViewClientDetails = (clientId) => {
    navigate(buildConsultantClientDetailRoute(clientId));
  };

  const handleConsultationLogSave = () => {
    setShowConsultationLogModal(false);
    setSelectedSchedule(null);
    fetchDashboardData();
  };

  const weeklyConsultationCount = useMemo(() => {
    if (!dashboardData.weeklyStats.length) return 0;
    const latest = dashboardData.weeklyStats[dashboardData.weeklyStats.length - 1];
    return latest?.count ?? 0;
  }, [dashboardData.weeklyStats]);

  const weeklyCounts = dashboardData.weeklyStats.map((s) => s.count);
  const maxChartValue = weeklyCounts.length > 0 ? Math.max(...weeklyCounts) : 1;

  const resolveStatusLabel = useCallback((status) => {
    if (!status) return CONSULTANT_SCHEDULE_STATUS_LABELS.PENDING;
    return CONSULTANT_SCHEDULE_STATUS_LABELS[status] || CONSULTANT_SCHEDULE_STATUS_LABELS.PENDING;
  }, []);

  const recentScheduleRows = useMemo(() => (
    dashboardData.todaySchedules.map((schedule, idx) => {
      const { time, meridiem } = formatTime(schedule.startTime);
      return {
        id: schedule.id || `recent-schedule-${idx}`,
        clientName: schedule.clientName || '내담자',
        timeLabel: `${time} ${meridiem}`,
        statusLabel: resolveStatusLabel(schedule.status),
        scheduleId: schedule.id
      };
    })
  ), [dashboardData.todaySchedules, resolveStatusLabel]);

  const upcomingScheduleRows = useMemo(() => (
    (dashboardData.upcomingSchedules || []).map((schedule, idx) => {
      const { dateStr, weekday, timeStr } = formatUpcomingSchedule(schedule);
      return {
        id: schedule.id || `upcoming-schedule-${idx}`,
        clientName: schedule.clientName || '내담자',
        datetimeLabel: `${dateStr} (${weekday}) ${timeStr}`,
        statusLabel: resolveStatusLabel(schedule.status),
        scheduleId: schedule.id
      };
    })
  ), [dashboardData.upcomingSchedules, resolveStatusLabel]);

  const notificationRows = useMemo(() => (
    dashboardData.recentNotifications.map((noti) => ({
      id: noti.id,
      text: noti.text,
      time: noti.time
    }))
  ), [dashboardData.recentNotifications]);

  const renderScheduleCell = useCallback((columnKey, item) => {
    const value = item[columnKey];
    return <SafeText tag="span">{toDisplayString(value, '—')}</SafeText>;
  }, []);

  const renderNotificationCell = useCallback((columnKey, item) => {
    const value = item[columnKey];
    return <SafeText tag="span">{toDisplayString(value, '—')}</SafeText>;
  }, []);

  const welcomeTitle = (
    <>
      {'환영합니다, '}
      <SafeText tag="span">{toDisplayString(user?.name, '상담사')}</SafeText>
      {' 상담사님'}
    </>
  );

  const dashboardShell = (mainBody) => (
    <div className="mg-v2-ad-b0kla consultant-dashboard-v2" data-testid={CONSULTANT_DASHBOARD_PAGE_TEST_ID}>
      <div className="mg-v2-ad-b0kla__container consultant-dashboard-v2__container">
        <ContentArea ariaLabel="상담사 대시보드">
          <ContentHeader
            title={welcomeTitle}
            subtitle={t('common:dashboard-v2.ConsultantDashboardV2.t_808c1f0c')}
            titleId={CONSULTANT_DASHBOARD_TITLE_ID}
          />
          {mainBody}
        </ContentArea>
      </div>
    </div>
  );

  const isSectionLoading = loading && Boolean(user?.id);
  const kpiUnavailable = Boolean(dashboardError) && !isSectionLoading;
  const listSectionError = kpiUnavailable ? CONSULTANT_DASHBOARD_LIST_ERROR_LABEL : '';

  const formatKpiValue = (display) => (kpiUnavailable ? '—' : display);

  const handlePhase1Retry = () => {
    if (user?.id) {
      fetchPhase1Content(user.id);
    }
  };

  return (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      {dashboardShell(
        <>
        {dashboardError && (
          <div className="consultant-dashboard-tenant-alert" role="alert">
            {dashboardError}
          </div>
        )}

        <QuickActionBar onNavigate={navigate} />

        <IncompleteRecordsAlert
          count={incompleteRecords.count}
          schedules={incompleteRecords.schedules}
          onAction={handleIncompleteRecordsAction}
        />

        <NextConsultationCard
          consultation={nextConsultation}
          onViewPreviousRecords={handleViewPreviousRecords}
          onViewDetails={handleViewDetails}
        />

        <section
          className="consultant-dashboard-v2__kpi-zone"
          aria-label="핵심 지표"
          data-testid={CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID}
        >
          {kpiUnavailable ? (
            <div className="consultant-dashboard-v2__kpi-retry">
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm'
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={fetchDashboardData}
                preventDoubleClick={false}
                aria-label={CONSULTANT_DASHBOARD_KPI_RETRY_ARIA_LABEL}
              >
                <Icon name="REFRESH" size="SM" color="TRANSPARENT" aria-hidden />
              </MGButton>
            </div>
          ) : null}
          <ContentKpiRow
            className="consultant-dashboard-v2__kpi-row"
            loading={isSectionLoading}
            items={[
              {
                id: 'weeklyConsultations',
                icon: <Calendar {...kpiLucideProps} />,
                label: '주간 상담 건수',
                value: formatKpiValue(`${weeklyConsultationCount}건`),
                iconVariant: 'blue',
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.WEEKLY_CONSULTATIONS)
              },
              {
                id: 'newClients',
                icon: <UserPlus {...kpiLucideProps} />,
                label: '신규 내담자',
                value: formatKpiValue(`${dashboardData.stats.newClients}명`),
                iconVariant: 'green',
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.NEW_CLIENTS)
              },
              {
                id: 'unreadMessages',
                icon: <MessageSquare {...kpiLucideProps} />,
                label: '미확인 메시지',
                value: formatKpiValue(`${dashboardData.stats.unreadMessages}건`),
                iconVariant: 'orange',
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES)
              },
              {
                id: 'incompleteRecords',
                icon: <ClipboardList {...kpiLucideProps} />,
                label: '작성 대기 일지',
                value: formatKpiValue(`${incompleteRecords.count}건`),
                iconVariant: 'gray',
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.INCOMPLETE_RECORDS)
              }
            ]}
          />
        </section>

        <UrgentClientsSection
          clients={urgentClients}
          loading={phase1Loading}
          error={phase1Error}
          onRetry={handlePhase1Retry}
          onViewAllClients={handleViewAllClients}
          onViewClientDetails={handleViewClientDetails}
        />

        <div className="consultant-dashboard-v2__lists-row">
          <ConsultantDashboardListSection
            title={t('common:dashboard-v2.ConsultantDashboardV2.t_f39a6b65')}
            titleIconName="CLOCK"
            columns={RECENT_SCHEDULE_COLUMNS}
            data={recentScheduleRows}
            renderCell={renderScheduleCell}
            onRowClick={(item) => handleScheduleClick(item.scheduleId)}
            emptyText={t('common:dashboard-v2.ConsultantDashboardV2.t_b2218467')}
            viewAllHref={CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}
            viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL}
            dataTestId="consultant-dashboard-recent-schedules"
            loading={isSectionLoading}
            error={listSectionError}
            onRetry={kpiUnavailable ? fetchDashboardData : undefined}
          />

          <ConsultantDashboardListSection
            title={t('common:dashboard-v2.ConsultantDashboardV2.t_1e4cd526')}
            titleIconName="CALENDAR"
            columns={UPCOMING_SCHEDULE_COLUMNS}
            data={upcomingScheduleRows}
            renderCell={renderScheduleCell}
            onRowClick={(item) => handleScheduleClick(item.scheduleId)}
            emptyText={t('common:dashboard-v2.ConsultantDashboardV2.t_7f221836')}
            viewAllHref={CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}
            viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL}
            dataTestId="consultant-dashboard-upcoming-schedules"
            loading={isSectionLoading}
            error={listSectionError}
            onRetry={kpiUnavailable ? fetchDashboardData : undefined}
          />

          <ConsultantDashboardListSection
            title={t('common:dashboard-v2.ConsultantDashboardV2.t_74e4a0da')}
            titleIconName="BELL"
            columns={NOTIFICATION_COLUMNS}
            data={notificationRows}
            renderCell={renderNotificationCell}
            onRowClick={() => navigate(CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS)}
            emptyText={t('common:dashboard-v2.ConsultantDashboardV2.t_00fa1636')}
            viewAllHref={CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS}
            viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL}
            rowKeyField="id"
            dataTestId="consultant-dashboard-notifications"
            loading={isSectionLoading}
            error={listSectionError}
            onRetry={kpiUnavailable ? fetchDashboardData : undefined}
          />
        </div>

        <ContentSection
          title={t('common:dashboard-v2.ConsultantDashboardV2.t_2a22e022')}
          className="mg-v2-content-section--full consultant-dashboard-v2__weekly-chart"
          dataTestId="consultant-dashboard-weekly-chart"
        >
          {dashboardData.weeklyStats.length === 0 ? (
            <div className="consultant-dashboard-v2__chart-empty mg-v2-ad-b0kla__chart-empty">
              <Icon
                name="BAR_CHART_3"
                size="XXXL"
                color="TRANSPARENT"
                className="consultant-dashboard-v2__chart-empty-icon mg-v2-ad-b0kla__chart-placeholder-icon"
              />
              <p className="consultant-dashboard-v2__chart-empty-text">
                {t('common:dashboard-v2.ConsultantDashboardV2.t_b283cb3a')}
              </p>
            </div>
          ) : (
            <div className="consultant-dashboard-v2__chart-container">
              {dashboardData.weeklyStats.map((stat, idx) => {
                const heightPercent = maxChartValue > 0 ? (stat.count / maxChartValue) * 100 : 0;
                const isLatestWeek = idx === dashboardData.weeklyStats.length - 1;
                return (
                  <div key={`stat-${stat.label}-${idx}`} className="consultant-dashboard-v2__chart-bar-wrapper">
                    <div
                      className={`consultant-dashboard-v2__chart-bar${isLatestWeek ? ' consultant-dashboard-v2__chart-bar--active' : ''}`}
                      style={{ '--chart-bar-height': `${Math.max(heightPercent, 4)}%` }}
                      title={`${stat.label}: ${stat.count}건`}
                    />
                    <span className="consultant-dashboard-v2__chart-label">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ContentSection>
        </>
      )}

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
