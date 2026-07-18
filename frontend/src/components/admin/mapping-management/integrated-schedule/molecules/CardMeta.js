/**
 * CardMeta - StatusBadge + RemainingSessionsBadge + 스케줄/desync 상태
 * @param {string} status - 매칭 상태
 * @param {number} remainingSessions - 남은 회기 수
 * @param {boolean} [hasConsultationSchedule] - mappingId 기준 점유 일정 유무
 * @param {string|null} [nextConsultationDate] - 다음 상담일 ISO date
 * @param {string} [paymentTiming] - 결제 시점 (Option-B desync 판별)
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../../../../common/StatusBadge';
import RemainingSessionsBadge from '../../../../common/RemainingSessionsBadge';
import SafeText from '../../../../common/SafeText';
import { renderCompactPackageName } from '../../../../../utils/packagePricing';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';
import { toSafeNumber, toDisplayString } from '../../../../../utils/safeDisplay';
import { resolveMappingScheduleStatus } from '../utils/mappingScheduleStatusDisplay';
import {
  MAPPING_DESYNC_KIND,
  resolveMappingScheduleDesync
} from '../utils/mappingScheduleDesync';
import './CardMeta.css';

const CardMeta = ({
  status,
  remainingSessions,
  packageName,
  pendingSessionExtension,
  hasConsultationSchedule,
  nextConsultationDate,
  paymentTiming
}) => {
  const pendingSessions = toSafeNumber(pendingSessionExtension?.additionalSessions, null);
  const scheduleStatus = resolveMappingScheduleStatus({
    hasConsultationSchedule,
    nextConsultationDate
  });
  const scheduleLabel = toDisplayString(scheduleStatus.label, '');
  const desync = resolveMappingScheduleDesync({
    status,
    remainingSessions,
    hasConsultationSchedule,
    nextConsultationDate,
    paymentTiming
  });
  const showDesyncBadge = desync.isDesync && Boolean(desync.badgeLabel);
  const scheduleTitle =
    desync.kind === MAPPING_DESYNC_KIND.SESSIONS_IN_PROGRESS
      ? desync.tooltip
      : scheduleLabel;
  const desyncBadgeTitle = toDisplayString(desync.tooltip, '');
  const desyncBadgeLabel = toDisplayString(desync.badgeLabel, '');

  return (
  <div className="integrated-schedule__card-meta">
    <StatusBadge status={status} />
    {pendingSessionExtension ? (
      <StatusBadge status="PENDING" variant="info">
        {SESSION_EXTENSION_UI.BADGE_LABEL}
        {pendingSessions != null ? ` +${pendingSessions}회기` : ''}
      </StatusBadge>
    ) : null}
    {packageName && (
      <span className="integrated-schedule__card-package">
        {renderCompactPackageName(packageName)}
      </span>
    )}
    <RemainingSessionsBadge remainingSessions={remainingSessions} />
    {showDesyncBadge ? (
      <span
        className={`integrated-schedule__card-desync-badge integrated-schedule__card-desync-badge--${desync.badgeVariant}`}
        title={desyncBadgeTitle}
      >
        <SafeText>{desyncBadgeLabel}</SafeText>
      </span>
    ) : (
      <span
        className={`integrated-schedule__card-schedule-status integrated-schedule__card-schedule-status--${scheduleStatus.kind}`}
        title={scheduleTitle}
      >
        <SafeText>{scheduleLabel}</SafeText>
      </span>
    )}
  </div>
  );
};

CardMeta.propTypes = {
  status: PropTypes.string,
  remainingSessions: PropTypes.number,
  packageName: PropTypes.string,
  pendingSessionExtension: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    additionalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  hasConsultationSchedule: PropTypes.bool,
  nextConsultationDate: PropTypes.string,
  paymentTiming: PropTypes.string
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  packageName: '',
  pendingSessionExtension: null,
  hasConsultationSchedule: false,
  nextConsultationDate: null,
  paymentTiming: null
};

export default CardMeta;
