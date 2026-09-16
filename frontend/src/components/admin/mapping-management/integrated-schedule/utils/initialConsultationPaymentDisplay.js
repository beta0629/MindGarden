/**
 * Side Peek 초기상담 결제 — 재무 FT 존재 판별용.
 * UI는 「초기 결제 완료」배지만 사용. 금액·일자 상세 표시 금지.
 * contract prepaid_amount / institutionLinkPrepaidAmount(DATAFIX 10만) 금지.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';

/**
 * @param {object|null|undefined} mapping
 * @returns {{ amount: number, transactionDate: string|null, status: string|null, financialTransactionId: number|null, relatedMappingId: number|null }|null}
 */
export function resolveInitialConsultationPayment(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  // contract denorm 은 표시·판별 정본이 아님 — 무시
  void mapping.institutionLinkPrepaidAmount;
  void mapping.prepaidAmount;
  const payment = mapping.initialConsultationPayment;
  if (payment == null || typeof payment !== 'object') {
    return null;
  }
  const amount = toSafeNumber(payment.amount, null);
  const financialTransactionId = payment.financialTransactionId != null
    ? toSafeNumber(payment.financialTransactionId, null)
    : null;
  if ((amount == null || amount <= 0) && financialTransactionId == null) {
    return null;
  }
  return {
    amount: amount != null && amount > 0 ? amount : 0,
    transactionDate: payment.transactionDate != null
      ? toDisplayString(payment.transactionDate, '').trim() || null
      : null,
    status: payment.status != null
      ? toDisplayString(payment.status, '').trim() || null
      : null,
    financialTransactionId,
    relatedMappingId: payment.relatedMappingId != null
      ? toSafeNumber(payment.relatedMappingId, null)
      : null
  };
}
