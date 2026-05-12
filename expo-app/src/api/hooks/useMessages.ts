/**
 * 메시지(채팅) 관련 TanStack Query 커스텀 훅
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
import { apiGet, apiPost } from '../client';
import { MESSAGE_API } from '../endpoints';
import { useAuthStore } from '../../stores/useAuthStore';

export interface Conversation {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerProfileImageUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
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

interface ConversationsPage {
  content: Conversation[];
  hasNext: boolean;
  page: number;
  totalCount: number;
}

interface MessagesPage {
  content: Message[];
  hasNext: boolean;
  page: number;
}

interface SendMessageParams {
  conversationId: number;
  content: string;
  receiverId: number;
}

const PAGE_SIZE = 20;

const MESSAGE_QUERY_KEYS = {
  all: ['messages'],
  conversations: () => [...MESSAGE_QUERY_KEYS.all, 'conversations'],
  conversationsList: (userId: number) =>
    [...MESSAGE_QUERY_KEYS.conversations(), userId],
  messages: () => [...MESSAGE_QUERY_KEYS.all, 'detail'],
  messagesList: (conversationId: number) =>
    [...MESSAGE_QUERY_KEYS.messages(), conversationId],
  unreadCount: (userId: number) =>
    [...MESSAGE_QUERY_KEYS.all, 'unread-count', userId],
};

export function useConversations(searchQuery?: string) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: [...MESSAGE_QUERY_KEYS.conversationsList(userId!), searchQuery],
    queryFn: ({ pageParam }) =>
      apiGet<ConversationsPage>(MESSAGE_API.conversations(userId!), {
        page: pageParam,
        size: PAGE_SIZE,
        search: searchQuery || undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useMessages(conversationId: number | undefined) {
  return useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messagesList(conversationId!),
    queryFn: ({ pageParam }) =>
      apiGet<MessagesPage>(MESSAGE_API.messages(conversationId!), {
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content, receiverId }: SendMessageParams) =>
      apiPost<Message>(MESSAGE_API.SEND_MESSAGE, {
        conversationId,
        content,
        receiverId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.messagesList(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });
    },
  });
}

export function useUnreadMessageCount() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const userType = user?.role;

  return useQuery<{ count: number }>({
    queryKey: MESSAGE_QUERY_KEYS.unreadCount(userId!),
    queryFn: () =>
      apiGet<{ count: number }>(MESSAGE_API.unreadCount(userId!, userType!)),
    enabled: !!userId && !!userType,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) =>
      apiPost(MESSAGE_API.markAsRead(messageId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });
    },
  });
}

export { MESSAGE_QUERY_KEYS };
