/**
 * 커뮤니티 피드 (내담자) — 탭, 게시글 카드, FAB, Pull-to-refresh
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Heart, MessageCircle, Plus, User, RefreshCw } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useCommunityFeed } from '@/api/hooks/useCommunity';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { COMMUNITY_TABS, type CommunityPost, type CommunityTab } from '@/constants/communityData';
import {
  COMMUNITY_FEED_DATA_SOURCE_API,
  COMMUNITY_FEED_DATA_SOURCE_DEMO,
  COMMUNITY_FEED_DEMO_HINT,
  COMMUNITY_FEED_DEV_DATA_SOURCE_PREFIX,
  COMMUNITY_FEED_FETCH_ERROR,
  COMMUNITY_FEED_SYNC_HINT,
  COMMUNITY_FEED_SYNC_OK,
  COMMUNITY_POST_LOCAL_ONLY_BADGE,
} from '@/constants/communityFeedCopy';

export default function ClientCommunityFeed() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommunityTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const {
    dataSource,
    refetch,
    isFetching,
    lastFetchedAt,
    isError: feedQueryError,
    isPostLocalOnly,
    hasLocalOnlyPosts,
  } = useCommunityFeed({ feedTab: activeTab });

  const { posts, togglePostLike, isPostLiked } = useCommunityStore();

  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return posts;
    return posts.filter((p) => p.tab === activeTab);
  }, [activeTab, posts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const navigateToDetail = (postId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/(more)/community/${postId}`);
  };

  const navigateToCreate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(client)/(more)/community/create');
  };

  const handleLike = useCallback(
    (postId: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      togglePostLike(postId);
    },
    [togglePostLike],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CommunityPost; index: number }) => (
      <PostCard
        post={item}
        index={index}
        isLiked={isPostLiked(item.id)}
        showLocalOnlyBadge={isPostLocalOnly(item.id)}
        onPress={() => navigateToDetail(item.id)}
        onLike={() => handleLike(item.id)}
      />
    ),
    [isPostLiked, handleLike, isPostLocalOnly],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="커뮤니티" canGoBack />

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textTertiary,
            }}
          >
            {__DEV__ ? `${COMMUNITY_FEED_DEV_DATA_SOURCE_PREFIX} ` : ''}
            {dataSource === 'api' ? COMMUNITY_FEED_DATA_SOURCE_API : COMMUNITY_FEED_DATA_SOURCE_DEMO}
            {lastFetchedAt > 0
              ? ` · 동기화 ${new Date(lastFetchedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              color: theme.colors.textTertiary,
              marginTop: 4,
            }}
          >
            {dataSource === 'api'
              ? hasLocalOnlyPosts
                ? COMMUNITY_FEED_SYNC_HINT
                : COMMUNITY_FEED_SYNC_OK
              : COMMUNITY_FEED_DEMO_HINT}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void handleRefresh();
          }}
          disabled={refreshing || isFetching}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: theme.borderRadius.lg,
            backgroundColor: theme.colors.surface,
            opacity: pressed ? 0.85 : refreshing || isFetching ? 0.6 : 1,
            ...theme.shadows.sm,
          })}
          accessibilityLabel="서버에서 커뮤니티 다시 불러오기"
          accessibilityRole="button"
        >
          <RefreshCw size={16} color={theme.colors.primary} />
          <Text
            style={{
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
              color: theme.colors.primary,
              marginLeft: 6,
            }}
          >
            동기화
          </Text>
        </Pressable>
      </View>

      {feedQueryError ? (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: theme.borderRadius.lg,
            backgroundColor: theme.colors.accentSoft,
          }}
          accessibilityRole="text"
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
            }}
          >
            {COMMUNITY_FEED_FETCH_ERROR}
          </Text>
        </View>
      ) : null}

      {/* 탭 */}
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={styles.tabRow}>
          {COMMUNITY_TABS.map((tab) => (
            <Chip
              key={tab.key}
              label={tab.label}
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>
      </Animated.View>

      {/* 게시글 리스트 */}
      <View style={styles.listContainer}>
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={32} color={theme.colors.textTertiary} />}
            title="게시글이 없어요"
            description="첫 번째 글을 작성해보세요"
            actionLabel="글쓰기"
            onAction={navigateToCreate}
          />
        ) : (
          <FlashList
            data={filteredPosts}
            renderItem={renderItem}
            estimatedItemSize={168}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isFetching}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </View>

      {/* FAB */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            ...theme.shadows.lg,
          },
        ]}
      >
        <Pressable
          onPress={navigateToCreate}
          style={styles.fabInner}
          accessibilityLabel="글쓰기"
          accessibilityRole="button"
        >
          <Plus size={28} color={theme.colors.textOnPrimary} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

interface PostCardProps {
  post: CommunityPost;
  index: number;
  isLiked: boolean;
  showLocalOnlyBadge: boolean;
  onPress: () => void;
  onLike: () => void;
}

function PostCard({ post, index, isLiked, showLocalOnlyBadge, onPress, onLike }: PostCardProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          postStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityLabel={`${post.title}. ${post.author}`}
        accessibilityRole="button"
      >
        {/* 작성자 */}
        <View style={postStyles.authorRow}>
          <View style={[postStyles.avatar, { backgroundColor: theme.colors.accentSoft }]}>
            <User size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={postStyles.authorText}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
              }}
            >
              {post.author}
            </Text>
            {post.specialty ? (
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.textTertiary,
                }}
              >
                {post.specialty}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {showLocalOnlyBadge ? (
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.primary,
                }}
              >
                {COMMUNITY_POST_LOCAL_ONLY_BADGE}
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
              }}
            >
              {post.time}
            </Text>
          </View>
        </View>

        {/* 본문 */}
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
            color: theme.colors.textMain,
            marginTop: 8,
          }}
          numberOfLines={1}
        >
          {post.title}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            marginTop: 4,
          }}
          numberOfLines={2}
        >
          {post.body}
        </Text>

        {/* 좋아요/댓글 */}
        <View style={postStyles.footerRow}>
          <Pressable
            onPress={onLike}
            hitSlop={8}
            style={postStyles.actionBtn}
            accessibilityLabel={isLiked ? '좋아요 취소' : '좋아요'}
            accessibilityRole="button"
          >
            <Heart
              size={16}
              color={isLiked ? theme.colors.error : theme.colors.textTertiary}
              fill={isLiked ? theme.colors.error : 'transparent'}
            />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: isLiked ? theme.colors.error : theme.colors.textTertiary,
                marginLeft: 4,
              }}
            >
              {post.likes}
            </Text>
          </Pressable>

          <View style={postStyles.actionBtn}>
            <MessageCircle size={16} color={theme.colors.textTertiary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
                marginLeft: 4,
              }}
            >
              {post.comments.length}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const postStyles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    flex: 1,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
