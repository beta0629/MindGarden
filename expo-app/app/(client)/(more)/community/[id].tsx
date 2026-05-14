/**
 * 커뮤니티 게시글 상세 (내담자) — 본문 + 좋아요 + 댓글 + 댓글입력
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Heart, MessageCircle, Send, User } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useCommunityPostById, useCommunityFeed } from '@/api/hooks/useCommunity';
import { useCommunityStore } from '@/stores/useCommunityStore';
import {
  createRemoteCommunityComment,
  createRemoteCommunityLike,
  deleteRemoteCommunityLike,
} from '@/services/communityApi';
import { COMMUNITY_DEMO_LABELS, type CommunityComment } from '@/constants/communityData';

export default function ClientCommunityDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const {
    togglePostLike,
    toggleCommentLike,
    isPostLiked,
    isCommentLiked,
    addComment,
    appendServerComment,
  } = useCommunityStore();

  const { dataSource, isError: feedQueryError } = useCommunityFeed();

  const post = useCommunityPostById(postId);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handlePostLike = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const wasLiked = isPostLiked(postId);
    try {
      if (wasLiked) {
        await deleteRemoteCommunityLike(postId);
      } else {
        await createRemoteCommunityLike(postId);
      }
    } catch {
      /* §11.1 — 서버 실패 시에도 로컬 토글로 데모 유지 */
    }
    togglePostLike(postId);
  };

  const handleCommentLike = useCallback(
    (commentId: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      toggleCommentLike(commentId);
    },
    [toggleCommentLike],
  );

  const handleSendComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      const remoteComment = await createRemoteCommunityComment(postId, { body: trimmed });
      if (remoteComment) {
        appendServerComment(postId, remoteComment);
        setCommentText('');
        inputRef.current?.blur();
        return;
      }
    } catch {
      /* §11.1 폴백 */
    }
    addComment(postId, COMMUNITY_DEMO_LABELS.clientCommentAuthor, trimmed);
    setCommentText('');
    inputRef.current?.blur();
  };

  if (!post) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'bottom']}
      >
        <EmptyState
          title="게시글을 찾을 수 없습니다"
          description="목록으로 돌아가 다른 글을 선택해 주세요"
        />
      </SafeAreaView>
    );
  }

  const liked = isPostLiked(post.id);

  const renderHeader = () => (
    <View>
      <View
        style={{
          marginBottom: 12,
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
          {feedQueryError || dataSource === 'demo-mmkv'
            ? '데모·기기 저장(MMKV) 모드입니다. 댓글·좋아요는 이 기기에만 반영되며, 서버 API(/api/v1/community) 연동 후 동기화됩니다.'
            : '서버 피드를 불러온 상태입니다. 댓글·좋아요는 아직 이 기기(MMKV)에만 저장됩니다.'}
        </Text>
      </View>
      {/* 작성자 */}
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.accentSoft }]}>
          <User size={20} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.authorText}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
          >
            {post.author}
          </Text>
          {post.specialty ? (
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
              }}
            >
              {post.specialty}
            </Text>
          ) : null}
        </View>
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

      {/* 제목 + 본문 */}
      <Text
        style={{
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize.xl,
          color: theme.colors.textMain,
          marginTop: 16,
        }}
      >
        {post.title}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
          color: theme.colors.textSecondary,
          lineHeight: 26,
          marginTop: 12,
        }}
      >
        {post.body}
      </Text>

      {/* 좋아요 버튼 */}
      <Pressable
        onPress={handlePostLike}
        style={({ pressed }) => [
          styles.likeBtn,
          {
            backgroundColor: liked ? theme.colors.error + '15' : theme.colors.accentSoft,
            borderRadius: theme.borderRadius.lg,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
        accessibilityRole="button"
      >
        <Heart
          size={20}
          color={liked ? theme.colors.error : theme.colors.textTertiary}
          fill={liked ? theme.colors.error : 'transparent'}
        />
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: liked ? theme.colors.error : theme.colors.textTertiary,
            marginLeft: 6,
          }}
        >
          {post.likes}
        </Text>
      </Pressable>

      {/* 댓글 헤더 */}
      <View style={styles.commentHeader}>
        <MessageCircle size={16} color={theme.colors.textMain} />
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
            marginLeft: 6,
          }}
        >
          댓글 {post.comments.length}
        </Text>
      </View>
    </View>
  );

  const renderComment = ({ item, index }: { item: CommunityComment; index: number }) => {
    const commentLiked = isCommentLiked(item.id);
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
        <View
          style={[
            styles.commentCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <View style={styles.commentTop}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
              }}
            >
              {item.author}
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize['2xs'],
                color: theme.colors.textTertiary,
              }}
            >
              {item.time}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {item.body}
          </Text>
          <Pressable
            onPress={() => handleCommentLike(item.id)}
            hitSlop={8}
            style={styles.commentLike}
            accessibilityLabel={commentLiked ? '좋아요 취소' : '좋아요'}
            accessibilityRole="button"
          >
            <Heart
              size={14}
              color={commentLiked ? theme.colors.error : theme.colors.textTertiary}
              fill={commentLiked ? theme.colors.error : 'transparent'}
            />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize['2xs'],
                color: commentLiked ? theme.colors.error : theme.colors.textTertiary,
                marginLeft: 4,
              }}
            >
              {item.likes}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      {/* 헤더 */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={16}
          style={styles.backBtn}
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMain,
          }}
        >
          게시글
        </Text>
        <View style={styles.backBtn} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          <FlashList
            data={post.comments as CommunityComment[]}
            renderItem={renderComment}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* 댓글 입력 */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.divider,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.accentSoft,
                borderRadius: theme.borderRadius.lg,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              },
            ]}
            multiline
            maxLength={500}
            accessibilityLabel="댓글 입력"
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: commentText.trim() ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="댓글 전송"
            accessibilityRole="button"
          >
            <Send size={18} color={theme.colors.textOnPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    flex: 1,
    marginLeft: 10,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  commentCard: {
    padding: 12,
    marginBottom: 8,
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
