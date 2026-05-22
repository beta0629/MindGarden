/**
 * 상담 메시지(비동기 스레드) TanStack Query 훅
 * 백엔드: GET .../client/{id}, GET .../consultant/{id}, POST .../consultation-messages
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 실 API 페이징·ApiResponse 언래핑·역할별 스레드 키 정합
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { MESSAGE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAuthStore } from '../../stores/useAuthStore';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { toClientConsultantMessagingRole } from '@/utils/adminRole';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import {
  isUnreadMessageForReceiver,
  parseMessageIsRead,
  parseUnreadMessageCountPayload,
} from '@/utils/consultationMessageUnread';
import { resolveClientScheduleUserId } from '@/utils/resolveClientScheduleUserId';

export interface Conversation {
  /** 스레드 식별자 = 상대방 사용자 ID(내담자: 상담사 ID / 상담사: 내담자 ID) */
  id: number;
  partnerId: number;
  partnerName: string;
  partnerProfileImageUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** 수신·미읽음 메시지 id — 미리보기 시 일괄 읽음 처리용 */
  unreadMessageIds: number[];
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderProfileImageUrl?: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isMine: boolean;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

/** 백엔드 ConsultationMessage 목록 행(부분 필드) */
export interface ConsultationMessageRow {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  senderType?: unknown;
  senderId?: unknown;
  receiverId?: unknown;
  clientId?: unknown;
  consultantId?: unknown;
  clientName?: unknown;
  messageType?: unknown;
  status?: unknown;
  isRead?: unknown;
  readAt?: unknown;
  repliedAt?: unknown;
  sentAt?: unknown;
  createdAt?: unknown;
}

interface ConsultationMessagesPage {
  messages: ConsultationMessageRow[];
  page: number;
  hasNext: boolean;
  totalElements: number;
}

interface SendMessageParams {
  partnerId: number;
  content: string;
}

const PAGE_SIZE = 30;
const CLIENT_PARTNER_LABEL = '상담사';
const DEFAULT_PARTNER_NAME = '내담자';

const MESSAGE_QUERY_KEYS = {
  all: ['messages'],
  conversations: () => [...MESSAGE_QUERY_KEYS.all, 'conversations'],
  conversationsList: (role: string, userId: number, search: string, tenantId: string) => [
    ...MESSAGE_QUERY_KEYS.conversations(),
    role,
    userId,
    search,
    tenantId,
  ],
  messages: () => [...MESSAGE_QUERY_KEYS.all, 'detail'],
  messagesList: (role: string, selfId: number, partnerId: number, tenantId: string) => [
    ...MESSAGE_QUERY_KEYS.messages(),
    role,
    selfId,
    partnerId,
    tenantId,
  ],
  unreadCount: (userId: number) => [...MESSAGE_QUERY_KEYS.all, 'unread-count', userId],
};

function roleToSenderType(role: 'client' | 'consultant'): string {
  return role === 'consultant' ? 'CONSULTANT' : 'CLIENT';
}

function normalizeBubbleStatus(rawStatus: unknown, isRead: boolean): Message['status'] {
  const s = String(rawStatus ?? '').toUpperCase();
  if (isRead || s === 'READ' || s === 'REPLIED') {
    return 'READ';
  }
  if (s === 'DELIVERED') {
    return 'DELIVERED';
  }
  if (s === 'FAILED') {
    return 'FAILED';
  }
  return 'SENT';
}

function rowToMessage(row: ConsultationMessageRow, partnerId: number, selfId: number): Message {
  const id = toSafeNumber(row.id, 0);
  const senderId = toSafeNumber(row.senderId, 0);
  const isMine = senderId === selfId && senderId > 0;
  const isRead = parseMessageIsRead(row.isRead);
  const sentRaw = row.sentAt ?? row.createdAt;
  return {
    id,
    conversationId: partnerId,
    senderId,
    senderName: '',
    content: toDisplayString(row.content, ''),
    sentAt: typeof sentRaw === 'string' ? sentRaw : toDisplayString(sentRaw, ''),
    isRead,
    isMine,
    status: normalizeBubbleStatus(row.status, isRead),
  };
}

/** 내담자 목록에서 스레드 키 = 상담사 사용자 ID */
function consultantPartnerId(row: ConsultationMessageRow): number {
  const cid = toSafeNumber(row.consultantId, 0);
  if (cid > 0) {
    return cid;
  }
  const st = String(row.senderType ?? '').toUpperCase();
  if (st === 'CONSULTANT') {
    return toSafeNumber(row.senderId, 0);
  }
  return toSafeNumber(row.receiverId, 0);
}

/**
 * 목록 API에서 받은 메시지 행을 상대방 단위 대화 목록으로 집계한다.
 *
 * @param rows 메시지 행(시간 내림차순 권장)
 * @param role 현재 사용자 역할
 * @param selfId 현재 사용자 ID
 * @param searchQuery 이름·미리보기 필터(소문자 비교)
 */
export function buildConversationsFromRows(
  rows: ConsultationMessageRow[],
  role: 'client' | 'consultant',
  selfId: number,
  searchQuery: string,
): Conversation[] {
  const q = searchQuery.trim().toLowerCase();
  const byPartner = new Map<
    number,
    {
      partnerName: string;
      lastMessage: string;
      lastMessageAt: string;
      unread: number;
      unreadMessageIds: number[];
    }
  >();

  for (const row of rows) {
    const partnerId =
      role === 'consultant' ? toSafeNumber(row.clientId, 0) : consultantPartnerId(row);
    if (partnerId <= 0) {
      continue;
    }

    let partnerName =
      role === 'consultant'
        ? toDisplayString(row.clientName, DEFAULT_PARTNER_NAME)
        : CLIENT_PARTNER_LABEL;

    if (role === 'consultant' && partnerName === DEFAULT_PARTNER_NAME) {
      partnerName = toDisplayString(row.clientName, DEFAULT_PARTNER_NAME);
    }

    const sentRaw = row.sentAt ?? row.createdAt;
    const lastAt = typeof sentRaw === 'string' ? sentRaw : toDisplayString(sentRaw, '');
    const preview = toDisplayString(row.content, toDisplayString(row.title, ''));

    const receiverId = toSafeNumber(row.receiverId, 0);
    const unreadInc = isUnreadMessageForReceiver(row.isRead, receiverId, selfId) ? 1 : 0;
    const messageId = toSafeNumber(row.id, 0);

    const existing = byPartner.get(partnerId);
    if (!existing) {
      byPartner.set(partnerId, {
        partnerName,
        lastMessage: preview,
        lastMessageAt: lastAt,
        unread: unreadInc,
        unreadMessageIds: unreadInc > 0 && messageId > 0 ? [messageId] : [],
      });
    } else {
      existing.unread += unreadInc;
      if (unreadInc > 0 && messageId > 0 && !existing.unreadMessageIds.includes(messageId)) {
        existing.unreadMessageIds.push(messageId);
      }
      const prevTime = new Date(existing.lastMessageAt).getTime();
      const curTime = new Date(lastAt).getTime();
      if (!Number.isNaN(curTime) && (Number.isNaN(prevTime) || curTime >= prevTime)) {
        existing.lastMessageAt = lastAt;
        existing.lastMessage = preview;
        if (role === 'consultant' && partnerName !== DEFAULT_PARTNER_NAME) {
          existing.partnerName = partnerName;
        }
      }
    }
  }

  const list: Conversation[] = [];
  byPartner.forEach((v, partnerId) => {
    if (q !== '') {
      const hay = `${v.partnerName} ${v.lastMessage}`.toLowerCase();
      if (!hay.includes(q)) {
        return;
      }
    }
    list.push({
      id: partnerId,
      partnerId,
      partnerName: v.partnerName,
      lastMessage: v.lastMessage,
      lastMessageAt: v.lastMessageAt,
      unreadCount: v.unread,
      unreadMessageIds: v.unreadMessageIds,
    });
  });

  list.sort((a, b) => {
    const ta = new Date(a.lastMessageAt).getTime();
    const tb = new Date(b.lastMessageAt).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  return list;
}

async function fetchConsultationMessagesPage(
  role: 'client' | 'consultant',
  selfId: number,
  page: number,
): Promise<ConsultationMessagesPage> {
  const endpoint =
    role === 'consultant'
      ? MESSAGE_API.consultantMessages(selfId)
      : MESSAGE_API.clientMessages(selfId);

  const raw = await apiGet<unknown>(endpoint, {
    page,
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  });
  const inner = unwrapApiResponse<Record<string, unknown>>(raw);
  if (!inner) {
    return { messages: [], page: 0, hasNext: false, totalElements: 0 };
  }
  const messages = Array.isArray(inner.messages)
    ? (inner.messages as ConsultationMessageRow[])
    : [];
  const currentPage = toSafeNumber(inner.currentPage, 0);
  const totalPages = toSafeNumber(inner.totalPages, 0);
  const hasNext = currentPage + 1 < totalPages;
  return {
    messages,
    page: currentPage,
    hasNext,
    totalElements: toSafeNumber(inner.totalElements, messages.length),
  };
}

export function useConversations(searchQuery: string) {
  const user = useAuthStore((s) => s.user);
  const { ready, tenantId, userId } = useApiQueryReady();
  const role = user?.role;

  return useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversationsList(role ?? '', userId ?? 0, searchQuery, tenantId),
    queryFn: async ({ pageParam }) => {
      if (!userId || !role || !tenantId) {
        return { messages: [], page: 0, hasNext: false, totalElements: 0 };
      }
      return fetchConsultationMessagesPage(
        toClientConsultantMessagingRole(role),
        userId,
        pageParam as number,
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: ready && !!role,
    staleTime: 1000 * 30,
  });
}

export function useMessages(partnerId: number | undefined) {
  const user = useAuthStore((s) => s.user);
  const { ready, tenantId, userId: selfId } = useApiQueryReady();
  const role = user?.role;

  return useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messagesList(role ?? '', selfId ?? 0, partnerId ?? 0, tenantId),
    queryFn: async ({ pageParam }) => {
      if (!partnerId || !selfId || !role || !tenantId) {
        return { content: [], page: 0, hasNext: false };
      }
      const endpoint =
        role === 'consultant'
          ? MESSAGE_API.consultantMessages(selfId)
          : MESSAGE_API.clientMessages(selfId);
      const params: Record<string, unknown> = {
        page: pageParam,
        size: PAGE_SIZE,
        /** 최신 페이지가 0번 — 스크롤 하단에 최근 메시지가 오도록 화면에서 페이지 역순 병합 */
        sort: 'createdAt,desc',
      };
      if (role === 'consultant') {
        params.clientId = partnerId;
      } else {
        params.consultantId = partnerId;
      }
      const raw = await apiGet<unknown>(endpoint, params);
      const inner = unwrapApiResponse<Record<string, unknown>>(raw);
      if (!inner) {
        return { content: [], page: 0, hasNext: false };
      }
      const rows = Array.isArray(inner.messages)
        ? (inner.messages as ConsultationMessageRow[])
        : [];
      const currentPage = toSafeNumber(inner.currentPage, 0);
      const totalPages = toSafeNumber(inner.totalPages, 0);
      const hasNext = currentPage + 1 < totalPages;
      const content = rows.map((r) => rowToMessage(r, partnerId, selfId)).reverse();
      return { content, page: currentPage, hasNext };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: ready && !!partnerId && !!role,
    staleTime: 1000 * 10,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, content }: SendMessageParams) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }
      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error('내용을 입력해주세요.');
      }
      const title = trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
      const body =
        user.role === 'consultant'
          ? {
              consultantId: user.id,
              clientId: partnerId,
              consultationId: null,
              senderType: 'CONSULTANT',
              title,
              content: trimmed,
              messageType: 'GENERAL',
              isImportant: false,
              isUrgent: false,
            }
          : {
              consultantId: partnerId,
              clientId: user.id,
              consultationId: null,
              senderType: 'CLIENT',
              title,
              content: trimmed,
              messageType: 'GENERAL',
              isImportant: false,
              isUrgent: false,
            };
      const raw = await apiPost<unknown>(MESSAGE_API.SEND_MESSAGE, body);
      unwrapApiResponse<unknown>(raw);
    },
    onSuccess: (_data, variables) => {
      const user = useAuthStore.getState().user;
      const accessToken = useAuthStore.getState().accessToken;
      const tid = resolveTenantIdForApi();
      const userId = resolveClientScheduleUserId(user?.id, accessToken);
      if (!user || !tid || !userId) {
        return;
      }
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.messagesList(user.role, userId, variables.partnerId, tid),
      });
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });
    },
  });
}

export function useUnreadMessageCount() {
  const user = useAuthStore((s) => s.user);
  const { ready, tenantId, userId } = useApiQueryReady();
  const userType = user?.role ? roleToSenderType(toClientConsultantMessagingRole(user.role)) : '';

  return useQuery<{ count: number }>({
    queryKey: [...MESSAGE_QUERY_KEYS.unreadCount(userId ?? 0), tenantId],
    queryFn: async () => {
      try {
        const raw = await apiGet<unknown>(MESSAGE_API.unreadCount(userId!, userType));
        return { count: parseUnreadMessageCountPayload(raw) };
      } catch {
        return { count: 0 };
      }
    },
    enabled: ready && !!userType && !!userId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: false,
  });
}

function invalidateMessageCaches(queryClient: QueryClient): void {
  const user = useAuthStore.getState().user;
  const accessToken = useAuthStore.getState().accessToken;
  const tid = resolveTenantIdForApi();
  const userId = resolveClientScheduleUserId(user?.id, accessToken);
  queryClient.invalidateQueries({
    queryKey: MESSAGE_QUERY_KEYS.conversations(),
    refetchType: 'all',
  });
  queryClient.invalidateQueries({
    queryKey: MESSAGE_QUERY_KEYS.messages(),
    refetchType: 'all',
  });
  if (userId != null && userId > 0) {
    queryClient.invalidateQueries({
      queryKey: [...MESSAGE_QUERY_KEYS.unreadCount(userId), tid],
      refetchType: 'all',
    });
  }
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      try {
        const raw = await apiGet<unknown>(MESSAGE_API.markAsRead(messageId));
        unwrapApiResponse<unknown>(raw);
      } catch (e) {
        if (__DEV__) {
          // eslint-disable-next-line no-console -- 읽음 API 실패 추적
          console.warn('[mark-message-read]', messageId, e);
        }
      }
    },
    onSuccess: () => {
      invalidateMessageCaches(queryClient);
    },
  });
}

/** 미리보기 등에서 스레드 단위로 여러 메시지 읽음 — invalidate는 한 번 */
export function useMarkMessagesAsReadBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: number[]) => {
      const ids = [...new Set(messageIds)].filter((id) => id > 0);
      await Promise.all(
        ids.map(async (id) => {
          try {
            const raw = await apiGet<unknown>(MESSAGE_API.markAsRead(id));
            unwrapApiResponse<unknown>(raw);
          } catch (e) {
            if (__DEV__) {
              // eslint-disable-next-line no-console -- 읽음 배치 실패 추적
              console.warn('[mark-messages-read-batch]', id, e);
            }
          }
        }),
      );
    },
    onSuccess: () => {
      invalidateMessageCaches(queryClient);
    },
  });
}

export { MESSAGE_QUERY_KEYS };
