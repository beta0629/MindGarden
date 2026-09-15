/**
 * CardBillingProgress — 배정 카드 누적 진행 + 접이식 일정 상세 (청구 스캔)
 * SSOT: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
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
  CARD_BILLING_SCHEDULE_LIST_TEST_ID,
  CARD_BILLING_SCHEDULE_TOGGLE_TEST_ID,
  buildBillingProgressSentence,
  buildBillingScheduleRowLabel,
  sliceConsultationSchedulesForCard
} from '../utils/cardBillingProgressDisplay';
import './CardBillingProgress.css';

const CardBillingProgress = ({
  usedSessions = 0,
  totalSessions = 0,
  remainingSessions = 0,
  consultationSchedules = []
}) => {
  const [expanded, setExpanded] = useState(false);
  const progressSentence = buildBillingProgressSentence({
    usedSessions,
    totalSessions,
    remainingSessions
  });
  const { items, hiddenCount, totalCount } = sliceConsultationSchedulesForCard(
    consultationSchedules
  );

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
    >
      <p className="integrated-schedule__card-billing-progress">
        <SafeText>{progressSentence}</SafeText>
      </p>
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
            <SafeText>{expanded ? `일정 ${totalCount}건 접기` : `일정 ${totalCount}건`}</SafeText>
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
                <li className="integrated-schedule__card-billing-schedule-more">
                  <SafeText>{`외 ${hiddenCount}건`}</SafeText>
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
  consultationSchedules: PropTypes.arrayOf(PropTypes.object)
};

export default CardBillingProgress;
