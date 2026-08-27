/**
 * 머니 콕핏 응답 파싱·집계 (날조 금지 · 실필드만)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  OFD_MIX_CATEGORY,
  OFD_REFUND_SUBCATEGORIES,
  OFD_SALARY_PAID_STATUS
} from '../../../../constants/operatorFinanceDashboardStrings';
import { toSafeNumber } from '../../../../utils/safeDisplay';

/**
 * FINANCE_DASHBOARD 응답에서 summary·transactions·categoryBreakdown 추출
 * @param {unknown} raw
 * @returns {{
 *   totalRevenue: number,
 *   totalExpenses: number,
 *   remaining: number,
 *   transactions: Array<object>,
 *   categoryBreakdown: Record<string, number>
 * }}
 */
export function parseFinanceDashboardPayload(raw) {
  const data = raw?.data ?? raw;
  const financialData = data?.financialData ?? data;
  const summary = financialData?.summary ?? {};
  const totalRevenue = toSafeNumber(
    summary.totalRevenue ?? financialData?.totalIncome ?? financialData?.totalRevenue
  );
  const totalExpenses = toSafeNumber(
    summary.totalExpenses ?? financialData?.totalExpense ?? financialData?.totalExpenses
  );
  const remaining = totalRevenue - totalExpenses;
  const transactionsRaw =
    financialData?.transactions ?? data?.recentTransactions ?? data?.transactions ?? [];
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];
  const breakdownRaw = financialData?.categoryBreakdown ?? data?.categoryBreakdown ?? {};
  const categoryBreakdown = normalizeBreakdownMap(breakdownRaw);
  return {
    totalRevenue,
    totalExpenses,
    remaining,
    transactions,
    categoryBreakdown
  };
}

/**
 * @param {unknown} raw
 * @returns {Record<string, number>}
 */
function normalizeBreakdownMap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    if (Array.isArray(raw)) {
      const map = {};
      raw.forEach((item) => {
        const key = item?.category ?? item?.name ?? item?.code;
        if (!key) return;
        map[String(key)] = toSafeNumber(item?.amount ?? item?.total ?? item?.value);
      });
      return map;
    }
    return {};
  }
  const map = {};
  Object.keys(raw).forEach((key) => {
    map[key] = toSafeNumber(raw[key]);
  });
  return map;
}

/**
 * monthly-report 단건에서 수입·지출 total 추출
 * @param {unknown} raw
 * @returns {{ income: number, expense: number }}
 */
export function parseMonthlyReportTotals(raw) {
  const data = raw?.data ?? raw;
  const income = toSafeNumber(data?.monthlyIncome?.total);
  const expense = toSafeNumber(data?.monthlyExpenses?.total);
  return { income, expense };
}

/**
 * 나간 곳 mix — 급여 / 임대·관리 / 환불 / 기타. 전부 0이면 빈 배열.
 * @param {Record<string, number>} categoryBreakdown
 * @param {Array<object>} transactions
 * @returns {Array<{ id: string, label: string, amount: number }>}
 */
export function buildOutflowMixItems(categoryBreakdown, transactions) {
  const salary = toSafeNumber(categoryBreakdown.SALARY);
  const rentUtility =
    toSafeNumber(categoryBreakdown.RENT) +
    toSafeNumber(categoryBreakdown.UTILITY) +
    toSafeNumber(categoryBreakdown.MANAGEMENT_FEE);
  const refundFromTx = sumRefundFromTransactions(transactions);
  const refundFromBreakdown = toSafeNumber(categoryBreakdown.CONSULTATION_REFUND);
  const refund = refundFromTx > 0 ? refundFromTx : refundFromBreakdown;

  const knownKeys = new Set([
    'SALARY',
    'RENT',
    'UTILITY',
    'MANAGEMENT_FEE',
    'CONSULTATION_REFUND'
  ]);
  let other = 0;
  Object.keys(categoryBreakdown || {}).forEach((key) => {
    if (knownKeys.has(key)) return;
    const upper = String(key).toUpperCase();
    if (OFD_REFUND_SUBCATEGORIES.includes(upper)) return;
    // 수입 카테고리는 나간 곳에서 제외
    if (
      upper === 'CONSULTATION' ||
      upper === 'CONSULTATION_FEE' ||
      upper === 'INCOME' ||
      upper.includes('REVENUE')
    ) {
      return;
    }
    other += toSafeNumber(categoryBreakdown[key]);
  });

  const items = [
    { id: 'salary', label: OFD_MIX_CATEGORY.SALARY, amount: salary },
    { id: 'rentUtility', label: OFD_MIX_CATEGORY.RENT_UTILITY, amount: rentUtility },
    { id: 'refund', label: OFD_MIX_CATEGORY.REFUND, amount: refund },
    { id: 'other', label: OFD_MIX_CATEGORY.OTHER, amount: other }
  ].filter((item) => item.amount > 0);

  return items;
}

/**
 * @param {Array<object>} transactions
 * @returns {number}
 */
export function sumRefundFromTransactions(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  return transactions.reduce((sum, tx) => {
    const sub = String(tx?.subcategory ?? tx?.subCategory ?? '').toUpperCase();
    const cat = String(tx?.category ?? '').toUpperCase();
    if (
      OFD_REFUND_SUBCATEGORIES.includes(sub) ||
      OFD_REFUND_SUBCATEGORIES.includes(cat)
    ) {
      return sum + toSafeNumber(tx?.amount);
    }
    return sum;
  }, 0);
}

/**
 * pending-payment 목록 packagePrice 합. 실패·빈 목록 → null (행 생략)
 * @param {unknown} raw
 * @returns {number|null}
 */
export function sumPendingConsultationFees(raw) {
  const list = unwrapList(raw);
  if (!list || list.length === 0) {
    return null;
  }
  const total = list.reduce(
    (sum, item) => sum + toSafeNumber(item?.packagePrice ?? item?.paymentAmount),
    0
  );
  return total > 0 ? total : null;
}

/**
 * salary period 계산 — non-PAID netSalary 합. 없으면 null
 * @param {unknown} raw
 * @returns {number|null}
 */
export function sumPendingSalaryNet(raw) {
  const list = unwrapList(raw);
  if (!list || list.length === 0) {
    return null;
  }
  const total = list.reduce((sum, item) => {
    const status = String(item?.status ?? item?.paymentStatus ?? '').toUpperCase();
    if (status === OFD_SALARY_PAID_STATUS) {
      return sum;
    }
    return sum + toSafeNumber(item?.netSalary);
  }, 0);
  return total > 0 ? total : null;
}

/**
 * @param {unknown} raw
 * @returns {Array<object>|null}
 */
function unwrapList(raw) {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  const data = raw?.data ?? raw;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return null;
}

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatWonAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(toSafeNumber(amount));
}

/**
 * 거래가 수입인지
 * @param {object} tx
 * @returns {boolean}
 */
export function isIncomeTransaction(tx) {
  const type = String(tx?.type ?? tx?.transactionType ?? '').toUpperCase();
  return type === 'INCOME';
}
