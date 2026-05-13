/**
 * NotificationCenterScreen — 알림 센터 공용 컴포넌트
 * 상담사/내담자 양쪽에서 재사용
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback } from 'react';
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
import Animated, { FadeInRight, SlideInLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
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

const SKELETON_COUNT = 6;

const NOTIFICATION_TYPE_ICONS: Record<
  NotificationType,
  { icon: typeof Bell; color: string }
> = {
  SCHEDULE: { icon: Calendar, color: 'info' },
  PAYMENT: { icon: CreditCard, color: 'success' },
  MESSAGE: { icon: MessageCircle, color: 'primary' },
  WELLNESS: { icon: Heart, color: 'warning' },
  SYSTEM: { icon: Settings, color: 'textSecondary' },
};

export function NotificationCenterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNotifications();

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = data?.pages.flatMap((page) => page.content).filter(Boolean) ?? [];
  const hasUnread = notifications.some((n) => n && !n.isRead);

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
      if (notification.deepLink) {
        router.push(notification.deepLink as never);
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} lines={2} style={styles.skeletonCard} />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
      {hasUnread ? (
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
        estimatedItemSize={72}
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
            title="새로운 알림이 없습니다"
            description="새 알림이 도착하면 여기에 표시됩니다"
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
  const iconColor =
    theme.colors[typeConfig.color as keyof typeof theme.colors] ??
    theme.colors.textSecondary;

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
        accessibilityLabel={`${notification.title}. ${notification.content}`}
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
          <IconComponent size={20} color={iconColor as string} />
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
            {notification.title}
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
            {notification.content}
          </Text>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              marginTop: 4,
            }}
          >
            {formatRelativeTime(notification.createdAt)}
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
