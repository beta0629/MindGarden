import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ConsultantHomeCover from './ConsultantHomeCover';
import ConsultantHomeNextSheet from './ConsultantHomeNextSheet';
import ConsultantHomeScheduleChapter from './ConsultantHomeScheduleChapter';
import ConsultantHomeGuideChapter from './ConsultantHomeGuideChapter';
import {
  COVER_CHAPTER_ROOT_CLASS,
  COVER_CHAPTER_TEST_ID,
  COVER_CHAPTER_BRAND_FALLBACK
} from './consultantCoverChapterConstants';
import {
  formatCoverDateLabel,
  formatConsultantDisplayName,
  buildCoverSubtitle,
  mapNextConsultationSheet,
  mapTodayScheduleRows,
  mapScheduleChips,
  mapGuideContent,
  filterTodayOnlySchedules
} from './consultantCoverChapterMappers';
import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTANT_DASHBOARD_TITLE_ID } from '../../../constants/consultantDashboardConstants';
import './ConsultantCoverChapterHome.css';

/** Web / tablet landscape — 좌 커버 | 우 시트 (tobe-home.html) */
const SPLIT_MQ = '(min-width: 1024px)';

/**
 * @returns {boolean}
 */
const getIsSplitLayout = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(SPLIT_MQ).matches;
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
  nextConsultation,
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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(SPLIT_MQ);
    const onChange = (event) => {
      setIsSplitLayout(Boolean(event.matches));
    };
    setIsSplitLayout(Boolean(mql.matches));
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const centerLabel = toDisplayString(brandName, COVER_CHAPTER_BRAND_FALLBACK);
  const consultantName = formatConsultantDisplayName(user?.name);
  const kicker = formatCoverDateLabel(new Date());

  const todayOnly = useMemo(
    () => filterTodayOnlySchedules(todaySchedules),
    [todaySchedules]
  );

  const sheetModel = useMemo(
    () => mapNextConsultationSheet(nextConsultation),
    [nextConsultation]
  );

  const scheduleRows = useMemo(
    () => mapTodayScheduleRows(todayOnly, nextConsultation),
    [todayOnly, nextConsultation]
  );

  const chips = useMemo(
    () => mapScheduleChips(stats, todayOnly.length),
    [stats, todayOnly.length]
  );

  const coverSubtitle = useMemo(
    () => buildCoverSubtitle(nextConsultation, chips.today),
    [nextConsultation, chips.today]
  );

  const guide = useMemo(
    () => mapGuideContent(notifications, incompleteCount),
    [notifications, incompleteCount]
  );

  // upcoming 은 예비 소스(매퍼·확장용). 현재 시트는 preparation SSOT.
  void upcomingSchedules;

  const nextSheet = (
    <ConsultantHomeNextSheet
      nextConsultation={sheetModel}
      onOpenConsultation={onOpenConsultation}
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
  nextConsultation: PropTypes.object,
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
