import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ConsultantHomeCover from './ConsultantHomeCover';
import ConsultantHomeNextSheet from './ConsultantHomeNextSheet';
import ConsultantHomeScheduleChapter from './ConsultantHomeScheduleChapter';
import ConsultantHomeGuideChapter from './ConsultantHomeGuideChapter';
import {
  COVER_CHAPTER_ROOT_CLASS,
  COVER_CHAPTER_TEST_ID,
  COVER_CHAPTER_BRAND_FALLBACK,
  COVER_CHAPTER_DESKTOP_SHELL_MQ,
  COVER_CHAPTER_TABLET_SPLIT_MQ
} from './consultantCoverChapterConstants';
import {
  formatCoverDateLabel,
  formatConsultantDisplayName,
  buildCoverSubtitle,
  mapNextConsultationSheet,
  mapTodayScheduleRows,
  mapScheduleChips,
  mapGuideContent,
  filterTodayOnlySchedules,
  selectNextWaitingSchedule
} from './consultantCoverChapterMappers';
import { getNow } from '../../../utils/serverClock';
import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTANT_DASHBOARD_TITLE_ID } from '../../../constants/consultantDashboardConstants';
import './ConsultantCoverChapterHome.css';

/**
 * 태블릿 가로 등 고정 LNB 없을 때만 좌커버 분할.
 * true desktop(≥1280+fine-pointer)은 DesktopLayout LNB + 커버 전폭 스택.
 *
 * @returns {boolean}
 */
const getIsSplitLayout = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  if (window.matchMedia(COVER_CHAPTER_DESKTOP_SHELL_MQ).matches) {
    return false;
  }
  return window.matchMedia(COVER_CHAPTER_TABLET_SPLIT_MQ).matches;
};

/**
 * Clinic-OS Cover+Chapter 홈 본문
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantCoverChapterHome = ({
  user,
  brandName,
  todaySchedules = [],
  upcomingSchedules = [],
  stats = {},
  notifications = [],
  incompleteCount = 0,
  dashboardError,
  titleId,
  onOpenConsultation,
  onOpenSchedule,
  onScheduleRowClick,
  onOpenGuide,
  onMenuClick
}) => {
  const [isSplitLayout, setIsSplitLayout] = useState(getIsSplitLayout);
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const desktopMql = window.matchMedia(COVER_CHAPTER_DESKTOP_SHELL_MQ);
    const splitMql = window.matchMedia(COVER_CHAPTER_TABLET_SPLIT_MQ);
    const onChange = () => {
      setIsSplitLayout(getIsSplitLayout());
    };
    setIsSplitLayout(getIsSplitLayout());
    const bind = (mql) => {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      }
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    };
    const unbindDesktop = bind(desktopMql);
    const unbindSplit = bind(splitMql);
    return () => {
      unbindDesktop();
      unbindSplit();
    };
  }, []);

  // 분 단위 재평가 — 다음 대기 셀렉터가 서버 now 기준으로 갱신되도록
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const id = window.setInterval(() => {
      setClockTick((prev) => prev + 1);
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  const centerLabel = toDisplayString(brandName, COVER_CHAPTER_BRAND_FALLBACK);
  const consultantName = formatConsultantDisplayName(user?.name);
  const now = useMemo(() => {
    void clockTick;
    return getNow();
  }, [clockTick]);
  const kicker = formatCoverDateLabel(now);

  const todayOnly = useMemo(
    () => filterTodayOnlySchedules(todaySchedules, now),
    [todaySchedules, now]
  );

  // 스케줄 배열 SSOT (preparation API 미사용)
  const nextWaiting = useMemo(
    () => selectNextWaitingSchedule(todayOnly, now),
    [todayOnly, now]
  );

  const sheetModel = useMemo(
    () => mapNextConsultationSheet(nextWaiting),
    [nextWaiting]
  );

  const scheduleRows = useMemo(
    () => mapTodayScheduleRows(todayOnly, nextWaiting),
    [todayOnly, nextWaiting]
  );

  const chips = useMemo(
    () => mapScheduleChips(stats, todayOnly.length),
    [stats, todayOnly.length]
  );

  const coverSubtitle = useMemo(
    () => buildCoverSubtitle(nextWaiting, chips.today),
    [nextWaiting, chips.today]
  );

  const guide = useMemo(
    () => mapGuideContent(notifications, incompleteCount),
    [notifications, incompleteCount]
  );

  // upcoming 은 예비 소스(매퍼·확장용). 시트·필은 today 스케줄 SSOT.
  void upcomingSchedules;

  const handleOpenConsultation = useCallback(() => {
    if (typeof onOpenConsultation !== 'function') {
      return;
    }
    onOpenConsultation(sheetModel?.scheduleId ?? nextWaiting?.id ?? null);
  }, [onOpenConsultation, sheetModel, nextWaiting]);

  const nextSheet = (
    <ConsultantHomeNextSheet
      nextConsultation={sheetModel}
      onOpenConsultation={handleOpenConsultation}
      onOpenSchedule={onOpenSchedule}
    />
  );

  return (
    <div
      className={COVER_CHAPTER_ROOT_CLASS}
      data-testid={COVER_CHAPTER_TEST_ID}
      data-layout={isSplitLayout ? 'split' : 'stack'}
    >
      {dashboardError ? (
        <div className="consultant-cover-chapter__alert" role="alert">
          <span>{toDisplayString(dashboardError, '')}</span>
        </div>
      ) : null}

      <ConsultantHomeCover
        brandName={centerLabel}
        kicker={kicker}
        consultantName={consultantName}
        subtitle={coverSubtitle}
        titleId={titleId || CONSULTANT_DASHBOARD_TITLE_ID}
        onMenuClick={onMenuClick}
      >
        {!isSplitLayout ? nextSheet : null}
      </ConsultantHomeCover>

      <div className="consultant-cover-chapter__body">
        {isSplitLayout ? nextSheet : null}

        <div className="consultant-cover-chapter__scroll">
          <div className="consultant-cover-chapter__chapters">
            <ConsultantHomeScheduleChapter
              rows={scheduleRows}
              chips={chips}
              onViewAll={onOpenSchedule}
              onWeeklyScheduleClick={onOpenSchedule}
              onRowClick={onScheduleRowClick}
            />
            <ConsultantHomeGuideChapter
              title={guide.title}
              body={guide.body}
              onOpen={onOpenGuide}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ConsultantCoverChapterHome.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    tenantId: PropTypes.string,
    tenantName: PropTypes.string,
    tenant: PropTypes.shape({ name: PropTypes.string })
  }),
  brandName: PropTypes.string,
  todaySchedules: PropTypes.array,
  upcomingSchedules: PropTypes.array,
  stats: PropTypes.object,
  notifications: PropTypes.array,
  incompleteCount: PropTypes.number,
  dashboardError: PropTypes.string,
  titleId: PropTypes.string,
  onOpenConsultation: PropTypes.func.isRequired,
  onOpenSchedule: PropTypes.func.isRequired,
  onScheduleRowClick: PropTypes.func,
  onOpenGuide: PropTypes.func,
  onMenuClick: PropTypes.func
};

export default ConsultantCoverChapterHome;
