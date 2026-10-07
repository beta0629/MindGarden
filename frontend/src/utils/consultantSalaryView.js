/**
 * 상담사 급여 정산(읽기 전용) 화면 계산 — 월 카드 금액·상태 분류·요약
 * 관리자 확정 결과만 표시하며 승인·지급 동작은 제공하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import { SALARY_STATUS } from '../constants/salaryConstants';
import { CONSULTANT_SALARY_FILTER } from '../constants/consultantSuite';
import {
  buildSalaryCalculationComponentRows,
  normalizeSalaryCalculationStatus,
  resolveSalaryMonthlySessionCount
} from './salaryCalculationDisplay';

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{1,2})$/;

/**
 * @param {unknown} value
 * @returns {number}
 */
export const toSalaryNumber = (value) => {
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
export const resolveSalaryStatusKey = (item) => normalizeSalaryCalculationStatus(
  item?.status ?? item?.settlementStatus ?? item?.state
);

/**
 * 지급 상태 필터 분류 — PAID=지급됨, CANCELLED=제외, 그 외=지급 대기
 *
 * @param {Object} item
 * @returns {'paid'|'pending'|'cancelled'}
 */
export const classifySalaryPayout = (item) => {
  const key = resolveSalaryStatusKey(item);
  if (key === SALARY_STATUS.PAID) {
    return CONSULTANT_SALARY_FILTER.PAID;
  }
  if (key === SALARY_STATUS.CANCELLED) {
    return 'cancelled';
  }
  return CONSULTANT_SALARY_FILTER.PENDING;
};

/**
 * @param {Object} item
 * @returns {{ year: number, month: number }|null}
 */
export const resolveSalaryYearMonth = (item) => {
  const direct = item?.calculationPeriod ?? item?.settlementPeriod ?? item?.period;
  if (direct != null) {
    const match = YEAR_MONTH_PATTERN.exec(String(direct).trim());
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) };
    }
  }
  const y = item?.year ?? item?.settlementYear;
  const m = item?.month ?? item?.settlementMonth;
  if (y != null && m != null && Number.isFinite(Number(y)) && Number.isFinite(Number(m))) {
    return { year: Number(y), month: Number(m) };
  }
  return null;
};

/**
 * @param {Object} item
 * @returns {{ start: string, end: string }|null}
 */
export const resolveSalaryPeriodRange = (item) => {
  const start = item?.calculationPeriodStart;
  const end = item?.calculationPeriodEnd;
  if (start == null || end == null) {
    return null;
  }
  const s = String(start).split('T')[0];
  const e = String(end).split('T')[0];
  return s && e ? { start: s, end: e } : null;
};

/**
 * 최신순 정렬 키 (ISO 날짜/YYYY-MM 문자열 사전순)
 *
 * @param {Object} item
 * @returns {string}
 */
const resolveSalarySortKey = (item) => {
  const raw = item?.calculationPeriodEnd
    ?? item?.calculationPeriodStart
    ?? item?.calculationPeriod
    ?? '';
  return String(raw);
};

/**
 * @param {Array<Object>} items
 * @returns {Array<Object>}
 */
export const sortSalaryItemsNewestFirst = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return [...items].sort((a, b) => resolveSalarySortKey(b).localeCompare(resolveSalarySortKey(a)));
};

/**
 * 월 카드 금액 — 세전 구성 행·수당·세전 합계·공제·실수령
 *
 * @param {Object} item
 * @returns {{
 *   sessionCount: number,
 *   pretaxRows: Array<{ label: string, amount: number }>,
 *   bonus: number,
 *   grossPretax: number,
 *   tax: number,
 *   net: number
 * }}
 */
export const computeSalaryCardAmounts = (item) => {
  const pretaxRows = buildSalaryCalculationComponentRows(item, toSalaryNumber);
  const bonus = toSalaryNumber(item?.bonusEarnings);
  const tax = toSalaryNumber(item?.taxAmount ?? item?.deductions);
  const grossPretax = item?.grossSalary != null && item.grossSalary !== ''
    ? toSalaryNumber(item.grossSalary)
    : toSalaryNumber(item?.totalSalary);
  const net = item?.netSalary != null && item.netSalary !== ''
    ? toSalaryNumber(item.netSalary)
    : grossPretax - tax;
  return {
    sessionCount: resolveSalaryMonthlySessionCount(item),
    pretaxRows,
    bonus,
    grossPretax,
    tax,
    net
  };
};

/**
 * 요약 3칸 — 최근 실수령(취소 제외 최신 1건) · 지급 대기 건수 · 지급 완료 건수
 *
 * @param {Array<Object>} items
 * @returns {{ latestNet: number|null, pendingCount: number, paidCount: number }}
 */
export const buildSalarySummary = (items) => {
  const sorted = sortSalaryItemsNewestFirst(items);
  const active = sorted.filter((item) => classifySalaryPayout(item) !== 'cancelled');
  return {
    latestNet: active.length > 0 ? computeSalaryCardAmounts(active[0]).net : null,
    pendingCount: active.filter((item) => classifySalaryPayout(item) === CONSULTANT_SALARY_FILTER.PENDING).length,
    paidCount: active.filter((item) => classifySalaryPayout(item) === CONSULTANT_SALARY_FILTER.PAID).length
  };
};

/**
 * @param {Array<Object>} items
 * @param {string} filterKey
 * @returns {Array<Object>}
 */
export const filterSalaryItems = (items, filterKey) => {
  const sorted = sortSalaryItemsNewestFirst(items);
  if (filterKey === CONSULTANT_SALARY_FILTER.ALL) {
    return sorted;
  }
  return sorted.filter((item) => classifySalaryPayout(item) === filterKey);
};
