/**
 * NotificationCenterScreen — 알림 센터 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 전체/안읽음 필터·표시 경계·아이콘 색상 토큰
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  Calendar,
  CheckCheck,
  CreditCard,
  Heart,
  MessageCircle,
  Settings,
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import type { AppThemeColors } from '@/theme';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type AppNotification,
  type NotificationType,
} from '@/api/hooks/useNotifications';
import { formatRelativeTime } from '@/utils/dateFormat';
import { toDisplayString } from '@/utils/safeDisplay';
import { useTenantStore } from '@/stores/useTenantStore';

const SKELETON_COUNT = 6;

const NOTIFICATION_TYPE_ICONS: Record<
  NotificationType,
  { icon: typeof Bell; colorKey: keyof Pick<
    AppThemeColors,
    'primary' | 'success' | 'warning' | 'info' | 'textSecondary'
  > }
> = {
  SCHEDULE: { icon: Calendar, colorKey: 'info' },
  PAYMENT: { icon: CreditCard, colorKey: 'success' },
  MESSAGE: { icon: MessageCircle, colorKey: 'primary' },
  WELLNESS: { icon: Heart, colorKey: 'warning' },
  SYSTEM: { icon: Settings, colorKey: 'textSecondary' },
};

type InboxFilter = 'all' | 'unread';

export function NotificationCenterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';
  const [filter, setFilter] = useState<InboxFilter>('all');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    isError,
  } = useNotifications();

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const flatNotifications = useMemo(() => {
    if (!tenantId) {
      return [];
    }
    return data?.pages.flatMap((page) => page.content).filter(Boolean) ?? [];
  }, [tenantId, data?.pages]);

  const notifications = useMemo(() => {
    if (filter === 'unread') {
      return flatNotifications.filter((n) => n && !n.isRead);
    }
    return flatNotifications;
  }, [flatNotifications, filter]);

  const hasUnread = flatNotifications.some((n) => n && !n.isRead);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id);
      }
      const link = notification.deepLink;
      const hasLink = typeof link === 'string' && link.trim().length > 0;
      if (hasLink) {
        router.push(link.trim() as never);
        return;
      }
      if (notification.type === 'WELLNESS') {
        router.push('/(client)/(wellness)' as never);
      }
    },
    [markAsReadMutation, router],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const renderItem = useCallback(
    ({ item, index }: { item: AppNotification; index: number }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        index={index}
      />
    ),
    [handleNotificationPress],
  );

  if (!tenantId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <EmptyState
          icon={<Bell size={32} color={theme.colors.textTertiary} />}
          title="기관 정보가 필요합니다"
          description="테넌트를 선택한 뒤 알림을 불러올 수 있습니다"
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} lines={2} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <EmptyState
          icon={<Bell size={32} color={theme.colors.textTertiary} />}
          title="알림을 불러오지 못했습니다"
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
      <View style={[styles.filterRow, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[
            styles.filterChip,
            filter === 'all' && { backgroundColor: theme.colors.accentSoft },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'all' }}
        >
          <Text
            style={{
              color: filter === 'all' ? theme.colors.primary : theme.colors.textSecondary,
              fontFamily:
                filter === 'all' ? theme.fontFamily.semibold : theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            전체
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('unread')}
          style={[
            styles.filterChip,
            filter === 'unread' && { backgroundColor: theme.colors.accentSoft },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'unread' }}
        >
          <Text
            style={{
              color:
                filter === 'unread' ? theme.colors.primary : theme.colors.textSecondary,
              fontFamily:
                filter === 'unread'
                  ? theme.fontFamily.semibold
                  : theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            안 읽음
          </Text>
        </Pressable>
      </View>
      {hasUnread && filter === 'all' ? (
        <View style={[styles.headerRow, { borderBottomColor: theme.colors.divider }]}>
          <Pressable
            onPress={handleMarkAllRead}
            style={styles.markAllButton}
            accessibilityLabel="모두 읽음 처리"
            accessibilityRole="button"
          >
            <CheckCheck size={16} color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                marginLeft: 4,
              }}
            >
              모두 읽음
            </Text>
          </Pressable>
        </View>
      ) : null}
      <FlashList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item?.id ?? `fallback-${index}`)}
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
            icon={<Bell size={32} color={theme.colors.textTertiary} />}
            title={filter === 'unread' ? '안 읽은 알림이 없습니다' : '새로운 알림이 없습니다'}
            description={
              filter === 'unread'
                ? '전체 탭에서 모든 알림을 확인할 수 있습니다'
                : '새 알림이 도착하면 여기에 표시됩니다'
            }
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  index: number;
}

function NotificationItem({ notification, onPress, index }: NotificationItemProps) {
  const theme = useTheme();
  const typeConfig = NOTIFICATION_TYPE_ICONS[notification.type];
  const IconComponent = typeConfig.icon;
  const iconColor = theme.colors[typeConfig.colorKey];

  const title = toDisplayString(notification.title, '알림');
  const body = toDisplayString(notification.content, '');
  const timeLabel = formatRelativeTime(notification.createdAt);

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(250)}>
      <Pressable
        onPress={() => onPress(notification)}
        style={({ pressed }) => [
          styles.itemContainer,
          {
            backgroundColor: pressed
              ? theme.colors.accentSoft
              : notification.isRead
                ? theme.colors.bgMain
                : theme.colors.surfaceAlt,
            borderBottomColor: theme.colors.divider,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
      >
        {!notification.isRead ? (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.colors.info }]}
          />
        ) : null}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.colors.accentSoft },
          ]}
        >
          <IconComponent size={20} color={iconColor} />
        </View>
        <View style={styles.itemContent}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: notification.isRead
                ? theme.fontFamily.regular
                : theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {body}
          </Text>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              marginTop: 4,
            }}
          >
            {timeLabel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  retryPressable: {
    alignSelf: 'center',
    padding: 12,
  },
  skeletonCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: 8,
    top: 20,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
});
