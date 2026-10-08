/**
 * 주/일 풀 카드 칩 — measure-based time-first fit (long+badge → long → short+badge → short).
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
import { WEEK_DAY_CHIP_TIME_MODE } from '../../../utils/weekDayChipFit';
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
  sameDayPrefix,
  pastClass,
  cancelledClass,
  extendedProps,
  showInstitutionMark,
  institutionLabel
}) => {
  const chipRef = useRef(null);
  const shortTime = formatIntegratedMonthChipShortTime(eventStart);
  const fit = useWeekDayChipFit({
    chipRef,
    longTime: timeText || '',
    shortTime,
    badgeLabel: showInstitutionMark ? (institutionLabel || '') : '',
    considerBadge: Boolean(showInstitutionMark && institutionLabel)
  });
  const displayTime = fit.timeMode === WEEK_DAY_CHIP_TIME_MODE.LONG
    ? (timeText || shortTime)
    : shortTime;

  return (
    <div
      ref={chipRef}
      className={`mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit${pastClass}${cancelledClass}`.trim()}
      data-chip-fit-stage={fit.stage}
      title={`${clientName} - ${statusLabel}`}
    >
      <div className="mg-v2-ad-calendar-event__time">
        <span className="mg-v2-ad-calendar-event__time-text">
          <span className="mg-v2-ad-calendar-event__time-measured">{displayTime}</span>
        </span>
        {fit.showBadge ? (
          <EngagementTypeBadge
            source={extendedProps}
            className="mg-v2-ad-calendar-event__engagement"
          />
        ) : null}
      </div>
      <div className="mg-v2-ad-calendar-event__title">
        {sameDayPrefix}
        <span className="client-name">{clientName}</span>
        <ScheduleReminderSmsBadge
          sms={extendedProps?.[CLIENT_REMINDER_SMS_FIELD]}
          stopPropagation
          className="mg-v2-ad-calendar-event__reminder-sms"
        />
        {consultantName ? (
          <span className="counselor-name">{consultantName}</span>
        ) : null}
      </div>
      <div className="mg-v2-ad-calendar-event__status">{statusLabel}</div>
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
  sameDayPrefix: null,
  pastClass: '',
  cancelledClass: '',
  extendedProps: {},
  showInstitutionMark: false,
  institutionLabel: ''
};

export default WeekDayScheduleEventChip;
