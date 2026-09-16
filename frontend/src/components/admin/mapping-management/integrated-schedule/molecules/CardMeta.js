/**
 * CardMeta — optional amber 할 일 필 + 기관연동 배지
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * 사이드바 카드는 누적 진행(CardBillingProgress)만 크게 노출한다.
 * 잔여·날짜 나열 mute 문장은 Side Peek 일정 상세 아코디언으로 이동(중복 제거).
 * 기관연동 배지는 EngagementTypeBadge 한 곳만.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import EngagementTypeBadge from '../../../../common/EngagementTypeBadge';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { resolveCardTodoPill } from '../utils/resolveCardTodoPill';
import './CardMeta.css';

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
