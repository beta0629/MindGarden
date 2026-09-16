/**
 * CardMeta — optional amber 할 일 필 + 기관연동 배지
 * SSOT: docs/design-system/clinic-os-sidebar-cards.md
 *
 * 초기 결제 완료는 재무 FT 존재 시에만 짧은 배지(금액 비표시).
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../../../common/SafeText';
import StatusBadge from '../../../../common/StatusBadge';
import EngagementTypeBadge from '../../../../common/EngagementTypeBadge';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { resolveCardTodoPill } from '../utils/resolveCardTodoPill';
import {
  hasInstitutionLinkInitialPaymentCompleted,
  isInstitutionLinkMapping
} from '../utils/institutionLinkBillingDisplay';
import { CARD_INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID } from '../constants/institutionLinkBillingReminderConstants';
import './CardMeta.css';

const CardMeta = ({
  status,
  remainingSessions,
  pendingSessionExtension,
  hasConsultationSchedule,
  nextConsultationDate,
  paymentTiming,
  clientEngagementType,
  engagementType,
  hasInstitutionLinkInitialPayment,
  initialConsultationPayment
}) => {
  const { t } = useTranslation(['admin']);
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
  const mappingLike = {
    paymentTiming,
    clientEngagementType,
    engagementType,
    hasInstitutionLinkInitialPayment,
    initialConsultationPayment
  };
  const showInitialPaymentCompleted = isInstitutionLinkMapping(mappingLike)
    && hasInstitutionLinkInitialPaymentCompleted(mappingLike);

  return (
    <div className="integrated-schedule__card-meta">
      <div className="integrated-schedule__card-engagement">
        <EngagementTypeBadge
          mapping={{ paymentTiming, engagementType, clientEngagementType }}
        />
        {showInitialPaymentCompleted ? (
          <StatusBadge
            variant="success"
            data-testid={CARD_INITIAL_PAYMENT_COMPLETED_BADGE_TEST_ID}
          >
            {t('admin:integratedSchedule.sidePeek.initialPaymentCompleted')}
          </StatusBadge>
        ) : null}
      </div>
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
  engagementType: PropTypes.string,
  hasInstitutionLinkInitialPayment: PropTypes.bool,
  initialConsultationPayment: PropTypes.object
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null,
  pendingSessionExtension: null,
  hasConsultationSchedule: false,
  nextConsultationDate: null,
  consultationSchedules: undefined,
  paymentTiming: undefined,
  clientEngagementType: undefined,
  engagementType: undefined,
  hasInstitutionLinkInitialPayment: false,
  initialConsultationPayment: null
};

export default CardMeta;
