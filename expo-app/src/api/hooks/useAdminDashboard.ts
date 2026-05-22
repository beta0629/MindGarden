/**
 * 어드민·스태프 홈 대시보드 지표
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo } from 'react';
import { useUnreadCount } from './useNotifications';
import { useAdminTodaySchedules } from './useAdminSchedules';
import type { Schedule } from './useSchedules';
import { useTenantStore } from '@/stores/useTenantStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { sliceTodaySchedulePreview } from '@/utils/adminHomeKpi';
import { toDisplayString } from '@/utils/safeDisplay';

export interface AdminMobileDashboardSnapshot {
  tenantName: string;
  userDisplayName: string;
  unreadNotificationCount: number;
  todayScheduleCount: number;
  todaySchedules: Schedule[];
  notificationsLoading: boolean;
  schedulesLoading: boolean;
  schedulesEnabled: boolean;
  refetchAll: () => Promise<unknown[]>;
}

export function useAdminMobileDashboard(): AdminMobileDashboardSnapshot {
  const tenantName = useTenantStore((s) => s.tenantName);
  const user = useAuthStore((s) => s.user);

  const unreadQuery = useUnreadCount();
  const schedulesQuery = useAdminTodaySchedules();

  const refetchAll = useCallback(() => {
    return Promise.all([unreadQuery.refetch(), schedulesQuery.refetch()]);
  }, [unreadQuery, schedulesQuery]);

  return useMemo(() => {
    const todaySchedulesRaw = schedulesQuery.data ?? [];

    return {
      tenantName: toDisplayString(tenantName, '테넌트'),
      userDisplayName: toDisplayString(user?.name ?? user?.nickname, '관리자'),
      unreadNotificationCount: unreadQuery.data?.count ?? 0,
      todayScheduleCount: todaySchedulesRaw.length,
      todaySchedules: sliceTodaySchedulePreview(todaySchedulesRaw),
      notificationsLoading: unreadQuery.isLoading,
      schedulesLoading: schedulesQuery.isLoading,
      schedulesEnabled: schedulesQuery.isFetched || schedulesQuery.isFetching,
      refetchAll,
    };
  }, [
    tenantName,
    user?.name,
    user?.nickname,
    unreadQuery.data?.count,
    unreadQuery.isLoading,
    schedulesQuery.data,
    schedulesQuery.isLoading,
    schedulesQuery.isFetched,
    refetchAll,
  ]);
}
