import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import {
  COVER_CHAPTER_SCHEDULE_TEST_ID,
  COVER_CHAPTER_CHAP_SCHEDULE_NUM,
  COVER_CHAPTER_CHAP_SCHEDULE_TITLE,
  COVER_CHAPTER_VIEW_ALL,
  COVER_CHAPTER_EMPTY_TITLE,
  COVER_CHAPTER_EMPTY_DESC,
  COVER_CHAPTER_WEEKLY_SCHEDULE_LINK,
  COVER_CHAPTER_CHIP_TODAY,
  COVER_CHAPTER_CHIP_DONE,
  COVER_CHAPTER_CHIP_REMAINING,
  COVER_CHAPTER_PILL_WAIT
} from './consultantCoverChapterConstants';

/**
 * Clinic-OS Chapter 01 — 일정 dense rows / zero empty
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const ConsultantHomeScheduleChapter = ({
  rows = [],
  chips = { today: 0, completed: 0, remaining: 0 },
  onViewAll,
  onRowClick,
  onWeeklyScheduleClick
}) => {
  const hasRows = Array.isArray(rows) && rows.length > 0;
  const todayCount = toSafeNumber(chips?.today, 0);
  const completedCount = toSafeNumber(chips?.completed, 0);
  const remainingCount = toSafeNumber(chips?.remaining, 0);

  return (
    <section
      className="consultant-cover-chapter__chapter"
      data-testid={COVER_CHAPTER_SCHEDULE_TEST_ID}
      aria-labelledby="consultant-home-chap-schedule-title"
    >
      <div className="consultant-cover-chapter__chap-head">
        <span className="consultant-cover-chapter__chap-num">
          {COVER_CHAPTER_CHAP_SCHEDULE_NUM}
        </span>
        <h2
          className="consultant-cover-chapter__chap-title"
          id="consultant-home-chap-schedule-title"
        >
          {COVER_CHAPTER_CHAP_SCHEDULE_TITLE}
        </h2>
        {hasRows ? (
          <button
            type="button"
            className="consultant-cover-chapter__chap-more"
            onClick={onViewAll}
          >
            {COVER_CHAPTER_VIEW_ALL}
          </button>
        ) : null}
      </div>

      {!hasRows ? (
        <div className="consultant-cover-chapter__empty">
          <h4 className="consultant-cover-chapter__empty-title">{COVER_CHAPTER_EMPTY_TITLE}</h4>
          <p className="consultant-cover-chapter__empty-desc">{COVER_CHAPTER_EMPTY_DESC}</p>
          <button
            type="button"
            className="consultant-cover-chapter__empty-link"
            onClick={onWeeklyScheduleClick || onViewAll}
          >
            {COVER_CHAPTER_WEEKLY_SCHEDULE_LINK}
          </button>
        </div>
      ) : (
        <div className="consultant-cover-chapter__dense">
          {rows.map((row) => {
            const pillClass = row.pillVariant === 'wait'
              ? 'consultant-cover-chapter__pill consultant-cover-chapter__pill--wait'
              : 'consultant-cover-chapter__pill';
            return (
              <button
                key={row.id}
                type="button"
                className="consultant-cover-chapter__row"
                onClick={() => onRowClick?.(row)}
              >
                <span className="consultant-cover-chapter__row-time">
                  <SafeText tag="span">{toDisplayString(row.timeLabel, '')}</SafeText>
                </span>
                <span className="consultant-cover-chapter__row-txt">
                  <span className="consultant-cover-chapter__row-title">
                    <SafeText tag="span">{toDisplayString(row.clientName, '')}</SafeText>
                  </span>
                  <span className="consultant-cover-chapter__row-sub">
                    <SafeText tag="span">{toDisplayString(row.subLabel, '')}</SafeText>
                  </span>
                </span>
                <span className={pillClass}>
                  <SafeText tag="span">
                    {toDisplayString(row.pillLabel, COVER_CHAPTER_PILL_WAIT)}
                  </SafeText>
                </span>
              </button>
            );
          })}
          <div className="consultant-cover-chapter__chips">
            <span className="consultant-cover-chapter__chip consultant-cover-chapter__chip--teal">
              {COVER_CHAPTER_CHIP_TODAY}
              {' '}
              <span className="consultant-cover-chapter__chip-n">{todayCount}</span>
            </span>
            <span className="consultant-cover-chapter__chip">
              {COVER_CHAPTER_CHIP_DONE}
              {' '}
              <span className="consultant-cover-chapter__chip-n">{completedCount}</span>
            </span>
            <span className="consultant-cover-chapter__chip">
              {COVER_CHAPTER_CHIP_REMAINING}
              {' '}
              <span className="consultant-cover-chapter__chip-n">{remainingCount}</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

ConsultantHomeScheduleChapter.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    timeLabel: PropTypes.string,
    clientName: PropTypes.string,
    subLabel: PropTypes.string,
    pillLabel: PropTypes.string,
    pillVariant: PropTypes.oneOf(['default', 'wait']),
    scheduleId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })),
  chips: PropTypes.shape({
    today: PropTypes.number,
    completed: PropTypes.number,
    remaining: PropTypes.number
  }),
  onViewAll: PropTypes.func,
  onRowClick: PropTypes.func,
  onWeeklyScheduleClick: PropTypes.func
};

export default ConsultantHomeScheduleChapter;
