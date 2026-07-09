/**
 * Client Dashboard — 데이터 로드 훅 (StandardizedApi)
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
  EMPTY_CONSULTATION_DATA
} from './constants';
import { parseUnreadCountPayload, scheduleSortKey } from './scheduleUtils';

export function useClientDashboardData(currentUser, sessionLoading, isLoggedIn) {
  const [consultationData, setConsultationData] = useState(EMPTY_CONSULTATION_DATA);
  const [clientStatus, setClientStatus] = useState(null);
  const [sharedClientMappings, setSharedClientMappings] = useState(null);
  const [mappingsLoadFailed, setMappingsLoadFailed] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadClientData = useCallback(async() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setMappingsLoadFailed(false);

      const scheduleRaw = await StandardizedApi.get(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: currentUser.id,
        userRole: USER_ROLES.CLIENT
      });
      const schedules = normalizeScheduleListPayload(scheduleRaw);

      let mappings = [];
      try {
        const mappingRaw = await StandardizedApi.get(API_CLIENT_MAPPINGS(currentUser.id));
        if (isApiGetNullFailure(mappingRaw)) {
          setMappingsLoadFailed(true);
          mappings = [];
          setSharedClientMappings([]);
        } else {
          mappings = normalizeMappingsListPayload(mappingRaw);
          setSharedClientMappings(mappings);
        }
      } catch {
        setMappingsLoadFailed(true);
        mappings = [];
        setSharedClientMappings([]);
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
        totalSessions,
        usedSessions,
        remainingSessions,
        thisMonthScheduleCount
      });
    } catch (error) {
      console.error('내담자 데이터 로드 실패:', error);
      setMappingsLoadFailed(true);
      setSharedClientMappings([]);
      setClientStatus({ mappingStatus: 'NONE', paymentStatus: null });
      setUnreadMessageCount(0);
      setConsultationData(EMPTY_CONSULTATION_DATA);
    } finally {
      setIsLoading(false);
    }
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
    reload: loadClientData
  };
}
