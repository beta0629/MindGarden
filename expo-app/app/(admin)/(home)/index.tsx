/**
 * 어드민·스태프 홈 — 알림·오늘 일정·탭 바로가기
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, Calendar, LayoutGrid, MessageSquare, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { StatCard } from '@/components/atoms/StatCard';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { QuickActionBar, type QuickAction } from '@/components/molecules/QuickActionBar';
import { useAdminMobileDashboard } from '@/api/hooks/useAdminDashboard';
import { ADMIN_MOBILE_HOME_COPY } from '@/constants/adminMobileScreensCopy';
import { toDisplayString } from '@/utils/safeDisplay';

const TODAY_LABEL = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

export default function AdminHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dashboard = useAdminMobileDashboard();

  const isRefreshing = dashboard.notificationsLoading || dashboard.schedulesLoading;

  const onRefresh = useCallback(() => {
    dashboard.refetchAll();
  }, [dashboard]);

  const quickActions: QuickAction[] = [
    {
      icon: MessageSquare,
      label: ADMIN_MOBILE_HOME_COPY.LINK_MESSAGES,
      onPress: () => router.push('/(admin)/(messages)'),
    },
    {
      icon: LayoutGrid,
      label: ADMIN_MOBILE_HOME_COPY.LINK_OPERATION,
      onPress: () => router.push('/(admin)/(operation)'),
    },
    {
      icon: MoreHorizontal,
      label: ADMIN_MOBILE_HOME_COPY.LINK_MORE,
      onPress: () => router.push('/(admin)/(more)'),
    },
    {
      icon: Bell,
      label: ADMIN_MOBILE_HOME_COPY.LINK_NOTIFICATIONS,
      onPress: () => router.push('/(admin)/(more)/notification-settings'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize['2xl'],
            marginTop: theme.spacing.xl,
          }}
          accessibilityRole="header"
        >
          {ADMIN_MOBILE_HOME_COPY.GREETING}, {toDisplayString(dashboard.userDisplayName, '관리자')}
          님
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.xs,
          }}
        >
          {TODAY_LABEL}
        </Text>
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            marginTop: theme.spacing.sm,
          }}
        >
          {ADMIN_MOBILE_HOME_COPY.TENANT_LABEL}: {toDisplayString(dashboard.tenantName, '—')}
        </Text>

        <View style={[styles.statsRow, { marginTop: theme.spacing.xl, gap: theme.spacing.md }]}>
          {dashboard.notificationsLoading ? (
            <SkeletonCard />
          ) : (
            <StatCard
              style={styles.statFlex}
              showAccentBar
              label={ADMIN_MOBILE_HOME_COPY.UNREAD_NOTIFICATIONS}
              value={dashboard.unreadNotificationCount}
              unit="건"
              icon={<Bell size={20} color={theme.colors.primary} />}
              onPress={() => router.push('/(admin)/(more)/notification-settings')}
            />
          )}
          {dashboard.schedulesLoading ? (
            <SkeletonCard />
          ) : (
            <StatCard
              style={styles.statFlex}
              showAccentBar
              label={ADMIN_MOBILE_HOME_COPY.TODAY_SCHEDULES}
              value={dashboard.todayScheduleCount}
              unit="건"
              icon={<Calendar size={20} color={theme.colors.primary} />}
              onPress={() => router.push('/(admin)/(operation)/schedule')}
            />
          )}
        </View>

        <Pressable
          onPress={() => router.push('/(admin)/(operation)/schedule')}
          style={[
            styles.scheduleLink,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.borderRadius.xl,
              marginTop: theme.spacing.lg,
              padding: theme.spacing.lg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="오늘 일정 상세 보기"
        >
          <Calendar size={20} color={theme.colors.primary} />
          <Text
            style={{
              flex: 1,
              marginLeft: theme.spacing.sm,
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            스케줄 라이트에서 오늘 일정 보기
          </Text>
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            &gt;
          </Text>
        </Pressable>

        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginTop: theme.spacing['2xl'],
            marginBottom: theme.spacing.md,
          }}
        >
          {ADMIN_MOBILE_HOME_COPY.QUICK_LINKS_TITLE}
        </Text>
        <QuickActionBar actions={quickActions} />
        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statFlex: {
    flex: 1,
  },
  scheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
