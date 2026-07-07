/**
 * 상담사 대시보드 (홈)
 * AppTopBar, 인사·요약, 미작성 일지, KPI, 다음 상담, 오늘 스케줄, 스냅샷, 빠른 액션
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
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  Users,
  Wallet,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { StatCard } from '@/components/atoms/StatCard';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import { ConsultantUrgentClientBanner } from '@/components/molecules/ConsultantUrgentClientBanner';
import {
  getConsultantScheduleCardFooterHint,
  getConsultantScheduleCardVisualTone,
  getConsultantScheduleListRowActions,
} from '@/utils/consultantScheduleCardUi';
import { QuickActionBar, type QuickAction } from '@/components/molecules/QuickActionBar';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { ConsultantNextSessionCard } from '@/components/organisms/ConsultantNextSessionCard';
import { ConsultantHomeSnapshotRow } from '@/components/organisms/ConsultantHomeSnapshotRow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { useConsultantMobileDashboard } from '@/api/hooks/useSchedules';
import {
  useConsultantHomeStats,
  useIncompleteRecords,
  useHighPriorityClients,
  useUpcomingPreparation,
} from '@/api/hooks/useConsultantHome';
import { usePendingRecords } from '@/api/hooks/useRecords';
import { useUnreadCount } from '@/api/hooks/useNotifications';
import {
  buildConversationsFromRows,
  useConversations,
  useUnreadMessageCount,
} from '@/api/hooks/useMessages';
import { useConsultantSalarySettlements } from '@/api/hooks/useConsultantSalarySettlements';
import {
  CONSULTANT_HOME_COPY,
  CONSULTANT_HOME_ROUTES,
} from '@/constants/consultantHomeCopy';
import {
  buildConsultantTodaySummary,
  resolveConsultantPendingCount,
  resolveTodayCount,
  selectConsultantHomeKpiItems,
} from '@/utils/consultantHomeKpi';
import { toClientConsultantMessagingRole } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';

function formatSalarySnapshot(
  period: string | null | undefined,
  net: number | string | null | undefined,
): { periodLabel: string; netLabel: string } | null {
  const periodLabel = toDisplayString(period, '').trim();
  const netLabel =
    net != null && String(net).trim() !== ''
      ? `${Number(net).toLocaleString('ko-KR')}원`
      : '';
  if (!periodLabel && !netLabel) {
    return null;
  }
  return {
    periodLabel: periodLabel || '최근 정산',
    netLabel: netLabel || '—',
  };
}

export default function ConsultantDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { userId } = useApiQueryReady({ requireUserId: true });

  const dashboard = useConsultantMobileDashboard(userId);
  const homeStatsQuery = useConsultantHomeStats();
  const incompleteQuery = useIncompleteRecords(userId);
  const pendingQuery = usePendingRecords(userId);
  const urgentClientsQuery = useHighPriorityClients(userId);
  const upcomingQuery = useUpcomingPreparation(userId);
  const unreadNotificationQuery = useUnreadCount();
  const unreadMessageQuery = useUnreadMessageCount();
  const conversationsQuery = useConversations('');
  const salaryQuery = useConsultantSalarySettlements({ enabled: !!userId });

  const schedules = dashboard.todaySchedules;
  const incompleteCount = incompleteQuery.data?.count ?? 0;
  const pendingCount = resolveConsultantPendingCount(
    incompleteCount,
    pendingQuery.data?.length,
    dashboard.pendingRecordCount,
  );
  const urgentClient = urgentClientsQuery.data?.[0] ?? null;
  const unreadNotificationCount = unreadNotificationQuery.data?.count ?? 0;
  const unreadMessageCount = unreadMessageQuery.data?.count ?? 0;
  const statsTodayCount = homeStatsQuery.data?.totalToday;

  const todayCount = resolveTodayCount(
    statsTodayCount ?? dashboard.todayCount,
    schedules.length,
  );
  const todaySummary = buildConsultantTodaySummary(todayCount);
  const kpiItems = useMemo(
    () =>
      selectConsultantHomeKpiItems({
        todayCount: statsTodayCount ?? dashboard.todayCount,
        scheduleLength: schedules.length,
        unreadMessageCount,
        newClientsCount: homeStatsQuery.data?.newClients,
      }),
    [
      statsTodayCount,
      dashboard.todayCount,
      schedules.length,
      unreadMessageCount,
      homeStatsQuery.data?.newClients,
    ],
  );

  const isDashboardKpiLoading = dashboard.isLoading || homeStatsQuery.isLoading;
  const isUnreadKpiLoading = unreadMessageQuery.isLoading;
  const isKpiLoading = isDashboardKpiLoading || isUnreadKpiLoading;

  const snapshotMessage = useMemo(() => {
    if (!user?.role || !userId) return null;
    const flat =
      conversationsQuery.data?.pages.flatMap((p) => ('messages' in p ? p.messages : [])) ?? [];
    const conversations = buildConversationsFromRows(
      flat,
      toClientConsultantMessagingRole(user.role),
      userId,
      '',
    );
    const first = conversations[0];
    if (!first) return null;
    return {
      partnerId: first.partnerId,
      partnerName: first.partnerName,
      lastMessage: first.lastMessage,
    };
  }, [conversationsQuery.data?.pages, user?.role, userId]);

  const snapshotSalary = useMemo(() => {
    const latest = salaryQuery.data?.[0];
    if (!latest) return null;
    return formatSalarySnapshot(
      latest.calculationPeriod ?? latest.calculationPeriodEnd,
      latest.netSalary ?? latest.totalSalary,
    );
  }, [salaryQuery.data]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetchAll(),
        homeStatsQuery.refetch(),
        incompleteQuery.refetch(),
        pendingQuery.refetch(),
        urgentClientsQuery.refetch(),
        upcomingQuery.refetch(),
        unreadNotificationQuery.refetch(),
        unreadMessageQuery.refetch(),
        conversationsQuery.refetch(),
        salaryQuery.refetch(),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    dashboard.refetchAll,
    homeStatsQuery.refetch,
    incompleteQuery.refetch,
    pendingQuery.refetch,
    urgentClientsQuery.refetch,
    upcomingQuery.refetch,
    unreadNotificationQuery.refetch,
    unreadMessageQuery.refetch,
    conversationsQuery.refetch,
    salaryQuery.refetch,
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
      {
        icon: MessageSquare,
        label: CONSULTANT_HOME_COPY.QUICK_ACTION_MESSAGES,
        onPress: () => router.push(CONSULTANT_HOME_ROUTES.MESSAGES),
      },
      {
        icon: ClipboardList,
        label: CONSULTANT_HOME_COPY.QUICK_ACTION_RECORDS,
        onPress: () => router.push(CONSULTANT_HOME_ROUTES.RECORDS),
      },
      {
        icon: Wallet,
        label: CONSULTANT_HOME_COPY.QUICK_ACTION_SALARY,
        onPress: () => router.push(CONSULTANT_HOME_ROUTES.SALARY),
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
    if (id === 'new_clients') {
      router.push('/(consultant)/(clients)/');
      return;
    }
    router.push(CONSULTANT_HOME_ROUTES.MESSAGES);
  };

  const handleScheduleNav = (scheduleId: number) => {
    router.push(`/(consultant)/(schedule)/${scheduleId}`);
  };

  const handleRecordNav = (scheduleId: number) => {
    router.push(`/(consultant)/(records)/create/${scheduleId}`);
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

        {urgentClient ? (
          <ConsultantUrgentClientBanner
            client={urgentClient}
            onPress={() =>
              router.push(`/(consultant)/(clients)/${urgentClient.clientId}`)
            }
          />
        ) : null}

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
              {[1, 2, 3].map((i) => (
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
                    ) : item.id === 'new_clients' ? (
                      <Users size={18} color={theme.colors.primary} />
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

        <ConsultantNextSessionCard
          session={upcomingQuery.data ?? null}
          isLoading={upcomingQuery.isLoading && !upcomingQuery.isFetched}
          onPressDetail={handleScheduleNav}
          onPressRecord={handleRecordNav}
        />

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

        <ConsultantHomeSnapshotRow
          message={snapshotMessage}
          salary={snapshotSalary}
          onPressMessage={() => {
            if (snapshotMessage) {
              router.push(`/(consultant)/(more)/messages/${snapshotMessage.partnerId}`);
              return;
            }
            router.push(CONSULTANT_HOME_ROUTES.MESSAGES);
          }}
          onPressSalary={() => router.push(CONSULTANT_HOME_ROUTES.SALARY)}
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
