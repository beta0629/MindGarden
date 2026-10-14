/**
 * ScheduleEventMarks — 칩 끝 표식 묶음 (기관연계 · 문자 발송).
 * 기관연계는 폭과 관계없이 일정 상세와 같은 EngagementTypeBadge 글자 배지다.
 * 문자 발송은 ScheduleReminderSmsBadge 원 표식이며 툴팁·aria 로 구분한다.
 */

import React from 'react';
import PropTypes from 'prop-types';
import EngagementTypeBadge from '../../../../common/EngagementTypeBadge';
import {
  resolveMappingEngagementType,
  shouldRenderEngagementTypeBadge
} from '../../../../../constants/mappingEngagementType';
import ScheduleReminderSmsBadge from './ScheduleReminderSmsBadge';
import { resolveScheduleReminderSmsDisplay } from '../utils/scheduleReminderSmsDisplay';
import './ScheduleEventMarks.css';

const ScheduleEventMarks = ({
  source,
  mapping,
  sms,
  compact,
  stopPropagation,
  institutionTitle,
  className
}) => {
  const engagementSource = source || mapping;
  const engagementType = resolveMappingEngagementType(engagementSource);
  const showInstitution = shouldRenderEngagementTypeBadge(engagementType);
  const smsDisplay = resolveScheduleReminderSmsDisplay(sms);
  if (!showInstitution && !smsDisplay) {
    return null;
  }

  const rootClass = ['mg-schedule-event-marks', 'mg-v2-ad-calendar-event__marks', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClass} aria-hidden="true">
      {showInstitution ? (
        <span className="mg-schedule-event-marks__institution" title={institutionTitle || undefined}>
          <EngagementTypeBadge source={source} mapping={mapping} />
        </span>
      ) : null}
      <ScheduleReminderSmsBadge
        sms={sms}
        compact={compact}
        stopPropagation={stopPropagation}
      />
    </span>
  );
};

ScheduleEventMarks.propTypes = {
  source: PropTypes.object,
  mapping: PropTypes.object,
  sms: PropTypes.object,
  compact: PropTypes.bool,
  stopPropagation: PropTypes.bool,
  institutionTitle: PropTypes.string,
  className: PropTypes.string
};

ScheduleEventMarks.defaultProps = {
  source: null,
  mapping: null,
  sms: null,
  compact: true,
  stopPropagation: false,
  institutionTitle: '',
  className: ''
};

export default ScheduleEventMarks;
