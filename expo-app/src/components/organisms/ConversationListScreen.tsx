/**
 * ConversationListScreen — 대화 목록 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용. 스레드 라우트 파라미터 = 상대방 사용자 ID
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 실 API 집계·검색 지연·오류·표시 경계
 * @since 2026-05-13 — 목록 탭 시 미리보기 시트 후 대화 화면 이동
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageCircle, X } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Avatar } from '@/components/atoms/Avatar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { SearchBar } from '@/components/molecules/SearchBar';
import {
  useConversations,
  buildConversationsFromRows,
  useMarkMessagesAsReadBatch,
  type Conversation,
} from '@/api/hooks/useMessages';
import { useAuthStore } from '@/stores/useAuthStore';
import { toClientConsultantMessagingRole } from '@/utils/adminRole';
import { useTenantStore } from '@/stores/useTenantStore';
import { formatRelativeTime } from '@/utils/dateFormat';
import { toDisplayString } from '@/utils/safeDisplay';

interface ConversationListScreenProps {
  basePath: string;
}

const SKELETON_COUNT = 5;

const WINDOW_H = Dimensions.get('window').height;
const PREVIEW_SHEET_MAX_H = Math.round(WINDOW_H * 0.82);
const PREVIEW_BODY_MAX_H = Math.round(WINDOW_H * 0.42);

export function ConversationListScreen({ basePath }: ConversationListScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [previewConversation, setPreviewConversation] = useState<Conversation | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isError,
  } = useConversations(deferredSearch);

  const conversations = useMemo(() => {
    if (!tenantId || !user?.id || !user.role) {
      return [];
    }
    const flat = data?.pages.flatMap((p) => ('messages' in p ? p.messages : [])) ?? [];
    flat.sort((a, b) => {
      const sa = String(a.sentAt ?? a.createdAt ?? '');
      const sb = String(b.sentAt ?? b.createdAt ?? '');
      const ta = new Date(sa).getTime();
      const tb = new Date(sb).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
    return buildConversationsFromRows(
      flat,
      toClientConsultantMessagingRole(user.role),
      user.id,
      deferredSearch,
    );
  }, [tenantId, data?.pages, deferredSearch, user?.id, user?.role]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleConversationPress = useCallback((conversation: Conversation) => {
    setPreviewConversation(conversation);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewConversation(null);
  }, []);

  const openThreadFromPreview = useCallback(() => {
    const c = previewConversation;
    if (!c) return;
    const name = encodeURIComponent(c.partnerName);
    router.push(`${basePath}/${c.id}?partnerName=${name}` as never);
    setPreviewConversation(null);
  }, [previewConversation, router, basePath]);

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => (
      <ConversationItem conversation={item} onPress={handleConversationPress} index={index} />
    ),
    [handleConversationPress],
  );

  if (!tenantId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <EmptyState
          icon={<MessageCircle size={32} color={theme.colors.textTertiary} />}
          title="기관 정보가 필요합니다"
          description="테넌트를 선택한 뒤 메시지 목록을 불러올 수 있습니다"
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <View style={styles.searchWrapper}>
          <SearchBar value="" onChangeText={() => {}} placeholder="이름으로 검색" />
        </View>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} lines={2} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="이름으로 검색"
          />
        </View>
        <EmptyState
          icon={<MessageCircle size={32} color={theme.colors.textTertiary} />}
          title="목록을 불러오지 못했습니다"
          description="네트워크를 확인한 뒤 다시 시도해 주세요"
        />
        <Pressable
          onPress={() => refetch()}
          style={styles.retryPressable}
          accessibilityLabel="다시 시도"
          accessibilityRole="button"
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
      <View style={styles.searchWrapper}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="이름으로 검색" />
      </View>
      <FlashList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<MessageCircle size={32} color={theme.colors.textTertiary} />}
            title="아직 대화가 없습니다"
            description="상담이 시작되면 대화가 표시됩니다"
          />
        }
        contentContainerStyle={styles.listContent}
      />
      {previewConversation ? (
        <ConversationPreviewSheet
          conversation={previewConversation}
          onClose={closePreview}
          onOpenThread={openThreadFromPreview}
          maxSheetHeight={PREVIEW_SHEET_MAX_H}
          bodyMaxHeight={PREVIEW_BODY_MAX_H}
        />
      ) : null}
    </View>
  );
}

interface ConversationPreviewSheetProps {
  conversation: Conversation;
  onClose: () => void;
  onOpenThread: () => void;
  maxSheetHeight: number;
  bodyMaxHeight: number;
}

function ConversationPreviewSheet({
  conversation,
  onClose,
  onOpenThread,
  maxSheetHeight,
  bodyMaxHeight,
}: ConversationPreviewSheetProps) {
  const theme = useTheme();
  const { mutate: markUnreadBatch } = useMarkMessagesAsReadBatch();
  const unreadIdsSerialized = JSON.stringify(conversation.unreadMessageIds ?? []);

  useEffect(() => {
    if (unreadIdsSerialized === '[]') return;
    let ids: number[] = [];
    try {
      ids = JSON.parse(unreadIdsSerialized) as number[];
    } catch {
      return;
    }
    if (!Array.isArray(ids) || ids.length === 0) return;
    markUnreadBatch(ids);
  }, [conversation.partnerId, unreadIdsSerialized, markUnreadBatch]);

  const partnerLabel = toDisplayString(conversation.partnerName, '대화');
  const preview = toDisplayString(conversation.lastMessage, '');
  const previewDisplay = preview.length > 0 ? preview : '메시지가 없습니다.';
  const timeLabel = formatRelativeTime(conversation.lastMessageAt);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={[styles.sheetBackdrop, { backgroundColor: theme.colors.modalBackdrop }]}
        onPress={onClose}
        accessibilityLabel="닫기"
      >
        <Pressable
          style={[
            styles.sheetOuter,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius['2xl'],
              borderTopRightRadius: theme.borderRadius['2xl'],
              maxHeight: maxSheetHeight,
            },
          ]}
          onPress={() => {}}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheetSafe}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: theme.colors.gray[300] }]} />
            </View>
            <View style={styles.sheetHeader}>
              <Text
                style={{
                  flex: 1,
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                }}
                accessibilityRole="header"
              >
                {partnerLabel}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityLabel="닫기"
                accessibilityRole="button"
              >
                <X size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
            <Text
              style={{
                marginTop: 4,
                color: theme.colors.textTertiary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize['2xs'],
              }}
            >
              {timeLabel}
            </Text>
            <ScrollView
              style={[styles.previewBodyScroll, { maxHeight: bodyMaxHeight }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text
                style={{
                  marginTop: 12,
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  lineHeight: 22,
                }}
              >
                {previewDisplay}
              </Text>
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.sheetButtonSecondary,
                  {
                    backgroundColor: theme.colors.bgMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityLabel="닫기"
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  닫기
                </Text>
              </Pressable>
              <Pressable
                onPress={onOpenThread}
                style={({ pressed }) => [
                  styles.sheetButtonPrimary,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                accessibilityLabel="대화 열기"
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textOnPrimary,
                  }}
                >
                  대화 열기
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
  index: number;
}

function ConversationItem({ conversation, onPress, index }: ConversationItemProps) {
  const theme = useTheme();
  const partnerLabel = toDisplayString(conversation.partnerName, '대화');
  const preview = toDisplayString(conversation.lastMessage, '');

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <Pressable
        onPress={() => onPress(conversation)}
        style={({ pressed }) => [
          styles.itemContainer,
          {
            backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
            borderBottomColor: theme.colors.divider,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${partnerLabel}과의 대화. ${preview}`}
      >
        <Avatar uri={conversation.partnerProfileImageUrl} name={partnerLabel} size="lg" />
        <View style={styles.itemContent}>
          <View style={styles.itemTopRow}>
            <Text
              style={[
                styles.partnerName,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                },
              ]}
              numberOfLines={1}
            >
              {partnerLabel}
            </Text>
            <Text
              style={[
                styles.time,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                },
              ]}
            >
              {formatRelativeTime(conversation.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.itemBottomRow}>
            <Text
              style={[
                styles.lastMessage,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {conversation.unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                <Text
                  style={[
                    styles.unreadText,
                    {
                      color: theme.colors.textOnPrimary,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize['2xs'],
                    },
                  ]}
                >
                  {conversation.unreadCount > 99 ? '99+' : String(conversation.unreadCount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  skeletonCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  retryPressable: {
    alignSelf: 'center',
    padding: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    flex: 1,
    marginRight: 8,
  },
  time: {},
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetSafe: {
    paddingBottom: 8,
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  previewBodyScroll: {
    marginTop: 0,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  sheetButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sheetButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
