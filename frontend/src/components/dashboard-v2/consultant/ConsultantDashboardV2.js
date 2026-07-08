import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, MessageSquare, Star } from 'lucide-react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import Icon from '../../ui/Icon/Icon';
import ProfileAvatar from '../atoms/ProfileAvatar';
import StatusBadge from '../../common/StatusBadge';
import Chart from '../../common/Chart';
import { ContentArea, ContentHeader, ContentSection, ContentKpiRow } from '../content';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API, MESSAGE_API, RATING_API } from '../../../constants/api';
import QuickActionBar from './QuickActionBar';
import IncompleteRecordsAlert from './IncompleteRecordsAlert';
import NextConsultationCard from './NextConsultationCard';
import UrgentClientsSection from './UrgentClientsSection';
import ConsultantDashboardListSection from './ConsultantDashboardListSection';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import { resolveCssColorVarToHex } from '../../../utils/resolveCssColorVarToHex';
import { CHART_TYPES, CHART_HEIGHTS, B0KLA_CHART_BAR_FALLBACK } from '../../../constants/charts';
import { CONSULTATION_TYPE_LABELS } from '../../../constants/schedule';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import {
  CONSULTANT_DASHBOARD_TITLE_ID,
  CONSULTANT_DASHBOARD_PAGE_TEST_ID,
  CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID,
  CONSULTANT_DASHBOARD_ROUTES,
  CONSULTANT_DASHBOARD_QUERY,
  CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL,
  CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL,
  CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL,
  CONSULTANT_DASHBOARD_VIEW_ALL_MESSAGES_LABEL,
  CONSULTANT_SCHEDULE_STATUS_LABELS,
  CONSULTANT_DASHBOARD_KPI_LOADING_LABEL,
  CONSULTANT_DASHBOARD_KPI_ERROR_VALUE,
  CONSULTANT_DASHBOARD_SECTION_EMPTY,
  CONSULTANT_DASHBOARD_SECTION_ERROR,
  CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL
} from '../../../constants/consultantDashboardConstants';
import '../../../styles/unified-design-tokens.css';
import '../../../styles/responsive-layout-tokens.css';
import '../../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantDashboard.css';
import './ConsultantDashboardListSection.css';
import { USER_ROLES } from '../../../constants/roles';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

const TENANT_ERROR_MESSAGE = '테넌트 정보를 불러올 수 없습니다. 로그아웃 후 다시 로그인해 주세요.';
const RECENT_MESSAGE_MAX_ROWS = 5;

const RECENT_SCHEDULE_COLUMNS = [
  { key: 'timeLabel', label: '시간' },
  { key: 'clientName', label: '내담자' },
  { key: 'consultationTypeLabel', label: '상담 종류', hideOnMobile: true },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

const UPCOMING_SCHEDULE_COLUMNS = [
  { key: 'datetimeLabel', label: '일시' },
  { key: 'clientName', label: '내담자' },
  { key: 'consultationTypeLabel', label: '상담 종류', hideOnMobile: true },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

const MESSAGE_COLUMNS = [
  { key: 'preview', label: '메시지' },
  { key: 'receivedAtLabel', label: '수신', hideOnMobile: true }
];

const NOTIFICATION_COLUMNS = [
  { key: 'text', label: '알림' },
  { key: 'time', label: '일시', hideOnMobile: true }
];

const kpiLucideProps = {
  className: 'mg-v2-content-kpi-card__lucide',
  size: 28,
  strokeWidth: 2,
  'aria-hidden': true
};

const resolveConsultationTypeLabel = (schedule) => {
  const raw = schedule?.consultationTypeCode || schedule?.consultationType || schedule?.sessionType;
  if (!raw) return '—';
  return CONSULTATION_TYPE_LABELS[raw] || toDisplayString(raw, '—');
};

const formatMessagePreviewTime = (raw) => {
  if (!raw) return '—';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return toDisplayString(raw, '—');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

const ConsultantDashboardV2 = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resolved: darkResolved } = useDarkMode();
  const chartWrapperRef = useRef(null);

  const [dashboardError, setDashboardError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: { unreadMessages: 0 },
    todaySchedules: [],
    upcomingSchedules: [],
    recentNotifications: [],
    weeklyStats: []
  });
  const [ratingAverage, setRatingAverage] = useState(null);
  const [ratingLoadFailed, setRatingLoadFailed] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState([]);

  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });
  const [urgentClients, setUrgentClients] = useState([]);
  const [nextConsultation, setNextConsultation] = useState(null);

  const [sectionLoading, setSectionLoading] = useState({
    kpi: true,
    schedules: true,
    upcoming: true,
    notifications: true,
    messages: true,
    urgent: true,
    chart: true,
    phase1: true
  });
  const [sectionErrors, setSectionErrors] = useState({
    schedules: '',
    upcoming: '',
    notifications: '',
    messages: '',
    urgent: '',
    chart: ''
  });

  const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [chartBarColors, setChartBarColors] = useState({
    fill: B0KLA_CHART_BAR_FALLBACK.FILL,
    border: B0KLA_CHART_BAR_FALLBACK.BORDER
  });
  const [chartCanvasTheme, setChartCanvasTheme] = useState({
    tick: resolveCssColorVarToHex('--mg-v2-color-text-secondary', '#6B7280'),
    grid: resolveCssColorVarToHex('--mg-v2-color-border-light', '#E5E7EB'),
    tooltipBg: resolveCssColorVarToHex('--mg-v2-color-surface-raised', '#FFFFFF'),
    tooltipText: resolveCssColorVarToHex('--mg-v2-color-text-primary', '#111827')
  });

  useEffect(() => {
    const el = chartWrapperRef.current || document.documentElement;
    const style = el && typeof getComputedStyle !== 'undefined' ? getComputedStyle(el) : null;
    if (!style) return;
    const fill = style.getPropertyValue('--ad-b0kla-green').trim();
    const border = style.getPropertyValue('--ad-b0kla-blue').trim();
    setChartBarColors({
      fill: fill || B0KLA_CHART_BAR_FALLBACK.FILL,
      border: border || B0KLA_CHART_BAR_FALLBACK.BORDER
    });
    setChartCanvasTheme({
      tick: resolveCssColorVarToHex('--mg-v2-color-text-secondary', '#6B7280'),
      grid: resolveCssColorVarToHex('--mg-v2-color-border-light', '#E5E7EB'),
      tooltipBg: resolveCssColorVarToHex('--mg-v2-color-surface-raised', '#FFFFFF'),
      tooltipText: resolveCssColorVarToHex('--mg-v2-color-text-primary', '#111827')
    });
  }, [darkResolved, dashboardData.weeklyStats.length]);

  const resolveSessionUser = useCallback(() => {
    const sessionManager = typeof window !== 'undefined' ? window.sessionManager : null;
    return sessionManager?.getUser?.() ?? user;
  }, [user]);

  const resolveTenantId = useCallback((currentUser) => (
    currentUser?.tenantId
    ?? (typeof window !== 'undefined' ? window.sessionManager?.getSessionInfo?.()?.tenantId : null)
    ?? null
  ), []);

  const fetchRatingStats = useCallback(async(consultantId) => {
    setRatingLoading(true);
    setRatingLoadFailed(false);
    try {
      const ratingRes = await StandardizedApi.get(RATING_API.CONSULTANT_STATS(consultantId));
      const avg = ratingRes?.averageHeartScore ?? ratingRes?.averageRating;
      const parsed = typeof avg === 'number' ? avg : toSafeNumber(avg, 0);
      setRatingAverage(Number.isFinite(parsed) ? parsed : 0);
    } catch (err) {
      console.warn('상담사 평점 통계 API 실패:', err?.message || err);
      setRatingLoadFailed(true);
      setRatingAverage(null);
    } finally {
      setRatingLoading(false);
    }
  }, []);

  const fetchRecentMessages = useCallback(async(consultantId) => {
    setSectionLoading((prev) => ({ ...prev, messages: true }));
    setSectionErrors((prev) => ({ ...prev, messages: '' }));
    try {
      const res = await StandardizedApi.get(MESSAGE_API.GET_CONSULTANT_MESSAGES(consultantId), {
        page: 0,
        size: RECENT_MESSAGE_MAX_ROWS
      });
      const list = Array.isArray(res?.messages) ? res.messages : (Array.isArray(res) ? res : []);
      setRecentMessages(list.slice(0, RECENT_MESSAGE_MAX_ROWS));
    } catch (err) {
      console.warn('최근 메시지 API 실패:', err?.message || err);
      setRecentMessages([]);
      setSectionErrors((prev) => ({ ...prev, messages: CONSULTANT_DASHBOARD_SECTION_ERROR.MESSAGES }));
    } finally {
      setSectionLoading((prev) => ({ ...prev, messages: false }));
    }
  }, []);

  const fetchPhase1Content = useCallback(async(consultantId) => {
    setSectionLoading((prev) => ({ ...prev, phase1: true, urgent: true }));
    setSectionErrors((prev) => ({ ...prev, urgent: '' }));
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
      } else {
        setIncompleteRecords({ count: 0, schedules: [] });
      }

      if (urgentRes.status === 'fulfilled' && urgentRes.value) {
        setUrgentClients(urgentRes.value.clients ?? []);
      } else {
        setUrgentClients([]);
        if (urgentRes.status === 'rejected') {
          setSectionErrors((prev) => ({ ...prev, urgent: CONSULTANT_DASHBOARD_SECTION_ERROR.URGENT_CLIENTS }));
        }
      }

      if (preparationRes.status === 'fulfilled' && preparationRes.value?.consultation) {
        const data = preparationRes.value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const consultationDate = new Date(data.consultation.startTime);
        consultationDate.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (consultationDate.getTime() === today.getTime() || consultationDate.getTime() === tomorrow.getTime()) {
          setNextConsultation({
            ...data.consultation,
            isToday: consultationDate.getTime() === today.getTime()
          });
        } else {
          setNextConsultation(null);
        }
      } else {
        setNextConsultation(null);
      }
    } catch (error) {
      console.warn('Phase 1 컨텐츠 로드 실패:', error);
      setSectionErrors((prev) => ({ ...prev, urgent: CONSULTANT_DASHBOARD_SECTION_ERROR.URGENT_CLIENTS }));
    } finally {
      setSectionLoading((prev) => ({ ...prev, phase1: false, urgent: false }));
    }
  }, []);

  const fetchDashboardData = useCallback(async() => {
    if (!user?.id) {
      setSectionLoading({
        kpi: false,
        schedules: false,
        upcoming: false,
        notifications: false,
        messages: false,
        urgent: false,
        chart: false,
        phase1: false
      });
      return;
    }

    if (typeof window !== 'undefined' && window.sessionManager?.checkSession) {
      const lastCheck = window.sessionManager.getLastCheckTime?.() || 0;
      if (!lastCheck || Date.now() - lastCheck > 30000) {
        await window.sessionManager.checkSession(true);
      }
    }

    const currentUser = resolveSessionUser();
    const tenantId = resolveTenantId(currentUser);

    if (!tenantId) {
      console.warn('⚠️ [상담사 대시보드] tenantId 없음');
      setDashboardError(TENANT_ERROR_MESSAGE);
      setSectionLoading({
        kpi: false,
        schedules: false,
        upcoming: false,
        notifications: false,
        messages: false,
        urgent: false,
        chart: false,
        phase1: false
      });
      setDashboardData((prev) => ({
        ...prev,
        stats: { unreadMessages: 0 },
        todaySchedules: [],
        weeklyStats: []
      }));
      return;
    }

    setDashboardError('');
    setSectionErrors({
      schedules: '',
      upcoming: '',
      notifications: '',
      messages: '',
      urgent: '',
      chart: ''
    });
    setSectionLoading({
      kpi: true,
      schedules: true,
      upcoming: true,
      notifications: true,
      messages: true,
      urgent: true,
      chart: true,
      phase1: true
    });

    try {
      let statsResponse = null;
      try {
        statsResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS, {
          userRole: USER_ROLES.CONSULTANT
        });
      } catch (statsErr) {
        const isTenantError = (statsErr?.status === 400 || statsErr?.response?.status === 400)
          && /테넌트/.test(statsErr?.response?.data?.message || statsErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 통계 API 실패:', statsErr?.message || statsErr);
        setSectionErrors((prev) => ({ ...prev, chart: CONSULTANT_DASHBOARD_SECTION_ERROR.CHART }));
      }

      let scheduleResponse = { schedules: [] };
      try {
        scheduleResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: currentUser.id,
          userRole: USER_ROLES.CONSULTANT
        });
      } catch (scheduleErr) {
        const isTenantError = (scheduleErr?.status === 400 || scheduleErr?.response?.status === 400)
          && /테넌트/.test(scheduleErr?.response?.data?.message || scheduleErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 스케줄 API 실패:', scheduleErr?.message || scheduleErr);
        setSectionErrors((prev) => ({ ...prev, schedules: CONSULTANT_DASHBOARD_SECTION_ERROR.SCHEDULES }));
      } finally {
        setSectionLoading((prev) => ({ ...prev, schedules: false }));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let rawSchedules = [];
      if (scheduleResponse) {
        if (Array.isArray(scheduleResponse)) rawSchedules = scheduleResponse;
        else if (Array.isArray(scheduleResponse.schedules)) rawSchedules = scheduleResponse.schedules;
        else if (Array.isArray(scheduleResponse.data)) rawSchedules = scheduleResponse.data;
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

      const schedules = rawSchedules.map((schedule) => {
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
            dateStr = String(schedule.date).includes('T')
              ? String(schedule.date).split('T')[0]
              : String(schedule.date);
          }
          fullStartTime = `${dateStr}T${formatTimeStr(schedule.startTime)}`;
          fullEndTime = `${dateStr}T${formatTimeStr(schedule.endTime)}`;
        } else if (Array.isArray(schedule.startTime)) {
          const todayStr = today.toISOString().split('T')[0];
          fullStartTime = `${todayStr}T${formatTimeStr(schedule.startTime)}`;
        }
        return { ...schedule, startTime: fullStartTime, endTime: fullEndTime };
      }).filter((schedule) => {
        if (!schedule.startTime) return false;
        const scheduleDate = new Date(schedule.startTime);
        if (Number.isNaN(scheduleDate.getTime())) return false;
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === today.getTime() || scheduleDate.getTime() === yesterday.getTime();
      }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const stats = statsResponse && typeof statsResponse === 'object' ? statsResponse : {};
      const weeklyStatsData = Array.isArray(stats?.weeklyStats) && stats.weeklyStats.length > 0
        ? stats.weeklyStats.map((s) => ({
          label: s.period != null && String(s.period).trim() !== '' ? String(s.period).trim() : '—',
          count: typeof s.completedCount === 'number' ? s.completedCount : (Number(s.completedCount) || 0)
        }))
        : [];

      let unreadMessages = stats.unreadMessages ?? 0;
      try {
        const unreadRes = await StandardizedApi.get(MESSAGE_API.UNREAD_COUNT, {
          userId: currentUser.id,
          userType: USER_ROLES.CONSULTANT,
          _t: Date.now()
        });
        if (unreadRes != null && typeof unreadRes.unreadCount === 'number') {
          unreadMessages = unreadRes.unreadCount;
        }
      } catch (unreadErr) {
        console.warn('안읽은 메시지 수 조회 실패:', unreadErr?.message || unreadErr);
      }

      let activeNotifications = [];
      setSectionLoading((prev) => ({ ...prev, notifications: true }));
      try {
        const notiRes = await StandardizedApi.get(API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE);
        if (notiRes && Array.isArray(notiRes)) {
          activeNotifications = notiRes.slice(0, 3).map((n) => ({
            id: n.id,
            text: n.title,
            time: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '최근',
            isRead: n.isRead
          }));
        }
      } catch (err) {
        console.warn('알림 API 호출 실패:', err);
        setSectionErrors((prev) => ({ ...prev, notifications: CONSULTANT_DASHBOARD_SECTION_ERROR.NOTIFICATIONS }));
      } finally {
        setSectionLoading((prev) => ({ ...prev, notifications: false }));
      }

      let upcomingSchedules = [];
      setSectionLoading((prev) => ({ ...prev, upcoming: true }));
      try {
        const todayDate = new Date();
        const endDate = new Date(todayDate);
        endDate.setDate(endDate.getDate() + 7);
        const upcomingResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES, {
          userId: currentUser.id,
          userRole: USER_ROLES.CONSULTANT,
          startDate: todayDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 5
        });
        if (Array.isArray(upcomingResponse)) upcomingSchedules = upcomingResponse;
        else if (Array.isArray(upcomingResponse?.schedules)) upcomingSchedules = upcomingResponse.schedules;
        else if (Array.isArray(upcomingResponse?.data)) upcomingSchedules = upcomingResponse.data;

        upcomingSchedules = upcomingSchedules.sort((a, b) => {
          const dateA = Array.isArray(a.date) ? new Date(a.date[0], a.date[1] - 1, a.date[2]) : new Date(a.date);
          const dateB = Array.isArray(b.date) ? new Date(b.date[0], b.date[1] - 1, b.date[2]) : new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
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
      } catch (upcomingErr) {
        console.warn('다가오는 상담 API 실패:', upcomingErr?.message || upcomingErr);
        setSectionErrors((prev) => ({ ...prev, upcoming: CONSULTANT_DASHBOARD_SECTION_ERROR.SCHEDULES }));
      } finally {
        setSectionLoading((prev) => ({ ...prev, upcoming: false }));
      }

      setDashboardData({
        stats: { unreadMessages },
        todaySchedules: schedules,
        upcomingSchedules,
        recentNotifications: activeNotifications,
        weeklyStats: weeklyStatsData
      });
      setSectionLoading((prev) => ({ ...prev, chart: false, kpi: false }));

      await Promise.all([
        fetchRatingStats(currentUser.id),
        fetchRecentMessages(currentUser.id),
        fetchPhase1Content(currentUser.id)
      ]);
    } catch (error) {
      const isTenantError = (error?.status === 400 || error?.response?.status === 400)
        && /테넌트/.test(error?.response?.data?.message || error?.message || '');
      if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
      console.error('대시보드 데이터 로드 실패:', error);
      setSectionLoading({
        kpi: false,
        schedules: false,
        upcoming: false,
        notifications: false,
        messages: false,
        urgent: false,
        chart: false,
        phase1: false
      });
    }
  }, [user, resolveSessionUser, resolveTenantId, fetchRatingStats, fetchRecentMessages, fetchPhase1Content]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (dateString) => {
    if (!dateString) return { time: '', meridiem: '' };
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return { time: '', meridiem: '' };
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return { time: `${hours}:${minutes}`, meridiem };
  };

  const formatUpcomingSchedule = (schedule) => {
    if (!schedule.date || !schedule.startTime) return { dateStr: '', weekday: '', timeStr: '' };
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
    navigate(`${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?scheduleId=${scheduleId}`);
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
        navigate(`${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?${CONSULTANT_DASHBOARD_QUERY.RECORDS_INCOMPLETE_FILTER}`);
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
      navigate(`${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?${CONSULTANT_DASHBOARD_QUERY.RECORDS_INCOMPLETE_FILTER}`);
    }
  };

  const handleViewPreviousRecords = (clientId) => {
    navigate(`${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?clientId=${clientId}`);
  };

  const handleViewDetails = (scheduleId) => {
    navigate(`${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?scheduleId=${scheduleId}`);
  };

  const handleViewClientDetails = (clientId) => {
    navigate(`${CONSULTANT_DASHBOARD_ROUTES.CLIENTS}/${clientId}`);
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
        consultationTypeLabel: resolveConsultationTypeLabel(schedule),
        status: schedule.status,
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
        consultationTypeLabel: resolveConsultationTypeLabel(schedule),
        status: schedule.status,
        statusLabel: resolveStatusLabel(schedule.status),
        scheduleId: schedule.id
      };
    })
  ), [dashboardData.upcomingSchedules, resolveStatusLabel]);

  const messageRows = useMemo(() => (
    recentMessages.map((message, idx) => {
      const previewText = message.title || message.content || '';
      const truncated = previewText.length > 80 ? `${previewText.slice(0, 80)}…` : previewText;
      return {
        id: message.id ?? `message-${idx}`,
        clientName: message.clientName,
        preview: truncated,
        receivedAtLabel: formatMessagePreviewTime(message.sentAt || message.createdAt),
        isRead: message.isRead === true,
        messageId: message.id
      };
    })
  ), [recentMessages]);

  const notificationRows = useMemo(() => (
    dashboardData.recentNotifications.map((noti) => ({
      id: noti.id,
      text: noti.text,
      time: noti.time,
      isRead: noti.isRead === true
    }))
  ), [dashboardData.recentNotifications]);

  const renderScheduleCell = useCallback((columnKey, item) => {
    if (columnKey === 'statusLabel') {
      return (
        <StatusBadge status={item.status}>
          {toDisplayString(item.statusLabel, '—')}
        </StatusBadge>
      );
    }
    const value = item[columnKey];
    return <SafeText tag="span">{toDisplayString(value, '—')}</SafeText>;
  }, []);

  const renderMessageCell = useCallback((columnKey, item) => {
    if (columnKey === 'preview') {
      const unreadClass = item.isRead ? '' : 'consultant-dashboard-v2__message-preview--unread';
      return (
        <div className="consultant-dashboard-v2__message-preview-row">
          <ProfileAvatar name={toDisplayString(item.clientName, '내담자')} size="small" />
          <span className={`consultant-dashboard-v2__message-preview ${unreadClass}`.trim()}>
            <SafeText tag="span">{toDisplayString(item.preview, '—')}</SafeText>
          </span>
          {!item.isRead ? (
            <span
              className="mg-v2-indicator-dot mg-v2-indicator-dot--unread consultant-dashboard-v2__message-unread-dot"
              aria-label="미읽음"
            />
          ) : null}
        </div>
      );
    }
    if (columnKey === 'receivedAtLabel') {
      return <SafeText tag="span">{toDisplayString(item.receivedAtLabel, '—')}</SafeText>;
    }
    return <SafeText tag="span">{toDisplayString(item[columnKey], '—')}</SafeText>;
  }, []);

  const renderNotificationCell = useCallback((columnKey, item) => {
    const unreadClass = item.isRead ? '' : 'consultant-dashboard-v2__notification-text--unread';
    const value = item[columnKey];
    if (columnKey === 'text') {
      return (
        <SafeText tag="span" className={unreadClass}>
          {toDisplayString(value, '—')}
        </SafeText>
      );
    }
    return <SafeText tag="span">{toDisplayString(value, '—')}</SafeText>;
  }, []);

  const getNotificationRowClassName = useCallback((item) => (
    item.isRead ? '' : 'consultant-dashboard-v2__notification-row--unread'
  ), []);

  const welcomeTitle = (
    <>
      {'환영합니다, '}
      <SafeText tag="span">{toDisplayString(user?.name, '상담사')}</SafeText>
      {' 상담사님'}
    </>
  );

  const isKpiRowLoading = sectionLoading.kpi && Boolean(user?.id) && !dashboardError;
  const ratingKpiValue = ratingLoadFailed || dashboardError
    ? CONSULTANT_DASHBOARD_KPI_ERROR_VALUE
    : ratingLoading
      ? CONSULTANT_DASHBOARD_KPI_LOADING_LABEL
      : `${toDisplayString(ratingAverage != null ? Number(ratingAverage).toFixed(1) : '0.0', '0.0')}점`;

  const chartValues = dashboardData.weeklyStats.map((s) => s.count);
  const chartAllZero = chartValues.length > 0 && chartValues.every((v) => v === 0);
  const chartHasData = dashboardData.weeklyStats.length > 0 && !chartAllZero;

  const chartJsTooltipOptions = {
    backgroundColor: chartCanvasTheme.tooltipBg,
    titleColor: chartCanvasTheme.tooltipText,
    bodyColor: chartCanvasTheme.tooltipText
  };

  const renderChartSection = () => {
    if (sectionLoading.chart) {
      return (
        <p className="consultant-dashboard-v2__chart-loading" aria-live="polite" aria-busy="true">
          <SafeText tag="span">{CONSULTANT_DASHBOARD_KPI_LOADING_LABEL}</SafeText>
        </p>
      );
    }

    if (sectionErrors.chart) {
      return (
        <div className="consultant-dashboard-list-section__error-wrap" role="alert">
          <p className="consultant-dashboard-list-section__error">
            <SafeText tag="span">{sectionErrors.chart}</SafeText>
          </p>
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm consultant-dashboard-list-section__retry'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={fetchDashboardData}
            preventDoubleClick={false}
            aria-label={`${sectionErrors.chart} ${CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL}`}
          >
            <SafeText tag="span">{CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL}</SafeText>
          </MGButton>
        </div>
      );
    }

    if (!chartHasData) {
      return (
        <div className="consultant-dashboard-v2__chart-empty mg-v2-ad-b0kla__chart-empty">
          <Icon
            name="BAR_CHART_3"
            size="XXXL"
            color="TRANSPARENT"
            className="consultant-dashboard-v2__chart-empty-icon mg-v2-ad-b0kla__chart-placeholder-icon"
            aria-hidden
          />
          <p className="consultant-dashboard-v2__chart-empty-text">
            {CONSULTANT_DASHBOARD_SECTION_EMPTY.CHART}
          </p>
        </div>
      );
    }

    return (
      <div ref={chartWrapperRef} className="consultant-dashboard-v2__chart-canvas-wrap">
        <Chart
          type={CHART_TYPES.BAR}
          data={{
            labels: dashboardData.weeklyStats.map((s) => s.label),
            datasets: [
              {
                label: '완료 상담',
                data: chartValues,
                backgroundColor: chartBarColors.fill,
                borderColor: chartBarColors.border,
                borderWidth: 1,
                borderRadius: 6
              }
            ]
          }}
          height={CHART_HEIGHTS.MEDIUM}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...chartJsTooltipOptions,
                callbacks: {
                  label: (ctx) => `완료: ${ctx.parsed.y}건`
                }
              }
            },
            scales: {
              x: {
                ticks: { color: chartCanvasTheme.tick },
                grid: { color: chartCanvasTheme.grid }
              },
              y: {
                beginAtZero: true,
                ticks: { color: chartCanvasTheme.tick },
                grid: { color: chartCanvasTheme.grid }
              }
            }
          }}
        />
      </div>
    );
  };

  const dashboardShell = (mainBody) => (
    <div className="mg-v2-ad-b0kla consultant-dashboard-v2" data-testid={CONSULTANT_DASHBOARD_PAGE_TEST_ID}>
      <div className="mg-v2-ad-b0kla__container consultant-dashboard-v2__container">
        <ContentArea ariaLabel="상담사 대시보드">
          <ContentHeader
            title={welcomeTitle}
            subtitle={t('common:dashboard-v2.ConsultantDashboardV2.t_808c1f0c')}
            titleId={CONSULTANT_DASHBOARD_TITLE_ID}
            actions={<QuickActionBar onNavigate={navigate} layout="inline" />}
          />
          {mainBody}
        </ContentArea>
      </div>
    </div>
  );

  return (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      {dashboardShell(
        <>
          {dashboardError ? (
            <div className="consultant-dashboard-tenant-alert" role="alert">
              <SafeText tag="span">{toDisplayString(dashboardError, '')}</SafeText>
            </div>
          ) : null}

          <IncompleteRecordsAlert
            count={incompleteRecords.count}
            schedules={incompleteRecords.schedules}
            onAction={handleIncompleteRecordsAction}
            loading={sectionLoading.phase1}
          />

          <NextConsultationCard
            consultation={nextConsultation}
            onViewPreviousRecords={handleViewPreviousRecords}
            onViewDetails={handleViewDetails}
            loading={sectionLoading.phase1}
          />

          <section
            className="consultant-dashboard-v2__kpi-zone mg-v2-dashboard-kpi-zone mg-v2-dashboard-kpi-zone--compact"
            aria-label="핵심 지표"
            data-testid={CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID}
          >
            <ContentKpiRow
              className="consultant-dashboard-v2__kpi-row"
              loading={isKpiRowLoading}
              items={[
                {
                  id: 'weeklyConsultations',
                  icon: <Calendar {...kpiLucideProps} />,
                  label: '주간 상담 건수',
                  value: dashboardError ? CONSULTANT_DASHBOARD_KPI_ERROR_VALUE : `${weeklyConsultationCount}건`,
                  iconVariant: 'blue'
                },
                {
                  id: 'ratingAverage',
                  icon: <Star {...kpiLucideProps} />,
                  label: '평점',
                  value: ratingKpiValue,
                  iconVariant: 'accent'
                },
                {
                  id: 'unreadMessages',
                  icon: <MessageSquare {...kpiLucideProps} />,
                  label: '미확인 메시지',
                  value: dashboardError
                    ? CONSULTANT_DASHBOARD_KPI_ERROR_VALUE
                    : `${dashboardData.stats.unreadMessages}건`,
                  iconVariant: 'error'
                },
                {
                  id: 'incompleteRecords',
                  icon: <ClipboardList {...kpiLucideProps} />,
                  label: '미작성 일지',
                  value: sectionLoading.phase1
                    ? CONSULTANT_DASHBOARD_KPI_LOADING_LABEL
                    : `${incompleteRecords.count}건`,
                  iconVariant: 'warning'
                }
              ]}
            />
          </section>

          <UrgentClientsSection
            clients={urgentClients}
            loading={sectionLoading.urgent}
            error={sectionErrors.urgent}
            onRetry={fetchDashboardData}
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
              emptyText={CONSULTANT_DASHBOARD_SECTION_EMPTY.RECENT_SCHEDULES}
              viewAllHref={CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}
              viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL}
              viewAllAriaLabel={CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL}
              dataTestId="consultant-dashboard-recent-schedules"
              loading={sectionLoading.schedules}
              error={sectionErrors.schedules}
              onRetry={fetchDashboardData}
            />

            <ConsultantDashboardListSection
              title={t('common:dashboard-v2.ConsultantDashboardV2.t_1e4cd526')}
              titleIconName="CALENDAR"
              columns={UPCOMING_SCHEDULE_COLUMNS}
              data={upcomingScheduleRows}
              renderCell={renderScheduleCell}
              onRowClick={(item) => handleScheduleClick(item.scheduleId)}
              emptyText={CONSULTANT_DASHBOARD_SECTION_EMPTY.UPCOMING_SCHEDULES}
              viewAllHref={CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}
              viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL}
              viewAllAriaLabel={CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL}
              dataTestId="consultant-dashboard-upcoming-schedules"
              loading={sectionLoading.upcoming}
              error={sectionErrors.upcoming}
              onRetry={fetchDashboardData}
            />

            <ConsultantDashboardListSection
              title="최근 메시지"
              titleIconName="MESSAGE"
              columns={MESSAGE_COLUMNS}
              data={messageRows}
              renderCell={renderMessageCell}
              onRowClick={() => navigate(CONSULTANT_DASHBOARD_ROUTES.MESSAGES)}
              emptyText={CONSULTANT_DASHBOARD_SECTION_EMPTY.MESSAGES}
              viewAllHref={CONSULTANT_DASHBOARD_ROUTES.MESSAGES}
              viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_MESSAGES_LABEL}
              viewAllAriaLabel={CONSULTANT_DASHBOARD_VIEW_ALL_MESSAGES_LABEL}
              rowKeyField="id"
              dataTestId="consultant-dashboard-recent-messages"
              loading={sectionLoading.messages}
              error={sectionErrors.messages}
              onRetry={() => user?.id && fetchRecentMessages(user.id)}
            />

            <ConsultantDashboardListSection
              title={t('common:dashboard-v2.ConsultantDashboardV2.t_74e4a0da')}
              titleIconName="BELL"
              columns={NOTIFICATION_COLUMNS}
              data={notificationRows}
              renderCell={renderNotificationCell}
              getRowClassName={getNotificationRowClassName}
              onRowClick={() => navigate(CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS)}
              emptyText={CONSULTANT_DASHBOARD_SECTION_EMPTY.NOTIFICATIONS}
              viewAllHref={CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS}
              viewAllLabel={CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL}
              viewAllAriaLabel={CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL}
              rowKeyField="id"
              dataTestId="consultant-dashboard-notifications"
              loading={sectionLoading.notifications}
              error={sectionErrors.notifications}
              onRetry={fetchDashboardData}
            />
          </div>

          <ContentSection
            title={t('common:dashboard-v2.ConsultantDashboardV2.t_2a22e022')}
            className="mg-v2-content-section--full consultant-dashboard-v2__weekly-chart"
            dataTestId="consultant-dashboard-weekly-chart"
          >
            {renderChartSection()}
          </ContentSection>
        </>
      )}

      {showConsultationLogModal && selectedSchedule ? (
        <ConsultationLogModal
          isOpen={showConsultationLogModal}
          onClose={() => {
            setShowConsultationLogModal(false);
            setSelectedSchedule(null);
          }}
          scheduleData={selectedSchedule}
          onSave={handleConsultationLogSave}
        />
      ) : null}
    </AdminCommonLayout>
  );
};

ConsultantDashboardV2.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    tenantId: PropTypes.string
  })
};

export default ConsultantDashboardV2;
