/**
 * 어드민 — 커뮤니티 검수 큐 목록 (ADMIN 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight, ShieldAlert } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  getMutationErrorMessage,
  useAdminCommunityModerationQueue,
} from '@/api/hooks/useAdminCommunityModeration';
import { ADMIN_COMMUNITY_MODERATION_COPY } from '@/constants/adminCommunityModerationCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { canAccessCommunityModeration, isStaffRole } from '@/utils/adminRole';
import type { CommunityModerationQueueItem } from '@/utils/adminCommunityModerationNormalize';
import { toDisplayString } from '@/utils/safeDisplay';
import { normalizeCommunityListedTimeIso } from '@/utils/dateFormat';

function formatQueueCreatedAt(iso: string): string {
  const trimmed = iso.trim();
  if (trimmed === '') {
    return '—';
  }
  try {
    const normalized = normalizeCommunityListedTimeIso(trimmed);
    const d = parseISO(normalized);
    if (Number.isNaN(d.getTime())) {
      return trimmed;
    }
    return format(d, 'yyyy.MM.dd HH:mm', { locale: ko });
  } catch {
    return trimmed;
  }
}

function postKindLabel(kind: string): string {
  if (kind === 'CONSULTANT_COLUMN') {
    return ADMIN_COMMUNITY_MODERATION_COPY.KIND_CONSULTANT_COLUMN;
  }
  if (kind === 'CLIENT_REVIEW') {
    return ADMIN_COMMUNITY_MODERATION_COPY.KIND_CLIENT_REVIEW;
  }
  return toDisplayString(kind, '—');
}

function statusBadge(status: string): {
  label: string;
  variant: 'warning' | 'success' | 'error' | 'gray';
} {
  const s = status.trim().toUpperCase();
  if (s === 'APPROVED') {
    return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_APPROVED, variant: 'success' };
  }
  if (s === 'REJECTED') {
    return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_REJECTED, variant: 'error' };
  }
  return { label: ADMIN_COMMUNITY_MODERATION_COPY.STATUS_PENDING, variant: 'warning' };
}

export default function AdminCommunityModerationQueueScreen() {
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const allowed = canAccessCommunityModeration(role);
  const staffDenied = isStaffRole(role);

  const queueQuery = useAdminCommunityModerationQueue();
  const [refreshing, setRefreshing] = useState(false);

  const items = queueQuery.data ?? [];

  const accessDeniedMessage = useMemo(() => {
    if (staffDenied) {
      return ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_STAFF;
    }
    return ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_GENERIC;
  }, [staffDenied]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queueQuery.refetch();
    setRefreshing(false);
  }, [queueQuery]);

  const openDetail = useCallback(
    (id: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push(`/(admin)/(review)/${id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: CommunityModerationQueueItem }) => {
      const badge = statusBadge(item.moderationStatus);
      return (
        <Pressable
          onPress={() => openDetail(item.id)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.divider,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${badge.label}`}
        >
          <View style={styles.rowMain}>
            <View style={styles.rowTitleRow}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                }}
                numberOfLines={2}
              >
                {toDisplayString(item.title, '제목 없음')}
              </Text>
              <ChevronRight size={18} color={theme.colors.textTertiary} />
            </View>
            <Text
              style={{
                marginTop: 4,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
              }}
              numberOfLines={2}
            >
              {toDisplayString(item.bodyPreview, '')}
            </Text>
            <View style={styles.metaRow}>
              <Badge label={badge.label} variant={badge.variant} />
              <Badge label={postKindLabel(item.postKind)} variant="gray" />
            </View>
            <Text
              style={{
                marginTop: 6,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
              }}
            >
              {toDisplayString(item.authorDisplay, '—')} · {formatQueueCreatedAt(item.createdAt)}
            </Text>
          </View>
        </Pressable>
      );
    },
    [openDetail, theme],
  );

  if (!allowed) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'left', 'right']}
      >
        <AppTopBar title={ADMIN_COMMUNITY_MODERATION_COPY.PAGE_TITLE} canGoBack />
        <View style={styles.deniedWrap}>
          <ShieldAlert size={40} color={theme.colors.error} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
              textAlign: 'center',
            }}
          >
            {ADMIN_COMMUNITY_MODERATION_COPY.ACCESS_DENIED_TITLE}
          </Text>
          <Text
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            {accessDeniedMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const listErrorMessage = queueQuery.isError
    ? getMutationErrorMessage(queueQuery.error, ADMIN_COMMUNITY_MODERATION_COPY.LIST_ERROR)
    : null;

  const showLoading = queueQuery.isPending && !queueQuery.isFetched;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'left', 'right']}
    >
      <AppTopBar title={ADMIN_COMMUNITY_MODERATION_COPY.PAGE_TITLE} canGoBack />
      <View style={styles.headerBlock}>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {ADMIN_COMMUNITY_MODERATION_COPY.PAGE_SUBTITLE}
        </Text>
      </View>

      {showLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            listErrorMessage ? (
              <EmptyState
                title={ADMIN_COMMUNITY_MODERATION_COPY.LIST_ERROR}
                description={listErrorMessage}
                actionLabel={ADMIN_COMMUNITY_MODERATION_COPY.RETRY}
                onAction={() => void queueQuery.refetch()}
              />
            ) : (
              <EmptyState
                title={ADMIN_COMMUNITY_MODERATION_COPY.EMPTY_TITLE}
                description={ADMIN_COMMUNITY_MODERATION_COPY.EMPTY_DESC}
                actionLabel={ADMIN_COMMUNITY_MODERATION_COPY.RETRY}
                onAction={() => void queueQuery.refetch()}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
