/**
 * 내담자 홈 — Clinic-OS 「다음 한 장」로비 (P1)
 *
 * §1 한줄: Expo 내담자 홈 = 웹 Lobby 「다음 한 장」서사 · 앱 셸 유지.
 * Floor: KPI 3열·카운트다운 주인공·팁 지배·FadeInDown 남발 금지.
 * 정책: 직접예약 CTA 없음 · API 계약 유지 · PortOne UI 없음.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import {
  AppTopBar,
  AppTopBarNotificationPill,
} from '@/components/app-chrome/AppTopBar';
import { MGButton } from '@/components/atoms/MGButton';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyInvite } from '@/components/molecules/EmptyInvite';
import { NextSheet } from '@/components/molecules/NextSheet';
import { SoftChipRibbon } from '@/components/molecules/SoftChipRibbon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useClientDashboard, useUpcomingConsultation } from '@/api/hooks/useConsultations';
import { useUnreadCount } from '@/api/hooks/useNotifications';
import { useRandomWellnessTip } from '@/api/hooks/useWellness';
import { CLIENT_HOME_COPY, CLIENT_HOME_ROUTES } from '@/constants/clientHomeCopy';
import { TabletContentShell } from '@/components/layout/TabletContentShell';
import {
  buildLobbySoftChips,
  formatLobbyDatetime,
  formatLobbyGreetingSubtitle,
  formatLobbyMeta,
  formatLobbyTodayLabel,
  isLobbyTabletLandscape,
  truncateLobbyTip,
} from '@/utils/clientHomeLobby';

export default function ClientHome() {
  const theme = useTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const landscape = isLobbyTabletLandscape(width, height);
  const user = useAuthStore((s) => s.user);

  const dashboardQuery = useClientDashboard();
  const upcomingQuery = useUpcomingConsultation();
  const tipQuery = useRandomWellnessTip();
  const unreadQuery = useUnreadCount();
  const unreadCount = unreadQuery.data?.count ?? 0;

  const isUpcomingLoading =
    upcomingQuery.isLoading && !upcomingQuery.isError && !upcomingQuery.isFetched;
  const isDashboardLoading =
    dashboardQuery.isLoading && !dashboardQuery.isError && !dashboardQuery.isFetched;
  const isTipLoading = tipQuery.isLoading && !tipQuery.isError && !tipQuery.isFetched;

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        dashboardQuery.refetch(),
        upcomingQuery.refetch(),
        tipQuery.refetch(),
        unreadQuery.refetch(),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [dashboardQuery, upcomingQuery, tipQuery, unreadQuery]);

  const upcoming = upcomingQuery.data;
  const remainingSessions = dashboardQuery.data?.remainingSessions ?? 0;
  const tip = tipQuery.data;
  const displayName = user?.name?.trim() || '내담자';

  const greetingSubtitle = useMemo(
    () =>
      formatLobbyGreetingSubtitle({
        todayLabel: formatLobbyTodayLabel(),
        upcoming: upcoming ?? null,
      }),
    [upcoming],
  );

  const softChips = useMemo(
    () =>
      buildLobbySoftChips({
        remainingSessions,
        upcoming: upcoming ?? null,
      }),
    [remainingSessions, upcoming],
  );

  const tipLine = useMemo(() => {
    if (isTipLoading) return null;
    const raw = tip?.title || tip?.description;
    const body = truncateLobbyTip(raw);
    if (body === CLIENT_HOME_COPY.TIP_FALLBACK) return body;
    return `${CLIENT_HOME_COPY.TIP_PREFIX}${body}`;
  }, [isTipLoading, tip]);

  const nextSheetBlock = (() => {
    if (isUpcomingLoading || isDashboardLoading) {
      return <SkeletonCard style={styles.sheetSkeleton} />;
    }
    /** 회기 0 → EmptyInvite (회기 고르기·결제하기 · 예약하기 없음) */
    if (remainingSessions === 0) {
      return <EmptyInvite />;
    }
    if (upcoming) {
      return (
        <NextSheet
          title={CLIENT_HOME_COPY.NEXT_SHEET_TITLE}
          datetime={formatLobbyDatetime(upcoming)}
          meta={formatLobbyMeta(upcoming)}
          note={upcoming.notes || upcoming.memo || CLIENT_HOME_COPY.NEXT_SHEET_NOTE}
          cta={
            <MGButton
              label={CLIENT_HOME_COPY.NEXT_SHEET_CTA}
              variant="primary"
              onPress={() => router.push(`/(client)/(sessions)/${upcoming.id}`)}
            />
          }
        />
      );
    }
    /** 회기 있음·예정 없음 — 입구 CTA 없이 로비만 (직접예약 금지) */
    return (
      <NextSheet
        title={CLIENT_HOME_COPY.NO_UPCOMING_META}
        meta={CLIENT_HOME_COPY.NO_UPCOMING_SHEET_META}
      />
    );
  })();

  const tipBlock =
    tipLine != null ? (
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: theme.colors.mute,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.xs,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.lineWarm,
        }}
      >
        {tipLine}
      </Text>
    ) : (
      <SkeletonCard lines={1} style={styles.tipSkeleton} />
    );

  /** 결제 CTA·판매자 푸터 — 빈 슬롯만 (카피·PortOne UI 금지) */
  const sellerSlot = (
    <View
      style={[
        styles.sellerSlot,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          minHeight: theme.spacing['3xl'],
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );

  const greetBlock = (
    <View style={styles.greetingSection}>
      <Text
        style={{
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize['2xl'],
          color: theme.colors.textMain,
          letterSpacing: -0.56,
        }}
        accessibilityRole="header"
      >
        {CLIENT_HOME_COPY.GREETING(displayName)}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
          color: theme.colors.mute,
          marginTop: theme.spacing.sm,
        }}
      >
        {greetingSubtitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: theme.colors.bgMain,
          ...(Platform.OS === 'web'
            ? ({ minHeight: '100dvh' } as object)
            : null),
        },
      ]}
      edges={['top']}
    >
      <AppTopBar
        title={CLIENT_HOME_COPY.TOP_BAR_TITLE}
        rightAction={
          <AppTopBarNotificationPill
            unreadCount={unreadCount}
            onPress={() => router.push(CLIENT_HOME_ROUTES.NOTIFICATIONS)}
          />
        }
      />

      <TabletContentShell>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            landscape ? styles.scrollLandscape : null,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {landscape ? (
            <>
              <View style={styles.colMain}>
                {greetBlock}
                {nextSheetBlock}
                {tipBlock}
              </View>
              <View style={styles.colSide}>
                <SoftChipRibbon items={softChips} />
                {sellerSlot}
              </View>
            </>
          ) : (
            <>
              {greetBlock}
              {nextSheetBlock}
              <SoftChipRibbon items={softChips} />
              {tipBlock}
              {sellerSlot}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </TabletContentShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? ({ minHeight: '100vh' } as object)
      : null),
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  scrollLandscape: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    gap: 20,
  },
  colMain: {
    flex: 1.25,
    minWidth: 0,
  },
  colSide: {
    flex: 0.9,
    minWidth: 0,
  },
  greetingSection: {
    marginBottom: 18,
  },
  sheetSkeleton: {
    marginBottom: 16,
    minHeight: 160,
  },
  tipSkeleton: {
    marginTop: 8,
  },
  sellerSlot: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  bottomSpacer: {
    height: 24,
  },
});
