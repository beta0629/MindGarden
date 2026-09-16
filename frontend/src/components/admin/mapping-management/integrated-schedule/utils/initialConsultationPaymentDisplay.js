/**
 * Side Peek 초기상담 결제 표시 — 재무 FT SSOT.
 * contract prepaid_amount / institutionLinkPrepaidAmount(DATAFIX 10만) 금지.
 * 라벨은 「초기상담 결제」(게이트 금지 라벨·contract prepaid 위조 표시 금지).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';

export const INITIAL_CONSULTATION_PAYMENT_AMOUNT_SUFFIX = '원';

/**
 * @param {object|null|undefined} mapping
 * @returns {{ amount: number, transactionDate: string|null, status: string|null, financialTransactionId: number|null, relatedMappingId: number|null }|null}
 */
export function resolveInitialConsultationPayment(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  void mapping.institutionLinkPrepaidAmount;
  void mapping.prepaidAmount;
  const payment = mapping.initialConsultationPayment;
  if (payment == null || typeof payment !== 'object') {
    return null;
  }
  const amount = toSafeNumber(payment.amount, null);
  if (amount == null || amount <= 0) {
    return null;
  }
  return {
    amount,
    transactionDate: payment.transactionDate != null
      ? toDisplayString(payment.transactionDate, '').trim() || null
      : null,
    status: payment.status != null
      ? toDisplayString(payment.status, '').trim() || null
      : null,
    financialTransactionId: payment.financialTransactionId != null
      ? toSafeNumber(payment.financialTransactionId, null)
      : null,
    relatedMappingId: payment.relatedMappingId != null
      ? toSafeNumber(payment.relatedMappingId, null)
      : null
  };
}

/**
 * @param {number|null|undefined} amount
 * @returns {string}
 */
export function formatInitialConsultationPaymentAmount(amount) {
  const num = toSafeNumber(amount, null);
  if (num == null) {
    return '';
  }
  return `${num.toLocaleString('ko-KR')}${INITIAL_CONSULTATION_PAYMENT_AMOUNT_SUFFIX}`;
}

/**
 * @param {string|null|undefined} isoDate
 * @returns {string}
 */
export function formatInitialConsultationPaymentDate(isoDate) {
  const raw = toDisplayString(isoDate, '').trim();
  if (!raw) {
    return '';
  }
  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    return raw;
  }
}
