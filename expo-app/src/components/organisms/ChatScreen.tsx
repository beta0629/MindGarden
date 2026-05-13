/**
 * ChatScreen — 채팅 화면 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용. 스레드 키 = 상대방 사용자 ID(partnerId)
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 실 API 스레드·읽음 시도·날짜 구분선·스크롤 하단 정합
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import {
  Check,
  CheckCheck,
  RefreshCw,
  Send,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  useMessages,
  useSendMessage,
  useMarkMessageAsRead,
  type Message,
} from '@/api/hooks/useMessages';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  formatMessageTime,
  formatDateSeparator,
  isSameDay,
} from '@/utils/dateFormat';
import { toDisplayString } from '@/utils/safeDisplay';

interface ChatScreenProps {
  partnerId: number;
}

const QUICK_REPLIES = [
  '네, 알겠습니다',
  '확인했습니다',
  '감사합니다',
  '잠시만요',
];

export function ChatScreen({ partnerId }: ChatScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((s) => s.user?.role);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlashListRef<Message>>(null);
  const markedIdsRef = useRef<Set<number>>(new Set());

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(Number.isFinite(partnerId) ? partnerId : undefined);

  const sendMessageMutation = useSendMessage();
  const { mutate: markReadMutate } = useMarkMessageAsRead();

  /** API 페이지는 desc(최신→과거) 순 — 화면은 시간순(과거→최신)으로 병합 */
  const messages = useMemo(
    () =>
      (data?.pages ?? [])
        .slice()
        .reverse()
        .flatMap((page) => page.content),
    [data?.pages],
  );

  /** Spring `ConsultationMessageController` 의 읽음 API는 MESSAGE_MANAGE 권한 전제 — 내담자는 403 방지를 위해 생략 */
  useEffect(() => {
    if (!messages.length || role !== 'consultant') {
      return;
    }
    messages.forEach((m) => {
      if (!m.isMine && !m.isRead && !markedIdsRef.current.has(m.id)) {
        markedIdsRef.current.add(m.id);
        markReadMutate(m.id);
      }
    });
  }, [messages, markReadMutate, role]);

  useEffect(() => {
    if (isLoading || messages.length === 0) {
      return;
    }
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [isLoading, messages.length, partnerId]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    sendMessageMutation.mutate({
      partnerId,
      content: trimmed,
    });
    setInputText('');
    setShowQuickReplies(false);
  }, [inputText, partnerId, sendMessageMutation]);

  const handleQuickReply = useCallback(
    (text: string) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      sendMessageMutation.mutate({
        partnerId,
        content: text,
      });
      setShowQuickReplies(false);
    },
    [partnerId, sendMessageMutation],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      sendMessageMutation.mutate({
        partnerId,
        content: message.content,
      });
    },
    [partnerId, sendMessageMutation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const olderMessage = messages[index - 1];
      const showDateSeparator =
        !olderMessage || !isSameDay(item.sentAt, olderMessage.sentAt);

      return (
        <>
          {showDateSeparator ? (
            <DateSeparator date={item.sentAt} />
          ) : null}
          <MessageBubble
            message={item}
            onRetry={handleRetry}
          />
        </>
      );
    },
    [messages, handleRetry],
  );

  if (!Number.isFinite(partnerId) || partnerId <= 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            padding: 16,
          }}
        >
          대화 상대 정보가 없습니다.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <ChatSkeleton />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingIndicator /> : null
        }
      />

      {sendMessageMutation.isError ? (
        <Text
          style={{
            color: theme.colors.error,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            paddingHorizontal: 16,
            paddingVertical: 6,
          }}
          accessibilityLiveRegion="polite"
        >
          메시지를 보내지 못했습니다. 다시 시도해 주세요.
        </Text>
      ) : null}

      {showQuickReplies ? (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[
            styles.quickRepliesContainer,
            { borderTopColor: theme.colors.divider },
          ]}
        >
          {QUICK_REPLIES.map((text) => (
            <Pressable
              key={text}
              onPress={() => handleQuickReply(text)}
              style={[
                styles.quickReplyChip,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityLabel={`빠른 답장: ${text}`}
              accessibilityRole="button"
            >
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                }}
              >
                {text}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
            paddingBottom: insets.bottom || 12,
          },
        ]}
      >
        <Pressable
          onPress={() => setShowQuickReplies(!showQuickReplies)}
          style={styles.quickReplyButton}
          accessibilityLabel="빠른 답장"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: theme.fontSize.lg,
              color: theme.colors.textSecondary,
            }}
          >
            ⚡
          </Text>
        </Pressable>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bgMain,
              borderRadius: theme.borderRadius.xl,
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              borderColor: theme.colors.border,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          accessibilityLabel="메시지 입력"
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessageMutation.isPending}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim()
                ? theme.colors.primary
                : theme.colors.gray[200],
              borderRadius: theme.borderRadius.full,
            },
          ]}
          accessibilityLabel="메시지 전송"
          accessibilityRole="button"
        >
          <Send
            size={18}
            color={
              inputText.trim()
                ? theme.colors.textOnPrimary
                : theme.colors.textTertiary
            }
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onRetry,
}: {
  message: Message;
  onRetry: (msg: Message) => void;
}) {
  const theme = useTheme();
  const isMine = message.isMine;
  const isFailed = message.status === 'FAILED';
  const body = toDisplayString(message.content, '');

  const enterAnimation = isMine
    ? SlideInRight.duration(250)
    : SlideInLeft.duration(250);

  return (
    <Animated.View
      entering={enterAnimation}
      style={[
        styles.bubbleRow,
        isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
      ]}
    >
      {isFailed ? (
        <Pressable
          onPress={() => onRetry(message)}
          style={styles.retryButton}
          accessibilityLabel="재전송"
          accessibilityRole="button"
        >
          <RefreshCw size={14} color={theme.colors.error} />
        </Pressable>
      ) : null}
      <View
        style={[
          styles.bubble,
          isMine
            ? {
                backgroundColor: theme.colors.primary,
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: theme.colors.surface,
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: theme.colors.divider,
              },
        ]}
      >
        <Text
          style={{
            color: isMine
              ? theme.colors.textOnPrimary
              : theme.colors.textMain,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.fontSize.sm * 1.5,
          }}
        >
          {body}
        </Text>
      </View>
      <View style={[styles.metaRow, isMine && styles.metaRowRight]}>
        {isMine ? (
          <ReadStatus status={message.status} />
        ) : null}
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize['2xs'],
            marginLeft: isMine ? 2 : 0,
          }}
        >
          {formatMessageTime(message.sentAt)}
        </Text>
      </View>
    </Animated.View>
  );
}

function ReadStatus({ status }: { status: Message['status'] }) {
  const theme = useTheme();
  const size = 12;

  if (status === 'READ') {
    return <CheckCheck size={size} color={theme.colors.info} />;
  }
  if (status === 'DELIVERED' || status === 'SENT') {
    return <Check size={size} color={theme.colors.textTertiary} />;
  }
  return null;
}

function DateSeparator({ date }: { date: string }) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.dateSeparator}>
      <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
      <Text
        style={[
          styles.separatorText,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            backgroundColor: theme.colors.bgMain,
          },
        ]}
      >
        {formatDateSeparator(date)}
      </Text>
      <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
    </Animated.View>
  );
}

function ChatSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.skeletonBubble,
            i % 2 === 0 ? styles.bubbleRowLeft : styles.bubbleRowRight,
          ]}
        >
          <SkeletonLoader
            width={i % 3 === 0 ? 200 : 150}
            height={40}
            borderRadius={16}
          />
        </View>
      ))}
    </View>
  );
}

function LoadingIndicator() {
  return (
    <View style={styles.loadingFooter}>
      <SkeletonLoader width={120} height={32} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubbleRow: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleRowLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRowRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  metaRowRight: {
    justifyContent: 'flex-end',
  },
  retryButton: {
    position: 'absolute',
    left: -24,
    top: '50%',
    marginTop: -7,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    paddingHorizontal: 12,
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  quickReplyButton: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  skeletonBubble: {
    marginVertical: 4,
  },
  loadingFooter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
