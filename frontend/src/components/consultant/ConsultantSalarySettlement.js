/**
 * ConsultantSalarySettlement — 관리자 급여 산정 결과(상담사 조회 전용)
 *
 * 금액·문자 필드는 {@link toDisplayString}, {@link toSafeNumber} 경계를 따른다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useConsultantSalaryCalculations } from '../../hooks/useConsultantSalaryCalculations';
import { toDisplayString, toSafeNumber, toErrorMessage } from '../../utils/safeDisplay';
import { CONSULTANT_SALARY_SETTLEMENT_STRINGS as S } from '../../constants/consultantSalarySettlementStrings';
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
 * @param {Object} item
 * @returns {string}
 */
const resolveStatus = (item) => {
  const v = item.status ?? item.settlementStatus ?? item.state;
  return toDisplayString(v, S.FALLBACK_STATUS);
};

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveNet = (item) =>
  item.netSalary
  ?? item.netPay
  ?? item.netAmount
  ?? item.actualPayment
  ?? item.takeHomePay;

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveGross = (item) =>
  item.grossSalary
  ?? item.grossPay
  ?? item.totalGross
  ?? item.totalPayment;

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveDeductions = (item) => item.totalDeductions ?? item.deductionTotal ?? item.deductions;

/**
 * @param {Object} item
 * @returns {*}
 */
const resolveMemo = (item) => item.memo ?? item.note ?? item.description ?? item.remarks;

// eslint-disable-next-line react/prop-types -- 행 단위 프레젠테이션 전용
const SettlementCard = ({ item }) => {
  return (
    <article
      className="cr-salary-settlement__card"
      aria-label={`${S.LABEL_PERIOD}: ${resolvePeriodLabel(item)}`}
    >
      <h3 className="cr-salary-settlement__card-title">{resolvePeriodLabel(item)}</h3>
      <div className="cr-salary-settlement__grid">
        <div className="cr-salary-settlement__field">
          <span className="cr-salary-settlement__label">{S.LABEL_STATUS}</span>
          <span className="cr-salary-settlement__value">{resolveStatus(item)}</span>
        </div>
        <div className="cr-salary-settlement__field">
          <span className="cr-salary-settlement__label">{S.LABEL_NET}</span>
          <span className="cr-salary-settlement__value cr-salary-settlement__value--emph">
            {formatWon(resolveNet(item))}
          </span>
        </div>
        <div className="cr-salary-settlement__field">
          <span className="cr-salary-settlement__label">{S.LABEL_GROSS}</span>
          <span className="cr-salary-settlement__value">{formatWon(resolveGross(item))}</span>
        </div>
        <div className="cr-salary-settlement__field">
          <span className="cr-salary-settlement__label">{S.LABEL_DEDUCTIONS}</span>
          <span className="cr-salary-settlement__value">{formatWon(resolveDeductions(item))}</span>
        </div>
        <div className="cr-salary-settlement__field cr-salary-settlement__field--full">
          <span className="cr-salary-settlement__label">{S.LABEL_MEMO}</span>
          <span className="cr-salary-settlement__value">{toDisplayString(resolveMemo(item), '—')}</span>
        </div>
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
