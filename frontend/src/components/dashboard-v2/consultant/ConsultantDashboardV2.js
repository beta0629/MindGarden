import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import Icon from '../../ui/Icon/Icon';
import { ContentArea, ContentHeader, ContentSection, ContentCard } from '../content';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API, MESSAGE_API, SCHEDULE_API } from '../../../constants/api';
import QuickActionBar from './QuickActionBar';
import IncompleteRecordsAlert from './IncompleteRecordsAlert';
import NextConsultationCard from './NextConsultationCard';
import UrgentClientsSection from './UrgentClientsSection';
import TodayScheduleRunList from './TodayScheduleRunList';
import ConsultantHomeSnapshotRow from './ConsultantHomeSnapshotRow';
import ConsultantSummaryStrip from './ConsultantSummaryStrip';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import MissingConsultationLogsList from '../../ui/Schedule/MissingConsultationLogsList';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import useCumulativeMissingConsultationLogs from '../../../hooks/useCumulativeMissingConsultationLogs';
import notificationManager from '../../../utils/notification';
import {
  buildConsultantMissingConsultationLogFallbackRoute,
  resolveMissingLogSchedule
} from '../../../utils/missingConsultationLogNavigation';
import { fetchConsultantSessionStatistics } from '../../../api/consultantSessionStatisticsClient';
import { loadConsultantSalaryCalculations } from '../../../api/consultantSalaryCalculationsClient';
import {
  CONSULTANT_DASHBOARD_TITLE_ID,
  CONSULTANT_DASHBOARD_PAGE_TEST_ID,
  CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID,
  CONSULTANT_DASHBOARD_ACTION_STRIP_TEST_ID,
  CONSULTANT_DASHBOARD_SESSION_CHART_TEST_ID,
  CONSULTANT_DASHBOARD_LIST_ERROR_LABEL,
  CONSULTANT_DASHBOARD_KPI_RETRY_ARIA_LABEL,
  CONSULTANT_DASHBOARD_HOME_COPY as HOME_COPY
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
import '../../ui/Schedule/ScheduleLegend.css';
import './ConsultantDashboard.css';
import './ConsultantDashboardListSection.css';
import './ConsultantSummaryStrip.css';
import { USER_ROLES } from '../../../constants/roles';
import { useTranslation } from 'react-i18next';

const API_CONSULTATION_MESSAGES_UNREAD_COUNT = '/api/v1/consultation-messages/unread-count';
const TENANT_ERROR_MESSAGE = '센터 정보를 불러올 수 없습니다. 로그아웃 후 다시 로그인해 주세요.';

/**
 * @param {Date} d
 * @returns {string}
 */
function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {Object} item
 * @returns {string}
 */
function resolveSalaryPeriodLabel(item) {
  const direct =
    item?.settlementPeriod
    ?? item?.periodLabel
    ?? item?.period
    ?? item?.payPeriod
    ?? item?.calculationPeriod;
  if (direct != null && String(direct).trim() !== '') {
    return toDisplayString(direct, '—');
  }
  const y = item?.year ?? item?.settlementYear;
  const m = item?.month ?? item?.settlementMonth;
  if (y != null && m != null) {
    return toDisplayString(`${y}-${String(m).padStart(2, '0')}`, '—');
  }
  return '—';
}

/**
 * @param {Object} item
 * @returns {string}
 */
function resolveSalaryNetLabel(item) {
  const taxAmt = toSafeNumber(item?.taxAmount ?? item?.deductions, 0);
  const gross =
    item?.grossSalary != null && item?.grossSalary !== ''
      ? toSafeNumber(item.grossSalary, 0)
      : toSafeNumber(item?.totalSalary, 0);
  const net =
    item?.netSalary != null && item?.netSalary !== ''
      ? toSafeNumber(item.netSalary, Number.NaN)
      : gross - taxAmt;
  if (!Number.isFinite(net)) {
    return '—';
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(net);
}

/**
 * @param {*} schedule
 * @returns {boolean}
 */
function scheduleHasConsultationRecord(schedule, incompleteSchedules) {
  if (schedule?.consultationRecordId != null && schedule.consultationRecordId !== '') {
    return true;
  }
  if (schedule?.hasConsultationRecord === true || schedule?.hasConsultationLog === true) {
    return true;
  }
  const sid = schedule?.id ?? schedule?.scheduleId;
  if (sid == null) {
    return false;
  }
  const incomplete = Array.isArray(incompleteSchedules) ? incompleteSchedules : [];
  const isIncomplete = incomplete.some(
    (row) => String(row.scheduleId ?? row.id) === String(sid)
  );
  return !isIncomplete && schedule?.status === 'COMPLETED';
}

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
    sessionBuckets: [],
    snapshotMessage: null,
    snapshotSalary: null
  });

  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });
  const [urgentClients, setUrgentClients] = useState([]);
  const [phase1Loading, setPhase1Loading] = useState(false);
  const [phase1Error, setPhase1Error] = useState('');
  const [nextConsultation, setNextConsultation] = useState(null);
  const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [missingLogChipResolving, setMissingLogChipResolving] = useState(false);
  const [scheduleActionBusyId, setScheduleActionBusyId] = useState(null);

  const { items: cumulativeMissingLogItems } = useCumulativeMissingConsultationLogs();
  const missingConsultationLogsForCard = useMemo(() => {
    if (!Array.isArray(cumulativeMissingLogItems)) {
      return cumulativeMissingLogItems;
    }
    if (user?.id == null) {
      return [];
    }
    const selfId = String(user.id);
    return cumulativeMissingLogItems.filter(
      (item) => item != null && String(item.consultantId) === selfId
    );
  }, [cumulativeMissingLogItems, user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
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
      setDashboardData((prev) => ({
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
      let statsResponse;
      try {
        statsResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS, {
          userRole: USER_ROLES.CONSULTANT
        });
      } catch (statsErr) {
        const isTenantError = (statsErr?.status === 400 || statsErr?.response?.status === 400)
          && /테넌트/.test(statsErr?.response?.data?.message || statsErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 통계 API 실패, 기본값 사용:', statsErr?.message || statsErr);
        statsResponse = null;
      }

      let scheduleResponse;
      try {
        scheduleResponse = await StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES, {
          userId: currentUser.id,
          userRole: USER_ROLES.CONSULTANT
        });
      } catch (scheduleErr) {
        const isTenantError = (scheduleErr?.status === 400 || scheduleErr?.response?.status === 400)
          && /테넌트/.test(scheduleErr?.response?.data?.message || scheduleErr?.message || '');
        if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
        console.warn('상담사 스케줄 API 실패, 빈 목록 사용:', scheduleErr?.message || scheduleErr);
        scheduleResponse = { schedules: [] };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

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

      const schedules = rawSchedules.map((schedule) => {
        let fullStartTime = schedule.startTime;
        let fullEndTime = schedule.endTime;
        let dateYmd = '';

        if (schedule.date) {
          if (Array.isArray(schedule.date)) {
            const y = schedule.date[0];
            const m = String(schedule.date[1] || 1).padStart(2, '0');
            const d = String(schedule.date[2] || 1).padStart(2, '0');
            dateYmd = `${y}-${m}-${d}`;
          } else {
            dateYmd = String(schedule.date).includes('T')
              ? String(schedule.date).split('T')[0]
              : String(schedule.date).slice(0, 10);
          }
          const timeStr = formatTimeStr(schedule.startTime);
          const endTimeStr = formatTimeStr(schedule.endTime);
          fullStartTime = `${dateYmd}T${timeStr}`;
          fullEndTime = `${dateYmd}T${endTimeStr}`;
        } else if (Array.isArray(schedule.startTime)) {
          dateYmd = today.toISOString().split('T')[0];
          fullStartTime = `${dateYmd}T${formatTimeStr(schedule.startTime)}`;
        } else if (typeof schedule.startTime === 'string' && schedule.startTime.includes('T')) {
          dateYmd = schedule.startTime.split('T')[0];
        }

        return {
          ...schedule,
          date: dateYmd || schedule.date,
          startTime: fullStartTime,
          endTime: fullEndTime
        };
      }).filter((schedule) => {
        if (!schedule.startTime) return false;
        const scheduleDate = new Date(schedule.startTime);
        if (Number.isNaN(scheduleDate.getTime())) return false;
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === today.getTime();
      }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const stats = statsResponse && typeof statsResponse === 'object' ? statsResponse : {};
      const todaySchedulesFromStats = stats.totalToday ?? stats.todaySchedules;

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

      let snapshotMessage = null;
      try {
        const msgRes = await StandardizedApi.get(MESSAGE_API.GET_CONSULTANT_MESSAGES(currentUser.id), {});
        let list = [];
        if (Array.isArray(msgRes)) {
          list = msgRes;
        } else if (msgRes && Array.isArray(msgRes.messages)) {
          list = msgRes.messages;
        }
        const latest = list[0];
        if (latest) {
          snapshotMessage = {
            partnerName: toDisplayString(latest.clientName ?? latest.senderName, '내담자'),
            lastMessage: toDisplayString(latest.content ?? latest.title ?? latest.message, '')
          };
        }
      } catch (msgErr) {
        console.warn('최근 메시지 glance 조회 실패:', msgErr?.message || msgErr);
      }

      let snapshotSalary = null;
      try {
        const salaryRes = await loadConsultantSalaryCalculations();
        const first = Array.isArray(salaryRes?.items) ? salaryRes.items[0] : null;
        if (first) {
          snapshotSalary = {
            periodLabel: resolveSalaryPeriodLabel(first),
            netLabel: resolveSalaryNetLabel(first)
          };
        }
      } catch (salaryErr) {
        console.warn('급여 snapshot 조회 실패:', salaryErr?.message || salaryErr);
      }

      let sessionBuckets = [];
      try {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - 55);
        start.setHours(0, 0, 0, 0);
        const sessionStats = await fetchConsultantSessionStatistics({
          startDate: formatYmd(start),
          endDate: formatYmd(end),
          granularity: 'WEEK'
        });
        sessionBuckets = Array.isArray(sessionStats?.buckets) ? sessionStats.buckets : [];
      } catch (sessionErr) {
        console.warn('완료 회기 추이 조회 실패:', sessionErr?.message || sessionErr);
      }

      setDashboardData({
        stats: {
          todaySchedules: schedules.length || todaySchedulesFromStats || 0,
          newClients: stats.newClients ?? 0,
          unreadMessages
        },
        todaySchedules: schedules,
        sessionBuckets,
        snapshotMessage,
        snapshotSalary
      });

      await fetchPhase1Content(currentUser.id);
    } catch (error) {
      const isTenantError = (error?.status === 400 || error?.response?.status === 400)
        && /테넌트/.test(error?.response?.data?.message || error?.message || '');
      if (isTenantError) setDashboardError(TENANT_ERROR_MESSAGE);
      console.error('대시보드 데이터 로드 실패:', error);
      setDashboardData((prev) => ({
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
          } else {
            setNextConsultation(null);
          }
        } else {
          setNextConsultation(null);
        }
      }
    } catch (error) {
      setPhase1Error(CONSULTANT_DASHBOARD_LIST_ERROR_LABEL);
      console.warn('Phase 1 컨텐츠 로드 실패:', error);
    } finally {
      setPhase1Loading(false);
    }
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

  const handleMissingLogDateChipClick = useCallback(async({
    consultantId,
    date,
    scheduleId,
    clientId
  }) => {
    if (missingLogChipResolving) {
      return;
    }
    const scopedConsultantId = user?.id != null ? user.id : consultantId;
    setMissingLogChipResolving(true);
    try {
      const resolved = await resolveMissingLogSchedule({
        consultantId: scopedConsultantId,
        date,
        scheduleId,
        clientId
      });
      if (resolved?.id != null) {
        setSelectedSchedule({
          ...resolved,
          id: resolved.id,
          consultantId: resolved.consultantId ?? scopedConsultantId,
          clientId: resolved.clientId ?? clientId ?? undefined,
          sessionDate: resolved.sessionDate ?? resolved.date ?? date
        });
        setShowConsultationLogModal(true);
        return;
      }
      notificationManager.warning(
        t('admin:dashboard.consultationStats.missingLogScheduleNotFound', {
          defaultValue: '해당 날짜의 일정을 찾지 못했습니다. 상담일지 조회로 이동합니다.'
        })
      );
      navigate(buildConsultantMissingConsultationLogFallbackRoute({
        date,
        scheduleId,
        clientId
      }));
    } catch (err) {
      console.warn('상담일지 누락 칩 → 스케줄 조회 실패:', err);
      notificationManager.error(
        t('admin:dashboard.consultationStats.missingLogOpenFailed', {
          defaultValue: '상담일지 작성 화면을 열지 못했습니다.'
        })
      );
      navigate(buildConsultantMissingConsultationLogFallbackRoute({
        date,
        scheduleId,
        clientId
      }));
    } finally {
      setMissingLogChipResolving(false);
    }
  }, [missingLogChipResolving, navigate, t, user?.id]);

  const handleWriteRecord = (scheduleId) => {
    navigate(buildConsultantConsultationRecordRoute(scheduleId));
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

  const updateScheduleStatus = async(scheduleId, status) => {
    await StandardizedApi.put(`${SCHEDULE_API.SCHEDULES}/${scheduleId}`, { status });
  };

  const handleTodaySchedulePrimaryAction = async(schedule, actionKind) => {
    const scheduleId = schedule?.id ?? schedule?.scheduleId;
    if (scheduleId == null || scheduleId === '') {
      return;
    }
    if (actionKind === 'start') {
      setScheduleActionBusyId(scheduleId);
      try {
        await updateScheduleStatus(scheduleId, 'IN_PROGRESS');
        notificationManager.success('상담을 시작했습니다.');
        await fetchDashboardData();
      } catch (err) {
        console.warn('상담 시작 실패:', err);
        notificationManager.error(toDisplayString(err?.message, '상담 시작에 실패했습니다.'));
      } finally {
        setScheduleActionBusyId(null);
      }
      return;
    }

    if (actionKind === 'complete') {
      const hasRecord = scheduleHasConsultationRecord(schedule, incompleteRecords.schedules);
      if (!hasRecord) {
        notificationManager.warning('상담일지를 작성한 뒤 완료할 수 있습니다.');
        navigate(buildConsultantConsultationRecordRoute(scheduleId));
        return;
      }
      setScheduleActionBusyId(scheduleId);
      try {
        await updateScheduleStatus(scheduleId, 'COMPLETED');
        notificationManager.success('상담을 완료했습니다.');
        await fetchDashboardData();
      } catch (err) {
        console.warn('상담 완료 실패:', err);
        const msg = toDisplayString(err?.message, '');
        if (/상담일지|일지/.test(msg)) {
          notificationManager.warning('상담일지를 작성한 뒤 완료할 수 있습니다.');
          navigate(buildConsultantConsultationRecordRoute(scheduleId));
        } else {
          notificationManager.error(msg || '상담 완료에 실패했습니다.');
        }
      } finally {
        setScheduleActionBusyId(null);
      }
    }
  };

  const handleTodayScheduleRowClick = (schedule) => {
    const scheduleId = schedule?.id ?? schedule?.scheduleId;
    if (scheduleId == null) return;
    navigate(buildConsultantConsultationRecordRoute(scheduleId));
  };

  const sessionCounts = dashboardData.sessionBuckets.map((b) => toSafeNumber(b.value, 0));
  const maxChartValue = sessionCounts.length > 0 ? Math.max(...sessionCounts, 1) : 1;

  const isSectionLoading = loading && Boolean(user?.id);
  const kpiUnavailable = Boolean(dashboardError) && !isSectionLoading;
  const listSectionError = kpiUnavailable ? CONSULTANT_DASHBOARD_LIST_ERROR_LABEL : '';
  const formatKpiValue = (display) => (kpiUnavailable ? '—' : display);

  const handlePhase1Retry = () => {
    if (user?.id) {
      fetchPhase1Content(user.id);
    }
  };

  const hasMissingLogs = Array.isArray(missingConsultationLogsForCard)
    && missingConsultationLogsForCard.length > 0;
  const hasIncomplete = toSafeNumber(incompleteRecords.count, 0) > 0;
  const hasUrgent = Array.isArray(urgentClients) && urgentClients.length > 0;
  const showActionStrip = hasIncomplete || hasUrgent || hasMissingLogs;

  const todayCount = toSafeNumber(dashboardData.stats.todaySchedules, 0);
  const todaySummary = todayCount > 0
    ? HOME_COPY.TODAY_SUMMARY(todayCount)
    : HOME_COPY.TODAY_SUMMARY_ZERO;

  const welcomeTitle = (
    <>
      {'환영합니다, '}
      <SafeText tag="span">{toDisplayString(user?.name, '상담사')}</SafeText>
      {' 상담사님'}
    </>
  );

  const dashboardShell = (mainBody) => (
    <div className="consultant-dashboard-v2 mg-v2-clinic-os" data-testid={CONSULTANT_DASHBOARD_PAGE_TEST_ID}>
      <div className="consultant-dashboard-v2__container">
        <ContentArea ariaLabel="상담사 대시보드">
          <ContentHeader
            title={welcomeTitle}
            subtitle={todaySummary}
            titleId={CONSULTANT_DASHBOARD_TITLE_ID}
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
        {dashboardError && (
          <div className="consultant-dashboard-tenant-alert" role="alert">
            {dashboardError}
          </div>
        )}

        {showActionStrip ? (
          <section
            className="consultant-dashboard-v2__action-strip"
            aria-label={HOME_COPY.ACTION_STRIP_TITLE}
            data-testid={CONSULTANT_DASHBOARD_ACTION_STRIP_TEST_ID}
          >
            <h2 className="consultant-dashboard-v2__action-strip-title">
              <SafeText tag="span">{HOME_COPY.ACTION_STRIP_TITLE}</SafeText>
            </h2>
            {hasIncomplete ? (
              <IncompleteRecordsAlert
                count={incompleteRecords.count}
                schedules={incompleteRecords.schedules}
                onAction={handleIncompleteRecordsAction}
              />
            ) : null}
            {hasUrgent ? (
              <UrgentClientsSection
                clients={urgentClients}
                loading={false}
                error={phase1Error}
                onRetry={handlePhase1Retry}
                onViewAllClients={handleViewAllClients}
                onViewClientDetails={handleViewClientDetails}
              />
            ) : null}
            {hasMissingLogs ? (
              <div className="consultant-dashboard-v2__missing-logs-row">
                <ContentCard className="consultant-dashboard-v2__missing-logs-card">
                  <section
                    className="consultant-dashboard-v2__missing-logs-section"
                    aria-label={t('admin:dashboard.consultationStats.missingLogsTitle', {
                      defaultValue: '상담일지 누락'
                    })}
                    data-testid="consultant-dashboard-missing-logs"
                  >
                    <h3 className="consultant-dashboard-v2__missing-logs-title">
                      {t('admin:dashboard.consultationStats.missingLogsTitle', {
                        defaultValue: '상담일지 누락'
                      })}
                    </h3>
                    <MissingConsultationLogsList
                      items={missingConsultationLogsForCard}
                      variant="dashboard"
                      sectionClassName="consultant-dashboard-v2__missing-logs-body"
                      showTitle={false}
                      onDateChipClick={handleMissingLogDateChipClick}
                      dateChipsDisabled={missingLogChipResolving}
                    />
                  </section>
                </ContentCard>
              </div>
            ) : null}
          </section>
        ) : null}

        {nextConsultation ? (
          <NextConsultationCard
            consultation={nextConsultation}
            onWriteRecord={handleWriteRecord}
            onViewDetails={handleViewDetails}
          />
        ) : null}

        <section
          className="consultant-dashboard-v2__kpi-zone"
          aria-label="핵심 지표"
          data-testid={CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID}
        >
          {kpiUnavailable ? (
            <div className="consultant-dashboard-v2__kpi-retry">
              <MGButton
                type="button"
                variant="ghost"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'ghost',
                  size: 'sm',
                  loading: false,
                  className: 'consultant-dashboard-v2__kpi-retry-btn'
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
          <ConsultantSummaryStrip
            loading={isSectionLoading}
            items={[
              {
                id: 'todaySessions',
                label: HOME_COPY.KPI_TODAY_SESSIONS,
                value: formatKpiValue(`${dashboardData.stats.todaySchedules}건`),
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.TODAY_SESSIONS)
              },
              {
                id: 'unreadMessages',
                label: HOME_COPY.KPI_UNREAD_MESSAGES,
                value: formatKpiValue(`${dashboardData.stats.unreadMessages}건`),
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES)
              },
              {
                id: 'newClients',
                label: HOME_COPY.KPI_NEW_CLIENTS,
                value: formatKpiValue(`${dashboardData.stats.newClients}명`),
                onClick: () => navigate(CONSULTANT_DASHBOARD_KPI_ROUTES.NEW_CLIENTS)
              }
            ]}
          />
        </section>

        <TodayScheduleRunList
          schedules={dashboardData.todaySchedules}
          loading={isSectionLoading}
          error={listSectionError}
          onRetry={kpiUnavailable ? fetchDashboardData : undefined}
          onPrimaryAction={handleTodaySchedulePrimaryAction}
          onRowClick={handleTodayScheduleRowClick}
          actionBusyId={scheduleActionBusyId}
        />

        <ConsultantHomeSnapshotRow
          message={dashboardData.snapshotMessage}
          salary={dashboardData.snapshotSalary}
          onPressMessage={() => navigate(CONSULTANT_DASHBOARD_ROUTES.MESSAGES)}
          onPressSalary={() => navigate(CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT)}
        />

        <ContentSection
          title={HOME_COPY.SESSION_CHART_TITLE}
          className="mg-v2-content-section--full consultant-dashboard-v2__weekly-chart consultant-dashboard-v2__stage"
          dataTestId={CONSULTANT_DASHBOARD_SESSION_CHART_TEST_ID}
        >
          {dashboardData.sessionBuckets.length === 0 ? (
            <div className="consultant-dashboard-v2__chart-empty">
              <p className="consultant-dashboard-v2__chart-empty-text">
                <SafeText tag="span">{HOME_COPY.SESSION_CHART_EMPTY}</SafeText>
              </p>
            </div>
          ) : (
            <div className="consultant-dashboard-v2__chart-container">
              {dashboardData.sessionBuckets.map((stat, idx) => {
                const count = toSafeNumber(stat.value, 0);
                const heightPercent = maxChartValue > 0 ? (count / maxChartValue) * 100 : 0;
                return (
                  <div key={`stat-${stat.label}-${idx}`} className="consultant-dashboard-v2__chart-bar-wrapper">
                    <div
                      className="consultant-dashboard-v2__chart-bar"
                      style={{ '--chart-bar-height': `${Math.max(heightPercent, 4)}%` }}
                      title={`${stat.label}: ${count}${HOME_COPY.SESSION_CHART_UNIT}`}
                    />
                    <span className="consultant-dashboard-v2__chart-label">
                      <SafeText tag="span">{stat.label}</SafeText>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ContentSection>

        <QuickActionBar onNavigate={navigate} />
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
