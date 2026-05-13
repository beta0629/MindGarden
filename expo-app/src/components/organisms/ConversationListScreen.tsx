/**
 * ConversationListScreen — 대화 목록 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용. 스레드 라우트 파라미터 = 상대방 사용자 ID
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 실 API 집계·검색 지연·오류·표시 경계
 */
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageCircle } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Avatar } from '@/components/atoms/Avatar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { SearchBar } from '@/components/molecules/SearchBar';
import {
  useConversations,
  buildConversationsFromRows,
  type Conversation,
} from '@/api/hooks/useMessages';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { formatRelativeTime } from '@/utils/dateFormat';
import { toDisplayString } from '@/utils/safeDisplay';

interface ConversationListScreenProps {
  basePath: string;
}

const SKELETON_COUNT = 5;

export function ConversationListScreen({ basePath }: ConversationListScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';
  const [searchQuery, setSearchQuery] = useState('');
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
    const flat =
      data?.pages.flatMap((p) => ('messages' in p ? p.messages : [])) ?? [];
    flat.sort((a, b) => {
      const sa = String(a.sentAt ?? a.createdAt ?? '');
      const sb = String(b.sentAt ?? b.createdAt ?? '');
      const ta = new Date(sa).getTime();
      const tb = new Date(sb).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
    return buildConversationsFromRows(flat, user.role, user.id, deferredSearch);
  }, [tenantId, data?.pages, deferredSearch, user?.id, user?.role]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      const name = encodeURIComponent(conversation.partnerName);
      router.push(`${basePath}/${conversation.id}?partnerName=${name}` as never);
    },
    [router, basePath],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Conversation; index: number }) => (
      <ConversationItem
        conversation={item}
        onPress={handleConversationPress}
        index={index}
      />
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
          <SearchBar
            value=""
            onChangeText={() => {}}
            placeholder="이름으로 검색"
          />
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="이름으로 검색"
        />
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
    </View>
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
            backgroundColor: pressed
              ? theme.colors.accentSoft
              : theme.colors.surface,
            borderBottomColor: theme.colors.divider,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${partnerLabel}과의 대화. ${preview}`}
      >
        <Avatar
          uri={conversation.partnerProfileImageUrl}
          name={partnerLabel}
          size="lg"
        />
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
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
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
                  {conversation.unreadCount > 99
                    ? '99+'
                    : String(conversation.unreadCount)}
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
});
