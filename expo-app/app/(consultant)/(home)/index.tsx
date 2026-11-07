/**
 * 상담사 커버 홈 v4
 *
 * 브랜드 헤더 → 다음 상담 히어로 → 단일 입장 CTA → 소식 배너(활성 공지 있을 때만)
 * → 알림 행(일지 미작성만 경고 행) → 지금 진행 중 → 이후 일정 → 상담 기록.
 * 금액·결제·미결제·급여 정보는 이 화면에 두지 않는다.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-11-06 — 커버+챕터 v4 재구성 (KPI·급여 스냅샷·빠른 액션 제거)
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  CLINIC_OS,
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
  TintNewsBanner,
  getCoverGutter,
} from '@/components/organisms/coverChapter';
import { useAuthStore } from '@/stores/useAuthStore';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { useCoverInbox } from '@/hooks/useCoverInbox';
import { useCoverLayoutMode } from '@/hooks/useCoverLayoutMode';
import { useConsultantMobileDashboard } from '@/api/hooks/useSchedules';
import {
  useHighPriorityClients,
  useIncompleteRecords,
  useUpcomingPreparation,
} from '@/api/hooks/useConsultantHome';
import { usePendingRecords } from '@/api/hooks/useRecords';
import {
  CONSULTANT_COVER_COPY,
  CONSULTANT_HOME_COPY,
  CONSULTANT_HOME_ROUTES,
} from '@/constants/consultantHomeCopy';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { borderRadius, fontFamily, fontSize, spacing } from '@/theme';
import { resolveConsultantPendingCount } from '@/utils/consultantHomeKpi';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  buildCounselorHero,
  buildCounselorNotificationRows,
  formatListDateParts,
  splitCounselorToday,
  summarizeCounselorToday,
  type CoverNotificationRow,
} from '@/utils/coverChapterViewModel';

const RECORDS_LIST_MAX = 3;
const HERO_SKELETON_HEIGHT = 160;

export default function ConsultantHome() {
  const router = useRouter();
  const userName = useAuthStore((s) => s.user?.name);
  const { userId } = useApiQueryReady({ requireUserId: true });
  const mode = useCoverLayoutMode();
  const gutter = getCoverGutter(mode);
  const isLandscape = mode === 'tabletLandscape';

  const dashboard = useConsultantMobileDashboard(userId);
  const incompleteQuery = useIncompleteRecords(userId);
  const pendingQuery = usePendingRecords(userId);
  const urgentClientsQuery = useHighPriorityClients(userId);
  const upcomingQuery = useUpcomingPreparation(userId);
  const inbox = useCoverInbox('CONSULTANT');

  const now = new Date();
  const schedules = dashboard.todaySchedules;
  const hero = buildCounselorHero(upcomingQuery.data ?? null, schedules, now);
  const today = useMemo(
    () => splitCounselorToday(schedules, hero?.scheduleId ?? null, new Date()),
    [schedules, hero?.scheduleId],
  );
  const summary = summarizeCounselorToday(schedules, now);

  const pendingCount = resolveConsultantPendingCount(
    incompleteQuery.data?.count ?? 0,
    pendingQuery.data?.length,
    dashboard.pendingRecordCount,
  );
  const records = incompleteQuery.data?.records ?? [];
  const urgent = urgentClientsQuery.data?.[0] ?? null;
  const notificationRows = buildCounselorNotificationRows({
    pendingJournalCount: pendingCount,
    urgentClient: urgent
      ? {
          clientId: urgent.clientId,
          clientName: urgent.clientName,
          riskLabel: CONSULTANT_HOME_COPY.riskLevelLabel(urgent.riskLevel),
        }
      : null,
    notifications: inbox.notificationSources,
    now,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetchAll(),
        incompleteQuery.refetch(),
        pendingQuery.refetch(),
        urgentClientsQuery.refetch(),
        upcomingQuery.refetch(),
        inbox.refetchAll(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboard, incompleteQuery, pendingQuery, urgentClientsQuery, upcomingQuery, inbox]);

  const displayName = userName?.trim() || CONSULTANT_COVER_COPY.NAME_FALLBACK;
  const goSchedule = () => router.push(CONSULTANT_HOME_ROUTES.SCHEDULE);
  const goRecords = () => router.push(CONSULTANT_HOME_ROUTES.RECORDS);
  const goNotifications = () => router.push(CONSULTANT_HOME_ROUTES.NOTIFICATIONS);
  const goScheduleDetail = (id: number) => router.push(CONSULTANT_HOME_ROUTES.scheduleDetail(id));

  const onPressNotificationRow = (row: CoverNotificationRow) => {
    const { target } = row;
    switch (target.kind) {
      case 'records':
        goRecords();
        return;
      case 'client':
        router.push(CONSULTANT_HOME_ROUTES.CLIENT_DETAIL(target.clientId));
        return;
      case 'notifications':
        goNotifications();
        return;
      default: {
        const unhandled: never = target;
        return unhandled;
      }
    }
  };

  const isHeroLoading =
    (dashboard.isLoading || (upcomingQuery.isLoading && !upcomingQuery.isFetched)) && !hero;
  const heroBlock = isHeroLoading ? (
    <SkeletonLoader height={HERO_SKELETON_HEIGHT} borderRadius={borderRadius.md} />
  ) : hero ? (
    <View style={styles.heroStack}>
      <NextSessionHero hero={hero} size={mode === 'phone' ? 'phone' : 'tablet'} />
      <PrimaryEntryCta
        label={CONSULTANT_COVER_COPY.ENTRY_CTA}
        accessibilityLabel={CONSULTANT_COVER_COPY.ENTRY_CTA_A11Y}
        onPress={() => goScheduleDetail(hero.scheduleId)}
      />
    </View>
  ) : (
    <CoverHeroEmpty
      eyebrow={COVER_CHAPTER_COPY.NEXT_SESSION_LABEL}
      title={CONSULTANT_COVER_COPY.HERO_EMPTY_TITLE}
      description={CONSULTANT_COVER_COPY.HERO_EMPTY_DESCRIPTION}
      actionLabel={CONSULTANT_COVER_COPY.HERO_EMPTY_ACTION}
      actionIcon={Calendar}
      onAction={goSchedule}
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

  const inProgressBlock = today.inProgress ? (
    <ScheduleListSection
      title={CONSULTANT_COVER_COPY.IN_PROGRESS_TITLE}
      isEmpty={false}
      emptyLabel=""
    >
      <CounselorScheduleListRow
        schedule={today.inProgress}
        inProgress
        onPress={() => goScheduleDetail(today.inProgress!.id)}
      />
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
      onPressRight={goSchedule}
      isEmpty={!dashboard.isLoading && today.upcoming.length === 0}
      emptyLabel={CONSULTANT_COVER_COPY.UPCOMING_EMPTY}
      emptyActionLabel={CONSULTANT_COVER_COPY.UPCOMING_EMPTY_ACTION}
      onEmptyAction={goSchedule}
    >
      {today.upcoming.map((s) => (
        <CounselorScheduleListRow key={s.id} schedule={s} onPress={() => goScheduleDetail(s.id)} />
      ))}
    </ScheduleListSection>
  );

  const recordsBlock = (
    <ScheduleListSection
      title={CONSULTANT_COVER_COPY.RECORDS_TITLE}
      rightLabel={pendingCount > 0 ? CONSULTANT_COVER_COPY.recordsCount(pendingCount) : null}
      onPressRight={goRecords}
      isEmpty={pendingCount === 0 && records.length === 0}
      emptyLabel={CONSULTANT_COVER_COPY.RECORDS_EMPTY}
      emptyActionLabel={CONSULTANT_COVER_COPY.RECORDS_EMPTY_ACTION}
      onEmptyAction={goRecords}
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
              onPress={() => router.push(CONSULTANT_HOME_ROUTES.recordCreate(r.scheduleId))}
            />
          );
        })
      ) : (
        <ScheduleListRow
          leadPrimary={CONSULTANT_COVER_COPY.TODAY_LABEL}
          title={CONSULTANT_COVER_COPY.recordsCount(pendingCount)}
          detail={CONSULTANT_COVER_COPY.RECORDS_PROMPT}
          accessibilityLabel={CONSULTANT_COVER_COPY.RECORDS_A11Y}
          onPress={goRecords}
        />
      )}
    </ScheduleListSection>
  );

  const refreshControl = (
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={CLINIC_OS.teal} />
  );

  const greeting = (
    <CoverGreeting
      title={CONSULTANT_COVER_COPY.nameLabel(displayName)}
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CoverChapterSplitLayout
        mode={mode}
        header={<CoverBrandHeader rightLabel={CONSULTANT_COVER_COPY.ROLE_LABEL} />}
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
  heroStack: {
    gap: spacing['2xl'],
  },
  pane: {
    gap: spacing['2xl'],
  },
  sheetStack: {
    gap: spacing.lg,
  },
  inbox: {
    gap: spacing.sm,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
});
