/**
 * 기관연동 공통 청구 표시 유틸 (전 INSTITUTION_LINK — 고객 ID 특례 금지)
 *
 * - 결제 패턴: 기관·내담자(매핑)마다 SEPARATE / MONTHLY_COMBINED / ALL_COMBINED.
 *   단일 강제 UI 템플릿 금지.
 * - SEPARATE: 재무 FT 존재 시 「초기 결제 완료」·월 요약에서 해당 초기 상담 제외.
 * - MONTHLY_COMBINED: 배지 없음·해당 월 상담을 합쳐 단가×횟수.
 * - ALL_COMBINED: 배지 없음·월 전체 한 번 청구(계약 monthly 우선).
 * - 확장: mapping.institutionLinkBillingComposition (없으면 FT·monthly로 추론).
 * - 월말 안내: 기관연동 + 말일 N일 전(상수).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';
import {
  INSTITUTION_LINK_BILLING_COMPOSITION,
  INSTITUTION_LINK_BILLING_COMPOSITION_FIELD,
  INSTITUTION_LINK_INITIAL_BILLING_MODE_FIELD,
  MONTH_END_INSTITUTION_BILLING_REMINDER_DAYS
} from '../constants/institutionLinkBillingReminderConstants';
import {
  formatBillingScheduleDate,
  normalizeConsultationSchedules,
  parseBillingScheduleYmd,
  resolveConsultationSchedulesForSidePeek
} from './cardBillingProgressDisplay';

const STATUS_COMPLETED = 'COMPLETED';
const DATE_LABEL_SEP = ' · ';
const AMOUNT_SUFFIX = '원';
const MODE_SEPARATE = INSTITUTION_LINK_BILLING_COMPOSITION.SEPARATE;
const MODE_MONTHLY_COMBINED = INSTITUTION_LINK_BILLING_COMPOSITION.MONTHLY_COMBINED;
const MODE_ALL_COMBINED = INSTITUTION_LINK_BILLING_COMPOSITION.ALL_COMBINED;
const LEGACY_COMBINED = 'COMBINED';

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
 * @param {string} raw
 * @returns {'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED'|null}
 */
const normalizeBillingCompositionRaw = (raw) => {
  const value = toDisplayString(raw, '').trim().toUpperCase();
  if (!value) {
    return null;
  }
  if (value === MODE_SEPARATE) {
    return MODE_SEPARATE;
  }
  if (value === MODE_MONTHLY_COMBINED || value === LEGACY_COMBINED) {
    return MODE_MONTHLY_COMBINED;
  }
  if (value === MODE_ALL_COMBINED) {
    return MODE_ALL_COMBINED;
  }
  return null;
};

/**
 * 기관연동 청구 합산 모드 (고정 아님 — 데이터/설정 분기).
 * 1) institutionLinkBillingComposition
 * 2) legacy institutionLinkInitialBillingMode (SEPARATE|COMBINED→MONTHLY_COMBINED)
 * 3) 재무 초기 FT → SEPARATE
 * 4) 계약 monthly > 0 → ALL_COMBINED
 * 5) 그 외 → MONTHLY_COMBINED
 * contract prepaid_amount / 고객 ID 특례 금지.
 *
 * @param {object|null|undefined} mapping
 * @returns {'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED'}
 */
export const resolveInstitutionLinkBillingComposition = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return MODE_MONTHLY_COMBINED;
  }
  const fromComposition = normalizeBillingCompositionRaw(
    mapping[INSTITUTION_LINK_BILLING_COMPOSITION_FIELD]
  );
  if (fromComposition) {
    return fromComposition;
  }
  const fromLegacy = normalizeBillingCompositionRaw(
    mapping[INSTITUTION_LINK_INITIAL_BILLING_MODE_FIELD]
  );
  if (fromLegacy) {
    return fromLegacy;
  }
  if (hasInstitutionLinkInitialPaymentCompleted(mapping)) {
    return MODE_SEPARATE;
  }
  const contractMonthly = toSafeNumber(mapping.institutionLinkMonthlyAmount, null);
  if (contractMonthly != null && contractMonthly > 0) {
    return MODE_ALL_COMBINED;
  }
  return MODE_MONTHLY_COMBINED;
};

/**
 * @deprecated prefer resolveInstitutionLinkBillingComposition
 * @param {object|null|undefined} mapping
 * @returns {'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED'}
 */
export const resolveInstitutionLinkInitialBillingMode = (mapping) => (
  resolveInstitutionLinkBillingComposition(mapping)
);

/**
 * 월 요약에서 초기 상담을 제외할지 (SEPARATE 만).
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const shouldExcludeInitialConsultationFromMonthlyBilling = (mapping) => (
  resolveInstitutionLinkBillingComposition(mapping) === MODE_SEPARATE
);

/**
 * 「초기 결제 완료」배지·초기 결제 행 — SEPARATE 이고 실제 FT 있을 때만.
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const shouldShowInstitutionLinkInitialPaymentUi = (mapping) => (
  resolveInstitutionLinkBillingComposition(mapping) === MODE_SEPARATE
  && hasInstitutionLinkInitialPaymentCompleted(mapping)
);

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
 * 초기 상담 일정 id (생애 1회). FT 거래일 일치 COMPLETED 우선, 없으면 최초 COMPLETED.
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
 * 월 청구용 일정 — SEPARATE 일 때만 초기 상담(생애 1회) 제외. 합산 모드는 전부 포함.
 *
 * @param {object|null|undefined} mapping
 * @param {unknown} schedules
 * @returns {object[]}
 */
export const excludeInitialConsultationFromSchedules = (mapping, schedules) => {
  const items = normalizeConsultationSchedules(schedules);
  if (!shouldExcludeInitialConsultationFromMonthlyBilling(mapping)) {
    return items;
  }
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
 * 모드별 월 청구 금액.
 * - ALL_COMBINED: 계약 monthly 우선, 없으면 단가×횟수
 * - SEPARATE / MONTHLY_COMBINED: 단가×횟수 우선, 없으면 계약 monthly
 *
 * @param {object|null|undefined} mapping
 * @param {'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED'} composition
 * @param {number} count
 * @param {number|null} unitPrice
 * @returns {number|null}
 */
export const resolveInstitutionLinkMonthChargeAmount = (
  mapping,
  composition,
  count,
  unitPrice
) => {
  if (count <= 0) {
    return null;
  }
  const contractMonthly = toSafeNumber(mapping?.institutionLinkMonthlyAmount, null);
  const usageAmount = unitPrice != null ? unitPrice * count : null;
  if (composition === MODE_ALL_COMBINED) {
    if (contractMonthly != null && contractMonthly > 0) {
      return contractMonthly;
    }
    return usageAmount;
  }
  if (usageAmount != null) {
    return usageAmount;
  }
  if (contractMonthly != null && contractMonthly > 0) {
    return contractMonthly;
  }
  return null;
};

/**
 * 이번 달(기준월) 기관연동 월 청구 요약 — COMPLETED 만.
 * SEPARATE: 초기 상담 제외. MONTHLY/ALL_COMBINED: 해당 월 전체 합산.
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
 *   countLabel: string,
 *   billingComposition: 'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED',
 *   initialBillingMode: 'SEPARATE'|'MONTHLY_COMBINED'|'ALL_COMBINED',
 *   excludesInitialConsultation: boolean
 * }|null}
 */
export const buildInstitutionLinkMonthBillingSummary = (
  mapping,
  referenceDate = new Date()
) => {
  if (!isInstitutionLinkMapping(mapping)) {
    return null;
  }
  const billingComposition = resolveInstitutionLinkBillingComposition(mapping);
  const excludesInitialConsultation = billingComposition === MODE_SEPARATE;
  const unionSchedules = resolveConsultationSchedulesForSidePeek(mapping, true);
  const billingSchedules = excludeInitialConsultationFromSchedules(mapping, unionSchedules);
  const completedOnly = billingSchedules.filter((item) => {
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
  const monthlyAmount = resolveInstitutionLinkMonthChargeAmount(
    mapping,
    billingComposition,
    count,
    unitPrice
  );
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
    countLabel: `${count}회`,
    billingComposition,
    initialBillingMode: billingComposition,
    excludesInitialConsultation
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
