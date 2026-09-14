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
import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { resolveMappingScheduleStatus } from '../utils/mappingScheduleStatusDisplay';
import { resolveCardTodoPill } from '../utils/resolveCardTodoPill';
import {
  INSTITUTION_LINK_MONTHLY_LABEL,
  isInstitutionLinkPaymentTiming
} from '../../../constants/integratedScheduleSidebarFilterConstants';
import './CardMeta.css';

const META_REMAINING_PREFIX = '잔여';
const META_SEPARATOR = ' · ';

/**
 * @param {number|null|undefined} remainingSessions
 * @param {string} scheduleLabel
 * @returns {string}
 */
const buildMuteMetaSentence = (remainingSessions, scheduleLabel, paymentTiming) => {
  const schedule = toDisplayString(scheduleLabel, '').trim() || '일정 미등록';
  if (isInstitutionLinkPaymentTiming(paymentTiming)) {
    return `${INSTITUTION_LINK_MONTHLY_LABEL}${META_SEPARATOR}${schedule}`;
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
  paymentTiming
}) => {
  const scheduleStatus = resolveMappingScheduleStatus({
    hasConsultationSchedule,
    nextConsultationDate
  });
  const scheduleLabel = toDisplayString(scheduleStatus.label, '');
  const muteSentence = buildMuteMetaSentence(remainingSessions, scheduleLabel, paymentTiming);
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
  paymentTiming: PropTypes.string
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  pendingSessionExtension: null,
  hasConsultationSchedule: false,
  nextConsultationDate: null,
  paymentTiming: null
};

export default CardMeta;
