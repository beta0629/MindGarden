/**
 * CardMeta — mute meta 문장 + optional amber 할 일 필 (≤1)
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * 기관연동 배지는 EngagementTypeBadge 한 곳만. mute에 「기관연동」 문구를 넣지 않는다.
 * 일정 라벨은 한눈 일시(월별)를 우선하고 boolean 「일정 이력 있음」 단독을 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import EngagementTypeBadge from '../../../../common/EngagementTypeBadge';
import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';
import { resolveMappingScheduleStatus } from '../utils/mappingScheduleStatusDisplay';
import { buildBillingScheduleGlanceSummary } from '../utils/cardBillingProgressDisplay';
import { resolveCardTodoPill } from '../utils/resolveCardTodoPill';
import './CardMeta.css';

const META_REMAINING_PREFIX = '잔여';
const META_SEPARATOR = ' · ';
const META_SCHEDULE_FALLBACK = '일정 미등록';

/**
 * @param {number|null|undefined} remainingSessions
 * @param {string} scheduleLabel
 * @param {boolean} institutionLink
 * @returns {string}
 */
const buildMuteMetaSentence = (remainingSessions, scheduleLabel, institutionLink) => {
  const schedule = toDisplayString(scheduleLabel, '').trim() || META_SCHEDULE_FALLBACK;
  // 기관연동: 배지와 문구 이중 렌더 금지 — mute는 일정 요약만
  if (institutionLink) {
    return schedule;
  }
  const remaining = toSafeNumber(remainingSessions, 0);
  const safeRemaining = remaining == null ? 0 : remaining;
  return `${META_REMAINING_PREFIX} ${safeRemaining}${META_SEPARATOR}${schedule}`;
};

/**
 * @param {object} props
 * @returns {boolean}
 */
const resolveInstitutionLink = ({ paymentTiming, clientEngagementType, engagementType }) => (
  isInstitutionLinkEngagement(paymentTiming)
  || isInstitutionLinkEngagement(clientEngagementType)
  || isInstitutionLinkEngagement(engagementType)
);

/**
 * @param {object} args
 * @returns {string}
 */
const resolveScheduleMuteLabel = ({
  hasConsultationSchedule,
  nextConsultationDate,
  consultationSchedules
}) => {
  const glance = buildBillingScheduleGlanceSummary(consultationSchedules);
  if (glance) {
    return glance;
  }
  const scheduleStatus = resolveMappingScheduleStatus({
    hasConsultationSchedule,
    nextConsultationDate,
    consultationSchedules
  });
  return toDisplayString(scheduleStatus.label, '');
};

const CardMeta = ({
  status,
  remainingSessions,
  pendingSessionExtension,
  hasConsultationSchedule,
  nextConsultationDate,
  consultationSchedules,
  paymentTiming,
  clientEngagementType,
  engagementType
}) => {
  const scheduleLabel = resolveScheduleMuteLabel({
    hasConsultationSchedule,
    nextConsultationDate,
    consultationSchedules
  });
  const institutionLink = resolveInstitutionLink({
    paymentTiming,
    clientEngagementType,
    engagementType
  });
  const muteSentence = buildMuteMetaSentence(
    remainingSessions,
    scheduleLabel,
    institutionLink
  );
  const todoPill = resolveCardTodoPill({
    status,
    remainingSessions,
    pendingSessionExtension,
    hasConsultationSchedule,
    nextConsultationDate,
    paymentTiming,
    clientEngagementType,
    engagementType
  });
  const todoLabel = toDisplayString(todoPill?.label, '');
  const todoTitle = toDisplayString(todoPill?.title, todoLabel);

  return (
    <div className="integrated-schedule__card-meta">
      <EngagementTypeBadge
        mapping={{ paymentTiming, engagementType, clientEngagementType }}
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
  consultationSchedules: PropTypes.arrayOf(PropTypes.object),
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
  consultationSchedules: [],
  paymentTiming: null,
  clientEngagementType: null,
  engagementType: null
};

export default CardMeta;
