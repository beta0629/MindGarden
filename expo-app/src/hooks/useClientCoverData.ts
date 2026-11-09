/**
 * 내담자 커버 홈·일정 챕터 공용 데이터 — 다음 상담 히어로 · 회기 진행 · 예정/지난 목록.
 * 기존 훅(useUpcomingConsultation · useClientDashboard · useClientConsultations)만 조합한다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { useCallback, useMemo } from 'react';
import {
  useClientConsultations,
  useClientDashboard,
  useUpcomingConsultation,
  type UpcomingConsultation,
} from '@/api/hooks/useConsultations';
import type { Schedule } from '@/api/hooks/useSchedules';
import { CLIENT_COVER_COPY } from '@/constants/clientHomeCopy';
import {
  buildCoverHero,
  buildHeroDetail,
  buildSessionProgress,
  splitClientSessionLists,
  type ClientSessionLists,
  type CoverHeroView,
  type SessionProgressView,
} from '@/utils/coverChapterViewModel';

export interface ClientCoverData {
  readonly heroSchedule: UpcomingConsultation | null;
  readonly hero: CoverHeroView | null;
  readonly isHeroLoading: boolean;
  readonly isHeroError: boolean;
  readonly progress: SessionProgressView;
  readonly progressDetail: string;
  /** 「내 상담 회기」 블록 전용 */
  readonly unpaidCount: number;
  readonly lists: ClientSessionLists;
  readonly isListLoading: boolean;
  readonly isListError: boolean;
  readonly hasMorePast: boolean;
  readonly isFetchingMore: boolean;
  readonly fetchMore: () => void;
  readonly refetchAll: () => Promise<unknown>;
}

export function useClientCoverData(): ClientCoverData {
  const upcomingQuery = useUpcomingConsultation();
  const dashboardQuery = useClientDashboard();
  const consultationsQuery = useClientConsultations();

  const heroSchedule = upcomingQuery.data ?? null;
  const now = new Date();

  const hero = heroSchedule
    ? buildCoverHero(
        {
          scheduleId: heroSchedule.id,
          date: heroSchedule.date,
          startTime: heroSchedule.startTime,
          personLabel: CLIENT_COVER_COPY.consultantLabel(heroSchedule.consultantName),
          detail: buildHeroDetail(heroSchedule),
          engagementSource: heroSchedule,
        },
        now,
      )
    : null;

  const dashboard = dashboardQuery.data;
  const progress = buildSessionProgress({
    totalSessions: dashboard?.totalSessions,
    usedSessions: dashboard?.usedSessions,
    remainingSessions: dashboard?.remainingSessions,
  });
  const nextSessionNumber =
    typeof heroSchedule?.sessionNumber === 'number' ? heroSchedule.sessionNumber : null;

  const schedules = useMemo<Schedule[]>(
    () => consultationsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [consultationsQuery.data?.pages],
  );
  const lists = useMemo(
    () => splitClientSessionLists(schedules, heroSchedule?.id ?? null),
    [schedules, heroSchedule?.id],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = consultationsQuery;
  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refetchAll = useCallback(
    () =>
      Promise.all([
        upcomingQuery.refetch(),
        dashboardQuery.refetch(),
        consultationsQuery.refetch(),
      ]),
    [upcomingQuery, dashboardQuery, consultationsQuery],
  );

  return {
    heroSchedule,
    hero,
    isHeroLoading: upcomingQuery.isLoading && !upcomingQuery.isFetched && !upcomingQuery.isError,
    isHeroError: upcomingQuery.isError && !heroSchedule,
    progress,
    progressDetail: CLIENT_COVER_COPY.progressDetail(progress.used, nextSessionNumber),
    unpaidCount: dashboard?.pendingPaymentCount ?? 0,
    lists,
    isListLoading:
      consultationsQuery.isLoading && !consultationsQuery.isFetched && !consultationsQuery.isError,
    isListError: consultationsQuery.isError && schedules.length === 0,
    hasMorePast: Boolean(hasNextPage),
    isFetchingMore: isFetchingNextPage,
    fetchMore,
    refetchAll,
  };
}
