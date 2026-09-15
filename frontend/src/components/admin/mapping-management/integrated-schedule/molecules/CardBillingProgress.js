/**
 * CardBillingProgress — 사이드바 카드용 누적 진행 한 줄만
 * SSOT: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
 *
 * 한눈 일시·일정 목록은 Side Peek 아코디언(SidePeekBillingScheduleAccordion)으로 이동.
 * 기관연동은 회기권 used/total 대신 **이 매핑(카드)** COMPLETED 건수.
 * client lifetime 금지.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import {
  CARD_BILLING_PROGRESS_TEST_ID,
  buildBillingProgressSentence,
  buildInstitutionLinkCumulativeSentence
} from '../utils/cardBillingProgressDisplay';
import './CardBillingProgress.css';

const CARD_BILLING_PROGRESS_LINE_TEST_ID = 'mapping-card-billing-progress-line';

const CardBillingProgress = ({
  usedSessions = 0,
  totalSessions = 0,
  remainingSessions = 0,
  consultationSchedules = [],
  isInstitutionLink = false,
  clientCompletedConsultationCount = 0
}) => {
  const progressSentence = isInstitutionLink
    ? buildInstitutionLinkCumulativeSentence(
      Array.isArray(consultationSchedules)
        ? { consultationSchedules }
        : clientCompletedConsultationCount
    )
    : buildBillingProgressSentence({
      usedSessions,
      totalSessions,
      remainingSessions
    });

  return (
    <div
      className="integrated-schedule__card-billing"
      data-testid={CARD_BILLING_PROGRESS_TEST_ID}
      data-institution-link={isInstitutionLink ? 'true' : 'false'}
    >
      <p
        className="integrated-schedule__card-billing-progress"
        data-testid={CARD_BILLING_PROGRESS_LINE_TEST_ID}
      >
        <SafeText>{progressSentence}</SafeText>
      </p>
    </div>
  );
};

CardBillingProgress.propTypes = {
  usedSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  totalSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  remainingSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  consultationSchedules: PropTypes.arrayOf(PropTypes.object),
  isInstitutionLink: PropTypes.bool,
  clientCompletedConsultationCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default CardBillingProgress;
