/**
 * ConversationListScreen — 대화 목록 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
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
  type Conversation,
} from '@/api/hooks/useMessages';
import { formatRelativeTime } from '@/utils/dateFormat';

interface ConversationListScreenProps {
  basePath: string;
}

const SKELETON_COUNT = 5;

export function ConversationListScreen({ basePath }: ConversationListScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useConversations(searchQuery);

  const conversations = data?.pages.flatMap((page) => page.content) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      router.push(`${basePath}/${conversation.id}` as never);
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
        accessibilityLabel={`${conversation.partnerName}과의 대화. ${conversation.lastMessage}`}
      >
        <Avatar
          uri={conversation.partnerProfileImageUrl}
          name={conversation.partnerName}
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
              {conversation.partnerName}
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
              {conversation.lastMessage}
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
