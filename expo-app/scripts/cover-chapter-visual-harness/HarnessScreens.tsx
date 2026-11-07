/**
 * 하네스 화면 조립 — `app/(client)/(home)` · `app/(client)/(sessions)` · `app/(consultant)/(home)` 의
 * 블록 구조를 그대로 옮기고, 데이터 훅·라우터만 HARVEST 픽스처 뷰와 no-op 으로 바꾼다.
 * 컴포넌트는 전부 `@/components/organisms/coverChapter` 실구현을 쓴다. 앱 라우트에 등록하지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import type { ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import {
  CLINIC_OS,
  ClientHeroBlock,
  ClientScheduleListRow,
  CounselorScheduleListRow,
  CoverBrandHeader,
  CoverChapterSplitLayout,
  CoverGreeting,
  CoverHeroEmpty,
  NextSessionHero,
  NotificationRows,
  PrimaryEntryCta,
  ScheduleListRow,
  ScheduleListSection,
  SessionProgressBlock,
  TintNewsBanner,
  getCoverGutter,
} from '@/components/organisms/coverChapter';
import { useCoverLayoutMode } from '@/hooks/useCoverLayoutMode';
import { CLIENT_COVER_COPY, CLIENT_SCHEDULE_CHAPTER_COPY } from '@/constants/clientHomeCopy';
import { CONSULTANT_COVER_COPY } from '@/constants/consultantHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { fontFamily, fontSize, spacing } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';
import { formatChapterDateHeading, formatListDateParts } from '@/utils/coverChapterViewModel';
import type { ClientHarnessView, CounselorHarnessView } from './harnessFixtures';

const HOME_UPCOMING_MAX = 2;
const HOME_PAST_MAX = 1;
const RECORDS_LIST_MAX = 3;

export const HARNESS_TEST_ID = {
  SAFE_AREA: 'harness-safe-area',
  BRAND_HEADER: 'harness-brand-header',
} as const;

const noop = () => undefined;

function HarnessHeader({ rightLabel }: Readonly<{ rightLabel: string | null }>) {
  return (
    <View testID={HARNESS_TEST_ID.BRAND_HEADER}>
      <CoverBrandHeader rightLabel={rightLabel} />
    </View>
  );
}

function harnessRefreshControl() {
  return <RefreshControl refreshing={false} onRefresh={noop} tintColor={CLINIC_OS.teal} />;
}

export function HarnessClientHome({ view }: Readonly<{ view: ClientHarnessView }>) {
  const mode = useCoverLayoutMode();
  const gutter = getCoverGutter(mode);
  const isLandscape = mode === 'tabletLandscape';

  const heroBlock = (
    <ClientHeroBlock
      hero={view.hero}
      isLoading={false}
      isError={false}
      size={mode === 'phone' ? 'phone' : 'tablet'}
      onEnter={noop}
      onRetry={noop}
      onEmptyAction={noop}
    />
  );

  const progressBlock = (
    <SessionProgressBlock
      progress={view.progress}
      unpaidCount={view.unpaidCount}
      detail={view.progressDetail}
      onPress={noop}
    />
  );

  const inboxBlock = (
    <View style={styles.inbox}>
      <TintNewsBanner banner={view.banner} onPress={noop} />
      <NotificationRows
        rows={view.notificationRows}
        unreadCount={view.unreadCount}
        onPressRow={noop}
        onPressAll={noop}
        gutter={gutter}
      />
    </View>
  );

  const upcomingRows = view.lists.upcoming.slice(0, HOME_UPCOMING_MAX);
  const pastRows = view.lists.past.slice(0, HOME_PAST_MAX);
  const listsBlock = (
    <View style={styles.lists}>
      <ScheduleListSection
        title={CLIENT_COVER_COPY.UPCOMING_TITLE}
        rightLabel={
          view.lists.upcomingTotal > 0
            ? COVER_CHAPTER_COPY.listCount(view.lists.upcomingTotal)
            : null
        }
        onPressRight={noop}
        isEmpty={upcomingRows.length === 0}
        emptyLabel={CLIENT_COVER_COPY.UPCOMING_EMPTY}
      >
        {upcomingRows.map((s) => (
          <ClientScheduleListRow key={s.id} schedule={s} onPress={noop} />
        ))}
      </ScheduleListSection>
      <ScheduleListSection
        title={CLIENT_COVER_COPY.PAST_TITLE}
        rightLabel={CLIENT_COVER_COPY.PAST_ACTION}
        onPressRight={noop}
        isEmpty={pastRows.length === 0}
        emptyLabel={CLIENT_COVER_COPY.PAST_EMPTY}
      >
        {pastRows.map((s) => (
          <ClientScheduleListRow key={s.id} schedule={s} past onPress={noop} />
        ))}
      </ScheduleListSection>
    </View>
  );

  const coverPane: ReactNode = isLandscape ? (
    <View style={styles.coverPane}>
      <CoverGreeting
        title={`${CLIENT_COVER_COPY.greetingName(view.displayName)}${CLIENT_COVER_COPY.LANDSCAPE_NAME_SUFFIX}`}
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
        title={CLIENT_COVER_COPY.greetingName(view.displayName)}
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
    <SafeAreaView
      testID={HARNESS_TEST_ID.SAFE_AREA}
      style={styles.safe}
      edges={['top', 'left', 'right']}
    >
      <CoverChapterSplitLayout
        mode={mode}
        header={<HarnessHeader rightLabel={view.branchLabel} />}
        cover={coverPane}
        sheet={sheetPane}
        refreshControl={harnessRefreshControl()}
      />
    </SafeAreaView>
  );
}

export function HarnessClientSchedule({
  view,
  now,
}: Readonly<{ view: ClientHarnessView; now: Date }>) {
  const mode = useCoverLayoutMode();
  const isLandscape = mode === 'tabletLandscape';
  const { lists } = view;

  const heroBlock = (
    <ClientHeroBlock
      hero={view.hero}
      isLoading={false}
      isError={false}
      size={mode === 'phone' ? 'phone' : 'tablet'}
      eyebrowOverride={
        view.heroSchedule ? formatChapterDateHeading(view.heroSchedule.date, now) : undefined
      }
      onEnter={noop}
      onRetry={noop}
      onEmptyAction={noop}
    />
  );

  const summaryBlock = (
    <SessionProgressBlock
      variant="summary"
      progress={view.progress}
      unpaidCount={view.unpaidCount}
      trailingLabel={CLIENT_SCHEDULE_CHAPTER_COPY.upcomingCount(lists.upcomingTotal)}
      onPress={noop}
    />
  );

  const footnote = <Text style={styles.footnote}>{CLIENT_SCHEDULE_CHAPTER_COPY.FOOTNOTE}</Text>;

  const listsBlock = (
    <View style={styles.lists}>
      <ScheduleListSection
        title={CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_TITLE}
        rightLabel={lists.upcomingTotal > 1 ? CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_SORT : null}
        isEmpty={lists.upcoming.length === 0}
        emptyLabel={CLIENT_SCHEDULE_CHAPTER_COPY.UPCOMING_EMPTY}
      >
        {lists.upcoming.map((s) => (
          <ClientScheduleListRow key={s.id} schedule={s} showInitial onPress={noop} />
        ))}
      </ScheduleListSection>
      <ScheduleListSection
        title={CLIENT_SCHEDULE_CHAPTER_COPY.PAST_TITLE}
        rightLabel={lists.pastTotal > 0 ? COVER_CHAPTER_COPY.listCount(lists.pastTotal) : null}
        isEmpty={lists.past.length === 0 && !view.hasMorePast}
        emptyLabel={CLIENT_SCHEDULE_CHAPTER_COPY.PAST_EMPTY}
      >
        {lists.past.map((s) => (
          <ClientScheduleListRow key={s.id} schedule={s} past showInitial onPress={noop} />
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
    <View style={[styles.sheetStack, styles.scheduleSheetStack]}>
      {summaryBlock}
      {listsBlock}
      {footnote}
    </View>
  );

  return (
    <SafeAreaView
      testID={HARNESS_TEST_ID.SAFE_AREA}
      style={styles.safe}
      edges={['top', 'left', 'right']}
    >
      <CoverChapterSplitLayout
        mode={mode}
        header={<HarnessHeader rightLabel={view.branchLabel} />}
        cover={coverPane}
        sheet={sheetPane}
        refreshControl={harnessRefreshControl()}
      />
    </SafeAreaView>
  );
}

export function HarnessCounselorHome({ view }: Readonly<{ view: CounselorHarnessView }>) {
  const mode = useCoverLayoutMode();
  const gutter = getCoverGutter(mode);
  const isLandscape = mode === 'tabletLandscape';
  const { hero, today, summary, pendingCount, records } = view;

  const heroBlock = hero ? (
    <View style={styles.heroStack}>
      <NextSessionHero hero={hero} size={mode === 'phone' ? 'phone' : 'tablet'} />
      <PrimaryEntryCta
        label={CONSULTANT_COVER_COPY.ENTRY_CTA}
        accessibilityLabel={CONSULTANT_COVER_COPY.ENTRY_CTA_A11Y}
        onPress={noop}
      />
    </View>
  ) : (
    <CoverHeroEmpty
      eyebrow={COVER_CHAPTER_COPY.NEXT_SESSION_LABEL}
      title={CONSULTANT_COVER_COPY.HERO_EMPTY_TITLE}
      description={CONSULTANT_COVER_COPY.HERO_EMPTY_DESCRIPTION}
      actionLabel={CONSULTANT_COVER_COPY.HERO_EMPTY_ACTION}
      actionIcon={Calendar}
      onAction={noop}
    />
  );

  const inboxBlock = (
    <View style={styles.inbox}>
      <TintNewsBanner banner={view.banner} onPress={noop} />
      <NotificationRows
        rows={view.notificationRows}
        unreadCount={view.unreadCount}
        onPressRow={noop}
        onPressAll={noop}
        gutter={gutter}
      />
    </View>
  );

  const inProgressBlock = today.inProgress ? (
    <ScheduleListSection
      title={CONSULTANT_COVER_COPY.IN_PROGRESS_TITLE}
      isEmpty={false}
      emptyLabel=""
    >
      <CounselorScheduleListRow schedule={today.inProgress} inProgress onPress={noop} />
    </ScheduleListSection>
  ) : null;

  const upcomingBlock = (
    <ScheduleListSection
      title={CONSULTANT_COVER_COPY.UPCOMING_TITLE}
      rightLabel={
        today.upcoming.length > 0
          ? CONSULTANT_COVER_COPY.upcomingCount(today.upcoming.length)
          : null
      }
      onPressRight={noop}
      isEmpty={today.upcoming.length === 0}
      emptyLabel={CONSULTANT_COVER_COPY.UPCOMING_EMPTY}
      emptyActionLabel={CONSULTANT_COVER_COPY.UPCOMING_EMPTY_ACTION}
      onEmptyAction={noop}
    >
      {today.upcoming.map((s) => (
        <CounselorScheduleListRow key={s.id} schedule={s} onPress={noop} />
      ))}
    </ScheduleListSection>
  );

  const recordsBlock = (
    <ScheduleListSection
      title={CONSULTANT_COVER_COPY.RECORDS_TITLE}
      rightLabel={pendingCount > 0 ? CONSULTANT_COVER_COPY.recordsCount(pendingCount) : null}
      onPressRight={noop}
      isEmpty={pendingCount === 0 && records.length === 0}
      emptyLabel={CONSULTANT_COVER_COPY.RECORDS_EMPTY}
      emptyActionLabel={CONSULTANT_COVER_COPY.RECORDS_EMPTY_ACTION}
      onEmptyAction={noop}
    >
      {records.length > 0 ? (
        records.slice(0, RECORDS_LIST_MAX).map((r) => {
          const date = formatListDateParts(r.sessionDate);
          const name = toDisplayString(r.clientName, '').trim();
          return (
            <ScheduleListRow
              key={r.scheduleId}
              leadPrimary={date.primary}
              leadSecondary={date.secondary}
              title={
                name ? CONSULTANT_COVER_COPY.clientLabel(name) : CONSULTANT_COVER_COPY.RECORDS_TITLE
              }
              detail={
                r.sessionNumber
                  ? COVER_CHAPTER_COPY.sessionNumber(r.sessionNumber)
                  : CONSULTANT_COVER_COPY.RECORDS_PROMPT
              }
              onPress={noop}
            />
          );
        })
      ) : (
        <ScheduleListRow
          leadPrimary={CONSULTANT_COVER_COPY.TODAY_LABEL}
          title={CONSULTANT_COVER_COPY.recordsCount(pendingCount)}
          detail={CONSULTANT_COVER_COPY.RECORDS_PROMPT}
          accessibilityLabel={CONSULTANT_COVER_COPY.RECORDS_A11Y}
          onPress={noop}
        />
      )}
    </ScheduleListSection>
  );

  const greeting = (
    <CoverGreeting
      title={CONSULTANT_COVER_COPY.nameLabel(view.displayName)}
      subtitle={
        summary.total > 0
          ? CONSULTANT_COVER_COPY.todaySummary(
              summary.total,
              summary.completed,
              summary.inProgress,
              summary.scheduled,
            )
          : CONSULTANT_COVER_COPY.TODAY_SUMMARY_ZERO
      }
      size={isLandscape ? 'compact' : 'cover'}
    />
  );

  const coverPane: ReactNode = isLandscape ? (
    <View style={styles.pane}>
      {greeting}
      {heroBlock}
      {inProgressBlock}
      <Text style={styles.footnote}>{CONSULTANT_COVER_COPY.LANDSCAPE_FOOTNOTE}</Text>
    </View>
  ) : (
    <View style={styles.pane}>
      {greeting}
      {heroBlock}
    </View>
  );

  const sheetPane: ReactNode = isLandscape ? (
    <View style={styles.pane}>
      {inboxBlock}
      {upcomingBlock}
      {recordsBlock}
    </View>
  ) : (
    <View style={styles.sheetStack}>
      {inboxBlock}
      {inProgressBlock}
      {upcomingBlock}
      {recordsBlock}
    </View>
  );

  return (
    <SafeAreaView
      testID={HARNESS_TEST_ID.SAFE_AREA}
      style={styles.safe}
      edges={['top', 'left', 'right']}
    >
      <CoverChapterSplitLayout
        mode={mode}
        header={<HarnessHeader rightLabel={CONSULTANT_COVER_COPY.ROLE_LABEL} />}
        cover={coverPane}
        sheet={sheetPane}
        refreshControl={harnessRefreshControl()}
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
  heroStack: {
    gap: spacing['2xl'],
  },
  pane: {
    gap: spacing['2xl'],
  },
  sheetPane: {
    gap: spacing['2xl'],
  },
  sheetStack: {
    gap: spacing.lg,
  },
  scheduleSheetStack: {
    paddingTop: spacing.lg,
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
