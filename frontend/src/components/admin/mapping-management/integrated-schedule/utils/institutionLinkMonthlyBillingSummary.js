/**
 * 기관연동 Side Peek — 월 청구 요약 (초기결제 제외 일자·횟수·금액)
 *
 * 횟수 SSOT: IL union 일정 중 COMPLETED, 초기결제 커버일 제외, 기준 연월.
 * 단가 SSOT: mapping.packagePrice (FT/요금표 정합). prepaid_amount·10만 하드코딩 금지.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import {
  formatBillingScheduleDate,
  normalizeConsultationSchedules,
  parseBillingScheduleYmd
} from './cardBillingProgressDisplay';
import {
  hasInstitutionLinkInitialPaymentCompleted,
  isInstitutionLinkMapping
} from './institutionLinkBillingDisplay';
import { resolveInitialConsultationPayment } from './initialConsultationPaymentDisplay';

const STATUS_COMPLETED = 'COMPLETED';
const LABEL_COUNT_UNIT = '회';
const LABEL_AMOUNT_SUFFIX = '원';
const LABEL_MONTH_SUFFIX = '월';
const LABEL_DAY_SUFFIX = '일';
const DATE_LIST_SEP = ' · ';

/**
 * @param {Date} [referenceDate]
 * @returns {{ year: number, month: number }}
 */
export const resolveBillingYearMonth = (referenceDate = new Date()) => {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  return {
    year: ref.getFullYear(),
    month: ref.getMonth() + 1
  };
};

/**
 * 기관연동 회당 단가 — packagePrice 만. prepaid denorm 무시.
 *
 * @param {object|null|undefined} mapping
 * @returns {number|null}
 */
export const resolveInstitutionLinkSessionUnitPrice = (mapping) => {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  void mapping.institutionLinkPrepaidAmount;
  void mapping.prepaidAmount;
  void mapping.initialConsultationPayment;
  const price = toSafeNumber(mapping.packagePrice, null);
  if (price == null || price <= 0) {
    return null;
  }
  return price;
};

/**
 * 초기결제로 커버된 상담일 (YYYY-MM-DD). FT transactionDate 우선, 없으면 최초 COMPLETED.
 *
 * @param {object[]} sortedCompleted
 * @param {object|null|undefined} mapping
 * @returns {string|null} yyyy-mm-dd
 */
export const resolveInitialPaymentCoveredDateKey = (sortedCompleted, mapping) => {
  if (!hasInstitutionLinkInitialPaymentCompleted(mapping)
    && resolveInitialConsultationPayment(mapping) == null) {
    return null;
  }
  const payment = resolveInitialConsultationPayment(mapping);
  const txYmd = payment?.transactionDate
    ? parseBillingScheduleYmd(payment.transactionDate)
    : null;
  if (txYmd) {
    return `${txYmd.year}-${String(txYmd.month).padStart(2, '0')}-${String(txYmd.day).padStart(2, '0')}`;
  }
  const first = Array.isArray(sortedCompleted) ? sortedCompleted[0] : null;
  const firstYmd = parseBillingScheduleYmd(first?.date);
  if (!firstYmd) {
    return null;
  }
  return `${firstYmd.year}-${String(firstYmd.month).padStart(2, '0')}-${String(firstYmd.day).padStart(2, '0')}`;
};

/**
 * @param {object} item
 * @returns {string}
 */
const toDateSortKey = (item) => {
  const ymd = parseBillingScheduleYmd(item?.date);
  if (!ymd) {
    return toDisplayString(item?.date, '');
  }
  return `${ymd.year}-${String(ymd.month).padStart(2, '0')}-${String(ymd.day).padStart(2, '0')}`;
};

/**
 * @param {unknown} schedules
 * @returns {object[]}
 */
export const listCompletedConsultationSchedulesSorted = (schedules) => {
  return normalizeConsultationSchedules(schedules)
    .filter((item) => {
      const status = toDisplayString(item?.status, '').trim().toUpperCase();
      return status === STATUS_COMPLETED;
    })
    .slice()
    .sort((a, b) => toDateSortKey(a).localeCompare(toDateSortKey(b)));
};

/**
 * 초기결제 제외·기준 월 COMPLETED 일정.
 *
 * @param {object|null|undefined} mapping
 * @param {unknown} schedules IL union
 * @param {Date} [referenceDate]
 * @returns {object[]}
 */
export const resolveMonthlyBillableConsultationSchedules = (
  mapping,
  schedules,
  referenceDate = new Date()
) => {
  if (!isInstitutionLinkMapping(mapping)) {
    return [];
  }
  const completed = listCompletedConsultationSchedulesSorted(schedules);
  const coveredKey = resolveInitialPaymentCoveredDateKey(completed, mapping);
  const { year, month } = resolveBillingYearMonth(referenceDate);
  return completed.filter((item) => {
    const ymd = parseBillingScheduleYmd(item?.date);
    if (!ymd || ymd.year !== year || ymd.month !== month) {
      return false;
    }
    if (!coveredKey) {
      return true;
    }
    const key = `${ymd.year}-${String(ymd.month).padStart(2, '0')}-${String(ymd.day).padStart(2, '0')}`;
    return key !== coveredKey;
  });
};

/**
 * @param {number|null|undefined} amount
 * @returns {string}
 */
export const formatMonthlyBillingAmount = (amount) => {
  const num = toSafeNumber(amount, null);
  if (num == null) {
    return '';
  }
  return `${num.toLocaleString('ko-KR')}${LABEL_AMOUNT_SUFFIX}`;
};

/**
 * @param {object[]} billableSchedules
 * @returns {string} e.g. 9월 7일 · 14일
 */
export const buildMonthlyBillableDatesGlance = (billableSchedules) => {
  const items = normalizeConsultationSchedules(billableSchedules);
  if (items.length === 0) {
    return '';
  }
  let monthLabel = '';
  const dayParts = [];
  items.forEach((item) => {
    const ymd = parseBillingScheduleYmd(item?.date);
    if (!ymd) {
      const fallback = formatBillingScheduleDate(item?.date);
      if (fallback) {
        dayParts.push(fallback);
      }
      return;
    }
    if (!monthLabel) {
      monthLabel = `${ymd.month}${LABEL_MONTH_SUFFIX}`;
    }
    dayParts.push(`${ymd.day}${LABEL_DAY_SUFFIX}`);
  });
  if (dayParts.length === 0) {
    return '';
  }
  if (!monthLabel) {
    return dayParts.join(DATE_LIST_SEP);
  }
  return dayParts
    .map((part, index) => (index === 0 ? `${monthLabel} ${part}` : part))
    .join(DATE_LIST_SEP);
};

/**
 * @param {object|null|undefined} mapping
 * @param {unknown} schedules
 * @param {Date} [referenceDate]
 * @returns {{
 *   year: number,
 *   month: number,
 *   billableSchedules: object[],
 *   sessionCount: number,
 *   unitPrice: number|null,
 *   totalAmount: number|null,
 *   datesGlance: string,
 *   countLabel: string,
 *   amountLabel: string
 * }|null}
 */
export const buildInstitutionLinkMonthlyBillingSummary = (
  mapping,
  schedules,
  referenceDate = new Date()
) => {
  if (!isInstitutionLinkMapping(mapping)) {
    return null;
  }
  const { year, month } = resolveBillingYearMonth(referenceDate);
  const billableSchedules = resolveMonthlyBillableConsultationSchedules(
    mapping,
    schedules,
    referenceDate
  );
  const sessionCount = billableSchedules.length;
  const unitPrice = resolveInstitutionLinkSessionUnitPrice(mapping);
  const totalAmount = unitPrice != null && sessionCount > 0
    ? unitPrice * sessionCount
    : null;
  return {
    year,
    month,
    billableSchedules,
    sessionCount,
    unitPrice,
    totalAmount,
    datesGlance: buildMonthlyBillableDatesGlance(billableSchedules),
    countLabel: `${sessionCount}${LABEL_COUNT_UNIT}`,
    amountLabel: formatMonthlyBillingAmount(totalAmount)
  };
};
