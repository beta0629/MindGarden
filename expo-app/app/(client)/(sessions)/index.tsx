/**
 * 내담자 예약 챕터 v4 — 다음 상담 히어로 · 입장 CTA · 잔여 회기 요약 · 예정 / 지난 상담.
 *
 * 소식 배너·알림 행은 두지 않는다. 미결제 칩은 잔여 회기 요약 행에서만 노출한다.
 * 예약 생성 CTA 없음 — 변경은 센터 문의 안내만.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-11-06 — 커버+챕터 v4 재구성 (세그먼트 탭 → 예정/지난 섹션)
 */
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CLINIC_OS,
  COVER_METRICS,
  ClientHeroBlock,
  ClientScheduleListRow,
  CoverBrandHeader,
  CoverChapterSplitLayout,
  CoverGreeting,
  CoverInlineEmpty,
  ScheduleListSection,
  SessionProgressBlock,
} from '@/components/organisms/coverChapter';
import { useTenantStore } from '@/stores/useTenantStore';
import { useClientCoverData } from '@/hooks/useClientCoverData';
import { useCoverLayoutMode } from '@/hooks/useCoverLayoutMode';
import { CLIENT_HOME_ROUTES, CLIENT_SCHEDULE_CHAPTER_COPY } from '@/constants/clientHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { fontFamily, fontSize, spacing } from '@/theme';
import { formatChapterDateHeading, resolveBranchLabel } from '@/utils/coverChapterViewModel';

export default function ClientSessions() {
  const router = useRouter();
  const tenantName = useTenantStore((s) => s.tenantName);
  const mode = useCoverLayoutMode();
  const isLandscape = mode === 'tabletLandscape';

  const cover = useClientCoverData();
  const { lists } = cover;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await cover.refetchAll();
    } finally {
      setIsRefreshing(false);
    }
  }, [cover]);

  const goSessionDetail = (id: number) => router.push(CLIENT_HOME_ROUTES.sessionDetail(id));
  const goNotifications = () => router.push(CLIENT_HOME_ROUTES.NOTIFICATIONS);

  const heroBlock = (
    <ClientHeroBlock
      hero={cover.hero}
      isLoading={cover.isHeroLoading}
      isError={cover.isHeroError}
      size={mode === 'phone' ? 'phone' : 'tablet'}
      eyebrowOverride={
        cover.heroSchedule
          ? formatChapterDateHeading(cover.heroSchedule.date, new Date())
          : undefined
      }
      onEnter={goSessionDetail}
      onRetry={onRefresh}
      onEmptyAction={goNotifications}
    />
  );

  const summaryBlock = (
    <SessionProgressBlock
      variant="summary"
      progress={cover.progress}
      unpaidCount={cover.unpaidCount}
      trailingLabel={CLIENT_SCHEDULE_CHAPTER_COPY.upcomingCount(lists.upcomingTotal)}
      onPress={() => router.push(CLIENT_HOME_ROUTES.SESSIONS_PAYMENT)}
    />
  );

  const footnote = <Text style={styles.footnote}>{CLIENT_SCHEDULE_CHAPTER_COPY.FOOTNOTE}</Text>;

  const loadMore = cover.hasMorePast ? (
    <Pressable
      onPress={cover.fetchMore}
      disabled={cover.isFetchingMore}
      accessibilityRole="button"
      accessibilityLabel={CLIENT_SCHEDULE_CHAPTER_COPY.LOAD_MORE}
      accessibilityState={{ busy: cover.isFetchingMore }}
      style={({ pressed }) => [styles.loadMore, pressed ? styles.pressed : null]}
    >
      {cover.isFetchingMore ? (
        <ActivityIndicator color={CLINIC_OS.teal} />
      ) : (
        <Text style={styles.loadMoreText}>{CLIENT_SCHEDULE_CHAPTER_COPY.LOAD_MORE}</Text>
      )}
    </Pressable>
  ) : null;

  const listsBlock = cover.isListError ? (
    <CoverInlineEmpty
      label={CLIENT_SCHEDULE_CHAPTER_COPY.LIST_ERROR_TITLE}
      actionLabel={CLIENT_SCHEDULE_CHAPTER_COPY.LIST_ERROR_ACTION}
      onAction={onRefresh}
    />
  ) : (
    <View style={styles.lists}>
      <ScheduleListSection
        title={CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_TITLE}
        rightLabel={lists.upcomingTotal > 1 ? CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_SORT : null}
        isEmpty={!cover.isListLoading && lists.upcoming.length === 0}
        emptyLabel={CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_EMPTY}
      >
        {lists.upcoming.map((s) => (
          <ClientScheduleListRow
            key={s.id}
            schedule={s}
            showInitial
            onPress={() => goSessionDetail(s.id)}
          />
        ))}
      </ScheduleListSection>
      <ScheduleListSection
        title={CLIENT_SCHEDULE_CHAPTER_COPY.PAST_TITLE}
        rightLabel={lists.pastTotal > 0 ? COVER_CHAPTER_COPY.listCount(lists.pastTotal) : null}
        isEmpty={!cover.isListLoading && lists.past.length === 0 && !cover.hasMorePast}
        emptyLabel={CLIENT_SCHEDULE_CHAPTER_COPY.PAST_EMPTY}
        footer={loadMore}
      >
        {lists.past.map((s) => (
          <ClientScheduleListRow
            key={s.id}
            schedule={s}
            past
            showInitial
            onPress={() => goSessionDetail(s.id)}
          />
        ))}
      </ScheduleListSection>
    </View>
  );

  const greeting = (
    <CoverGreeting
      title={CLIENT_SCHEDULE_CHAPTER_COPY.TITLE}
      subtitle={CLIENT_SCHEDULE_CHAPTER_COPY.SUBTITLE}
      size={isLandscape ? 'compact' : 'cover'}
    />
  );

  const coverPane: ReactNode = isLandscape ? (
    <View style={styles.pane}>
      {greeting}
      {heroBlock}
      {summaryBlock}
      {footnote}
    </View>
  ) : (
    <View style={styles.pane}>
      {greeting}
      {heroBlock}
    </View>
  );

  const sheetPane: ReactNode = isLandscape ? (
    <View style={styles.pane}>{listsBlock}</View>
  ) : (
    <View style={styles.sheetStack}>
      {summaryBlock}
      {listsBlock}
      {footnote}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CoverChapterSplitLayout
        mode={mode}
        header={<CoverBrandHeader rightLabel={resolveBranchLabel(tenantName)} />}
        cover={coverPane}
        sheet={sheetPane}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={CLINIC_OS.teal}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CLINIC_OS.cream,
  },
  pane: {
    gap: spacing['2xl'],
  },
  sheetStack: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  lists: {
    gap: spacing.lg,
  },
  loadMore: {
    minHeight: COVER_METRICS.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  loadMoreText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: CLINIC_OS.teal,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
});
