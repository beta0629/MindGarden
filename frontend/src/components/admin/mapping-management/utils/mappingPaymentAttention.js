/**
 * Mapping payment attention — PENDING_PAYMENT(+ paymentStatus PENDING) 클라이언트 집계 SSOT
 * 새 API 금지. handleStatCardClick payment 경로와 동일 조건.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { MAPPING_STATUS, PAYMENT_STATUS } from '../../../../constants/mapping';

/**
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function isMappingPaymentAttentionItem(mapping) {
  if (!mapping) {
    return false;
  }
  return (
    mapping.status === MAPPING_STATUS.PENDING_PAYMENT
    || mapping.paymentStatus === PAYMENT_STATUS.PENDING
  );
}

/**
 * 행/카드/테이블 결제 대기 금액 강조 여부 (동일 조건)
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function isMappingPaymentPendingAmount(mapping) {
  return isMappingPaymentAttentionItem(mapping);
}

/**
 * @param {object|null|undefined} mapping
 * @returns {number}
 */
export function getMappingPaymentAmount(mapping) {
  if (!mapping) {
    return 0;
  }
  const raw = mapping.packagePrice ?? mapping.paymentAmount ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Array<object>} mappings
 * @returns {{ count: number, totalAmount: number, items: Array<object> }}
 */
export function aggregateMappingPaymentAttention(mappings = []) {
  const items = (mappings || []).filter(isMappingPaymentAttentionItem);
  const totalAmount = items.reduce((sum, m) => sum + getMappingPaymentAmount(m), 0);
  return {
    count: items.length,
    totalAmount,
    items
  };
}
