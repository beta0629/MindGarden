/**
 * 주/일 풀 카드 칩 — measure-based time-first + height fit
 * (폭: long+badge → … → hide-time → marker /
 *  높이: full → hide-status → merge-time-title → hide-title).
 * ScheduleCalendarView renderEventContent 주/일 분기에서만 사용 (#1499/#1510 rebase 포인트).
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import EngagementTypeBadge from '../../common/EngagementTypeBadge';
import ScheduleReminderSmsBadge from '../../admin/mapping-management/integrated-schedule/molecules/ScheduleReminderSmsBadge';
import { formatIntegratedMonthChipShortTime } from './integratedMonthChipCopy';
import useWeekDayChipFit from '../../../hooks/useWeekDayChipFit';
import {
  WEEK_DAY_CHIP_HEIGHT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  buildWeekDayChipA11yLabel,
  isWeekDayChipMarkerOnly
} from '../../../utils/weekDayChipFit';
import { CLIENT_REMINDER_SMS_FIELD } from '../../../constants/scheduleClientReminderSms';

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
const WeekDayScheduleEventChip = ({
  timeText,
  eventStart,
  clientName,
  consultantName,
  statusLabel,
  statusModifier,
  sameDayPrefix,
  pastClass,
  cancelledClass,
  extendedProps,
  showInstitutionMark,
  institutionLabel
}) => {
  const chipRef = useRef(null);
  const timeRef = useRef(null);
  const shortTime = formatIntegratedMonthChipShortTime(eventStart);
  const longTime = timeText || shortTime;
  const fit = useWeekDayChipFit({
    chipRef,
    timeRef,
    longTime,
    shortTime,
    badgeLabel: showInstitutionMark ? (institutionLabel || '') : '',
    considerBadge: Boolean(showInstitutionMark && institutionLabel),
    clientName,
    counselorName: consultantName || ''
  });
  const markerOnly = isWeekDayChipMarkerOnly(fit);
  const displayTime = fit.showTime
    ? (fit.timeMode === WEEK_DAY_CHIP_TIME_MODE.LONG ? longTime : shortTime)
    : '';
  const fullTimeForA11y = longTime || shortTime;
  const chipTitle = buildWeekDayChipA11yLabel({
    timeText: fullTimeForA11y,
    clientName,
    counselorName: consultantName,
    statusLabel,
    institutionLabel,
    showInstitution: Boolean(showInstitutionMark && institutionLabel)
  });
  const mergeTimeTitle = !markerOnly
    && Boolean(fit.mergeTimeTitle)
    && fit.heightStage === WEEK_DAY_CHIP_HEIGHT_STAGE.MERGE_TIME_TITLE
    && fit.showTime
    && fit.showTitle;
  const statusModClass = statusModifier
    ? `mg-v2-ad-calendar-event--status-${statusModifier}`
    : '';
  const chipClass = [
    'mg-v2-ad-calendar-event',
    'mg-v2-ad-calendar-event--week-day-fit',
    fit.compactPad ? 'mg-v2-ad-calendar-event--chip-pad-compact' : '',
    mergeTimeTitle ? 'mg-v2-ad-calendar-event--merge-time-title' : '',
    markerOnly ? 'mg-v2-ad-calendar-event--chip-marker' : '',
    statusModClass,
    pastClass,
    cancelledClass
  ].filter(Boolean).join(' ');

  // 측정용 시간 노드 — marker/hide-time 에서도 computed font 확보. 보이는 글자 0.
  const measureTimeBlock = (
    <div className="mg-v2-ad-calendar-event__time" aria-hidden="true">
      <span
        className="mg-v2-ad-calendar-event__time-text"
        hidden
        aria-hidden="true"
      >
        <span ref={timeRef} className="mg-v2-ad-calendar-event__time-measured">
          {shortTime}
        </span>
      </span>
    </div>
  );

  if (markerOnly) {
    return (
      <div
        ref={chipRef}
        className={chipClass}
        data-chip-fit-stage={fit.stage}
        data-chip-height-stage={fit.heightStage}
        data-chip-marker="true"
        title={chipTitle}
        aria-label={chipTitle}
      >
        {measureTimeBlock}
      </div>
    );
  }

  const titleBlock = fit.showTitle ? (
    <div className="mg-v2-ad-calendar-event__title">
      {sameDayPrefix}
      <span className="client-name">{clientName}</span>
      <ScheduleReminderSmsBadge
        sms={extendedProps?.[CLIENT_REMINDER_SMS_FIELD]}
        stopPropagation
        className="mg-v2-ad-calendar-event__reminder-sms"
      />
      {fit.showCounselorName && consultantName ? (
        <span className="counselor-name">{consultantName}</span>
      ) : null}
    </div>
  ) : null;

  const timeBlock = (
    <div className="mg-v2-ad-calendar-event__time">
      {/* 측정용 노드는 항상 유지(hide-time 시에도 computed font 확보). 비가시일 때 aria-hidden. */}
      <span
        className="mg-v2-ad-calendar-event__time-text"
        hidden={!fit.showTime}
        aria-hidden={!fit.showTime}
      >
        <span ref={timeRef} className="mg-v2-ad-calendar-event__time-measured">
          {fit.showTime ? displayTime : shortTime}
        </span>
      </span>
      {fit.showBadge ? (
        <EngagementTypeBadge
          source={extendedProps}
          className="mg-v2-ad-calendar-event__engagement"
        />
      ) : null}
    </div>
  );

  return (
    <div
      ref={chipRef}
      className={chipClass}
      data-chip-fit-stage={fit.stage}
      data-chip-height-stage={fit.heightStage}
      title={chipTitle}
      aria-label={chipTitle}
    >
      {mergeTimeTitle ? (
        <div className="mg-v2-ad-calendar-event__merge-row">
          {timeBlock}
          {titleBlock}
        </div>
      ) : (
        <>
          {timeBlock}
          {titleBlock}
        </>
      )}
      {fit.showStatus ? (
        <div className="mg-v2-ad-calendar-event__status">{statusLabel}</div>
      ) : null}
    </div>
  );
};

WeekDayScheduleEventChip.propTypes = {
  timeText: PropTypes.string,
  eventStart: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  clientName: PropTypes.string.isRequired,
  consultantName: PropTypes.string,
  statusLabel: PropTypes.string.isRequired,
  statusModifier: PropTypes.string,
  sameDayPrefix: PropTypes.node,
  pastClass: PropTypes.string,
  cancelledClass: PropTypes.string,
  extendedProps: PropTypes.object,
  showInstitutionMark: PropTypes.bool,
  institutionLabel: PropTypes.string
};

WeekDayScheduleEventChip.defaultProps = {
  timeText: '',
  eventStart: null,
  consultantName: '',
  statusModifier: '',
  sameDayPrefix: null,
  pastClass: '',
  cancelledClass: '',
  extendedProps: {},
  showInstitutionMark: false,
  institutionLabel: ''
};

export default WeekDayScheduleEventChip;
