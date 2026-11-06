/**
 * 내담자 커버 홈 v4
 *
 * 브랜드 헤더 → 다음 상담 히어로(큰 시각) → 단일 입장 CTA → 소식 배너(활성 공지 있을 때만)
 * → 알림 행 → 내 상담 회기(미결제 칩은 여기만) → 이후 일정 · 지난 상담.
 * 가로 태블릿은 좌 40% 커버 / 우 60% 시트. 예약 생성 CTA 없음.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-11-06 — 커버+챕터 v4 재구성
 */
import { useCallback, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CLINIC_OS,
  ClientHeroBlock,
  ClientScheduleListRow,
  CoverBrandHeader,
  CoverChapterSplitLayout,
  CoverGreeting,
  NotificationRows,
  ScheduleListSection,
  SessionProgressBlock,
  TintNewsBanner,
  getCoverGutter,
} from '@/components/organisms/coverChapter';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { useClientCoverData } from '@/hooks/useClientCoverData';
import { useCoverInbox } from '@/hooks/useCoverInbox';
import { useCoverLayoutMode } from '@/hooks/useCoverLayoutMode';
import { CLIENT_COVER_COPY, CLIENT_HOME_ROUTES } from '@/constants/clientHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { fontFamily, fontSize, spacing } from '@/theme';
import {
  buildClientNotificationRows,
  resolveBranchLabel,
  type CoverNotificationRow,
} from '@/utils/coverChapterViewModel';

const HOME_UPCOMING_MAX = 2;
const HOME_PAST_MAX = 1;

export default function ClientHome() {
  const router = useRouter();
  const userName = useAuthStore((s) => s.user?.name);
  const tenantName = useTenantStore((s) => s.tenantName);
  const mode = useCoverLayoutMode();
  const gutter = getCoverGutter(mode);
  const isLandscape = mode === 'tabletLandscape';

  const cover = useClientCoverData();
  const inbox = useCoverInbox('CLIENT');
  const notificationRows = buildClientNotificationRows(inbox.notificationSources, new Date());

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([cover.refetchAll(), inbox.refetchAll()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [cover, inbox]);

  const displayName = userName?.trim() || CLIENT_COVER_COPY.NAME_FALLBACK;
  const goNotifications = () => router.push(CLIENT_HOME_ROUTES.NOTIFICATIONS);
  const goSessions = () => router.push(CLIENT_HOME_ROUTES.SESSIONS);
  const goSessionDetail = (id: number) => router.push(CLIENT_HOME_ROUTES.sessionDetail(id));
  const onPressNotificationRow = (_row: CoverNotificationRow) => goNotifications();

  const heroBlock = (
    <ClientHeroBlock
      hero={cover.hero}
      isLoading={cover.isHeroLoading}
      isError={cover.isHeroError}
      size={mode === 'phone' ? 'phone' : 'tablet'}
      onEnter={goSessionDetail}
      onRetry={onRefresh}
      onEmptyAction={goNotifications}
    />
  );

  const progressBlock = (
    <SessionProgressBlock
      progress={cover.progress}
      unpaidCount={cover.unpaidCount}
      detail={cover.progressDetail}
      onPress={() => router.push(CLIENT_HOME_ROUTES.SESSIONS_PAYMENT)}
    />
  );

  const inboxBlock = (
    <View style={styles.inbox}>
      <TintNewsBanner banner={inbox.banner} onPress={goNotifications} />
      <NotificationRows
        rows={notificationRows}
        unreadCount={inbox.unreadCount}
        onPressRow={onPressNotificationRow}
        onPressAll={goNotifications}
        gutter={gutter}
      />
    </View>
  );

  const upcomingRows = cover.lists.upcoming.slice(0, HOME_UPCOMING_MAX);
  const pastRows = cover.lists.past.slice(0, HOME_PAST_MAX);
  const listsBlock = (
    <View style={styles.lists}>
      <ScheduleListSection
        title={CLIENT_COVER_COPY.UPCOMING_TITLE}
        rightLabel={
          cover.lists.upcomingTotal > 0
            ? COVER_CHAPTER_COPY.listCount(cover.lists.upcomingTotal)
            : null
        }
        onPressRight={goSessions}
        isEmpty={!cover.isListLoading && upcomingRows.length === 0}
        emptyLabel={CLIENT_COVER_COPY.UPCOMING_EMPTY}
      >
        {upcomingRows.map((s) => (
          <ClientScheduleListRow key={s.id} schedule={s} onPress={() => goSessionDetail(s.id)} />
        ))}
      </ScheduleListSection>
      <ScheduleListSection
        title={CLIENT_COVER_COPY.PAST_TITLE}
        rightLabel={CLIENT_COVER_COPY.PAST_ACTION}
        onPressRight={goSessions}
        isEmpty={!cover.isListLoading && pastRows.length === 0}
        emptyLabel={CLIENT_COVER_COPY.PAST_EMPTY}
      >
        {pastRows.map((s) => (
          <ClientScheduleListRow
            key={s.id}
            schedule={s}
            past
            onPress={() => goSessionDetail(s.id)}
          />
        ))}
      </ScheduleListSection>
    </View>
  );

  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={CLINIC_OS.teal} />
  );

  const coverPane: ReactNode = isLandscape ? (
    <View style={styles.coverPane}>
      <CoverGreeting
        title={`${CLIENT_COVER_COPY.greetingName(displayName)}${CLIENT_COVER_COPY.LANDSCAPE_NAME_SUFFIX}`}
        size="compact"
      />
      {heroBlock}
      <View style={styles.paneDivider} />
      {progressBlock}
      <Text style={styles.footnote}>{CLIENT_COVER_COPY.LANDSCAPE_FOOTNOTE}</Text>
    </View>
  ) : (
    <View style={styles.coverStack}>
      <CoverGreeting
        title={CLIENT_COVER_COPY.greetingName(displayName)}
        subtitle={CLIENT_COVER_COPY.GREETING_SUB}
      />
      {heroBlock}
    </View>
  );

  const sheetPane: ReactNode = isLandscape ? (
    <View style={styles.sheetPane}>
      {inboxBlock}
      {listsBlock}
    </View>
  ) : (
    <View style={styles.sheetStack}>
      {inboxBlock}
      <View style={[styles.bleedSheet, { marginHorizontal: -gutter, paddingHorizontal: gutter }]}>
        {progressBlock}
      </View>
      {listsBlock}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CoverChapterSplitLayout
        mode={mode}
        header={<CoverBrandHeader rightLabel={resolveBranchLabel(tenantName)} />}
        cover={coverPane}
        sheet={sheetPane}
        refreshControl={refreshControl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CLINIC_OS.cream,
  },
  coverStack: {
    gap: spacing['2xl'],
    paddingBottom: spacing.xs,
  },
  coverPane: {
    gap: spacing['2xl'],
  },
  sheetPane: {
    gap: spacing['2xl'],
  },
  sheetStack: {
    gap: spacing.lg,
  },
  inbox: {
    gap: spacing.sm,
  },
  bleedSheet: {
    backgroundColor: CLINIC_OS.sheet,
  },
  lists: {
    gap: spacing.lg,
  },
  paneDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CLINIC_OS.hairline,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
});
