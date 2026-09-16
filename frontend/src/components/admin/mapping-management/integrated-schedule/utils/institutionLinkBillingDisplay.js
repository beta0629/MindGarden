/**
 * 기관연동 공통 청구 표시 유틸 (전 INSTITUTION_LINK — 고객 ID 특례 금지)
 *
 * - 초기 결제: 생애 1회. 재무 FT 존재 시 「초기 결제 완료」배지만 (금액 상세 금지).
 * - 이후 월 청구: 상담 일자 + 월간 횟수 + 월간 금액(packagePrice×횟수, 없으면 계약 monthlyAmount), 초기 상담 제외.
 * - 월말 안내: 기관연동 + 말일 N일 전(상수).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';
import { MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS } from '../constants/institutionLinkBillingReminderConstants';
import {
  formatBillingScheduleDate,
  normalizeConsultationSchedules,
  parseBillingScheduleYmd,
  resolveConsultationSchedulesForSidePeek
} from './cardBillingProgressDisplay';

const STATUS_COMPLETED = 'COMPLETED';
const DATE_LABEL_SEP = ' · ';
const AMOUNT_SUFFIX = '원';

/**
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const isInstitutionLinkMapping = (mapping) => (
  isInstitutionLinkEngagement(mapping?.paymentTiming)
  || isInstitutionLinkEngagement(mapping?.clientEngagementType)
  || isInstitutionLinkEngagement(mapping?.engagementType)
  || isInstitutionLinkEngagement(mapping?.mappingEngagementType)
);

/**
 * 재무 FT enrich 존재 시에만 true.
 * contract prepaid_amount / institutionLinkPrepaidAmount 금액 필드는 보지 않는다.
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const hasInstitutionLinkInitialPaymentCompleted = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  if (mapping.hasInstitutionLinkInitialPayment === true) {
    return true;
  }
  const payment = mapping.initialConsultationPayment;
  if (payment == null || typeof payment !== 'object') {
    return false;
  }
  if (payment.financialTransactionId != null) {
    return true;
  }
  const amount = toSafeNumber(payment.amount, null);
  return amount != null && amount > 0;
};

/**
 * 기준일로부터 해당 월 말일까지 남은 일수(말일=0).
 *
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export const resolveDaysUntilMonthEnd = (referenceDate = new Date()) => {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const year = ref.getFullYear();
  const monthIndex = ref.getMonth();
  const day = ref.getDate();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.max(0, lastDay - day);
};

/**
 * 월말 임박 여부 (말일 포함, N일 전~말일).
 *
 * @param {Date} [referenceDate]
 * @param {number} [daysBefore]
 * @returns {boolean}
 */
export const isNearMonthEnd = (
  referenceDate = new Date(),
  daysBefore = MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS
) => {
  const safeDays = Number.isFinite(Number(daysBefore))
    ? Math.max(0, Number(daysBefore))
    : MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS;
  return resolveDaysUntilMonthEnd(referenceDate) <= safeDays;
};

/**
 * 기관연동 + 월말 임박이면 청구 안내 표시.
 *
 * @param {object|null|undefined} mapping
 * @param {Date} [referenceDate]
 * @param {number} [daysBefore]
 * @returns {boolean}
 */
export const shouldShowMonthEndInstitutionBillingReminder = (
  mapping,
  referenceDate = new Date(),
  daysBefore = MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS
) => {
  if (!isInstitutionLinkMapping(mapping)) {
    return false;
  }
  return isNearMonthEnd(referenceDate, daysBefore);
};

/**
 * 초기 상담 일정 id (생애 1회). FT 거래일 일치 COMPLETED 우선, 없으면 가장 COMPLETED.
 *
 * @param {object|null|undefined} mapping
 * @param {unknown} schedules
 * @returns {number|string|null}
 */
export const resolveInitialConsultationScheduleId = (mapping, schedules) => {
  const items = normalizeConsultationSchedules(schedules);
  const completed = items.filter((item) => {
    const status = toDisplayString(item?.status, '').trim().toUpperCase();
    return status === STATUS_COMPLETED;
  });
  if (completed.length === 0) {
    return null;
  }
  const paymentDateRaw = toDisplayString(
    mapping?.initialConsultationPayment?.transactionDate,
    ''
  ).trim();
  const paymentYmd = paymentDateRaw ? parseBillingScheduleYmd(paymentDateRaw) : null;
  if (paymentYmd) {
    const matched = completed.find((item) => {
      const ymd = parseBillingScheduleYmd(item?.date);
      return ymd
        && ymd.year === paymentYmd.year
        && ymd.month === paymentYmd.month
        && ymd.day === paymentYmd.day;
    });
    if (matched?.id != null) {
      return matched.id;
    }
  }
  const sorted = [...completed].sort((a, b) => {
    const da = toDisplayString(a?.date, '');
    const db = toDisplayString(b?.date, '');
    if (da !== db) {
      return da.localeCompare(db);
    }
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''), undefined, { numeric: true });
  });
  return sorted[0]?.id != null ? sorted[0].id : null;
};

/**
 * 월 청구용 일정 — 초기 상담(생애 1회) 제외.
 *
 * @param {object|null|undefined} mapping
 * @param {unknown} schedules
 * @returns {object[]}
 */
export const excludeInitialConsultationFromSchedules = (mapping, schedules) => {
  const items = normalizeConsultationSchedules(schedules);
  const initialId = resolveInitialConsultationScheduleId(mapping, items);
  if (initialId == null) {
    return items;
  }
  return items.filter((item) => String(item?.id) !== String(initialId));
};

/**
 * @param {Date} [referenceDate]
 * @returns {{ year: number, month: number }}
 */
export const resolveBillingYearMonth = (referenceDate = new Date()) => {
  const ref = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  return { year: ref.getFullYear(), month: ref.getMonth() + 1 };
};

/**
 * 기준 연·월 일정만.
 *
 * @param {unknown} schedules
 * @param {{ year: number, month: number }} yearMonth
 * @returns {object[]}
 */
export const filterSchedulesByYearMonth = (schedules, yearMonth) => {
  const year = toSafeNumber(yearMonth?.year, null);
  const month = toSafeNumber(yearMonth?.month, null);
  if (year == null || month == null) {
    return [];
  }
  return normalizeConsultationSchedules(schedules).filter((item) => {
    const ymd = parseBillingScheduleYmd(item?.date);
    return ymd && ymd.year === year && ymd.month === month;
  });
};

/**
 * @param {number|null|undefined} amount
 * @returns {string}
 */
export const formatInstitutionLinkMonthlyAmount = (amount) => {
  const num = toSafeNumber(amount, null);
  if (num == null || num <= 0) {
    return '';
  }
  return `${num.toLocaleString('ko-KR')}${AMOUNT_SUFFIX}`;
};

/**
 * 기관연동 회당 단가 — {@code packagePrice} SSOT.
 * prepaid_amount / institutionLinkPrepaidAmount(DATAFIX 10만) 금지.
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
  const price = toSafeNumber(mapping.packagePrice, null);
  if (price == null || price <= 0) {
    return null;
  }
  return price;
};

/**
 * 이번 달(기준월) 기관연동 월 청구 요약 — 초기 상담 제외·COMPLETED 만.
 * 월간 금액 = packagePrice(단가) × 횟수.
 * packagePrice 없을 때만 계약 {@code institutionLinkMonthlyAmount} 폴백.
 *
 * @param {object|null|undefined} mapping
 * @param {Date} [referenceDate]
 * @returns {{
 *   year: number,
 *   month: number,
 *   count: number,
 *   dateLabels: string[],
 *   datesGlance: string,
 *   unitPrice: number|null,
 *   monthlyAmount: number|null,
 *   monthlyAmountLabel: string,
 *   countLabel: string
 * }|null}
 */
export const buildInstitutionLinkMonthBillingSummary = (
  mapping,
  referenceDate = new Date()
) => {
  if (!isInstitutionLinkMapping(mapping)) {
    return null;
  }
  const unionSchedules = resolveConsultationSchedulesForSidePeek(mapping, true);
  const withoutInitial = excludeInitialConsultationFromSchedules(mapping, unionSchedules);
  const completedOnly = withoutInitial.filter((item) => {
    const status = toDisplayString(item?.status, '').trim().toUpperCase();
    return status === STATUS_COMPLETED;
  });
  const yearMonth = resolveBillingYearMonth(referenceDate);
  const monthSchedules = filterSchedulesByYearMonth(completedOnly, yearMonth);
  const dateLabels = [];
  monthSchedules.forEach((item) => {
    const label = formatBillingScheduleDate(item?.date);
    if (label && !dateLabels.includes(label)) {
      dateLabels.push(label);
    }
  });
  const count = monthSchedules.length;
  const unitPrice = resolveInstitutionLinkSessionUnitPrice(mapping);
  let monthlyAmount = null;
  if (unitPrice != null && count > 0) {
    monthlyAmount = unitPrice * count;
  } else {
    const contractMonthly = toSafeNumber(mapping?.institutionLinkMonthlyAmount, null);
    if (contractMonthly != null && contractMonthly > 0 && count > 0) {
      monthlyAmount = contractMonthly;
    }
  }
  const datesGlance = joinBillingDateLabels(dateLabels);
  return {
    year: yearMonth.year,
    month: yearMonth.month,
    count,
    dateLabels,
    datesGlance,
    unitPrice,
    monthlyAmount,
    monthlyAmountLabel: formatInstitutionLinkMonthlyAmount(monthlyAmount),
    countLabel: `${count}회`
  };
};

/**
 * @param {string[]} dateLabels
 * @returns {string}
 */
export const joinBillingDateLabels = (dateLabels) => {
  if (!Array.isArray(dateLabels) || dateLabels.length === 0) {
    return '';
  }
  return dateLabels.join(DATE_LABEL_SEP);
};
