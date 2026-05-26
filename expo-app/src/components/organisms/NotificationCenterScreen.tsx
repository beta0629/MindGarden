/**
 * NotificationCenterScreen — 알림 센터 공용 컴포넌트
 * 상담사·내담자·어드민·스태프에서 재사용
 *
 * @author MindGarden
 * @since 2026-05-12
 * @since 2026-05-13 — 전체/안읽음 필터·표시 경계·아이콘 색상 토큰
 * @since 2026-05-13 — 항목 탭 시 상세 시트(모달)·웰니스 잘못된 기본 이동 제거
 */
import { useCallback, useMemo, useState } from 'react';
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
import {
  Bell,
  Calendar,
  CheckCheck,
  CreditCard,
  Heart,
  MessageCircle,
  Settings,
  X,
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  {
    icon: typeof Bell;
    colorKey: keyof Pick<
      AppThemeColors,
      'primary' | 'success' | 'warning' | 'info' | 'textSecondary'
    >;
  }
> = {
  SCHEDULE: { icon: Calendar, colorKey: 'info' },
  PAYMENT: { icon: CreditCard, colorKey: 'success' },
  MESSAGE: { icon: MessageCircle, colorKey: 'primary' },
  WELLNESS: { icon: Heart, colorKey: 'warning' },
  SYSTEM: { icon: Settings, colorKey: 'textSecondary' },
};

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  SCHEDULE: '일정',
  PAYMENT: '결제',
  MESSAGE: '메시지',
  WELLNESS: '웰니스',
  SYSTEM: '시스템',
};

const WINDOW_H = Dimensions.get('window').height;
const DETAIL_SHEET_MAX_H = Math.round(WINDOW_H * 0.82);
const DETAIL_BODY_MAX_H = Math.round(WINDOW_H * 0.42);

type InboxFilter = 'all' | 'unread';

export function NotificationCenterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tenantId = useTenantStore((s) => s.tenantId)?.trim() ?? '';
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [detailNotification, setDetailNotification] = useState<AppNotification | null>(null);

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
      setDetailNotification(notification);
    },
    [markAsReadMutation],
  );

  const closeDetail = useCallback(() => {
    setDetailNotification(null);
  }, []);

  const handleNavigateFromDetail = useCallback(() => {
    const link = detailNotification?.deepLink;
    const trimmed = typeof link === 'string' ? link.trim() : '';
    if (!trimmed) {
      return;
    }
    try {
      router.push(trimmed as never);
      setDetailNotification(null);
    } catch {
      /* expo-router 잘못된 경로 — 시트만 닫음 */
      setDetailNotification(null);
    }
  }, [detailNotification?.deepLink, router]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const renderItem = useCallback(
    ({ item, index }: { item: AppNotification; index: number }) => (
      <NotificationItem notification={item} onPress={handleNotificationPress} index={index} />
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
              fontFamily: filter === 'all' ? theme.fontFamily.semibold : theme.fontFamily.regular,
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
              color: filter === 'unread' ? theme.colors.primary : theme.colors.textSecondary,
              fontFamily:
                filter === 'unread' ? theme.fontFamily.semibold : theme.fontFamily.regular,
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
      {detailNotification ? (
        <NotificationDetailSheet
          notification={detailNotification}
          onClose={closeDetail}
          onNavigate={handleNavigateFromDetail}
          maxSheetHeight={DETAIL_SHEET_MAX_H}
          bodyMaxHeight={DETAIL_BODY_MAX_H}
        />
      ) : null}
    </View>
  );
}

interface NotificationDetailSheetProps {
  notification: AppNotification;
  onClose: () => void;
  onNavigate: () => void;
  maxSheetHeight: number;
  bodyMaxHeight: number;
}

function NotificationDetailSheet({
  notification,
  onClose,
  onNavigate,
  maxSheetHeight,
  bodyMaxHeight,
}: NotificationDetailSheetProps) {
  const theme = useTheme();
  const typeConfig = NOTIFICATION_TYPE_ICONS[notification.type];
  const IconComponent = typeConfig.icon;
  const iconColor = theme.colors[typeConfig.colorKey];
  const title = toDisplayString(notification.title, '알림');
  const body = toDisplayString(notification.content, '');
  const bodyDisplay = body.length > 0 ? body : '내용이 없습니다.';
  const timeLabel = formatRelativeTime(notification.createdAt);
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type];
  const link = notification.deepLink;
  const hasLink = typeof link === 'string' && link.trim().length > 0;

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
          onPress={() => {
            /* 시트 내부 탭은 배경 닫기 차단 */
          }}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheetSafe}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: theme.colors.gray[300] }]} />
            </View>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View
                  style={[styles.sheetHeaderIcon, { backgroundColor: theme.colors.accentSoft }]}
                >
                  <IconComponent size={20} color={iconColor} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  }}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
              </View>
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
              {typeLabel} · {timeLabel}
            </Text>
            <ScrollView
              style={[styles.detailBodyScroll, { maxHeight: bodyMaxHeight }]}
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
                {bodyDisplay}
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
              {hasLink ? (
                <Pressable
                  onPress={onNavigate}
                  style={({ pressed }) => [
                    styles.sheetButtonPrimary,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius.lg,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                  accessibilityLabel="관련 화면으로 이동"
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textOnPrimary,
                    }}
                  >
                    화면으로 이동
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
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
          <View style={[styles.unreadDot, { backgroundColor: theme.colors.info }]} />
        ) : null}
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.accentSoft }]}>
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
  sheetHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detailBodyScroll: {
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
