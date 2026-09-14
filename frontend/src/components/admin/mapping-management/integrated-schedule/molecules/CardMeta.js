/**
 * CardMeta — mute meta 문장 + optional amber 할 일 필 (≤1)
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import EngagementTypeBadge from '../../../../common/EngagementTypeBadge';
import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { resolveMappingScheduleStatus } from '../utils/mappingScheduleStatusDisplay';
import { resolveCardTodoPill } from '../utils/resolveCardTodoPill';
import {
  INSTITUTION_LINK_LABEL,
  isInstitutionLinkMapping
} from '../../constants/integratedScheduleSidebarFilterConstants';
import './CardMeta.css';

const META_REMAINING_PREFIX = '잔여';
const META_SEPARATOR = ' · ';

/**
 * @param {number|null|undefined} remainingSessions
 * @param {string} scheduleLabel
 * @param {boolean} institutionLink
 * @returns {string}
 */
const buildMuteMetaSentence = (remainingSessions, scheduleLabel, institutionLink) => {
  const schedule = toDisplayString(scheduleLabel, '').trim() || '일정 미등록';
  if (institutionLink) {
    return `${INSTITUTION_LINK_LABEL}${META_SEPARATOR}${schedule}`;
  }
  const remaining = toSafeNumber(remainingSessions, 0);
  const safeRemaining = remaining == null ? 0 : remaining;
  return `${META_REMAINING_PREFIX} ${safeRemaining}${META_SEPARATOR}${schedule}`;
};

const CardMeta = ({
  status,
  remainingSessions,
  pendingSessionExtension,
  hasConsultationSchedule,
  nextConsultationDate,
  paymentTiming,
  clientEngagementType,
  engagementType
}) => {
  const scheduleStatus = resolveMappingScheduleStatus({
    hasConsultationSchedule,
    nextConsultationDate
  });
  const scheduleLabel = toDisplayString(scheduleStatus.label, '');
  const institutionLink = isInstitutionLinkMapping({
    paymentTiming,
    clientEngagementType,
    engagementType
  });
  const muteSentence = buildMuteMetaSentence(remainingSessions, scheduleLabel, institutionLink);
  const todoPill = resolveCardTodoPill({
    status,
    remainingSessions,
    pendingSessionExtension,
    hasConsultationSchedule,
    nextConsultationDate,
    paymentTiming
  });
  const todoLabel = toDisplayString(todoPill?.label, '');
  const todoTitle = toDisplayString(todoPill?.title, todoLabel);

  return (
    <div className="integrated-schedule__card-meta">
      <EngagementTypeBadge
        mapping={{ paymentTiming, clientEngagementType, engagementType }}
      />
      {todoLabel ? (
        <span
          className="integrated-schedule__card-todo-pill"
          title={todoTitle}
          data-testid="mapping-card-todo-pill"
        >
          <SafeText>{todoLabel}</SafeText>
        </span>
      ) : null}
      <p
        className="integrated-schedule__card-meta-mute"
        data-testid="mapping-card-meta-mute"
      >
        <SafeText>{muteSentence}</SafeText>
      </p>
    </div>
  );
};

CardMeta.propTypes = {
  status: PropTypes.string,
  remainingSessions: PropTypes.number,
  pendingSessionExtension: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    additionalSessions: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  hasConsultationSchedule: PropTypes.bool,
  nextConsultationDate: PropTypes.string,
  paymentTiming: PropTypes.string,
  clientEngagementType: PropTypes.string,
  engagementType: PropTypes.string
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  pendingSessionExtension: null,
  hasConsultationSchedule: false,
  nextConsultationDate: null,
  paymentTiming: null,
  clientEngagementType: null,
  engagementType: null
};

export default CardMeta;
