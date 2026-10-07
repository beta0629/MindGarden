/**
 * ConsultantSalaryMonthCard — 상담사 급여 월 카드 (읽기 전용 · 「N원」 · 실수령 ink)
 * 승인·지급 CTA 없음. 공제(out)만 파랑. 정산 수단 값이 없으면 「—」.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../common/StatusBadge';
import ConsultantMoneyText from '../suite/ConsultantMoneyText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  computeSalaryCardAmounts,
  resolveSalaryPeriodRange,
  resolveSalaryStatusKey,
  resolveSalaryYearMonth
} from '../../../utils/consultantSalaryView';
import { CONSULTANT_SALARY_SETTLEMENT_STRINGS as S } from '../../../constants/consultantSalarySettlementStrings';
import {
  SALARY_STATUS_LABELS,
  SALARY_CALC_DETAIL_OPTION_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL,
  SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT
} from '../../../constants/salaryConstants';
import {
  CONSULTANT_MONEY_SIGN,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../../constants/consultantSuite';
import './ConsultantSalaryMonthCard.css';

const CONSULTATION_ROW_LABELS = new Set([
  SALARY_CALC_DETAIL_OPTION_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL
]);

const EMPTY_DASH = '—';

/**
 * @param {Object} item
 * @returns {string}
 */
const resolveSettlementMethod = (item) => toDisplayString(
  item.paymentMethod ?? item.settlementMethod ?? item.payMethod ?? item.payoutMethod,
  EMPTY_DASH
);

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveMemo = (item) => item.memo ?? item.note ?? item.description ?? item.remarks;

const ConsultantSalaryMonthCard = ({ item }) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const amounts = computeSalaryCardAmounts(item);
  const yearMonth = resolveSalaryYearMonth(item);
  const range = resolveSalaryPeriodRange(item);
  const periodLabel = yearMonth
    ? t('salary.periodMonth', yearMonth)
    : (range ? t('salary.periodRange', range) : EMPTY_DASH);
  const statusKey = resolveSalaryStatusKey(item);
  const statusLabel = Object.prototype.hasOwnProperty.call(SALARY_STATUS_LABELS, statusKey)
    ? t(`salary.status.${statusKey}`, { defaultValue: SALARY_STATUS_LABELS[statusKey] })
    : S.FALLBACK_STATUS;
  const memo = resolveMemo(item);

  return (
    <article
      className="consultant-salary-card"
      aria-label={`${S.LABEL_PERIOD}: ${periodLabel}`}
      data-testid={CONSULTANT_SUITE_TEST_ID.SALARY_CARD}
    >
      <header className="consultant-salary-card__header">
        <h2 className="consultant-salary-card__title">{periodLabel}</h2>
        <StatusBadge variant="neutral" className={CONSULTANT_SUITE_CLASS.STATUS}>
          {statusLabel}
        </StatusBadge>
      </header>
      <dl className="consultant-salary-card__rows">
        <div className="consultant-salary-card__row">
          <dt>{S.LABEL_MONTHLY_SESSION_COUNT}</dt>
          <dd className={CONSULTANT_SUITE_CLASS.MONEY_MUTED}>
            {`${amounts.sessionCount}${SALARY_DETAIL_MONTHLY_SESSION_COUNT_UNIT}`}
          </dd>
        </div>
        {amounts.pretaxRows.map((row) => (
          <div key={row.label} className="consultant-salary-card__row">
            <dt>{CONSULTATION_ROW_LABELS.has(row.label) ? S.LABEL_CONSULTATION_PSYCH : row.label}</dt>
            <dd><ConsultantMoneyText value={row.amount} /></dd>
          </div>
        ))}
        {amounts.bonus > 0 ? (
          <div className="consultant-salary-card__row">
            <dt>{S.LABEL_MEAL_TRANSPORT}</dt>
            <dd><ConsultantMoneyText value={amounts.bonus} sign={CONSULTANT_MONEY_SIGN.PLUS} /></dd>
          </div>
        ) : null}
        <div className="consultant-salary-card__row">
          <dt>{S.LABEL_GROSS_PRETAX}</dt>
          <dd><ConsultantMoneyText value={amounts.grossPretax} /></dd>
        </div>
        {amounts.tax > 0 ? (
          <div className="consultant-salary-card__row">
            <dt>{S.LABEL_TAX_DEDUCTION}</dt>
            <dd><ConsultantMoneyText value={amounts.tax} sign={CONSULTANT_MONEY_SIGN.MINUS} /></dd>
          </div>
        ) : null}
        <div className="consultant-salary-card__row consultant-salary-card__row--net">
          <dt>{S.LABEL_NET_AFTER_TAX}</dt>
          <dd><ConsultantMoneyText value={amounts.net} strong /></dd>
        </div>
        <div className="consultant-salary-card__row">
          <dt>{S.LABEL_SETTLEMENT_METHOD}</dt>
          <dd className={CONSULTANT_SUITE_CLASS.MONEY_MUTED}>{resolveSettlementMethod(item)}</dd>
        </div>
        {memo != null && String(memo).trim() !== '' ? (
          <div className="consultant-salary-card__row consultant-salary-card__row--memo">
            <dt>{S.LABEL_MEMO}</dt>
            <dd>{toDisplayString(memo, EMPTY_DASH)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
};

ConsultantSalaryMonthCard.propTypes = {
  item: PropTypes.shape({}).isRequired
};

export default ConsultantSalaryMonthCard;
