/**
 * 알림 히스토리 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Bell, Clock, Trash2, CheckCircle, Circle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import notificationService from '../../services/NotificationService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 알림 히스토리 로드
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await notificationService.getNotificationHistory();
      setNotifications(history);
    } catch (error) {
      console.error('알림 히스토리 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await notificationService.markNotificationAsRead(notification.id);
      }
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return STRINGS.TIME.JUST_NOW || '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}${STRINGS.TIME.MINUTES_AGO || '분 전'}`;
      if (diffHours < 24) return `${diffHours}${STRINGS.TIME.HOURS_AGO || '시간 전'}`;
      if (diffDays < 7) return `${diffDays}${STRINGS.TIME.DAYS_AGO || '일 전'}`;

      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return dateString;
    }
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (data) => {
    if (!data) return <Bell size={SIZES.ICON.SM} color={COLORS.primary} />;

    try {
      const notificationData = typeof data === 'string' ? JSON.parse(data) : data;

      switch (notificationData.type) {
        case 'MESSAGE':
          return <Bell size={SIZES.ICON.SM} color={COLORS.primary} />;
        case 'SCHEDULE':
          return <Clock size={SIZES.ICON.SM} color={COLORS.info} />;
        case 'PAYMENT':
          return <CheckCircle size={SIZES.ICON.SM} color={COLORS.success} />;
        case 'SYSTEM':
          return <Bell size={SIZES.ICON.SM} color={COLORS.warning} />;
        default:
          return <Bell size={SIZES.ICON.SM} color={COLORS.primary} />;
      }
    } catch (error) {
      return <Bell size={SIZES.ICON.SM} color={COLORS.primary} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.NOTIFICATION.HISTORY_TITLE || '알림 내역'}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.NOTIFICATION.HISTORY_TITLE || '알림 내역'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 헤더 */}
        <DashboardSection title={STRINGS.NOTIFICATION.HISTORY_SUMMARY || '알림 요약'} icon={<Bell size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{STRINGS.COMMON.ALL || '전체'}</Text>
              <Text style={styles.summaryValue}>{notifications.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{STRINGS.NOTIFICATION.UNREAD || '읽지 않음'}</Text>
              <Text style={[styles.summaryValue, unreadCount > 0 && styles.summaryValueUnread]}>
                {unreadCount}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{STRINGS.NOTIFICATION.READ || '읽음'}</Text>
              <Text style={styles.summaryValue}>{notifications.length - unreadCount}</Text>
            </View>
          </View>

          {unreadCount > 0 && (
            <MGButton
              variant="secondary"
              size="small"
              fullWidth
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllButtonText}>
                {STRINGS.NOTIFICATION.MARK_ALL_READ || '모두 읽음 처리'}
              </Text>
            </MGButton>
          )}
        </DashboardSection>

        {/* 알림 목록 */}
        <DashboardSection title={STRINGS.NOTIFICATION.RECENT_NOTIFICATIONS || '최근 알림'} icon={<Bell size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {notifications.length > 0 ? (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationItemUnread,
                  ]}
                  onPress={() => !notification.read && markAsRead(notification.id)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(notification.data)}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title || STRINGS.NOTIFICATION.DEFAULT_TITLE}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.timestamp)}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View style={styles.unreadIndicator}>
                        <Circle size={SIZES.ICON.SM} color={COLORS.primary} />
                      </View>
                    )}
                  </View>

                  <Text style={styles.notificationBody} numberOfLines={2}>
                    {notification.body || STRINGS.NOTIFICATION.DEFAULT_BODY}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Bell size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>
                {STRINGS.NOTIFICATION.NO_NOTIFICATIONS || '알림 내역이 없습니다.'}
              </Text>
              <Text style={styles.emptySubText}>
                {STRINGS.NOTIFICATION.NO_NOTIFICATIONS_DESC || '새로운 알림이 도착하면 여기에 표시됩니다.'}
              </Text>
            </View>
          )}
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  summaryValueUnread: {
    color: COLORS.primary,
  },
  markAllButton: {
    marginTop: SPACING.sm,
  },
  markAllButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  notificationsList: {
    gap: SPACING.sm,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  notificationItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  notificationIcon: {
    marginRight: SPACING.sm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  notificationBody: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  unreadIndicator: {
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray400,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});

export default NotificationHistory;
