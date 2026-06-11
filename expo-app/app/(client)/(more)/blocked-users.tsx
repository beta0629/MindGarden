/**
 * Apple G1.2 UGC (P2-C) — 내담자 차단 목록 화면 (Expo).
 *
 * <p>디자이너 시안 §D 그대로 구현 — Avatar(40×40) molecule + Outline 톤 해제 버튼 +
 * EmptyState(아이콘+카피) + 푸터 24h 캡션. `GET/POST/DELETE /api/v1/community/users/blocked|/{id}/block`
 * 와 1:1 매핑.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserX } from 'lucide-react-native';

import { UserAvatar } from '@/components/molecules/UserAvatar';
import { UGC_REVIEW_SLA_COPY } from '@/constants/eulaTerms';
import {
  fetchRemoteCommunityBlockedUsers,
  unblockRemoteCommunityUser,
  type CommunityUserBlockResponseDto,
} from '@/services/communityApi';
import { useTheme } from '@/theme';

const AVATAR_SIZE = 40;
const UNBLOCK_BUTTON_HEIGHT = 36;
const EMPTY_ICON_SIZE = 56;

/**
 * `YYYY-MM-DDThh:mm:ss[.ms]` → `YYYY.MM.DD 차단` 자연어 포맷.
 */
function formatBlockedAt(isoDate?: string): string {
  if (!isoDate) {
    return '';
  }
  const dateOnly = isoDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return isoDate;
  }
  const [y, m, d] = dateOnly.split('-');
  return `${y}.${m}.${d} 차단`;
}

export default function ClientBlockedUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<CommunityUserBlockResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const loadBlocked = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchRemoteCommunityBlockedUsers();
      setItems(data);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? '차단 목록을 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlocked();
  }, [loadBlocked]);

  const handleUnblock = useCallback(async (blockedUserId: number) => {
    if (unblockingId !== null) {
      return;
    }
    setUnblockingId(blockedUserId);
    try {
      await unblockRemoteCommunityUser(blockedUserId);
      setItems((prev) => prev.filter((item) => item.blockedUserId !== blockedUserId));
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? '차단 해제에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setUnblockingId(null);
    }
  }, [unblockingId]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CommunityUserBlockResponseDto>) => {
      const isUnblocking = unblockingId === item.blockedUserId;
      return (
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          testID={`block-list-item-${item.blockedUserId}`}
        >
          <UserAvatar
            displayName={item.blockedDisplayName}
            size={AVATAR_SIZE}
            testID={`block-list-avatar-${item.blockedUserId}`}
          />
          <View style={styles.rowInfo}>
            <Text
              style={[
                styles.rowName,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                },
              ]}
              numberOfLines={1}
            >
              {item.blockedDisplayName ?? '사용자'}
            </Text>
            <Text style={[styles.rowDate, { color: theme.colors.textTertiary }]}>
              {formatBlockedAt(item.blockedAt)}
            </Text>
          </View>
          <Pressable
            onPress={() => handleUnblock(item.blockedUserId)}
            disabled={isUnblocking}
            style={({ pressed }) => [
              styles.unblockButton,
              {
                borderColor: theme.colors.gray[300],
                borderRadius: theme.borderRadius.md,
                backgroundColor: isUnblocking
                  ? theme.colors.gray[100]
                  : pressed
                    ? theme.colors.gray[100]
                    : theme.colors.surface,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.blockedDisplayName ?? '사용자'} 차단 해제`}
            testID={`block-list-unblock-${item.blockedUserId}`}
          >
            <Text
              style={[
                styles.unblockLabel,
                {
                  color: isUnblocking ? theme.colors.textTertiary : theme.colors.textMain,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              {isUnblocking ? '해제 중...' : '해제'}
            </Text>
          </Pressable>
        </View>
      );
    },
    [handleUnblock, theme, unblockingId],
  );

  const keyExtractor = useCallback(
    (item: CommunityUserBlockResponseDto) => `block-${item.blockedUserId}`,
    [],
  );

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrap} testID="block-list-empty">
        <UserX size={EMPTY_ICON_SIZE} color={theme.colors.gray[300]} />
        <Text
          style={[
            styles.emptyTitle,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
            },
            theme.textStyles.h3,
          ]}
        >
          차단한 사용자가 없습니다
        </Text>
        <Text
          style={[
            styles.emptyBody,
            { color: theme.colors.textSecondary },
            theme.textStyles.bodySmall,
          ]}
        >
          {'불편한 사용자를 차단하면 여기에\n모아 관리할 수 있어요.'}
        </Text>
      </View>
    ),
    [theme],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: 8,
          }}
        >
          차단 목록
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          차단한 사용자의 게시글과 댓글은 보이지 않습니다.
        </Text>

        {errorMessage.length > 0 && (
          <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
            {errorMessage}
          </Text>
        )}

        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loading}
            accessibilityLabel="차단 목록 불러오는 중"
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={listEmptyComponent}
            contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
          />
        )}

        <Text
          style={[
            styles.footerCaption,
            { color: theme.colors.textTertiary },
            theme.textStyles.caption,
          ]}
          testID="block-list-footer-caption"
        >
          {UGC_REVIEW_SLA_COPY.blockedListFooter}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    marginBottom: 12,
  },
  loading: {
    marginTop: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
    minHeight: 64,
  },
  rowInfo: {
    flex: 1,
    flexShrink: 1,
  },
  rowName: {
    fontSize: 15,
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 12,
  },
  unblockButton: {
    height: UNBLOCK_BUTTON_HEIGHT,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 64,
  },
  unblockLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerCaption: {
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
});
