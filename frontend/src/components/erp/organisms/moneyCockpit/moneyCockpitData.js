/**
 * 머니 콕핏 응답 파싱·집계 (날조 금지 · 실필드만)
 *
 * 금액 표기 규약:
 * - formatWonAmount: 정수 원 그룹만 (`1,000,000`) — Math.round + maximumFractionDigits:0
 * - formatWonDisplay: 그룹+원 (`1,000,000원`), 비숫자면 `—` (장부 formatKrw와 동일 정수 규약)
 *
 * pending 합계 규약:
 * - fetch 성공 시 호출 → 빈 목록이어도 `0` 반환 (UI는 0원 행 숨김)
 * - catch(실패) 시 호출하지 말고 `null`로 상태 설정 (행 숨김)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  OFD_CATEGORY_LABELS,
  OFD_FACTS,
  OFD_HERO,
  OFD_LEDGER,
  OFD_MAPPING_ENTITY,
  OFD_MIX_CATEGORY,
  OFD_REFUND_SUBCATEGORIES,
  OFD_SALARY_CHECKLIST,
  OFD_SALARY_PAID_STATUS,
  OFD_TODO_RULES,
  formatLateSessionPaidAdjustmentTodo,
  formatLateSessionUnpaidTodo,
  formatPaydayBeforeComment
} from '../../../../constants/operatorFinanceDashboardStrings';
import {
  SALARY_DEFAULTS,
  SALARY_TYPE
} from '../../../../constants/salaryConstants';
import { FINANCIAL_CARD_MERCHANT_FEE_LABEL } from '../../../../utils/erpFinancialAmountStack';
import { toSafeNumber } from '../../../../utils/safeDisplay';
import {
  isSalaryAdjustmentCalculation,
  normalizeSalaryCalculationStatus
} from '../../../../utils/salaryCalculationDisplay';
import { getKstDateParts } from './moneyCockpitPeriod';

/** codeValue → dayOfMonth (0 = 말일). 공통코드 extraData 없을 때 폴백 */
const SALARY_PAY_DAY_CODE_TO_DAY = {
  FIRST_DAY: 1,
  TENTH: 10,
  FIFTEENTH: 15,
  TWENTIETH: 20,
  TWENTY_FIFTH: 25,
  LAST_DAY: 0
};

const INCOME_CATEGORY_KEYS = new Set([
  'CONSULTATION',
  'CONSULTATION_FEE',
  'INCOME',
  'REVENUE',
  'OTHER_INCOME'
]);

/**
 * 백엔드 SSOT FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE
 * @type {string}
 */
const CATEGORY_CONSULTATION_FEE_KO = OFD_MIX_CATEGORY.CONSULTATION;

/** 상담료 계열 → 수입 mix 정규화 키 (SSOT: 상담료) */
const INCOME_CONSULTATION_CANONICAL = CATEGORY_CONSULTATION_FEE_KO;

const CONSULTATION_CATEGORY_ALIASES = new Set([
  'CONSULTATION',
  'CONSULTATION_FEE',
  CATEGORY_CONSULTATION_FEE_KO,
  // 결제수단-as-category 레거시 (백엔드 remap·V20260829_001 백필과 동일)
  '카드결제',
  '현금결제',
  '계좌이체',
  '가상계좌',
  '기타결제',
  'PAYMENT',
  '결제'
]);

/** 나간 곳 급여 별칭 */
const SALARY_CATEGORY_ALIASES = new Set(['SALARY', '급여']);

/** 나간 곳 임대·관리 별칭 → rentUtility 버킷 */
const RENT_UTILITY_CATEGORY_ALIASES = new Set([
  'RENT',
  '임대료',
  'UTILITY',
  'MANAGEMENT_FEE',
  '관리비'
]);

/** 나간 곳 세금·식대 별칭 (other 합산 시 정규화) */
const TAX_CATEGORY_ALIASES = new Set(['TAX', '세금']);
const MEAL_CATEGORY_ALIASES = new Set(['MEAL', '식대']);

const OUTFLOW_KNOWN_KEYS = new Set([
  'SALARY',
  '급여',
  'RENT',
  '임대료',
  'UTILITY',
  'MANAGEMENT_FEE',
  '관리비',
  'TAX',
  '세금',
  'MEAL',
  '식대',
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
 *   categoryBreakdown: Record<string, number>,
 *   incomeCategoryBreakdown: Record<string, number>,
 *   expenseCategoryBreakdown: Record<string, number>
 * }}
 */
export function parseFinanceDashboardPayload(raw) {
  const data = raw?.data ?? raw;
  const financialData = data?.financialData ?? data;
  const summary = financialData?.summary ?? {};
  const totalRevenue = toSafeNumber(
    summary.totalRevenue ?? financialData?.totalIncome ?? financialData?.totalRevenue
  );
  const summaryExpenses = toSafeNumber(
    summary.totalExpenses ?? financialData?.totalExpense ?? financialData?.totalExpenses
  );
  const transactionsRaw =
    financialData?.transactions ?? data?.recentTransactions ?? data?.transactions ?? [];
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];
  const feeFromSummary = summary.totalCardMerchantFee;
  const totalCardMerchantFee = feeFromSummary != null && feeFromSummary !== ''
    ? toSafeNumber(feeFromSummary)
    : sumCardMerchantFeeFromTransactions(transactions);
  // BE가 이미 fee를 totalExpenses에 포함한 경우(totalCardMerchantFee 존재) 이중합산 금지
  const totalExpenses = feeFromSummary != null && feeFromSummary !== ''
    ? summaryExpenses
    : summaryExpenses + totalCardMerchantFee;
  const remaining = totalRevenue - totalExpenses;
  const incomeBreakdownRaw =
    financialData?.incomeCategoryBreakdown
    ?? data?.incomeCategoryBreakdown
    ?? null;
  const expenseBreakdownRaw =
    financialData?.expenseCategoryBreakdown
    ?? data?.expenseCategoryBreakdown
    ?? null;
  const legacyBreakdownRaw = financialData?.categoryBreakdown ?? data?.categoryBreakdown ?? {};
  // 신규: income/expense 분리. 구버전 혼합 breakdown 은 양쪽 fallback (mix 빌더가 키 필터).
  const incomeCategoryBreakdown = normalizeBreakdownMap(
    incomeBreakdownRaw != null ? incomeBreakdownRaw : legacyBreakdownRaw
  );
  const expenseCategoryBreakdown = normalizeBreakdownMap(
    expenseBreakdownRaw != null ? expenseBreakdownRaw : legacyBreakdownRaw
  );
  const categoryBreakdown = incomeCategoryBreakdown;
  const taxBreakdownRaw = financialData?.taxBreakdown
    ?? data?.taxBreakdown
    ?? summary?.taxBreakdown
    ?? null;
  const taxBreakdown = parseTaxBreakdown(taxBreakdownRaw);
  return {
    totalRevenue,
    totalExpenses,
    totalCardMerchantFee,
    remaining,
    transactions,
    categoryBreakdown,
    incomeCategoryBreakdown,
    expenseCategoryBreakdown,
    taxBreakdown
  };
}

/**
 * 저장된 세금 필드 합계(taxBreakdown)를 숫자 맵으로 정규화한다.
 *
 * @param {unknown} raw
 * @returns {{ vatTotal: number, withholdingTotal: number, expenseVatTotal: number }}
 */
export function parseTaxBreakdown(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { vatTotal: 0, withholdingTotal: 0, expenseVatTotal: 0 };
  }
  return {
    vatTotal: toSafeNumber(raw.vatTotal),
    withholdingTotal: toSafeNumber(raw.withholdingTotal),
    expenseVatTotal: toSafeNumber(raw.expenseVatTotal)
  };
}

/**
 * 머니 히어로 아래 세금 저장액 캡션 (세율 재계산 없음).
 *
 * @param {{ vatTotal?: number, withholdingTotal?: number, expenseVatTotal?: number }|null|undefined} taxBreakdown
 * @returns {string}
 */
export function buildStoredTaxCaption(taxBreakdown) {
  const parsed = parseTaxBreakdown(taxBreakdown);
  return [
    `${OFD_HERO.TAX_VAT_PREFIX}${formatWonDisplay(parsed.vatTotal)}`,
    `${OFD_HERO.TAX_WITHHOLDING_PREFIX}${formatWonDisplay(parsed.withholdingTotal)}`,
    `${OFD_HERO.TAX_EXPENSE_VAT_PREFIX}${formatWonDisplay(parsed.expenseVatTotal)}`
  ].join('');
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
  const raw = String(key || '').trim();
  if (!raw) return false;
  if (CONSULTATION_CATEGORY_ALIASES.has(raw) || CONSULTATION_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    return true;
  }
  const upper = raw.toUpperCase();
  if (INCOME_CATEGORY_KEYS.has(upper)) return true;
  return upper.includes('REVENUE') || upper.includes('INCOME');
}

/**
 * 상담료 계열(CONSULTATION / 상담료 / 결제수단-as-category) → 상담료(SSOT) 하나로 합산
 * @param {string} key
 * @returns {string}
 */
function canonicalizeIncomeCategoryKey(key) {
  const raw = String(key || '').trim();
  if (!raw) return '';
  if (CONSULTATION_CATEGORY_ALIASES.has(raw) || CONSULTATION_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    return INCOME_CONSULTATION_CANONICAL;
  }
  return raw.toUpperCase();
}

/**
 * @param {string} key
 * @returns {string}
 */
function canonicalizeOutflowCategoryKey(key) {
  const raw = String(key || '').trim();
  if (!raw) return '';
  if (SALARY_CATEGORY_ALIASES.has(raw) || SALARY_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    return 'SALARY';
  }
  if (RENT_UTILITY_CATEGORY_ALIASES.has(raw) || RENT_UTILITY_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    if (raw === 'RENT' || raw === '임대료' || raw.toUpperCase() === 'RENT') {
      return 'RENT';
    }
    return 'UTILITY';
  }
  if (TAX_CATEGORY_ALIASES.has(raw) || TAX_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    return 'TAX';
  }
  if (MEAL_CATEGORY_ALIASES.has(raw) || MEAL_CATEGORY_ALIASES.has(raw.toUpperCase())) {
    return 'MEAL';
  }
  return raw.toUpperCase();
}

/**
 * breakdown 키 존재 여부 (별칭 포함)
 * @param {Record<string, number>} map
 * @param {Set<string>} aliases
 * @returns {boolean}
 */
function hasAnyBreakdownAlias(map, aliases) {
  if (!map) return false;
  return Object.keys(map).some((key) => {
    const raw = String(key || '').trim();
    return aliases.has(raw) || aliases.has(raw.toUpperCase());
  });
}

/**
 * breakdown 별칭 합산
 * @param {Record<string, number>} map
 * @param {Set<string>} aliases
 * @returns {number}
 */
function sumBreakdownAliases(map, aliases) {
  if (!map) return 0;
  let sum = 0;
  Object.keys(map).forEach((key) => {
    const raw = String(key || '').trim();
    if (aliases.has(raw) || aliases.has(raw.toUpperCase())) {
      sum += toSafeNumber(map[key]);
    }
  });
  return sum;
}

/**
 * @param {string} key
 * @returns {string}
 */
export function resolveCategoryLabel(key) {
  const canonical = canonicalizeIncomeCategoryKey(key);
  if (OFD_CATEGORY_LABELS[canonical]) {
    return OFD_CATEGORY_LABELS[canonical];
  }
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
    const key = String(tx?.category ?? tx?.subcategory ?? tx?.subCategory ?? '').trim();
    if (key) observedExpenseCats.add(key);
  });

  const observedCanonical = new Set(
    [...observedExpenseCats].map((k) => canonicalizeOutflowCategoryKey(k)).filter(Boolean)
  );

  const salaryPresent =
    hasAnyBreakdownAlias(breakdown, SALARY_CATEGORY_ALIASES)
    || observedCanonical.has('SALARY');
  if (salaryPresent) {
    items.push({
      id: 'salary',
      label: OFD_MIX_CATEGORY.SALARY,
      amount: sumBreakdownAliases(breakdown, SALARY_CATEGORY_ALIASES)
    });
  }

  const rentPresent =
    hasAnyBreakdownAlias(breakdown, RENT_UTILITY_CATEGORY_ALIASES)
    || observedCanonical.has('RENT')
    || observedCanonical.has('UTILITY');
  if (rentPresent) {
    items.push({
      id: 'rentUtility',
      label: OFD_MIX_CATEGORY.RENT_UTILITY,
      amount: sumBreakdownAliases(breakdown, RENT_UTILITY_CATEGORY_ALIASES)
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

  const cardFeeAmount = sumCardMerchantFeeFromTransactions(txList);
  if (cardFeeAmount > 0) {
    items.push({
      id: 'cardMerchantFee',
      label: FINANCIAL_CARD_MERCHANT_FEE_LABEL,
      amount: cardFeeAmount
    });
  }

  let other = 0;
  let otherPresent = false;
  const otherCanonicalAmounts = {};
  Object.keys(breakdown).forEach((key) => {
    const raw = String(key).trim();
    const upper = raw.toUpperCase();
    if (OUTFLOW_KNOWN_KEYS.has(raw) || OUTFLOW_KNOWN_KEYS.has(upper)) return;
    if (isIncomeCategoryKey(raw) || isIncomeCategoryKey(upper)) return;
    otherPresent = true;
    const canonical = canonicalizeOutflowCategoryKey(raw) || upper;
    otherCanonicalAmounts[canonical] = (otherCanonicalAmounts[canonical] || 0) + toSafeNumber(breakdown[key]);
  });
  Object.keys(otherCanonicalAmounts).forEach((k) => {
    other += otherCanonicalAmounts[k];
  });
  observedExpenseCats.forEach((key) => {
    const canonical = canonicalizeOutflowCategoryKey(key);
    if (OUTFLOW_KNOWN_KEYS.has(key) || OUTFLOW_KNOWN_KEYS.has(key.toUpperCase())) return;
    if (canonical === 'SALARY' || canonical === 'RENT' || canonical === 'UTILITY'
      || canonical === 'TAX' || canonical === 'MEAL') {
      return;
    }
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
 * INCOME 거래의 cardMerchantFeeAmount 합 (D5 SSOT, 가상 EXPENSE 없음).
 * @param {Array<object>} transactions
 * @returns {number}
 */
export function sumCardMerchantFeeFromTransactions(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  return transactions.reduce((sum, tx) => {
    if (!isIncomeTransaction(tx)) return sum;
    return sum + toSafeNumber(tx?.cardMerchantFeeAmount);
  }, 0);
}

/**
 * 들어온 곳 mix — payload 수입 키 또는 수입 tx 관측 카테고리만. 0원이어도 표시.
 * breakdown 우선(기간 합). 없으면 tx amount 합산. 상담료 계열은 canonical 하나로 병합.
 * @param {Record<string, number>} categoryBreakdown
 * @param {Array<object>} transactions
 * @returns {Array<{ id: string, label: string, amount: number }>}
 */
export function buildIncomeMixItems(categoryBreakdown, transactions) {
  const breakdown = categoryBreakdown || {};
  const amounts = {};
  const fromBreakdown = new Set();
  const txList = Array.isArray(transactions) ? transactions : [];

  Object.keys(breakdown).forEach((key) => {
    if (!isIncomeCategoryKey(key)) return;
    const canonical = canonicalizeIncomeCategoryKey(key);
    if (!canonical) return;
    amounts[canonical] = (amounts[canonical] || 0) + toSafeNumber(breakdown[key]);
    fromBreakdown.add(canonical);
  });

  txList.forEach((tx) => {
    if (!isIncomeTransaction(tx)) return;
    const rawKey = String(tx?.category ?? tx?.subcategory ?? tx?.subCategory ?? '').trim();
    if (!rawKey) return;
    const canonical = canonicalizeIncomeCategoryKey(rawKey);
    if (!canonical) return;
    // breakdown에서 이미 canonical 채움 → 이중 집계 금지
    if (fromBreakdown.has(canonical)) return;
    amounts[canonical] = (amounts[canonical] || 0) + toSafeNumber(tx?.amount);
  });

  return Object.keys(amounts).map((key) => ({
    id: `income-${String(key).toLowerCase()}`,
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
 * PRIMARY·ADJUSTMENT 모두 포함(미지급 ADJUSTMENT net 포함).
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
 * 공통코드 extraData 파싱 (string | object)
 * @param {unknown} extraData
 * @returns {Record<string, unknown>}
 */
function parsePayDayExtraData(extraData) {
  if (extraData == null || extraData === '') {
    return {};
  }
  if (typeof extraData === 'object' && !Array.isArray(extraData)) {
    return extraData;
  }
  if (typeof extraData === 'string') {
    try {
      const parsed = JSON.parse(extraData);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * SALARY_PAY_DAY 공통코드 한 건 → { codeValue, dayOfMonth, isDefault }
 * @param {object} code
 * @returns {{ codeValue: string, dayOfMonth: number, isDefault: boolean }|null}
 */
function normalizePayDayCode(code) {
  if (!code || typeof code !== 'object') {
    return null;
  }
  const codeValue = String(code.codeValue ?? code.code ?? '').trim().toUpperCase();
  if (!codeValue) {
    return null;
  }
  const extra = parsePayDayExtraData(code.extraData);
  let dayOfMonth;
  if (extra.dayOfMonth != null && extra.dayOfMonth !== '') {
    dayOfMonth = Number(extra.dayOfMonth);
  } else if (Object.prototype.hasOwnProperty.call(SALARY_PAY_DAY_CODE_TO_DAY, codeValue)) {
    dayOfMonth = SALARY_PAY_DAY_CODE_TO_DAY[codeValue];
  } else {
    const asNum = Number(codeValue);
    dayOfMonth = Number.isFinite(asNum) ? asNum : NaN;
  }
  if (!Number.isFinite(dayOfMonth)) {
    return null;
  }
  const isDefault = extra.isDefault === true || extra.isDefault === 'true';
  return { codeValue, dayOfMonth, isDefault };
}

/**
 * SALARY_PAY_DAY 공통코드에서 적용 급여일 해석.
 * isDefault 우선, 없으면 TENTH(10일), 코드 없으면 폴백 10일.
 * dayOfMonth 0 = 말일.
 *
 * @param {Array<object>|null|undefined} codes
 * @returns {{ codeValue: string, dayOfMonth: number }}
 */
export function resolveSalaryPayDayFromCodes(codes) {
  const list = Array.isArray(codes) ? codes : [];
  const normalized = list.map(normalizePayDayCode).filter(Boolean);

  const defaultCode = normalized.find((item) => item.isDefault);
  if (defaultCode) {
    return { codeValue: defaultCode.codeValue, dayOfMonth: defaultCode.dayOfMonth };
  }

  const tenthCode = String(SALARY_DEFAULTS.PAY_DAY_CODE).toUpperCase();
  const tenth = normalized.find((item) => item.codeValue === tenthCode);
  if (tenth) {
    return { codeValue: tenth.codeValue, dayOfMonth: tenth.dayOfMonth };
  }

  const fallbackDay = SALARY_PAY_DAY_CODE_TO_DAY[tenthCode];
  return {
    codeValue: tenthCode,
    dayOfMonth: fallbackDay != null ? fallbackDay : 10
  };
}

/**
 * 해당 월 유효 급여일 (말일=0 → lengthOfMonth)
 * @param {Date} today
 * @param {number} dayOfMonth
 * @returns {number}
 */
function resolveEffectivePayday(today, dayOfMonth) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lengthOfMonth = new Date(year, month + 1, 0).getDate();
  if (dayOfMonth === 0) {
    return lengthOfMonth;
  }
  const n = Number(dayOfMonth);
  if (!Number.isFinite(n) || n < 1) {
    return lengthOfMonth;
  }
  return Math.min(Math.floor(n), lengthOfMonth);
}

/**
 * 미지급일 때만 급여일 체크리스트 코멘트. 전원 지급 시 null (축하 문구 없음).
 *
 * @param {{ today: Date, dayOfMonth: number, hasUnpaid: boolean }} params
 * @returns {string|null}
 */
export function buildPaydayChecklistComment({ today, dayOfMonth, hasUnpaid }) {
  if (!hasUnpaid) {
    return null;
  }
  if (!(today instanceof Date) || Number.isNaN(today.getTime())) {
    return null;
  }
  const effective = resolveEffectivePayday(today, dayOfMonth);
  const currentDay = today.getDate();
  if (currentDay < effective) {
    return formatPaydayBeforeComment(dayOfMonth === 0 ? 0 : Number(dayOfMonth));
  }
  if (currentDay === effective) {
    return OFD_SALARY_CHECKLIST.PAYDAY_TODAY;
  }
  return OFD_SALARY_CHECKLIST.PAYDAY_AFTER;
}

/**
 * @param {object} profile
 * @returns {boolean}
 */
function isActiveSalaryProfile(profile) {
  return profile?.isActive !== false;
}

/**
 * @param {object} profile
 * @returns {boolean}
 */
function isFreelanceProfile(profile) {
  return String(profile?.salaryType ?? '').toUpperCase() === SALARY_TYPE.FREELANCE;
}

/**
 * 계산 행이 프리랜서인지 — DTO salaryType 또는 프로필 join
 * @param {object} calc
 * @param {Map<*, object>} profilesByConsultantId
 * @returns {boolean}
 */
function isFreelanceSalaryCalc(calc, profilesByConsultantId) {
  const type = String(calc?.salaryType ?? '').toUpperCase();
  if (type === SALARY_TYPE.FREELANCE) {
    return true;
  }
  const consultantId = calc?.consultantId;
  if (consultantId == null) {
    return false;
  }
  const profile = profilesByConsultantId.get(consultantId);
  return Boolean(profile && isFreelanceProfile(profile));
}

/**
 * 국세청·사업자 등록 체크리스트 (0–2개). 신고 완료 상태는 만들지 않음.
 *
 * @param {{
 *   profiles?: Array<object>|null,
 *   salaryCalculations?: Array<object>|null
 * }} params
 * @returns {string[]}
 */
export function buildNtsChecklistComments({ profiles, salaryCalculations } = {}) {
  const profileList = Array.isArray(profiles) ? profiles : [];
  const calcList = Array.isArray(salaryCalculations) ? salaryCalculations : [];
  const comments = [];

  const profilesByConsultantId = new Map();
  profileList.forEach((profile) => {
    if (profile?.consultantId == null) return;
    profilesByConsultantId.set(profile.consultantId, profile);
  });

  const hasFreelanceActivity = calcList.some((calc) =>
    isFreelanceSalaryCalc(calc, profilesByConsultantId)
  );
  if (hasFreelanceActivity) {
    comments.push(OFD_SALARY_CHECKLIST.NTS_WITHHOLDING);
  }

  const needsBusinessReg = profileList.some((profile) => (
    isActiveSalaryProfile(profile)
    && isFreelanceProfile(profile)
    && profile.isBusinessRegistered !== true
  ));
  if (needsBusinessReg) {
    comments.push(OFD_SALARY_CHECKLIST.BUSINESS_REG);
  }

  return comments;
}

const WITHHOLDING_TAX_KEYS = {
  NATIONAL: 'WITHHOLDING_NATIONAL',
  LOCAL: 'WITHHOLDING_LOCAL'
};

/**
 * pre-confirm-warning API 응답을 화면용 숫자로 정규화.
 * @param {unknown} response
 * @returns {object|null}
 */
export function parsePreConfirmWarningPayload(response) {
  if (response == null || typeof response !== 'object') {
    return null;
  }
  const data = response.data != null && typeof response.data === 'object'
    ? response.data
    : response;
  if (data.success === false) {
    return null;
  }
  const toCount = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    notCompletedCount: toCount(data.notCompletedCount),
    missingRecordCount: toCount(data.missingRecordCount),
    currentCompletedCount: toCount(data.currentCompletedCount),
    storedCompletedCount: toCount(data.storedCompletedCount),
    extraCompletedCount: toCount(data.extraCompletedCount),
    primaryCalculationId: data.primaryCalculationId ?? null,
    primaryStatus: data.primaryStatus != null ? String(data.primaryStatus) : null
  };
}

/**
 * 본정산 행별 pre-confirm-warning 조회 쿼리 (중복 consultant+period 제거).
 * @param {Array<object>|null|undefined} list
 * @returns {Array<{ consultantId: *, periodStart: string, periodEnd: string, fallbackPrimaryId: * }>}
 */
export function collectPrimaryPreConfirmQueries(list) {
  const primaries = (Array.isArray(list) ? list : []).filter(
    (calc) => !isSalaryAdjustmentCalculation(calc)
  );
  const uniqueByKey = new Map();
  primaries.forEach((calc) => {
    const consultantId = calc?.consultantId;
    const periodStart = calc?.calculationPeriodStart;
    const periodEnd = calc?.calculationPeriodEnd;
    if (consultantId == null || !periodStart || !periodEnd) {
      return;
    }
    const key = `${consultantId}|${periodStart}|${periodEnd}`;
    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, {
        consultantId,
        periodStart,
        periodEnd,
        fallbackPrimaryId: calc.id
      });
    }
  });
  return [...uniqueByKey.values()];
}

/**
 * pre-confirm-warning 배치 결과 → primaryId 맵
 * @param {Array<[*, object]|null|undefined>} entries
 * @returns {Record<string|number, object>}
 */
export function mergeLateWarningsFromEntries(entries) {
  const nextMap = {};
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (entry) {
      nextMap[entry[0]] = entry[1];
    }
  });
  return nextMap;
}

/**
 * tax statistics 응답에서 taxByType 추출
 * @param {unknown} raw
 * @returns {Record<string, number>|null}
 */
export function extractTaxByTypeFromStatistics(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const data = raw.data != null && typeof raw.data === 'object' ? raw.data : raw;
  const taxByType = data?.taxByType;
  if (!taxByType || typeof taxByType !== 'object' || Array.isArray(taxByType)) {
    return null;
  }
  return taxByType;
}

/**
 * 저장된 원천징수 국세·지방세 금액 코멘트 (3.3% 합산 표기 금지).
 * @param {Record<string, unknown>|null|undefined} taxByType
 * @returns {string|null}
 */
export function buildWithholdingStoredAmountComment(taxByType) {
  if (!taxByType || typeof taxByType !== 'object') {
    return null;
  }
  const national = toSafeNumber(taxByType[WITHHOLDING_TAX_KEYS.NATIONAL]);
  const local = toSafeNumber(taxByType[WITHHOLDING_TAX_KEYS.LOCAL]);
  if (national <= 0 && local <= 0) {
    return null;
  }
  const parts = [];
  if (national > 0) {
    parts.push(`${OFD_TODO_RULES.WITHHOLDING_NATIONAL_PREFIX}${formatWonDisplay(national)}`);
  }
  if (local > 0) {
    if (parts.length > 0) {
      parts.push(`${OFD_TODO_RULES.WITHHOLDING_LOCAL_PREFIX}${formatWonDisplay(local)}`);
    } else {
      parts.push(`원천징수 지방세 ${formatWonDisplay(local)}`);
    }
  }
  return parts.join('');
}

/**
 * @param {Array<object>|null|undefined} salaryCalculations
 * @param {*} parentPrimaryId
 * @returns {boolean}
 */
function hasAdjustmentChildForPrimary(salaryCalculations, parentPrimaryId) {
  if (parentPrimaryId == null) {
    return false;
  }
  return (Array.isArray(salaryCalculations) ? salaryCalculations : []).some((calc) => (
    isSalaryAdjustmentCalculation(calc)
    && calc?.parentCalculationId === parentPrimaryId
  ));
}

/**
 * 빠진 회기 RULE 코멘트 (본정산별 · extraCompletedCount>0).
 * @param {{
 *   salaryCalculations?: Array<object>|null,
 *   lateWarningsByPrimaryId?: Record<string|number, object>|null
 * }} params
 * @returns {string[]}
 */
export function buildLateSessionTodoComments({
  salaryCalculations,
  lateWarningsByPrimaryId
} = {}) {
  const calcList = Array.isArray(salaryCalculations) ? salaryCalculations : [];
  const warnings = lateWarningsByPrimaryId && typeof lateWarningsByPrimaryId === 'object'
    ? lateWarningsByPrimaryId
    : {};
  const comments = [];

  calcList.forEach((calc) => {
    if (isSalaryAdjustmentCalculation(calc)) {
      return;
    }
    const primaryId = calc?.id;
    const warning = primaryId != null ? warnings[primaryId] : null;
    const extraCount = toSafeNumber(warning?.extraCompletedCount);
    if (extraCount <= 0) {
      return;
    }
    const status = normalizeSalaryCalculationStatus(calc?.status ?? calc?.paymentStatus);
    if (status !== OFD_SALARY_PAID_STATUS) {
      const comment = formatLateSessionUnpaidTodo(extraCount);
      if (comment) {
        comments.push(comment);
      }
      return;
    }
    if (!hasAdjustmentChildForPrimary(calcList, primaryId)) {
      const comment = formatLateSessionPaidAdjustmentTodo(extraCount);
      if (comment) {
        comments.push(comment);
      }
    }
  });

  return comments;
}

/**
 * 지금 손볼 일 RULE 코멘트 orchestrator (금액 행 제외).
 * @param {{
 *   today?: Date,
 *   dayOfMonth?: number,
 *   hasUnpaid?: boolean,
 *   profiles?: Array<object>|null,
 *   salaryCalculations?: Array<object>|null,
 *   taxByType?: Record<string, unknown>|null,
 *   lateWarningsByPrimaryId?: Record<string|number, object>|null
 * }} params
 * @returns {string[]}
 */
export function buildMoneyTodoRuleComments({
  today = new Date(),
  dayOfMonth = 10,
  hasUnpaid = false,
  profiles = [],
  salaryCalculations = [],
  taxByType = null,
  lateWarningsByPrimaryId = {}
} = {}) {
  const comments = [];

  const paydayComment = buildPaydayChecklistComment({
    today,
    dayOfMonth,
    hasUnpaid
  });
  if (paydayComment) {
    comments.push(paydayComment);
  }

  const lateComments = buildLateSessionTodoComments({
    salaryCalculations,
    lateWarningsByPrimaryId
  });
  comments.push(...lateComments);

  const withholdingComment = buildWithholdingStoredAmountComment(taxByType);
  if (withholdingComment) {
    comments.push(withholdingComment);
  }

  const ntsComments = buildNtsChecklistComments({
    profiles,
    salaryCalculations
  });
  comments.push(...ntsComments);

  return comments.filter(Boolean);
}

/**
 * API 목록 응답 → 배열 (실패·비목록이면 빈 배열)
 * @param {unknown} raw
 * @returns {Array<object>}
 */
export function unwrapEntityList(raw) {
  const list = unwrapList(raw);
  return list == null ? [] : list;
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
  const n = Math.round(toSafeNumber(amount));
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n);
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
 * 차트 Y축 눈금 — 항상 전체 원 표기 (`1,200,000원`). 0 → `0원`. 만/억 축약 없음.
 * @param {number} value
 * @returns {string|number}
 */
export function formatAxisTick(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return formatWonDisplay(n);
}

/**
 * 행에 유효한 year/month가 있는지
 * @param {object} row
 * @returns {boolean}
 */
function hasSeriesYearMonth(row) {
  const year = Number(row?.year);
  const month = Number(row?.month);
  return Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12;
}

/**
 * (year, month)가 기준 연·월 이하인지
 * @param {object} row
 * @param {number} currentYear
 * @param {number} currentMonth
 * @returns {boolean}
 */
function isSeriesMonthOnOrBefore(row, currentYear, currentMonth) {
  if (!hasSeriesYearMonth(row)) {
    return false;
  }
  const year = Number(row.year);
  const month = Number(row.month);
  if (year < currentYear) return true;
  if (year > currentYear) return false;
  return month <= currentMonth;
}

/**
 * 운영 시작달 → KST 이번 달(포함) 구간의 들어옴·나감 월 평균.
 *
 * 규칙:
 * - 시작 = income > 0 또는 expense > 0 인 첫 행 (운영 시작월)
 * - 끝 = Asia/Seoul 현재 연·월 이하인 마지막 행 (미래 월 제외)
 * - 구간 안 0원 월은 분모에 포함. 시작 전·현재 이후 월은 제외.
 * - year/month가 모든 행에 없으면(레거시): 롤링이 지금으로 끝난다고 보고
 *   시작 활동 행부터 시리즈 끝까지 사용.
 *
 * @param {Array<{
 *   income?: number,
 *   expense?: number,
 *   year?: number,
 *   month?: number
 * }>|null|undefined} series
 * @param {Date} [now] 테스트용 기준 시각. 기본 `new Date()`
 * @returns {{ incomeAvg: number, expenseAvg: number }}
 */
export function computeSeriesMonthlyAverages(series, now = new Date()) {
  const rows = Array.isArray(series) ? series : [];
  if (rows.length === 0) {
    return { incomeAvg: 0, expenseAvg: 0 };
  }

  const startIndex = rows.findIndex((row) => (
    toSafeNumber(row?.income) > 0 || toSafeNumber(row?.expense) > 0
  ));
  if (startIndex < 0) {
    return { incomeAvg: 0, expenseAvg: 0 };
  }

  const { year: currentYear, month: currentMonth } = getKstDateParts(now);
  const allLackDates = rows.every((row) => !hasSeriesYearMonth(row));

  let endIndex = -1;
  if (allLackDates) {
    endIndex = rows.length - 1;
  } else {
    for (let i = startIndex; i < rows.length; i += 1) {
      if (isSeriesMonthOnOrBefore(rows[i], currentYear, currentMonth)) {
        endIndex = i;
      }
    }
  }

  if (endIndex < startIndex) {
    return { incomeAvg: 0, expenseAvg: 0 };
  }

  const n = endIndex - startIndex + 1;
  let incomeSum = 0;
  let expenseSum = 0;
  for (let i = startIndex; i <= endIndex; i += 1) {
    incomeSum += toSafeNumber(rows[i]?.income);
    expenseSum += toSafeNumber(rows[i]?.expense);
  }
  return {
    incomeAvg: Math.round(incomeSum / n),
    expenseAvg: Math.round(expenseSum / n)
  };
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
