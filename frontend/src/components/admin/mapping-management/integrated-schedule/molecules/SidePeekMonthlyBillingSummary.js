/**
 * SidePeekMonthlyBillingSummary — 월 청구 요약 (일자·횟수·금액·기관 청구 안내)
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../../../common/SafeText';
import {
  SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID,
  SIDE_PEEK_MONTHLY_BILLING_AMOUNT_TEST_ID,
  SIDE_PEEK_MONTHLY_BILLING_COUNT_TEST_ID,
  SIDE_PEEK_MONTHLY_BILLING_DATES_TEST_ID,
  SIDE_PEEK_MONTHLY_BILLING_CHARGE_HINT_TEST_ID,
  MONTH_END_INSTITUTION_BILLING_REMINDER_TEST_ID
} from '../constants/institutionLinkBillingReminderConstants';
import './SidePeekMonthlyBillingSummary.css';

/**
 * @param {object} props
 * @param {object} props.summary buildInstitutionLinkMonthBillingSummary 결과
 * @param {boolean} [props.showMonthEndReminder]
 */
const SidePeekMonthlyBillingSummary = ({
  summary,
  showMonthEndReminder = false
}) => {
  const { t } = useTranslation(['admin']);

  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const hasAmount = Boolean(summary.monthlyAmountLabel);
  const datesText = summary.datesGlance
    || (Array.isArray(summary.dateLabels) ? summary.dateLabels.join(' · ') : '');
  const countLabel = summary.countLabel || `${summary.count ?? 0}회`;
  const chargeHint = hasAmount
    ? t('admin:integratedSchedule.sidePeek.monthlyBillingChargeWithAmount', {
      amount: summary.monthlyAmountLabel,
      defaultValue: `이 금액(${summary.monthlyAmountLabel})으로 기관 청구`
    })
    : t('admin:integratedSchedule.sidePeek.monthlyBillingChargeHint', {
      defaultValue: '이 금액으로 기관 청구'
    });

  return (
    <section
      className="integrated-schedule-side-peek-monthly-billing"
      data-testid={SIDE_PEEK_MONTHLY_BILLING_SUMMARY_TEST_ID}
      aria-label={t('admin:integratedSchedule.sidePeek.monthlyBillingSummaryTitle', {
        defaultValue: '월 청구 요약'
      })}
    >
      <h3 className="integrated-schedule-side-peek-monthly-billing__title">
        <SafeText>
          {t('admin:integratedSchedule.sidePeek.monthlyBillingSummaryTitle', {
            defaultValue: '월 청구 요약'
          })}
        </SafeText>
      </h3>
      {datesText ? (
        <p
          className="integrated-schedule-side-peek-monthly-billing__dates"
          data-testid={SIDE_PEEK_MONTHLY_BILLING_DATES_TEST_ID}
        >
          <SafeText>
            {t('admin:integratedSchedule.sidePeek.monthlyBillingDatesLabel', {
              dates: datesText,
              defaultValue: `상담일 (초기결제 제외): ${datesText}`
            })}
          </SafeText>
        </p>
      ) : (
        <p
          className="integrated-schedule-side-peek-monthly-billing__dates"
          data-testid={SIDE_PEEK_MONTHLY_BILLING_DATES_TEST_ID}
        >
          <SafeText>
            {t('admin:integratedSchedule.sidePeek.monthlyBillingDatesEmpty', {
              defaultValue: '이번 달 청구 대상 상담일이 없습니다.'
            })}
          </SafeText>
        </p>
      )}
      <dl className="integrated-schedule-side-peek-monthly-billing__facts">
        <div className="integrated-schedule-side-peek-monthly-billing__fact">
          <dt>
            <SafeText>
              {t('admin:integratedSchedule.sidePeek.monthlyBillingCountLabel', {
                defaultValue: '월간 총 횟수'
              })}
            </SafeText>
          </dt>
          <dd data-testid={SIDE_PEEK_MONTHLY_BILLING_COUNT_TEST_ID}>
            <SafeText>{countLabel}</SafeText>
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-monthly-billing__fact">
          <dt>
            <SafeText>
              {t('admin:integratedSchedule.sidePeek.monthlyBillingAmountLabel', {
                defaultValue: '월간 총 금액'
              })}
            </SafeText>
          </dt>
          <dd data-testid={SIDE_PEEK_MONTHLY_BILLING_AMOUNT_TEST_ID}>
            <SafeText>{hasAmount ? summary.monthlyAmountLabel : '—'}</SafeText>
          </dd>
        </div>
      </dl>
      {(summary.count || 0) > 0 ? (
        <p
          className="integrated-schedule-side-peek-monthly-billing__charge-hint"
          data-testid={SIDE_PEEK_MONTHLY_BILLING_CHARGE_HINT_TEST_ID}
          role="note"
        >
          <SafeText>{chargeHint}</SafeText>
        </p>
      ) : null}
      {showMonthEndReminder ? (
        <p
          className="integrated-schedule-side-peek-monthly-billing__month-end-note"
          role="status"
          data-testid={MONTH_END_INSTITUTION_BILLING_REMINDER_TEST_ID}
        >
          <SafeText>
            {t('admin:integratedSchedule.sidePeek.monthEndInstitutionBillingReminder')}
          </SafeText>
        </p>
      ) : null}
    </section>
  );
};

SidePeekMonthlyBillingSummary.propTypes = {
  summary: PropTypes.shape({
    datesGlance: PropTypes.string,
    dateLabels: PropTypes.arrayOf(PropTypes.string),
    countLabel: PropTypes.string,
    count: PropTypes.number,
    monthlyAmountLabel: PropTypes.string
  }),
  showMonthEndReminder: PropTypes.bool
};

export default SidePeekMonthlyBillingSummary;
