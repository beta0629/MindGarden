/**
 * 상담사 대시보드 (홈)
 * AppTopBar, 인사·요약, 미작성 일지, KPI, 오늘 스케줄, 빠른 액션
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md
 */
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  Calendar,
  CalendarPlus,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { StatCard } from '@/components/atoms/StatCard';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import {
  getConsultantScheduleCardFooterHint,
  getConsultantScheduleCardVisualTone,
  getConsultantScheduleListRowActions,
} from '@/utils/consultantScheduleCardUi';
import { QuickActionBar, type QuickAction } from '@/components/molecules/QuickActionBar';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useAuthStore } from '@/stores/useAuthStore';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { useConsultantMobileDashboard } from '@/api/hooks/useSchedules';
import { usePendingRecords } from '@/api/hooks/useRecords';
import { useUnreadCount } from '@/api/hooks/useNotifications';
import { useUnreadMessageCount } from '@/api/hooks/useMessages';
import {
  CONSULTANT_HOME_COPY,
  CONSULTANT_HOME_ROUTES,
} from '@/constants/consultantHomeCopy';
import {
  buildConsultantTodaySummary,
  resolveTodayCount,
  selectConsultantHomeKpiItems,
} from '@/utils/consultantHomeKpi';

export default function ConsultantDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { userId } = useApiQueryReady({ requireUserId: true });

  const dashboard = useConsultantMobileDashboard(userId);
  const pendingQuery = usePendingRecords(userId);
  const unreadNotificationQuery = useUnreadCount();
  const unreadMessageQuery = useUnreadMessageCount();

  const schedules = dashboard.todaySchedules;
  const pendingCount = pendingQuery.data?.length ?? dashboard.pendingRecordCount;
  const unreadNotificationCount = unreadNotificationQuery.data?.count ?? 0;
  const unreadMessageCount = unreadMessageQuery.data?.count ?? 0;

  const todayCount = resolveTodayCount(dashboard.todayCount, schedules.length);
  const todaySummary = buildConsultantTodaySummary(todayCount);
  const kpiItems = useMemo(
    () =>
      selectConsultantHomeKpiItems({
        todayCount: dashboard.todayCount,
        scheduleLength: schedules.length,
        unreadMessageCount,
      }),
    [dashboard.todayCount, schedules.length, unreadMessageCount],
  );

  const isDashboardKpiLoading = dashboard.isLoading;
  const isUnreadKpiLoading = unreadMessageQuery.isLoading;
  const isKpiLoading = isDashboardKpiLoading || isUnreadKpiLoading;

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetchAll(),
        pendingQuery.refetch(),
        unreadNotificationQuery.refetch(),
        unreadMessageQuery.refetch(),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    dashboard.refetchAll,
    pendingQuery.refetch,
    unreadNotificationQuery.refetch,
    unreadMessageQuery.refetch,
  ]);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        icon: CalendarPlus,
        label: CONSULTANT_HOME_COPY.QUICK_ACTION_SCHEDULE,
        onPress: () => router.push(CONSULTANT_HOME_ROUTES.SCHEDULE),
      },
      {
        icon: Clock,
        label: CONSULTANT_HOME_COPY.QUICK_ACTION_AVAILABILITY,
        onPress: () => router.push(CONSULTANT_HOME_ROUTES.AVAILABILITY),
      },
    ],
    [router],
  );

  const handlePendingPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(CONSULTANT_HOME_ROUTES.RECORDS);
  };

  const handleKpiPress = (id: (typeof kpiItems)[number]['id']) => {
    if (id === 'today_sessions') {
      router.push(CONSULTANT_HOME_ROUTES.SCHEDULE);
      return;
    }
    router.push(CONSULTANT_HOME_ROUTES.MESSAGES);
  };

  const displayName = user?.name ?? CONSULTANT_HOME_COPY.GREETING_FALLBACK_NAME;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar
        title={CONSULTANT_HOME_COPY.TOP_BAR_TITLE}
        rightAction={
          <Pressable
            onPress={() => router.push(CONSULTANT_HOME_ROUTES.NOTIFICATIONS)}
            accessibilityRole="button"
            accessibilityLabel={CONSULTANT_HOME_COPY.NOTIFICATIONS_A11Y}
            hitSlop={8}
            style={styles.topBarIcon}
          >
            <View>
              <Bell size={22} color={theme.colors.textMain} />
              {unreadNotificationCount > 0 ? (
                <View
                  style={[styles.notificationDot, { backgroundColor: theme.colors.error }]}
                />
              ) : null}
            </View>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 인사 + 오늘 N건 요약 */}
        <View style={[styles.greeting, { marginTop: theme.spacing.md }]}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['2xl'],
            }}
            accessibilityRole="header"
          >
            {CONSULTANT_HOME_COPY.GREETING(displayName)}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            {todaySummary}
          </Text>
        </View>

        {/* 미작성 일지 배너 */}
        {pendingCount > 0 ? (
          <Pressable
            onPress={handlePendingPress}
            style={[
              styles.alertBanner,
              {
                backgroundColor: theme.colors.error + '15',
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={CONSULTANT_HOME_COPY.PENDING_BANNER_A11Y(pendingCount)}
          >
            <AlertTriangle size={20} color={theme.colors.error} />
            <Text
              style={[
                styles.alertText,
                {
                  color: theme.colors.error,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  marginLeft: theme.spacing.sm,
                },
              ]}
            >
              {CONSULTANT_HOME_COPY.PENDING_BANNER(pendingCount)}
            </Text>
            <Text
              style={{
                color: theme.colors.error,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              }}
            >
              {CONSULTANT_HOME_COPY.PENDING_BANNER_CTA}
            </Text>
          </Pressable>
        ) : null}

        {/* KPI 스트립 */}
        <View style={[styles.section, { marginTop: theme.spacing.lg }]}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginBottom: theme.spacing.md,
            }}
          >
            {CONSULTANT_HOME_COPY.KPI_SECTION_TITLE}
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
              {kpiItems.map((item) => (
                <StatCard
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  unit={item.unit}
                  icon={
                    item.id === 'today_sessions' ? (
                      <Calendar size={18} color={theme.colors.primary} />
                    ) : (
                      <MessageSquare size={18} color={theme.colors.primary} />
                    )
                  }
                  style={styles.statCard}
                  onPress={() => handleKpiPress(item.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* 오늘의 스케줄 */}
        <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
            }}
          >
            {CONSULTANT_HOME_COPY.SCHEDULE_SECTION_TITLE}
            {!dashboard.isLoading ? ` (${schedules.length}건)` : ''}
          </Text>
          <Pressable
            onPress={() => router.push(CONSULTANT_HOME_ROUTES.SCHEDULE)}
            accessibilityRole="button"
            accessibilityLabel={CONSULTANT_HOME_COPY.SCHEDULE_VIEW_ALL_A11Y}
            hitSlop={8}
            style={styles.viewAllButton}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              }}
            >
              {CONSULTANT_HOME_COPY.SCHEDULE_VIEW_ALL}
            </Text>
          </Pressable>
        </View>

        {dashboard.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_TITLE}
            description={CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_DESCRIPTION}
            actionLabel={CONSULTANT_HOME_COPY.EMPTY_SCHEDULE_ACTION}
            onAction={() => router.push(CONSULTANT_HOME_ROUTES.SCHEDULE)}
          />
        ) : (
          <View style={styles.listWrapper}>
            <FlashList
              data={schedules}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item, index }) => {
                const nav = () => router.push(`/(consultant)/(schedule)/${item.id}`);
                const row = getConsultantScheduleListRowActions(item, nav);
                const hint = getConsultantScheduleCardFooterHint(item);
                const tone = getConsultantScheduleCardVisualTone(item);
                return (
                  <ScheduleCard
                    time={`${item.startTime} - ${item.endTime}`}
                    clientName={`${item.clientName} 님`}
                    sessionType={item.consultationType}
                    status={item.status}
                    index={index}
                    containerOpacity={tone.containerOpacity}
                    footerHint={hint.text}
                    onPress={nav}
                    actionLabel={row.primaryActionLabel}
                    onActionPress={row.onPrimaryAction}
                  />
                );
              }}
            />
          </View>
        )}

        {/* 빠른 액션 */}
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginTop: theme.spacing['2xl'],
            marginBottom: theme.spacing.md,
          }}
        >
          {CONSULTANT_HOME_COPY.QUICK_ACTIONS_TITLE}
        </Text>
        <QuickActionBar actions={quickActions} />

        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  greeting: {},
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllButton: {
    minHeight: ADMIN_MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  listWrapper: {
    minHeight: 100,
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
    width: ADMIN_MIN_TOUCH_TARGET,
    height: ADMIN_MIN_TOUCH_TARGET,
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
