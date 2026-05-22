/**
 * AppState `active` 시 커뮤니티·마음날씨 수신함 refetch (debounce로 중복 폭주 방지)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { COMMUNITY_QUERY_KEYS } from '@/api/hooks/useCommunity';
import { MIND_WEATHER_QUERY_KEYS } from '@/api/hooks/useMindWeather';
import { MESSAGE_QUERY_KEYS } from '@/api/hooks/useMessages';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveClientScheduleUserId } from '@/utils/resolveClientScheduleUserId';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';

const FOREGROUND_REFETCH_DEBOUNCE_MS = 800;

function invalidateMessageUnreadOnForeground(queryClient: QueryClient): void {
  const { user, accessToken } = useAuthStore.getState();
  const userId = resolveClientScheduleUserId(user?.id, accessToken);
  const tid = resolveTenantIdForApi();
  if (userId != null && userId > 0 && tid) {
    void queryClient.invalidateQueries({
      queryKey: [...MESSAGE_QUERY_KEYS.unreadCount(userId), tid],
      refetchType: 'all',
    });
  }
}

export function useAppForegroundRefetch(): void {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRunRef = useRef(0);

  useEffect(() => {
    const scheduleRefetch = () => {
      const { isAuthenticated, accessToken } = useAuthStore.getState();
      if (!isAuthenticated || !accessToken) {
        return;
      }
      const now = Date.now();
      if (now - lastRunRef.current < FOREGROUND_REFETCH_DEBOUNCE_MS) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          lastRunRef.current = Date.now();
          void queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.all });
          void queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
          void invalidateMessageUnreadOnForeground(queryClient);
        }, FOREGROUND_REFETCH_DEBOUNCE_MS);
        return;
      }
      lastRunRef.current = now;
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
      void invalidateMessageUnreadOnForeground(queryClient);
    };

    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        scheduleRefetch();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [queryClient]);
}
