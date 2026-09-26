/**
 * Client Dashboard — 데이터 로드 훅 (StandardizedApi)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import StandardizedApi from '../../../utils/standardizedApi';
import { DASHBOARD_API } from '../../../constants/api';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import { USER_ROLES } from '../../../constants/roles';
import {
  MAPPING_STATUS,
  isAssignedMappingStatus
} from '../../../constants/mapping';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload,
  normalizeScheduleListPayload
} from '../../../utils/apiResponseNormalize';
import { calculateClientSessionTotalsFromMappings } from '../../../utils/clientSessionTotals';
import {
  CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT,
  consumeClientHomeMappingsSoftRefreshFlag
} from '../../../utils/clientHomeSoftRefresh';
import { runResourceLoad, softRefresh } from '../../../utils/softRefresh';
import {
  API_CLIENT_MAPPINGS,
  API_CONSULTATION_MESSAGES_UNREAD_COUNT,
  EMPTY_CONSULTATION_DATA
} from './constants';
import { parseUnreadCountPayload, selectClientUpcomingSchedules } from './scheduleUtils';

export function useClientDashboardData(currentUser, sessionLoading, isLoggedIn) {
  const [consultationData, setConsultationData] = useState(EMPTY_CONSULTATION_DATA);
  const [clientStatus, setClientStatus] = useState(null);
  const [sharedClientMappings, setSharedClientMappings] = useState(null);
  const [mappingsLoadFailed, setMappingsLoadFailed] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleLoadFailed, setScheduleLoadFailed] = useState(false);
  const loadClientDataRef = useRef(null);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 레이아웃 blank 없이 부분 갱신
   */
  const loadClientData = useCallback(async(options = {}) => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    setScheduleLoadFailed(false);
    setMappingsLoadFailed(false);

    try {
      await runResourceLoad(options, setIsLoading, async() => {
        let schedules = [];
        try {
          const scheduleRaw = await StandardizedApi.get(DASHBOARD_API.CLIENT_SCHEDULES, {
            userId: currentUser.id,
            userRole: USER_ROLES.CLIENT
          });
          schedules = normalizeScheduleListPayload(scheduleRaw);
        } catch (scheduleError) {
          console.error('내담자 일정 로드 실패:', scheduleError);
          setScheduleLoadFailed(true);
          schedules = [];
        }

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

        // 홈·회기 상세 SSOT: shop-paid 상태 remainingSessions 합 (ACTIVE + PAYMENT_CONFIRMED 등)
        const sessionTotals = calculateClientSessionTotalsFromMappings(mappings);
        const { totalSessions, usedSessions, remainingSessions } = sessionTotals;

        const hasActive = mappings.some((m) => m.status === MAPPING_STATUS.ACTIVE);
        const hasPendingPayment = mappings.some(
          (m) => m.status === MAPPING_STATUS.PENDING_PAYMENT
        );
        const firstAssigned = mappings.find((m) => isAssignedMappingStatus(m.status));
        const mappingStatus = mappings.length === 0
          ? 'NONE'
          : (hasActive
            ? MAPPING_STATUS.ACTIVE
            : (hasPendingPayment
              ? MAPPING_STATUS.PENDING_PAYMENT
              : (firstAssigned?.status || mappings[0].status || 'NONE')));

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

        const upcomingSchedules = selectClientUpcomingSchedules(schedules, {
          now: today,
          limit: WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS
        });

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
      });
    } catch (error) {
      console.error('내담자 데이터 로드 실패:', error);
      setScheduleLoadFailed(true);
      setMappingsLoadFailed(true);
      setSharedClientMappings([]);
      setClientStatus({ mappingStatus: 'NONE', paymentStatus: null });
      setUnreadMessageCount(0);
      setConsultationData(EMPTY_CONSULTATION_DATA);
    }
  }, [currentUser?.id]);

  loadClientDataRef.current = loadClientData;

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !currentUser?.id) {
      return;
    }
    loadClientData();
  }, [sessionLoading, isLoggedIn, currentUser?.id, loadClientData]);

  // 결제 verify / fulfill-retry SUCCESS · focus/visibility → soft-refresh (hard reload 금지)
  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !currentUser?.id) {
      return undefined;
    }

    const softReload = () => {
      consumeClientHomeMappingsSoftRefreshFlag();
      if (typeof loadClientDataRef.current === 'function') {
        softRefresh(loadClientDataRef.current);
      }
    };

    if (consumeClientHomeMappingsSoftRefreshFlag()) {
      if (typeof loadClientDataRef.current === 'function') {
        softRefresh(loadClientDataRef.current);
      }
    }

    const onSoftRefreshEvent = () => {
      softReload();
    };
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (typeof loadClientDataRef.current === 'function') {
          softRefresh(loadClientDataRef.current);
        }
      }
    };
    const onFocus = () => {
      if (typeof loadClientDataRef.current === 'function') {
        softRefresh(loadClientDataRef.current);
      }
    };

    window.addEventListener(CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT, onSoftRefreshEvent);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT, onSoftRefreshEvent);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [sessionLoading, isLoggedIn, currentUser?.id]);

  const sectionLoading = isLoading || sessionLoading;
  const sectionError = scheduleLoadFailed;

  return {
    consultationData,
    clientStatus,
    sharedClientMappings,
    mappingsLoadFailed,
    unreadMessageCount,
    isLoading: sectionLoading,
    scheduleLoadFailed,
    sectionError,
    reload: () => softRefresh(loadClientData)
  };
}
