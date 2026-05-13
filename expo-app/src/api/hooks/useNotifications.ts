/**
 * 시스템 공지(system-notifications) 및 푸시 설정 훅
 * ApiResponse `{ success, data }` 언래핑
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 목록 필드 `notifications` 정합, read-all 경로 상수화
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '../client';
import { NOTIFICATION_API, PUSH_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useTenantStore } from '../../stores/useTenantStore';
import { toDisplayString, toSafeNumber, stripHtmlToPlainText } from '../../utils/safeDisplay';

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
  list: (tenantId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'list', tenantId],
  unreadCount: (tenantId: string) =>
    [...NOTIFICATION_QUERY_KEYS.all, 'unread-count', tenantId],
  settings: (tenantId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'settings', tenantId],
};

/** 백엔드 notification_type → UI 카테고리 */
function mapNotificationType(raw: unknown): NotificationType {
  const s = String(raw ?? '').toUpperCase();
  if (s.includes('PAY') || s.includes('BILL')) {
    return 'PAYMENT';
  }
  if (s.includes('MESSAGE') || s.includes('CHAT')) {
    return 'MESSAGE';
  }
  if (s.includes('WELLNESS') || s.includes('HEAL')) {
    return 'WELLNESS';
  }
  if (s.includes('SCHEDULE') || s.includes('BOOK')) {
    return 'SCHEDULE';
  }
  return 'SYSTEM';
}

function pickDeepLink(row: Record<string, unknown>): string | undefined {
  const direct =
    toDisplayString(row.deepLink, '') ||
    toDisplayString(row.actionUrl, '') ||
    toDisplayString(row.link, '');
  if (direct) {
    return direct;
  }
  const meta = row.metadata;
  if (meta && typeof meta === 'object' && meta !== null) {
    const m = meta as Record<string, unknown>;
    const fromObj =
      toDisplayString(m.deepLink, '') ||
      toDisplayString(m.actionUrl, '') ||
      toDisplayString(m.href, '');
    if (fromObj) {
      return fromObj;
    }
  }
  if (typeof meta === 'string' && meta.trim() !== '') {
    try {
      const parsed = JSON.parse(meta) as Record<string, unknown>;
      return (
        toDisplayString(parsed.deepLink, '') ||
        toDisplayString(parsed.actionUrl, '') ||
        undefined
      );
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function mapRowToAppNotification(row: Record<string, unknown>): AppNotification {
  const deep = pickDeepLink(row);
  return {
    id: toSafeNumber(row.id, 0),
    type: mapNotificationType(row.notificationType),
    title: stripHtmlToPlainText(toDisplayString(row.title, '알림')),
    content: stripHtmlToPlainText(toDisplayString(row.content, '')),
    isRead: Boolean(row.isRead),
    createdAt: toDisplayString(row.createdAt ?? row.publishedAt, ''),
    deepLink: deep && deep.length > 0 ? deep : undefined,
  };
}

export function useNotifications() {
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';

  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(tenantId),
    queryFn: async ({ pageParam }) => {
      if (!tenantId) {
        return { content: [], hasNext: false, page: 0, totalCount: 0 };
      }
      const raw = await apiGet<unknown>(NOTIFICATION_API.GET_NOTIFICATIONS, {
        page: pageParam,
        size: PAGE_SIZE,
      });
      const inner = unwrapApiResponse<Record<string, unknown>>(raw);
      if (!inner) {
        return { content: [], hasNext: false, page: 0, totalCount: 0 };
      }
      const rows = Array.isArray(inner.notifications)
        ? (inner.notifications as Record<string, unknown>[])
        : [];
      const currentPage = toSafeNumber(inner.currentPage, 0);
      const totalPages = toSafeNumber(inner.totalPages, 0);
      const hasNext = currentPage + 1 < totalPages;
      const content = rows
        .map((r) => mapRowToAppNotification(r))
        .filter((n) => n.id > 0);
      return {
        content,
        hasNext,
        page: currentPage,
        totalCount: toSafeNumber(inner.totalElements, content.length),
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: !!tenantId,
    staleTime: 1000 * 30,
  });
}

export function useUnreadCount() {
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';

  return useQuery<{ count: number }>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(tenantId),
    queryFn: async () => {
      if (!tenantId) {
        return { count: 0 };
      }
      try {
        const raw = await apiGet<unknown>(NOTIFICATION_API.GET_UNREAD_COUNT);
        const inner = unwrapApiResponse<Record<string, unknown>>(raw);
        const bag = inner ?? (raw as Record<string, unknown>);
        const count =
          bag && typeof bag === 'object' && 'unreadCount' in bag
            ? toSafeNumber(bag.unreadCount, 0)
            : 0;
        return { count };
      } catch {
        return { count: 0 };
      }
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    enabled: !!tenantId,
    retry: false,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      apiPost(NOTIFICATION_API.markAsRead(notificationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost(NOTIFICATION_API.MARK_ALL_READ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
}

function normalizeSettingsPayload(raw: unknown): NotificationSettings | null {
  const inner = unwrapApiResponse<Record<string, unknown>>(raw);
  const bag = inner ?? (raw as Record<string, unknown> | null);
  if (!bag || typeof bag !== 'object') {
    return null;
  }
  const keys = ['schedule', 'payment', 'message', 'wellness', 'system'] as const;
  const out: Partial<NotificationSettings> = {};
  for (const k of keys) {
    if (k in bag) {
      out[k] = Boolean(bag[k]);
    }
  }
  if (Object.keys(out).length === 0) {
    return null;
  }
  return {
    schedule: out.schedule ?? true,
    payment: out.payment ?? true,
    message: out.message ?? true,
    wellness: out.wellness ?? true,
    system: out.system ?? true,
  };
}

export function useNotificationSettings() {
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';

  return useQuery<NotificationSettings>({
    queryKey: NOTIFICATION_QUERY_KEYS.settings(tenantId),
    queryFn: async () => {
      if (!tenantId) {
        return {
          schedule: true,
          payment: true,
          message: true,
          wellness: true,
          system: true,
        };
      }
      try {
        const raw = await apiGet<unknown>(PUSH_API.GET_SETTINGS);
        const parsed = normalizeSettingsPayload(raw);
        if (parsed) {
          return parsed;
        }
      } catch {
        /* 서버 미구현 시 로컬 기본값 */
      }
      return {
        schedule: true,
        payment: true,
        message: true,
        wellness: true,
        system: true,
      };
    },
    enabled: !!tenantId,
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
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
    onError: () => {
      const tid = useTenantStore.getState().tenantId?.trim() ?? '';
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
      if (tid) {
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.settings(tid),
        });
      }
    },
  });
}

export { NOTIFICATION_QUERY_KEYS };
