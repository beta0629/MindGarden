/**
 * 어드민·스태프 홈 — AppTopBar·KPI 스트립·오늘 일정 미리보기·빠른 액션
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, Calendar, CalendarPlus, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { StatCard } from '@/components/atoms/StatCard';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { AdminTodaySchedulePreview } from '@/components/molecules/AdminTodaySchedulePreview';
import { QuickActionBar, type QuickAction } from '@/components/molecules/QuickActionBar';
import { useAdminMobileDashboard } from '@/api/hooks/useAdminDashboard';
import { ADMIN_HOME_ROUTES, ADMIN_MOBILE_HOME_COPY } from '@/constants/adminHomeCopy';
import { buildAdminHomeSummaryLine } from '@/utils/adminHomeKpi';
import { toDisplayString } from '@/utils/safeDisplay';

const TODAY_LABEL = format(new Date(), 'yyyy년 M월 d일 (EEEE)', { locale: ko });

export default function AdminHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dashboard = useAdminMobileDashboard();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await dashboard.refetchAll();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [dashboard.refetchAll]);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        icon: CalendarPlus,
        label: ADMIN_MOBILE_HOME_COPY.QUICK_CREATE_SCHEDULE,
        onPress: () => router.push(ADMIN_HOME_ROUTES.CREATE_SCHEDULE),
      },
      {
        icon: Calendar,
        label: ADMIN_MOBILE_HOME_COPY.QUICK_SCHEDULE,
        onPress: () => router.push(ADMIN_HOME_ROUTES.SCHEDULE),
      },
      {
        icon: MessageSquare,
        label: ADMIN_MOBILE_HOME_COPY.QUICK_MESSAGES,
        onPress: () => router.push(ADMIN_HOME_ROUTES.MESSAGES),
      },
    ],
    [router],
  );

  const isKpiLoading = dashboard.notificationsLoading || dashboard.schedulesLoading;
  const summaryLine = buildAdminHomeSummaryLine(dashboard.todayScheduleCount, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar
        title={ADMIN_MOBILE_HOME_COPY.TITLE}
        rightAction={
          <Pressable
            onPress={() => router.push(ADMIN_HOME_ROUTES.NOTIFICATION_SETTINGS)}
            accessibilityRole="button"
            accessibilityLabel={ADMIN_MOBILE_HOME_COPY.LINK_NOTIFICATIONS}
            hitSlop={8}
            style={styles.topBarIcon}
          >
            <View>
              <Bell size={22} color={theme.colors.textMain} />
              {dashboard.unreadNotificationCount > 0 ? (
                <View style={[styles.notificationDot, { backgroundColor: theme.colors.error }]} />
              ) : null}
            </View>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['2xl'],
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
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            {summaryLine}
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
        </View>

        <View style={styles.section}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginBottom: theme.spacing.md,
            }}
          >
            {ADMIN_MOBILE_HOME_COPY.KPI_SECTION_TITLE}
          </Text>
          {isKpiLoading ? (
            <View style={styles.statRow}>
              {[1, 2].map((i) => (
                <SkeletonLoader key={i} width={110} height={80} borderRadius={16} />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statRow}
            >
              <StatCard
                label={ADMIN_MOBILE_HOME_COPY.UNREAD_NOTIFICATIONS}
                value={dashboard.unreadNotificationCount}
                unit={ADMIN_MOBILE_HOME_COPY.UNIT_COUNT}
                icon={<Bell size={18} color={theme.colors.primary} />}
                style={styles.statCard}
                showAccentBar
                onPress={() => router.push(ADMIN_HOME_ROUTES.NOTIFICATION_SETTINGS)}
              />
              <StatCard
                label={ADMIN_MOBILE_HOME_COPY.TODAY_SCHEDULES}
                value={dashboard.todayScheduleCount}
                unit={ADMIN_MOBILE_HOME_COPY.UNIT_COUNT}
                icon={<Calendar size={18} color={theme.colors.primary} />}
                style={styles.statCard}
                showAccentBar
                onPress={() => router.push(ADMIN_HOME_ROUTES.SCHEDULE)}
              />
            </ScrollView>
          )}
        </View>

        <AdminTodaySchedulePreview
          schedules={dashboard.todaySchedules}
          totalCount={dashboard.todayScheduleCount}
          isLoading={dashboard.schedulesLoading}
        />

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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  greetingSection: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  statCard: {
    minWidth: 110,
  },
  topBarIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
