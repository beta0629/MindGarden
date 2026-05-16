/**
 * ConsultantSalarySettlement — 관리자 급여 산정 결과(상담사 조회 전용)
 *
 * 금액·문자 필드는 {@link toDisplayString}, {@link toSafeNumber} 경계를 따른다.
 * 카드 레이아웃·구성 행은 ERP 급여 관리(`SalaryManagement`)와 동일 규칙을 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useConsultantSalaryCalculations } from '../../hooks/useConsultantSalaryCalculations';
import { toDisplayString, toSafeNumber, toErrorMessage } from '../../utils/safeDisplay';
import { CONSULTANT_SALARY_SETTLEMENT_STRINGS as S } from '../../constants/consultantSalarySettlementStrings';
import {
  SALARY_STATUS_LABELS,
  SALARY_CALC_DETAIL_OPTION_LABEL,
  SALARY_CALC_DETAIL_CONSULTATION_LABEL,
  SALARY_CALC_DETAIL_HOURLY_LABEL
} from '../../constants/salaryConstants';
import {
  buildSalaryCalculationComponentRows,
  normalizeSalaryCalculationStatus
} from '../../utils/salaryCalculationDisplay';
import '../common/StatusBadge.css';
import './ConsultantSalarySettlement.css';

/**
 * @param {*} value
 * @returns {string}
 */
const formatWon = (value) => {
  const n = toSafeNumber(value, Number.NaN);
  if (!Number.isFinite(n)) {
    return toDisplayString(null, '—');
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(n);
};

/**
 * @param {unknown} value
 * @returns {number}
 */
const toSalaryNumber = (value) => {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * @param {Object} item
 * @returns {string}
 */
const resolvePeriodLabel = (item) => {
  const direct =
    item.settlementPeriod
    ?? item.periodLabel
    ?? item.period
    ?? item.payPeriod
    ?? item.calculationPeriod;
  if (direct != null && String(direct).trim() !== '') {
    return toDisplayString(direct, '—');
  }
  const start = item.calculationPeriodStart;
  const end = item.calculationPeriodEnd;
  if (start != null && end != null) {
    const s = String(start).split('T')[0];
    const e = String(end).split('T')[0];
    if (s && e) {
      return toDisplayString(`${s} ~ ${e}`, '—');
    }
  }
  const y = item.year ?? item.settlementYear;
  const m = item.month ?? item.settlementMonth;
  if (y != null && m != null) {
    return toDisplayString(`${y}-${String(m).padStart(2, '0')}`, '—');
  }
  return '—';
};

/**
 * @param {unknown} raw
 * @returns {string}
 */
const getSalaryStatusLabel = (raw) => {
  const key = normalizeSalaryCalculationStatus(raw);
  if (key && Object.prototype.hasOwnProperty.call(SALARY_STATUS_LABELS, key)) {
    return SALARY_STATUS_LABELS[key];
  }
  return toDisplayString(raw, S.FALLBACK_STATUS);
};

/**
 * @param {string} rowLabel
 * @returns {string}
 */
const mapConsultantComponentLabel = (rowLabel) => {
  if (
    rowLabel === SALARY_CALC_DETAIL_OPTION_LABEL
    || rowLabel === SALARY_CALC_DETAIL_CONSULTATION_LABEL
    || rowLabel === SALARY_CALC_DETAIL_HOURLY_LABEL
  ) {
    return S.LABEL_CONSULTATION_PSYCH;
  }
  return rowLabel;
};

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveMemo = (item) => item.memo ?? item.note ?? item.description ?? item.remarks;

/**
 * @param {Object} item
 * @returns {string}
 */
const resolveSettlementMethodDisplay = (item) => {
  const v = item.paymentMethod ?? item.settlementMethod ?? item.payMethod ?? item.payoutMethod;
  return toDisplayString(v, '—');
};

// eslint-disable-next-line react/prop-types -- 행 단위 프레젠테이션 전용
const SettlementCard = ({ item }) => {
  const pretaxRows = buildSalaryCalculationComponentRows(item, toSalaryNumber);
  const bonus = toSalaryNumber(item.bonusEarnings);
  const taxAmt = toSalaryNumber(item.taxAmount ?? item.deductions);
  const grossPretax =
    item.grossSalary != null && item.grossSalary !== ''
      ? toSalaryNumber(item.grossSalary)
      : toSalaryNumber(item.totalSalary);
  const netAfter =
    item.netSalary != null && item.netSalary !== ''
      ? toSalaryNumber(item.netSalary)
      : grossPretax - taxAmt;
  const memo = resolveMemo(item);

  return (
    <article
      className="cr-salary-settlement__card"
      aria-label={`${S.LABEL_PERIOD}: ${resolvePeriodLabel(item)}`}
    >
      <div className="cr-salary-settlement__card-header">
        <h3 className="cr-salary-settlement__card-title">{resolvePeriodLabel(item)}</h3>
        <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
          {getSalaryStatusLabel(item.status ?? item.settlementStatus ?? item.state)}
        </span>
      </div>
      <div className="cr-salary-settlement__card-details">
        {pretaxRows.map((row, idx) => (
          <div
            key={`${row.label}-${idx}`}
            className="cr-salary-settlement__detail-row"
          >
            <span className="cr-salary-settlement__detail-label">
              {mapConsultantComponentLabel(row.label)}
            </span>
            <span className="cr-salary-settlement__detail-value">{formatWon(row.amount)}</span>
          </div>
        ))}
        {bonus > 0 ? (
          <div className="cr-salary-settlement__detail-row">
            <span className="cr-salary-settlement__detail-label">{S.LABEL_MEAL_TRANSPORT}</span>
            <span className="cr-salary-settlement__detail-value">+{formatWon(item.bonusEarnings)}</span>
          </div>
        ) : null}
        <div className="cr-salary-settlement__detail-row">
          <span className="cr-salary-settlement__detail-label">{S.LABEL_GROSS_PRETAX}</span>
          <span className="cr-salary-settlement__detail-value">{formatWon(grossPretax)}</span>
        </div>
        {taxAmt > 0 ? (
          <div className="cr-salary-settlement__detail-row cr-salary-settlement__detail-row--tax">
            <span className="cr-salary-settlement__detail-label">{S.LABEL_TAX_DEDUCTION}</span>
            <span className="cr-salary-settlement__detail-value">-{formatWon(taxAmt)}</span>
          </div>
        ) : null}
        <div className="cr-salary-settlement__detail-row cr-salary-settlement__detail-row--total">
          <span className="cr-salary-settlement__detail-label">{S.LABEL_NET_AFTER_TAX}</span>
          <span className="cr-salary-settlement__detail-value">{formatWon(netAfter)}</span>
        </div>
        <div className="cr-salary-settlement__detail-row">
          <span className="cr-salary-settlement__detail-label">{S.LABEL_SETTLEMENT_METHOD}</span>
          <span className="cr-salary-settlement__detail-value">{resolveSettlementMethodDisplay(item)}</span>
        </div>
        {memo != null && String(memo).trim() !== '' ? (
          <div className="cr-salary-settlement__grid cr-salary-settlement__memo-block">
            <div className="cr-salary-settlement__field cr-salary-settlement__field--full">
              <span className="cr-salary-settlement__label">{S.LABEL_MEMO}</span>
              <span className="cr-salary-settlement__value">{toDisplayString(memo, '—')}</span>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const ConsultantSalarySettlement = () => {
  const { items, loading, error, refetch, hasItems } = useConsultantSalaryCalculations();

  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return [...items];
  }, [items]);

  if (loading) {
    return (
      <div className="cr-dashboard" aria-busy="true" aria-label="로딩 중">
        <div className="cr-skeleton cr-skeleton--greeting" />
        <div className="cr-skeleton cr-skeleton--card" />
        <div className="cr-skeleton cr-skeleton--card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cr-salary-settlement">
        <div className="cr-salary-settlement__error" role="alert">
          <AlertTriangle size={40} className="cr-error__icon" aria-hidden />
          <p className="cr-salary-settlement__value">{toErrorMessage(error, S.LOAD_ERROR)}</p>
          <button type="button" className="cr-salary-settlement__retry" onClick={() => refetch()}>
            {S.RETRY}
          </button>
        </div>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="cr-salary-settlement">
        <p className="cr-salary-settlement__intro">{toDisplayString(S.PAGE_INTRO, '')}</p>
        <div className="cr-salary-settlement__empty">
          <div className="cr-salary-settlement__empty-title">{toDisplayString(S.EMPTY_TITLE, '')}</div>
          <p>{toDisplayString(S.EMPTY_BODY, '')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-salary-settlement">
      <p className="cr-salary-settlement__intro">{toDisplayString(S.PAGE_INTRO, '')}</p>
      <section className="cr-dashboard__section" aria-label={S.LIST_SECTION}>
        <h2 className="cr-dashboard__section-title">{S.LIST_SECTION}</h2>
        {sortedItems.map((row, idx) => (
          <SettlementCard
            key={String(row.id ?? row.calculationId ?? row.settlementId ?? `idx-${idx}`)}
            item={row}
          />
        ))}
      </section>
    </div>
  );
};

export default ConsultantSalarySettlement;
