/**
 * 머니 콕핏 응답 파싱·집계 (날조 금지 · 실필드만)
 *
 * 금액 표기 규약:
 * - formatWonAmount: 그룹만 (`1,000,000`)
 * - formatWonDisplay: 그룹+원 (`1,000,000원`), 비숫자면 `—`
 *
 * pending 합계 규약:
 * - fetch 성공 시 호출 → 빈 목록이어도 `0` 반환 (행 표시)
 * - catch(실패) 시 호출하지 말고 `null`로 상태 설정 (행 숨김)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  OFD_AXIS_COMPACT_THRESHOLD,
  OFD_CATEGORY_LABELS,
  OFD_CHART,
  OFD_FACTS,
  OFD_HERO,
  OFD_LEDGER,
  OFD_MAPPING_ENTITY,
  OFD_MIX_CATEGORY,
  OFD_REFUND_SUBCATEGORIES,
  OFD_SALARY_PAID_STATUS
} from '../../../../constants/operatorFinanceDashboardStrings';
import { toSafeNumber } from '../../../../utils/safeDisplay';

const INCOME_CATEGORY_KEYS = new Set([
  'CONSULTATION',
  'CONSULTATION_FEE',
  'INCOME',
  'REVENUE',
  'OTHER_INCOME'
]);

const OUTFLOW_KNOWN_KEYS = new Set([
  'SALARY',
  'RENT',
  'UTILITY',
  'MANAGEMENT_FEE',
  'CONSULTATION_REFUND',
  ...OFD_REFUND_SUBCATEGORIES
]);

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
 * @param {Record<string, number>|null|undefined} map
 * @param {string} key
 * @returns {boolean}
 */
function hasBreakdownKey(map, key) {
  return Boolean(map) && Object.prototype.hasOwnProperty.call(map, key);
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isIncomeCategoryKey(key) {
  const upper = String(key || '').toUpperCase();
  if (INCOME_CATEGORY_KEYS.has(upper)) return true;
  return upper.includes('REVENUE') || upper.includes('INCOME');
}

/**
 * @param {string} key
 * @returns {string}
 */
export function resolveCategoryLabel(key) {
  const upper = String(key || '').toUpperCase();
  if (OFD_CATEGORY_LABELS[upper]) {
    return OFD_CATEGORY_LABELS[upper];
  }
  if (OFD_REFUND_SUBCATEGORIES.includes(upper)) {
    return OFD_MIX_CATEGORY.REFUND;
  }
  return key ? String(key) : OFD_MIX_CATEGORY.OTHER;
}

/**
 * @param {object} tx
 * @returns {string}
 */
function readTxCategoryKey(tx) {
  const raw = tx?.category ?? tx?.subcategory ?? tx?.subCategory ?? '';
  return String(raw).trim().toUpperCase();
}

/**
 * 나간 곳 mix — payload 키 또는 지출 tx에서 관측된 카테고리만. 0원이어도 표시.
 * @param {Record<string, number>} categoryBreakdown
 * @param {Array<object>} transactions
 * @returns {Array<{ id: string, label: string, amount: number }>}
 */
export function buildOutflowMixItems(categoryBreakdown, transactions) {
  const breakdown = categoryBreakdown || {};
  const items = [];
  const txList = Array.isArray(transactions) ? transactions : [];

  const observedExpenseCats = new Set();
  txList.forEach((tx) => {
    if (isIncomeTransaction(tx)) return;
    const key = readTxCategoryKey(tx);
    if (key) observedExpenseCats.add(key);
  });

  const salaryPresent =
    hasBreakdownKey(breakdown, 'SALARY') || observedExpenseCats.has('SALARY');
  if (salaryPresent) {
    items.push({
      id: 'salary',
      label: OFD_MIX_CATEGORY.SALARY,
      amount: toSafeNumber(breakdown.SALARY)
    });
  }

  const rentKeys = ['RENT', 'UTILITY', 'MANAGEMENT_FEE'];
  const rentPresent =
    rentKeys.some((k) => hasBreakdownKey(breakdown, k))
    || rentKeys.some((k) => observedExpenseCats.has(k));
  if (rentPresent) {
    const amount = rentKeys.reduce(
      (sum, key) => sum + (hasBreakdownKey(breakdown, key) ? toSafeNumber(breakdown[key]) : 0),
      0
    );
    items.push({
      id: 'rentUtility',
      label: OFD_MIX_CATEGORY.RENT_UTILITY,
      amount
    });
  }

  const refundKeyPresent =
    hasBreakdownKey(breakdown, 'CONSULTATION_REFUND')
    || OFD_REFUND_SUBCATEGORIES.some((k) => hasBreakdownKey(breakdown, k));
  const refundObservedInTx = txList.some((tx) => {
    const sub = String(tx?.subcategory ?? tx?.subCategory ?? '').toUpperCase();
    const cat = String(tx?.category ?? '').toUpperCase();
    return (
      OFD_REFUND_SUBCATEGORIES.includes(sub)
      || OFD_REFUND_SUBCATEGORIES.includes(cat)
    );
  });
  if (refundKeyPresent || refundObservedInTx) {
    const refundFromTx = sumRefundFromTransactions(txList);
    const refundFromBreakdown = toSafeNumber(breakdown.CONSULTATION_REFUND);
    const amount = refundObservedInTx ? refundFromTx : refundFromBreakdown;
    items.push({
      id: 'refund',
      label: OFD_MIX_CATEGORY.REFUND,
      amount
    });
  }

  let other = 0;
  let otherPresent = false;
  Object.keys(breakdown).forEach((key) => {
    const upper = String(key).toUpperCase();
    if (OUTFLOW_KNOWN_KEYS.has(upper)) return;
    if (isIncomeCategoryKey(upper)) return;
    otherPresent = true;
    other += toSafeNumber(breakdown[key]);
  });
  observedExpenseCats.forEach((key) => {
    if (OUTFLOW_KNOWN_KEYS.has(key)) return;
    if (isIncomeCategoryKey(key)) return;
    if (hasBreakdownKey(breakdown, key) || hasBreakdownKey(breakdown, key.toLowerCase())) {
      return;
    }
    otherPresent = true;
  });
  if (otherPresent) {
    items.push({
      id: 'other',
      label: OFD_MIX_CATEGORY.OTHER,
      amount: other
    });
  }

  return items;
}

/**
 * 들어온 곳 mix — payload 수입 키 또는 수입 tx 관측 카테고리만. 0원이어도 표시.
 * @param {Record<string, number>} categoryBreakdown
 * @param {Array<object>} transactions
 * @returns {Array<{ id: string, label: string, amount: number }>}
 */
export function buildIncomeMixItems(categoryBreakdown, transactions) {
  const breakdown = categoryBreakdown || {};
  const amounts = {};
  const txList = Array.isArray(transactions) ? transactions : [];

  Object.keys(breakdown).forEach((key) => {
    if (!isIncomeCategoryKey(key)) return;
    const upper = String(key).toUpperCase();
    amounts[upper] = toSafeNumber(breakdown[key]);
  });

  txList.forEach((tx) => {
    if (!isIncomeTransaction(tx)) return;
    const key = readTxCategoryKey(tx);
    if (!key) return;
    // breakdown에 이미 있으면 이중 집계 금지 — 관측만 필요한 신규 키만 합산
    if (Object.prototype.hasOwnProperty.call(amounts, key)) {
      return;
    }
    amounts[key] = toSafeNumber(tx?.amount);
  });

  return Object.keys(amounts).map((key) => ({
    id: `income-${key.toLowerCase()}`,
    label: resolveCategoryLabel(key),
    amount: toSafeNumber(amounts[key])
  }));
}

/**
 * 수입 top caption — 예: `상담료 1,200,000원`. 없으면 빈 문자열.
 * @param {Record<string, number>} categoryBreakdown
 * @param {Array<object>} transactions
 * @returns {string}
 */
export function buildTopIncomeCaption(categoryBreakdown, transactions) {
  const items = buildIncomeMixItems(categoryBreakdown, transactions);
  if (!items.length) return '';
  const top = items.reduce((best, item) => (
    toSafeNumber(item.amount) > toSafeNumber(best.amount) ? item : best
  ), items[0]);
  return `${top.label} ${formatWonDisplay(top.amount)}`;
}

/**
 * 지출 top caption — 예: `급여 200,000원`. 없으면 빈 문자열.
 * @param {Array<{ label: string, amount: number }>} expenseMixItems
 * @returns {string}
 */
export function buildTopExpenseCaption(expenseMixItems) {
  if (!Array.isArray(expenseMixItems) || expenseMixItems.length === 0) {
    return '';
  }
  const top = expenseMixItems.reduce((best, item) => (
    toSafeNumber(item.amount) > toSafeNumber(best.amount) ? item : best
  ), expenseMixItems[0]);
  return `${top.label} ${formatWonDisplay(top.amount)}`;
}

/**
 * 남은 돈 vs 이전 기간 caption. previousRemaining이 null이면 빈 문자열.
 * @param {number} currentRemaining
 * @param {number|null|undefined} previousRemaining
 * @returns {string}
 */
export function buildRemainingVsPreviousCaption(currentRemaining, previousRemaining) {
  if (previousRemaining == null || !Number.isFinite(Number(previousRemaining))) {
    return '';
  }
  const current = toSafeNumber(currentRemaining);
  const previous = toSafeNumber(previousRemaining);
  const diff = current - previous;
  if (diff === 0) {
    return OFD_HERO.REMAINING_SAME;
  }
  const absText = formatWonDisplay(Math.abs(diff));
  if (diff > 0) {
    return `${OFD_HERO.REMAINING_MORE_PREFIX}${absText}${OFD_HERO.REMAINING_MORE_SUFFIX}`;
  }
  return `${OFD_HERO.REMAINING_LESS_PREFIX}${absText}${OFD_HERO.REMAINING_LESS_SUFFIX}`;
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
      OFD_REFUND_SUBCATEGORIES.includes(sub)
      || OFD_REFUND_SUBCATEGORIES.includes(cat)
    ) {
      return sum + toSafeNumber(tx?.amount);
    }
    return sum;
  }, 0);
}

/**
 * pending-payment 목록 packagePrice 합.
 * 성공 응답(빈 배열 포함) → number(0 가능). 파싱 불가면 null.
 * @param {unknown} raw
 * @returns {number|null}
 */
export function sumPendingConsultationFees(raw) {
  const list = unwrapList(raw);
  if (list == null) {
    return null;
  }
  return list.reduce(
    (sum, item) => sum + toSafeNumber(item?.packagePrice ?? item?.paymentAmount),
    0
  );
}

/**
 * salary period 계산 — non-PAID netSalary 합.
 * 성공 응답(빈 배열 포함) → number(0 가능). 파싱 불가면 null.
 * @param {unknown} raw
 * @returns {number|null}
 */
export function sumPendingSalaryNet(raw) {
  const list = unwrapList(raw);
  if (list == null) {
    return null;
  }
  return list.reduce((sum, item) => {
    const status = String(item?.status ?? item?.paymentStatus ?? '').toUpperCase();
    if (status === OFD_SALARY_PAID_STATUS) {
      return sum;
    }
    return sum + toSafeNumber(item?.netSalary);
  }, 0);
}

/**
 * 매핑으로 들어온 상담료 합 (relatedEntityType 실필드)
 * @param {Array<object>} transactions
 * @returns {number}
 */
export function sumMappingConsultationIncome(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  return transactions.reduce((sum, tx) => {
    if (!isIncomeTransaction(tx)) return sum;
    const entity = String(tx?.relatedEntityType ?? '').toUpperCase();
    if (entity !== OFD_MAPPING_ENTITY.INCOME) return sum;
    return sum + toSafeNumber(tx?.amount);
  }, 0);
}

/**
 * 매핑 환불 합
 * @param {Array<object>} transactions
 * @returns {number}
 */
export function sumMappingRefund(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  return transactions.reduce((sum, tx) => {
    const entity = String(tx?.relatedEntityType ?? '').toUpperCase();
    if (entity !== OFD_MAPPING_ENTITY.REFUND) return sum;
    return sum + toSafeNumber(tx?.amount);
  }, 0);
}

/**
 * payload에 관측 가능한 dense facts 캡션 목록
 * @param {Array<object>} transactions
 * @returns {string[]}
 */
export function buildDenseFactCaptions(transactions) {
  const txList = Array.isArray(transactions) ? transactions : [];
  const facts = [];

  facts.push(
    `${OFD_FACTS.TRANSACTION_COUNT_PREFIX}${txList.length}${OFD_FACTS.TRANSACTION_COUNT_SUFFIX}`
  );

  const hasMappingIncome = txList.some((tx) => {
    const entity = String(tx?.relatedEntityType ?? '').toUpperCase();
    return entity === OFD_MAPPING_ENTITY.INCOME;
  });
  if (hasMappingIncome) {
    const amount = sumMappingConsultationIncome(txList);
    facts.push(
      `${OFD_FACTS.MAPPING_INCOME_PREFIX}${formatWonDisplay(amount)}`
    );
  }

  const hasMappingRefund = txList.some((tx) => {
    const entity = String(tx?.relatedEntityType ?? '').toUpperCase();
    return entity === OFD_MAPPING_ENTITY.REFUND;
  });
  if (hasMappingRefund) {
    const amount = sumMappingRefund(txList);
    facts.push(
      `${OFD_FACTS.MAPPING_REFUND_PREFIX}${formatWonDisplay(amount)}`
    );
  }

  return facts;
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
 * 금액 그룹만 (`1,000,000`)
 * @param {number} amount
 * @returns {string}
 */
export function formatWonAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(toSafeNumber(amount));
}

/**
 * 가시 금액 (`1,000,000원`). 비숫자면 `—`.
 * @param {unknown} amount
 * @returns {string}
 */
export function formatWonDisplay(amount) {
  if (amount == null || amount === '') {
    return OFD_LEDGER.DASH;
  }
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) return OFD_LEDGER.DASH;
    return `${formatWonAmount(amount)}${OFD_HERO.UNIT}`;
  }
  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (trimmed === '') return OFD_LEDGER.DASH;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return OFD_LEDGER.DASH;
    return `${formatWonAmount(n)}${OFD_HERO.UNIT}`;
  }
  if (typeof amount === 'boolean') {
    return `${formatWonAmount(amount ? 1 : 0)}${OFD_HERO.UNIT}`;
  }
  return OFD_LEDGER.DASH;
}

/**
 * 차트 Y축 눈금 — 가능하면 `1,200,000원`, overflow면 `120만 원` / `1.2억 원`
 * @param {number} value
 * @returns {string|number}
 */
export function formatAxisTick(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  const abs = Math.abs(n);
  if (abs >= 100000000) {
    const eok = n / 100000000;
    const digits = n % 100000000 === 0 ? 0 : 1;
    return `${eok.toFixed(digits)}${OFD_CHART.AXIS_EOK_SUFFIX}`;
  }
  if (abs >= OFD_AXIS_COMPACT_THRESHOLD) {
    const man = n / 10000;
    const digits = n % 10000 === 0 ? 0 : 1;
    return `${man.toFixed(digits)}${OFD_CHART.AXIS_MAN_SUFFIX}`;
  }
  return formatWonDisplay(n);
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
