/**
 * Apple T2 (1.2 UGC) — 내담자 차단 목록 화면 (Expo).
 *
 * <p>디자이너 핸드오프 §5.2 — 차단한 사용자 목록과 해제. `GET /api/v1/community/users/blocked`
 * 에서 응답을 받고, 항목별 해제 버튼은 `DELETE /api/v1/community/users/{userId}/block` 을 호출한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { useTheme } from '@/theme';
import {
  fetchRemoteCommunityBlockedUsers,
  unblockRemoteCommunityUser,
  type CommunityUserBlockResponseDto,
} from '@/services/communityApi';

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
        ) : items.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.textTertiary }]}>
            차단한 사용자가 없습니다.
          </Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `block-${item.blockedUserId}`}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.row,
                  {
                    borderBottomColor: theme.colors.divider,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                testID={`block-list-item-${item.blockedUserId}`}
              >
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowName, { color: theme.colors.textMain }]}>
                    {item.blockedDisplayName ?? '사용자'}
                  </Text>
                  <Text style={[styles.rowDate, { color: theme.colors.textTertiary }]}>
                    {(item.blockedAt ?? '').slice(0, 10)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleUnblock(item.blockedUserId)}
                  disabled={unblockingId === item.blockedUserId}
                  style={[
                    styles.unblockButton,
                    {
                      backgroundColor:
                        unblockingId === item.blockedUserId
                          ? theme.colors.gray[100]
                          : theme.colors.primaryLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.blockedDisplayName ?? '사용자'} 차단 해제`}
                  testID={`block-list-unblock-${item.blockedUserId}`}
                >
                  <Text style={[styles.unblockLabel, { color: theme.colors.textOnPrimary }]}>
                    {unblockingId === item.blockedUserId ? '해제 중...' : '해제'}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        )}
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
  empty: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowInfo: {
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
