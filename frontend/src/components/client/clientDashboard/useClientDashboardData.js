/**
 * Client Dashboard — 데이터 로드 훅 (StandardizedApi)
 * 섹션별 loading/error 추적 + reload 재조회 지원 (전역 UnifiedLoading 제거).
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API } from '../../../constants/api';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import { USER_ROLES } from '../../../constants/roles';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload,
  normalizeScheduleListPayload
} from '../../../utils/apiResponseNormalize';
import {
  API_CLIENT_MAPPINGS,
  API_CONSULTATION_MESSAGES_UNREAD_COUNT,
  CLIENT_PAYMENT_LOAD_ERROR,
  CLIENT_SCHEDULE_LOAD_ERROR,
  EMPTY_CONSULTATION_DATA
} from './constants';
import { buildPaymentRows, parseUnreadCountPayload, scheduleSortKey } from './scheduleUtils';

const EMPTY_SECTION_STATE = { schedules: false, mappings: false };
const EMPTY_SECTION_ERRORS = { schedules: '', mappings: '' };

export function useClientDashboardData(currentUser, sessionLoading, isLoggedIn) {
  const [consultationData, setConsultationData] = useState(EMPTY_CONSULTATION_DATA);
  const [clientStatus, setClientStatus] = useState(null);
  const [sharedClientMappings, setSharedClientMappings] = useState(null);
  const [mappingsLoadFailed, setMappingsLoadFailed] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState({ schedules: true, mappings: true });
  const [sectionErrors, setSectionErrors] = useState(EMPTY_SECTION_ERRORS);

  const loadClientData = useCallback(async() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      setSectionLoading(EMPTY_SECTION_STATE);
      return;
    }

    setIsLoading(true);
    setSectionLoading({ schedules: true, mappings: true });
    setSectionErrors(EMPTY_SECTION_ERRORS);
    setMappingsLoadFailed(false);

    // 1) 일정 조회 (섹션 독립 에러 추적)
    let schedules = [];
    try {
      const scheduleRaw = await StandardizedApi.get(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: currentUser.id,
        userRole: USER_ROLES.CLIENT
      });
      schedules = normalizeScheduleListPayload(scheduleRaw);
    } catch (scheduleErr) {
      console.error('내담자 일정 로드 실패:', scheduleErr);
      setSectionErrors((prev) => ({ ...prev, schedules: CLIENT_SCHEDULE_LOAD_ERROR }));
      schedules = [];
    } finally {
      setSectionLoading((prev) => ({ ...prev, schedules: false }));
    }

    // 2) 매핑(회기·결제) 조회 (섹션 독립 에러 추적)
    let mappings = [];
    try {
      const mappingRaw = await StandardizedApi.get(API_CLIENT_MAPPINGS(currentUser.id));
      if (isApiGetNullFailure(mappingRaw)) {
        setMappingsLoadFailed(true);
        setSectionErrors((prev) => ({ ...prev, mappings: CLIENT_PAYMENT_LOAD_ERROR }));
        mappings = [];
        setSharedClientMappings([]);
      } else {
        mappings = normalizeMappingsListPayload(mappingRaw);
        setSharedClientMappings(mappings);
      }
    } catch (mappingErr) {
      console.error('내담자 매핑 로드 실패:', mappingErr);
      setMappingsLoadFailed(true);
      setSectionErrors((prev) => ({ ...prev, mappings: CLIENT_PAYMENT_LOAD_ERROR }));
      mappings = [];
      setSharedClientMappings([]);
    } finally {
      setSectionLoading((prev) => ({ ...prev, mappings: false }));
    }

    const activeMappings = mappings.filter((mapping) => mapping.status === 'ACTIVE');
    const totalSessions = activeMappings.reduce((sum, m) => sum + (m.totalSessions || 0), 0);
    const usedSessions = activeMappings.reduce((sum, m) => sum + (m.usedSessions || 0), 0);
    const remainingSessions = activeMappings.reduce((sum, m) => sum + (m.remainingSessions || 0), 0);

    const hasActive = mappings.some((m) => m.status === 'ACTIVE');
    const hasPending = mappings.some((m) => m.status === 'PENDING');
    const mappingStatus = mappings.length === 0
      ? 'NONE'
      : (hasActive ? 'ACTIVE' : (hasPending ? 'PENDING' : (mappings[0].status || 'NONE')));

    setClientStatus({
      mappingStatus,
      paymentStatus: mappings.some((m) => m.paymentStatus === 'PENDING') ? 'PENDING' : null
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaySchedules = schedules.filter((s) => s.date === todayStr);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    const weeklySchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
    });

    const y = today.getFullYear();
    const m = today.getMonth();
    const thisMonthScheduleCount = schedules.filter((s) => {
      const scheduleDate = new Date(s.date);
      return !Number.isNaN(scheduleDate.getTime())
        && scheduleDate.getFullYear() === y
        && scheduleDate.getMonth() === m;
    }).length;

    const dayStart = new Date(todayStr);
    dayStart.setHours(0, 0, 0, 0);

    const upcomingSchedules = schedules
      .filter((schedule) => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= dayStart && schedule.status === 'CONFIRMED';
      })
      .sort((a, b) => (scheduleSortKey(a) < scheduleSortKey(b) ? -1 : 1))
      .slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS);

    const completedList = schedules.filter((s) => s.status === 'COMPLETED');

    let unreadMsg = 0;
    try {
      const unreadRes = await StandardizedApi.get(API_CONSULTATION_MESSAGES_UNREAD_COUNT, {
        userId: currentUser.id,
        userType: USER_ROLES.CLIENT,
        _t: Date.now()
      });
      unreadMsg = parseUnreadCountPayload(unreadRes);
    } catch {
      unreadMsg = 0;
    }
    setUnreadMessageCount(unreadMsg);

    setConsultationData({
      todaySchedules,
      weeklySchedules,
      upcomingSchedules,
      upcomingConsultations: upcomingSchedules,
      completedConsultations: completedList,
      completedCount: completedList.length,
      recentPayments: buildPaymentRows(mappings),
      totalSessions,
      usedSessions,
      remainingSessions,
      thisMonthScheduleCount
    });

    setIsLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !currentUser?.id) {
      return;
    }
    loadClientData();
  }, [sessionLoading, isLoggedIn, currentUser?.id, loadClientData]);

  return {
    consultationData,
    clientStatus,
    sharedClientMappings,
    mappingsLoadFailed,
    unreadMessageCount,
    isLoading,
    sectionLoading,
    sectionErrors,
    reload: loadClientData
  };
}
