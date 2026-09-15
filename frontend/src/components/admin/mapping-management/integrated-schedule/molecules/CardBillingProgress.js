/**
 * CardBillingProgress — 배정 카드 누적 진행 + 한눈 일시 + 접이식 일정 상세
 * SSOT: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
 *
 * 기관연동은 회기권 used/total 대신 client lifetime 완료 건수·내담자 일정 목록을 표시한다.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  CARD_BILLING_PROGRESS_TEST_ID,
  CARD_BILLING_SCHEDULE_GLANCE_TEST_ID,
  CARD_BILLING_SCHEDULE_LIST_TEST_ID,
  CARD_BILLING_SCHEDULE_OVERFLOW_TEST_ID,
  CARD_BILLING_SCHEDULE_TOGGLE_TEST_ID,
  buildBillingProgressSentence,
  buildBillingScheduleGlanceSummary,
  buildBillingScheduleOverflowLabel,
  buildBillingScheduleRowLabel,
  buildBillingScheduleToggleLabel,
  buildInstitutionLinkCumulativeSentence,
  sliceConsultationSchedulesForCard
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
  const [expanded, setExpanded] = useState(false);
  const progressSentence = isInstitutionLink
    ? buildInstitutionLinkCumulativeSentence(clientCompletedConsultationCount)
    : buildBillingProgressSentence({
      usedSessions,
      totalSessions,
      remainingSessions
    });
  const { items, hiddenCount, totalCount } = sliceConsultationSchedulesForCard(
    consultationSchedules
  );
  const glanceSummary = buildBillingScheduleGlanceSummary(consultationSchedules);

  const handleToggle = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handleToggleKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

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
      {glanceSummary ? (
        <p
          className="integrated-schedule__card-billing-glance"
          data-testid={CARD_BILLING_SCHEDULE_GLANCE_TEST_ID}
        >
          <SafeText>{glanceSummary}</SafeText>
        </p>
      ) : null}
      {totalCount > 0 ? (
        <>
          <button
            type="button"
            className="integrated-schedule__card-billing-toggle"
            data-testid={CARD_BILLING_SCHEDULE_TOGGLE_TEST_ID}
            aria-expanded={expanded}
            onClick={handleToggle}
            onKeyDown={handleToggleKeyDown}
          >
            <SafeText>{buildBillingScheduleToggleLabel(totalCount, expanded)}</SafeText>
          </button>
          {expanded ? (
            <ul
              className="integrated-schedule__card-billing-schedule-list"
              data-testid={CARD_BILLING_SCHEDULE_LIST_TEST_ID}
            >
              {items.map((item, index) => {
                const key = toDisplayString(item?.id, `row-${index}`);
                return (
                  <li
                    key={key}
                    className="integrated-schedule__card-billing-schedule-item"
                  >
                    <SafeText>{buildBillingScheduleRowLabel(item)}</SafeText>
                  </li>
                );
              })}
              {hiddenCount > 0 ? (
                <li
                  className="integrated-schedule__card-billing-schedule-more"
                  data-testid={CARD_BILLING_SCHEDULE_OVERFLOW_TEST_ID}
                >
                  <SafeText>{buildBillingScheduleOverflowLabel(hiddenCount)}</SafeText>
                </li>
              ) : null}
            </ul>
          ) : null}
        </>
      ) : null}
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
