/**
 * SidePeekBillingScheduleAccordion — Side Peek 일정 상세(한눈·목록) 아코디언
 *
 * 사이드바 카드는 누적 진행 한 줄만 유지하고, 날짜 나열·일정 N건은 여기로 이동.
 * CSS: 공통 `mg-accordion*` 토큰 재사용 (ConsultationLog 패널과 동일 패턴).
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React, { useCallback, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../../../common/SafeText';
import MGButton from '../../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  SIDE_PEEK_BILLING_SCHEDULE_ACCORDION_TEST_ID,
  SIDE_PEEK_BILLING_SCHEDULE_GLANCE_TEST_ID,
  SIDE_PEEK_BILLING_SCHEDULE_LIST_TEST_ID,
  SIDE_PEEK_BILLING_SCHEDULE_OVERFLOW_TEST_ID,
  buildBillingScheduleGlanceSummary,
  buildBillingScheduleOverflowLabel,
  buildBillingScheduleRowLabel,
  buildBillingScheduleToggleLabel,
  sliceConsultationSchedulesForCard
} from '../utils/cardBillingProgressDisplay';
import './SidePeekBillingScheduleAccordion.css';

/**
 * @param {object} props
 * @param {object[]} [props.consultationSchedules]
 * @param {boolean} [props.defaultExpanded]
 * @param {string} [props.title] 기본: 일정 상세. IL Peek는 월 청구 일정.
 */
const SidePeekBillingScheduleAccordion = ({
  consultationSchedules = [],
  defaultExpanded = false,
  title
}) => {
  const { t } = useTranslation(['admin']);
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  const triggerId = `side-peek-billing-schedule-trigger-${safeId}`;
  const panelId = `side-peek-billing-schedule-panel-${safeId}`;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const { items, hiddenCount, totalCount } = sliceConsultationSchedulesForCard(
    consultationSchedules
  );
  const glanceSummary = buildBillingScheduleGlanceSummary(consultationSchedules);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (totalCount <= 0) {
    return null;
  }

  const resolvedTitle = toDisplayString(title, '').trim()
    || t('admin:integratedSchedule.sidePeek.scheduleDetailAccordionTitle', {
      defaultValue: '일정 상세'
    });
  const toggleHint = buildBillingScheduleToggleLabel(totalCount, expanded);

  return (
    <div
      className="mg-accordion integrated-schedule-side-peek-billing-accordion"
      data-testid={SIDE_PEEK_BILLING_SCHEDULE_ACCORDION_TEST_ID}
    >
      <div className="mg-accordion-item integrated-schedule-side-peek-billing-accordion__item">
        <MGButton
          type="button"
          variant="ghost"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'md',
            loading: false,
            className: 'mg-accordion-header'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          id={triggerId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={handleToggle}
          preventDoubleClick={false}
          data-testid="side-peek-billing-schedule-toggle"
        >
          <span className="mg-accordion-title">
            <SafeText>{resolvedTitle}</SafeText>
            <span className="integrated-schedule-side-peek-billing-accordion__count">
              <SafeText>{toggleHint}</SafeText>
            </span>
          </span>
          <span className={`mg-accordion-icon${expanded ? ' open' : ''}`} aria-hidden="true">
            ▼
          </span>
        </MGButton>
        <section
          id={panelId}
          className={`mg-accordion-content${expanded ? ' open' : ''}`}
          aria-labelledby={triggerId}
        >
          {expanded ? (
            <div className="mg-accordion-body integrated-schedule-side-peek-billing-accordion__body">
              {glanceSummary ? (
                <p
                  className="integrated-schedule-side-peek-billing-accordion__glance"
                  data-testid={SIDE_PEEK_BILLING_SCHEDULE_GLANCE_TEST_ID}
                >
                  <SafeText>{glanceSummary}</SafeText>
                </p>
              ) : null}
              <ul
                className="integrated-schedule-side-peek-billing-accordion__list"
                data-testid={SIDE_PEEK_BILLING_SCHEDULE_LIST_TEST_ID}
              >
                {items.map((item, index) => {
                  const key = toDisplayString(item?.id, `row-${index}`);
                  return (
                    <li
                      key={key}
                      className="integrated-schedule-side-peek-billing-accordion__item-row"
                    >
                      <SafeText>{buildBillingScheduleRowLabel(item)}</SafeText>
                    </li>
                  );
                })}
                {hiddenCount > 0 ? (
                  <li
                    className="integrated-schedule-side-peek-billing-accordion__more"
                    data-testid={SIDE_PEEK_BILLING_SCHEDULE_OVERFLOW_TEST_ID}
                  >
                    <SafeText>{buildBillingScheduleOverflowLabel(hiddenCount)}</SafeText>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

SidePeekBillingScheduleAccordion.propTypes = {
  consultationSchedules: PropTypes.arrayOf(PropTypes.object),
  defaultExpanded: PropTypes.bool,
  title: PropTypes.string
};

export default SidePeekBillingScheduleAccordion;
