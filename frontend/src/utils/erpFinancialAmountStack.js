/**
 * ERP 재무 거래 금액 스택 표시 SSOT (총액·부가세 포함가·원천·카드 정산).
 * UI는 FinancialManagement·FinancialTransactionForm 등에서 이 모듈만 사용한다.
 */
import { toSafeNumber } from './safeDisplay';

/** 승인·청구 총액(거래 금액) — 목록·폼 금액 필드 라벨 공통 */
export const FINANCIAL_AMOUNT_STACK_LABEL_TOTAL = '승인·청구 총액(거래 금액)';
export const FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY = '공급가액';
export const FINANCIAL_AMOUNT_STACK_LABEL_VAT = '부가세(VAT)';
/** 사업소득 원천징수 예정 — 스택 4번 */
export const FINANCIAL_WITHHOLDING_TAX_LABEL = '원천징수(3.3%) 예정';
/** 수입·taxIncluded=true 거래 금액 옆 배지 */
export const FINANCIAL_TAX_INCLUDED_LABEL = '부가세 포함가';
export const FINANCIAL_CARD_MERCHANT_FEE_LABEL = '카드 가맹점 수수료';
export const FINANCIAL_CARD_NET_DEPOSIT_LABEL = '카드 실입금';

/**
 * 원천징수 금액 표시 SSOT.
 * {@code withholdingTaxAmount}가 응답에 있으면(0 포함) 그대로 사용한다.
 * 레거시: 필드가 없을 때만 {@code taxAmount}를 쓴다(과거 응답에서 사업소득 원천이 taxAmount에 실리던 경우).
 * @param {Object|null|undefined} transaction
 * @returns {number}
 */
export function getDisplayWithholdingTaxAmount(transaction) {
  if (!transaction) {
    return 0;
  }
  if (transaction.withholdingTaxAmount != null && transaction.withholdingTaxAmount !== '') {
    return toSafeNumber(transaction.withholdingTaxAmount);
  }
  return toSafeNumber(transaction.taxAmount);
}

/**
 * 카드 수수료·실입금 중 하나라도 내려온 경우에만 블록 표시.
 * @param {Object|null|undefined} transaction
 * @returns {boolean}
 */
export function shouldShowCardSettlementSection(transaction) {
  if (!transaction) {
    return false;
  }
  return (
    transaction.cardMerchantFeeAmount != null ||
    transaction.cardNetDepositAmount != null
  );
}

/**
 * @param {unknown} amount
 * @returns {string}
 */
export function formatKrw(amount) {
  if (!amount && amount !== 0) {
    return '0원';
  }
  const n = typeof amount === 'number' ? amount : toSafeNumber(amount);
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

/**
 * 카드 정산 등 선택 필드: 없으면 대시(—).
 * @param {unknown} amount
 * @returns {string}
 */
export function formatOptionalKrw(amount) {
  if (amount == null || amount === '') {
    return '—';
  }
  return `${new Intl.NumberFormat('ko-KR').format(toSafeNumber(amount))}원`;
}

/**
 * 사업소득 원천징수 예정액 표시. INCOME이고 원천 금액이 있으면 부가세 포함가(taxIncluded) 여부와 무관하게 표시.
 * 거래 금액이 0 이하이면 표시하지 않는다.
 * @param {Object} transaction
 * @returns {boolean}
 */
export function shouldShowIncomeWithholdingTax(transaction) {
  if (!transaction || transaction.transactionType !== 'INCOME') {
    return false;
  }
  if (toSafeNumber(transaction.amount) <= 0) {
    return false;
  }
  if (getDisplayWithholdingTaxAmount(transaction) <= 0) {
    return false;
  }
  return true;
}

/**
 * 수입이면서 포함가(taxIncluded)인 경우에만 부가세 포함가 배지 표시.
 * @param {Object|null|undefined} transaction
 * @returns {boolean}
 */
export function shouldShowIncomeTaxIncludedLabel(transaction) {
  return (
    !!transaction &&
    transaction.transactionType === 'INCOME' &&
    transaction.taxIncluded === true
  );
}
