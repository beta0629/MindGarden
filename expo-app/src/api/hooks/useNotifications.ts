/**
 * 알림(Notification) 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '../client';
import { NOTIFICATION_API, PUSH_API } from '../endpoints';

export type NotificationType =
  | 'SCHEDULE'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'WELLNESS'
  | 'SYSTEM';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  deepLink?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsPage {
  content: AppNotification[];
  hasNext: boolean;
  page: number;
  totalCount: number;
}

export interface NotificationSettings {
  schedule: boolean;
  payment: boolean;
  message: boolean;
  wellness: boolean;
  system: boolean;
}

const PAGE_SIZE = 20;

const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'],
  list: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'],
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unread-count'],
  settings: () => [...NOTIFICATION_QUERY_KEYS.all, 'settings'],
};

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(),
    queryFn: ({ pageParam }) =>
      apiGet<NotificationsPage>(NOTIFICATION_API.GET_NOTIFICATIONS, {
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30,
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(),
    queryFn: () =>
      apiGet<{ count: number }>(NOTIFICATION_API.GET_UNREAD_COUNT),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      apiPost(NOTIFICATION_API.markAsRead(notificationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.list(),
      });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(),
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiPost(`${NOTIFICATION_API.GET_NOTIFICATIONS}/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.list(),
      });
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(),
      });
    },
  });
}

export function useNotificationSettings() {
  return useQuery<NotificationSettings>({
    queryKey: NOTIFICATION_QUERY_KEYS.settings(),
    queryFn: () => apiGet<NotificationSettings>(PUSH_API.GET_SETTINGS),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      apiPut(PUSH_API.UPDATE_SETTINGS, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.settings(),
      });
    },
  });
}

export { NOTIFICATION_QUERY_KEYS };
