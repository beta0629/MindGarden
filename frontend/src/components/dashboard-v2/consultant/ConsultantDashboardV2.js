import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API, SCHEDULE_API } from '../../../constants/api';
import { fetchConsultantSessionStatistics } from '../../../api/consultantSessionStatisticsClient';
import ConsultantCoverChapterHome from './ConsultantCoverChapterHome';
import ConsultationLogModal from '../../consultant/ConsultationLogModal';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import useCumulativeMissingConsultationLogs from '../../../hooks/useCumulativeMissingConsultationLogs';
import notificationManager from '../../../utils/notification';
import { runResourceLoad, softRefresh } from '../../../utils/softRefresh';
import {
  lookupMissingLogIdsForDate,
  resolveMissingLogSchedule
} from '../../../utils/missingConsultationLogNavigation';
import { resolveSessionNumberFromSchedule } from '../../../utils/consultationRecordSessionNumber';
import {
  CONSULTANT_DASHBOARD_TITLE_ID,
  CONSULTANT_DASHBOARD_PAGE_TEST_ID,
  CONSULTANT_DASHBOARD_CREATE_RECORD_NONE,
  CONSULTANT_HOME_SCHEDULE_LOOKBACK_DAYS,
  CONSULTANT_HOME_UPCOMING_LOOKAHEAD_DAYS,
  CONSULTANT_HOME_UPCOMING_LIMIT,
  CONSULTANT_HOME_WEEKLY_SESSION_RANGE_DAYS,
  CONSULTANT_DASHBOARD_TENANT_ERROR_MESSAGE,
  CONSULTANT_DASHBOARD_UNREAD_COUNT_API
} from '../../../constants/consultantDashboardConstants';
import {
  CONSULTANT_DASHBOARD_ROUTES,
  buildConsultantConsultationRecordRoute
} from '../../../constants/consultantDashboardRoutes';
import '../../../styles/unified-design-tokens.css';
import './ConsultantDashboard.css';
import { USER_ROLES } from '../../../constants/roles';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';
import { COVER_CHAPTER_BRAND_FALLBACK } from './consultantCoverChapterConstants';

const TENANT_ERROR_MESSAGE = CONSULTANT_DASHBOARD_TENANT_ERROR_MESSAGE;
const WEEKLY_SESSION_RANGE_DAYS = CONSULTANT_HOME_WEEKLY_SESSION_RANGE_DAYS;

/**
 * 센터/브랜드 표시명 (세션 user 필드만 — i18n 경로 회피)
 *
 * @param {object|null|undefined} sessionUser
 * @returns {string}
 */
const resolveCoverBrandName = (sessionUser) => {
  if (!sessionUser) {
    return COVER_CHAPTER_BRAND_FALLBACK;
  }
  const fromTenant = toDisplayString(sessionUser.tenant?.name, '').trim();
  if (fromTenant) return fromTenant;
  const fromName = toDisplayString(sessionUser.tenantName, '').trim();
  if (fromName) return fromName;
  const fromCompany = toDisplayString(sessionUser.companyName, '').trim();
  if (fromCompany) return fromCompany;
  const fromBranch = toDisplayString(sessionUser.branchName, '').trim();
  if (fromBranch) return fromBranch;
  return COVER_CHAPTER_BRAND_FALLBACK;
};

/**
 * @param {Date} date
 * @returns {string}
 */
const formatYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * @param {object|null|undefined} consultation
 * @returns {boolean}
 */
const isConsultationJournalMissing = (consultation) => {
  if (!consultation || typeof consultation !== 'object') {
    return false;
  }
  if (consultation.hasConsultationRecord === true
      || consultation.consultationRecordExists === true) {
    return false;
  }
  if (consultation.consultationRecordId != null && consultation.consultationRecordId !== '') {
    return false;
  }
  if (consultation.hasConsultationRecord === false
      || consultation.hasRecord === false
      || consultation.consultationRecordExists === false) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(consultation, 'consultationRecordId')
      && (consultation.consultationRecordId == null || consultation.consultationRecordId === '')) {
    return true;
  }
  return true;
};

/**
 * @param {Array<object>|null|undefined} items
 * @returns {{ consultantId?: *, date: string, scheduleId?: *, clientId?: * }|null}
 */
const pickLatestMissingLogTarget = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  let best = null;
  let bestDate = '';
  items.forEach((item) => {
    if (item == null || typeof item !== 'object') {
      return;
    }
    const dates = Array.isArray(item.missingDates) ? item.missingDates : [];
    dates.forEach((rawDate) => {
      const date = String(rawDate || '').trim();
      if (!date) {
        return;
      }
      if (!bestDate || date > bestDate) {
        bestDate = date;
        const ids = lookupMissingLogIdsForDate(item, date);
        const scheduleId = ids.scheduleId
          ?? item.scheduleId
          ?? item.schedules?.[0]?.id
          ?? null;
        const clientId = ids.clientId
          ?? item.clientId
          ?? item.schedules?.[0]?.clientId
          ?? null;
        best = {
          consultantId: item.consultantId,
          date,
          scheduleId: scheduleId != null && scheduleId !== '' ? scheduleId : undefined,
          clientId: clientId != null && clientId !== '' ? clientId : undefined
        };
      }
    });
  });
  return best;
};

/**
 * 상담사 홈 — Clinic-OS Cover+Chapter (`/consultant/dashboard`)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */
const ConsultantDashboardV2 = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [, setSecondaryLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      todaySchedules: 0,
      totalToday: 0,
      completedToday: 0,
      inProgressToday: 0,
      newClients: 0,
      unreadMessages: 0,
      weeklyCompleted: 0
    },
    todaySchedules: [],
    upcomingSchedules: [],
    recentNotifications: [],
    weeklyStats: []
  });

  const [incompleteRecords, setIncompleteRecords] = useState({ count: 0, schedules: [] });
  const [nextConsultation, setNextConsultation] = useState(null);
  const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [missingLogChipResolving, setMissingLogChipResolving] = useState(false);

  const inFlightUserIdRef = useRef(null);
  const fetchRequestIdRef = useRef(0);

  const { items: cumulativeMissingLogItems } = useCumulativeMissingConsultationLogs();
  const scopedCumulativeMissingLogItems = useMemo(() => {
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

  const brandName = useMemo(() => resolveCoverBrandName(user), [user]);

  const isTenantApiError = (err) => (
    (err?.status === 400 || err?.response?.status === 400)
    && /테넌트/.test(err?.response?.data?.message || err?.message || '')
  );

  /**
   * @param {*} scheduleResponse
   * @returns {Array}
   */
  const extractScheduleList = (scheduleResponse) => {
    if (!scheduleResponse) {
      return [];
    }
    if (Array.isArray(scheduleResponse)) {
      return scheduleResponse;
    }
    if (Array.isArray(scheduleResponse.schedules)) {
      return scheduleResponse.schedules;
    }
    if (Array.isArray(scheduleResponse.data)) {
      return scheduleResponse.data;
    }
    return [];
  };

  /**
   * @param {Array} rawSchedules
   * @param {Date} todayMidnight
   * @param {Date} lookbackMidnight
   * @returns {{ schedules: Array, todayOnlyCount: number }}
   */
  const normalizeHomeSchedules = (rawSchedules, todayMidnight, lookbackMidnight) => {
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
        const timeStr = formatTimeStr(schedule.startTime);
        const endTimeStr = formatTimeStr(schedule.endTime);
        fullStartTime = `${dateStr}T${timeStr}`;
        fullEndTime = `${dateStr}T${endTimeStr}`;
      } else if (Array.isArray(schedule.startTime)) {
        const todayStr = todayMidnight.toISOString().split('T')[0];
        fullStartTime = `${todayStr}T${formatTimeStr(schedule.startTime)}`;
      }

      return {
        ...schedule,
        startTime: fullStartTime,
        endTime: fullEndTime
      };
    }).filter((schedule) => {
      if (!schedule.startTime) return false;
      const scheduleDate = new Date(schedule.startTime);
      if (Number.isNaN(scheduleDate.getTime())) return false;
      scheduleDate.setHours(0, 0, 0, 0);
      const t = scheduleDate.getTime();
      return t >= lookbackMidnight.getTime() && t <= todayMidnight.getTime();
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const todayOnlyCount = schedules.filter((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === todayMidnight.getTime();
    }).length;

    return { schedules, todayOnlyCount };
  };

  const fetchPhase1Content = useCallback(async(consultantId) => {
    if (!consultantId) return;

    try {
      const [incompleteRes, preparationRes] = await Promise.allSettled([
        StandardizedApi.get(DASHBOARD_API.CONSULTANT_INCOMPLETE_RECORDS(consultantId)),
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
      } else {
        setNextConsultation(null);
      }
    } catch (error) {
      console.warn('Phase 1 컨텐츠 로드 실패:', error);
    }
  }, []);

  /**
   * @param {{ silent?: boolean }} [options]
   */
  const fetchDashboardData = useCallback(async(options = {}) => {
    const silent = options?.silent === true;
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const requestId = ++fetchRequestIdRef.current;

    if (typeof window !== 'undefined' && window.sessionManager?.checkSession) {
      const lastCheck = window.sessionManager.getLastCheckTime?.() || 0;
      if (!lastCheck || Date.now() - lastCheck > 30000) {
        await window.sessionManager.checkSession(true);
      }
    }
    const sessionManager = typeof window !== 'undefined' ? window.sessionManager : null;
    const currentUser = sessionManager?.getUser?.() ?? user;
    const tenantId = currentUser?.tenantId ?? sessionManager?.getSessionInfo?.()?.tenantId ?? user?.tenantId ?? null;

    if (!tenantId) {
      console.warn('⚠️ [상담사 대시보드] tenantId 없음 - 스케줄/통계 API 호출 생략. user.tenantId=', currentUser?.tenantId);
      setDashboardError(TENANT_ERROR_MESSAGE);
      if (!silent) {
        setLoading(false);
        setSecondaryLoading(false);
      }
      setDashboardData((prev) => ({
        ...prev,
        stats: {
          todaySchedules: 0,
          totalToday: 0,
          completedToday: 0,
          inProgressToday: 0,
          newClients: 0,
          unreadMessages: 0
        },
        todaySchedules: []
      }));
      return;
    }

    setDashboardError('');

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const lookbackMidnight = new Date(todayMidnight);
    lookbackMidnight.setDate(lookbackMidnight.getDate() - CONSULTANT_HOME_SCHEDULE_LOOKBACK_DAYS);
    const startDateYmd = formatYmd(lookbackMidnight);
    const endDateYmd = formatYmd(todayMidnight);

    try {
      await runResourceLoad(options, setLoading, async() => {
        if (!silent) {
          setSecondaryLoading(true);
        }

        const [statsSettled, scheduleSettled] = await Promise.allSettled([
          StandardizedApi.get(DASHBOARD_API.CONSULTANT_STATS, {
            userRole: USER_ROLES.CONSULTANT
          }),
          StandardizedApi.get(SCHEDULE_API.SCHEDULES_BY_DATE_RANGE, {
            userId: currentUser.id ?? userId,
            userRole: USER_ROLES.CONSULTANT,
            startDate: startDateYmd,
            endDate: endDateYmd
          })
        ]);

        if (requestId !== fetchRequestIdRef.current) {
          return;
        }

        let statsResponse = null;
        if (statsSettled.status === 'fulfilled') {
          statsResponse = statsSettled.value;
        } else {
          const statsErr = statsSettled.reason;
          if (isTenantApiError(statsErr)) setDashboardError(TENANT_ERROR_MESSAGE);
          console.warn('상담사 통계 API 실패, 기본값 사용:', statsErr?.message || statsErr);
        }

        let scheduleResponse = { schedules: [] };
        if (scheduleSettled.status === 'fulfilled') {
          scheduleResponse = scheduleSettled.value;
        } else {
          const scheduleErr = scheduleSettled.reason;
          if (isTenantApiError(scheduleErr)) setDashboardError(TENANT_ERROR_MESSAGE);
          console.warn('상담사 스케줄 API 실패, 빈 목록 사용:', scheduleErr?.message || scheduleErr);
        }

        const rawSchedules = extractScheduleList(scheduleResponse);
        const { schedules, todayOnlyCount } = normalizeHomeSchedules(
          rawSchedules,
          todayMidnight,
          lookbackMidnight
        );

        const stats = statsResponse && typeof statsResponse === 'object' ? statsResponse : {};
        const todaySchedulesFromStats = stats.totalToday ?? stats.todaySchedules;
        const unreadFromStats = stats.unreadMessages ?? 0;

        setDashboardData((prev) => ({
          ...prev,
          stats: {
            todaySchedules: todayOnlyCount ?? todaySchedulesFromStats ?? 0,
            totalToday: toSafeNumber(stats.totalToday ?? todayOnlyCount, 0),
            completedToday: toSafeNumber(stats.completedToday, 0),
            inProgressToday: toSafeNumber(stats.inProgressToday, 0),
            newClients: stats.newClients ?? 0,
            unreadMessages: unreadFromStats,
            weeklyCompleted: prev.stats?.weeklyCompleted ?? 0
          },
          todaySchedules: schedules
        }));

        const loadSecondary = async() => {
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          const start = new Date(end);
          start.setDate(start.getDate() - WEEKLY_SESSION_RANGE_DAYS);
          start.setHours(0, 0, 0, 0);

          const upcomingEnd = new Date(todayMidnight);
          upcomingEnd.setDate(upcomingEnd.getDate() + CONSULTANT_HOME_UPCOMING_LOOKAHEAD_DAYS);
          const resolvedUserId = currentUser.id ?? userId;

          const [
            sessionSettled,
            unreadSettled,
            notiSettled,
            upcomingSettled
          ] = await Promise.allSettled([
            fetchConsultantSessionStatistics({
              startDate: formatYmd(start),
              endDate: formatYmd(end),
              granularity: 'DAY'
            }),
            StandardizedApi.get(CONSULTANT_DASHBOARD_UNREAD_COUNT_API, {
              userId: resolvedUserId,
              userType: USER_ROLES.CONSULTANT
            }),
            StandardizedApi.get(API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE),
            StandardizedApi.get(DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES, {
              consultantId: resolvedUserId,
              startDate: endDateYmd,
              endDate: formatYmd(upcomingEnd),
              limit: CONSULTANT_HOME_UPCOMING_LIMIT
            })
          ]);

          if (requestId !== fetchRequestIdRef.current) {
            return;
          }

          let weeklyStatsData = [];
          let weeklyCompletedTotal = 0;
          if (sessionSettled.status === 'fulfilled') {
            const sessionStats = sessionSettled.value;
            const buckets = Array.isArray(sessionStats?.buckets) ? sessionStats.buckets : [];
            weeklyStatsData = buckets.map((b) => ({
              label: b.label != null && String(b.label).trim() !== '' ? String(b.label).trim() : '—',
              count: toSafeNumber(b.value, 0)
            }));
            weeklyCompletedTotal = toSafeNumber(
              sessionStats?.totalCompleted,
              weeklyStatsData.reduce((acc, s) => acc + toSafeNumber(s.count, 0), 0)
            );
          } else {
            console.warn('주간 완료 회기 추이 조회 실패:', sessionSettled.reason?.message || sessionSettled.reason);
          }

          let unreadMessages = unreadFromStats;
          if (unreadSettled.status === 'fulfilled') {
            const unreadRes = unreadSettled.value;
            if (unreadRes != null && typeof unreadRes.unreadCount === 'number') {
              unreadMessages = unreadRes.unreadCount;
            }
          } else {
            console.warn(
              '안읽은 메시지 수(unread-count) 조회 실패, 통계 응답값 유지:',
              unreadSettled.reason?.message || unreadSettled.reason
            );
          }

          let activeNotifications = [];
          if (notiSettled.status === 'fulfilled') {
            const notiRes = notiSettled.value;
            if (notiRes && Array.isArray(notiRes)) {
              activeNotifications = notiRes.slice(0, 3).map((n) => ({
                id: n.id,
                text: n.title,
                body: n.content ?? n.message ?? n.body ?? '',
                time: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '최근',
                isRead: n.isRead
              }));
            }
          } else {
            console.warn('알림 API 호출 실패:', notiSettled.reason);
          }

          let upcomingSchedules = extractScheduleList(
            upcomingSettled.status === 'fulfilled' ? upcomingSettled.value : { schedules: [] }
          );
          if (upcomingSettled.status === 'rejected') {
            console.warn(
              '다가오는 상담 API 실패, 빈 목록 사용:',
              upcomingSettled.reason?.message || upcomingSettled.reason
            );
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

          setDashboardData((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              unreadMessages,
              weeklyCompleted: weeklyCompletedTotal
            },
            upcomingSchedules,
            recentNotifications: activeNotifications,
            weeklyStats: weeklyStatsData
          }));

          await fetchPhase1Content(resolvedUserId);
        };

        await loadSecondary();
      });
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      if (isTenantApiError(error)) setDashboardError(TENANT_ERROR_MESSAGE);
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
      if (requestId === fetchRequestIdRef.current) {
        setSecondaryLoading(false);
      }
    }
  }, [user?.id, user?.tenantId, fetchPhase1Content]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return undefined;
    }

    if (inFlightUserIdRef.current === userId) {
      return undefined;
    }

    inFlightUserIdRef.current = userId;
    fetchDashboardData().finally(() => {
      if (inFlightUserIdRef.current === userId) {
        inFlightUserIdRef.current = null;
      }
    });

    return undefined;
  }, [user?.id, user?.tenantId, fetchDashboardData]);

  useEffect(() => {
    const handler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        softRefresh(fetchDashboardData);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchDashboardData]);

  const handleScheduleClick = useCallback((scheduleId) => {
    if (!scheduleId) return;
    navigate(buildConsultantConsultationRecordRoute(scheduleId));
  }, [navigate]);

  const handleOpenSchedule = useCallback(() => {
    navigate(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE);
  }, [navigate]);

  const handleOpenConsultation = useCallback(() => {
    const scheduleId = nextConsultation?.scheduleId ?? nextConsultation?.id;
    if (scheduleId != null && scheduleId !== '') {
      navigate(buildConsultantConsultationRecordRoute(scheduleId));
      return;
    }
    handleOpenSchedule();
  }, [nextConsultation, navigate, handleOpenSchedule]);

  const handleScheduleRowClick = useCallback((row) => {
    if (row?.scheduleId != null && row.scheduleId !== '') {
      handleScheduleClick(row.scheduleId);
    }
  }, [handleScheduleClick]);

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

  const openConsultationLogForIncomplete = (firstSchedule) => {
    const sid = firstSchedule.scheduleId ?? firstSchedule.id;
    if (sid == null || sid === '') {
      return false;
    }
    const sessionDateStr = normalizeIncompleteSessionDate(firstSchedule);
    const rawClientId = firstSchedule.clientId;
    const clientIdParsed = rawClientId != null && rawClientId !== ''
      ? (typeof rawClientId === 'number' ? rawClientId : parseInt(String(rawClientId), 10))
      : null;
    const sessionNumber = resolveSessionNumberFromSchedule(firstSchedule);
    setSelectedSchedule({
      ...firstSchedule,
      id: String(sid).startsWith('schedule-') ? String(sid) : `schedule-${sid}`,
      consultantId: firstSchedule.consultantId ?? user?.id,
      clientId: Number.isFinite(clientIdParsed) ? clientIdParsed : undefined,
      clientName: firstSchedule.clientName,
      sessionDate: sessionDateStr || firstSchedule.sessionDate || undefined,
      sessionSequence: firstSchedule.sessionSequence ?? sessionNumber ?? undefined,
      sessionNumber
    });
    setShowConsultationLogModal(true);
    return true;
  };

  const handleMissingLogDateChipClick = useCallback(async({
    consultantId,
    date,
    scheduleId,
    clientId
  }) => {
    if (missingLogChipResolving) {
      return false;
    }
    const scopedConsultantId = user?.id != null ? user.id : consultantId;

    setMissingLogChipResolving(true);
    try {
      const resolved = await resolveMissingLogSchedule({
        consultantId: scopedConsultantId,
        date,
        scheduleId,
        clientId,
        userId: user?.id,
        userRole: user?.role
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
        return true;
      }
      if (scheduleId != null && scheduleId !== '') {
        navigate(buildConsultantConsultationRecordRoute(scheduleId));
        return false;
      }
      notificationManager.warning(
        t('admin:dashboard.consultationStats.missingLogScheduleNotFoundStayHome', {
          defaultValue: '해당 날짜의 일정을 찾지 못했습니다.'
        })
      );
      return false;
    } catch (err) {
      console.warn('상담일지 누락 → 스케줄 조회 실패:', err);
      if (scheduleId != null && scheduleId !== '') {
        navigate(buildConsultantConsultationRecordRoute(scheduleId));
      } else {
        notificationManager.error(
          t('admin:dashboard.consultationStats.missingLogOpenFailed', {
            defaultValue: '상담일지 작성 화면을 열지 못했습니다.'
          })
        );
      }
      return false;
    } finally {
      setMissingLogChipResolving(false);
    }
  }, [missingLogChipResolving, navigate, t, user?.id, user?.role]);

  const handleCreateRecordAction = useCallback(async() => {
    if (incompleteRecords.schedules.length > 0) {
      const opened = openConsultationLogForIncomplete(incompleteRecords.schedules[0]);
      if (opened) {
        return;
      }
    }

    const missingTarget = pickLatestMissingLogTarget(scopedCumulativeMissingLogItems);
    if (missingTarget?.date) {
      await handleMissingLogDateChipClick(missingTarget);
      return;
    }

    const nc = nextConsultation;
    const nextScheduleId = nc?.scheduleId ?? nc?.id;
    if (nextScheduleId != null && nextScheduleId !== '' && isConsultationJournalMissing(nc)) {
      const opened = openConsultationLogForIncomplete({
        scheduleId: nextScheduleId,
        clientId: nc.clientId,
        clientName: nc.clientName,
        sessionDate: nc.sessionDate,
        sessionNumber: nc.sessionNumber,
        consultationDate: nc.sessionDate
      });
      if (opened) {
        return;
      }
    }

    notificationManager.info(CONSULTANT_DASHBOARD_CREATE_RECORD_NONE);
  }, [
    incompleteRecords.schedules,
    scopedCumulativeMissingLogItems,
    nextConsultation,
    handleMissingLogDateChipClick
  ]);

  const handleOpenGuide = useCallback(() => {
    if (toSafeNumber(incompleteRecords.count, 0) > 0) {
      handleCreateRecordAction();
      return;
    }
    navigate(CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS);
  }, [incompleteRecords.count, handleCreateRecordAction, navigate]);

  const handleConsultationLogSave = () => {
    setShowConsultationLogModal(false);
    setSelectedSchedule(null);
    softRefresh(fetchDashboardData);
  };

  return (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      <div
        className="consultant-dashboard-v2 mg-v2-clinic-os consultant-dashboard-v2--cover-chapter"
        data-testid={CONSULTANT_DASHBOARD_PAGE_TEST_ID}
        data-loading={loading ? 'true' : 'false'}
      >
        <ConsultantCoverChapterHome
          user={user}
          brandName={brandName}
          nextConsultation={nextConsultation}
          todaySchedules={dashboardData.todaySchedules}
          upcomingSchedules={dashboardData.upcomingSchedules}
          stats={dashboardData.stats}
          notifications={dashboardData.recentNotifications}
          incompleteCount={incompleteRecords.count}
          dashboardError={dashboardError}
          titleId={CONSULTANT_DASHBOARD_TITLE_ID}
          onOpenConsultation={handleOpenConsultation}
          onOpenSchedule={handleOpenSchedule}
          onScheduleRowClick={handleScheduleRowClick}
          onOpenGuide={handleOpenGuide}
        />
      </div>

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
    name: PropTypes.string,
    tenantId: PropTypes.string,
    tenantName: PropTypes.string,
    role: PropTypes.string,
    tenant: PropTypes.shape({ name: PropTypes.string })
  })
};

export default ConsultantDashboardV2;
