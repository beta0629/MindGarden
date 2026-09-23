/**
 * 내담자 결제 내역 — title/amount/method/status 표시 SSOT (fail-closed).
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import {
  MAPPING_PAYMENT_METHOD_LABELS,
  PAYMENT_PROVIDER_PORTONE_SURFACE
} from '../constants/billing';
import { PAYMENT_STATUS } from '../constants/mapping';
import { toDisplayString, toSafeNumber } from './safeDisplay';

const PG_PROVIDER_IAMPORT = 'IAMPORT';
const ORDER_STATUS_REFUNDED = 'REFUNDED';
const ORDER_STATUS_CANCELLED = 'CANCELLED';

/**
 * 값이 금액으로 쓸 수 있으면 (null/undefined/빈 문자열 제외).
 *
 * @param {*} value
 * @returns {boolean}
 */
function hasAmountValue(value) {
  return value != null && value !== '';
}

/**
 * 행 금액: pgAmount → paymentAmount → lineTotalMinor → cashDueMinor → packagePrice → 0
 * (packagePrice는 마지막 — shop SSOT 없을 때만)
 *
 * @param {object|null|undefined} mapping
 * @returns {number}
 */
export function resolveClientPaymentHistoryAmount(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return 0;
  }
  if (hasAmountValue(mapping.pgAmount)) {
    return toSafeNumber(mapping.pgAmount, 0);
  }
  if (hasAmountValue(mapping.paymentAmount)) {
    return toSafeNumber(mapping.paymentAmount, 0);
  }
  if (hasAmountValue(mapping.lineTotalMinor)) {
    return toSafeNumber(mapping.lineTotalMinor, 0);
  }
  if (hasAmountValue(mapping.cashDueMinor)) {
    return toSafeNumber(mapping.cashDueMinor, 0);
  }
  if (hasAmountValue(mapping.packagePrice)) {
    return toSafeNumber(mapping.packagePrice, 0);
  }
  return 0;
}

/**
 * 제목: productTitle → packageName → emptyFallback (상품명 발명 금지)
 *
 * @param {object|null|undefined} mapping
 * @param {string} emptyFallback
 * @returns {string}
 */
export function resolveClientPaymentHistoryTitle(mapping, emptyFallback) {
  const fallback = emptyFallback == null ? '' : String(emptyFallback);
  if (mapping == null || typeof mapping !== 'object') {
    return fallback;
  }
  const productTitle =
    mapping.productTitle != null && String(mapping.productTitle).trim() !== ''
      ? mapping.productTitle
      : null;
  const packageName =
    mapping.packageName != null && String(mapping.packageName).trim() !== ''
      ? mapping.packageName
      : null;
  return toDisplayString(productTitle ?? packageName, fallback);
}

/**
 * 표시용 결제 상태: effectivePaymentStatus → paymentStatus
 *
 * @param {object|null|undefined} mapping
 * @returns {string|null}
 */
export function resolveClientPaymentHistoryStatus(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  if (mapping.effectivePaymentStatus != null && String(mapping.effectivePaymentStatus).trim() !== '') {
    return String(mapping.effectivePaymentStatus).trim();
  }
  if (mapping.paymentStatus != null && String(mapping.paymentStatus).trim() !== '') {
    return String(mapping.paymentStatus).trim();
  }
  return null;
}

/**
 * 환불·취소 쇼핑 결제인지 (KPI·합계에서 제외).
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function isClientPaymentHistoryRefundedOrCancelled(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return false;
  }
  const status = resolveClientPaymentHistoryStatus(mapping);
  if (status === PAYMENT_STATUS.REFUNDED || status === ORDER_STATUS_CANCELLED) {
    return true;
  }
  const orderStatus =
    mapping.orderStatus == null ? '' : String(mapping.orderStatus).trim().toUpperCase();
  return orderStatus === ORDER_STATUS_REFUNDED || orderStatus === ORDER_STATUS_CANCELLED;
}

/**
 * KPI 합계에 포함할지 (환불·취소 제외).
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function shouldIncludeInClientPaymentHistoryTotals(mapping) {
  return !isClientPaymentHistoryRefundedOrCancelled(mapping);
}

/**
 * 결제 수단 라벨. SSOT 맵에 없으면 unknownFallback(미지정). IAMPORT → PortOne 표기.
 *
 * @param {string|null|undefined} method
 * @param {string|null|undefined} paymentProvider
 * @param {string} unknownFallback
 * @returns {string}
 */
export function resolveClientPaymentHistoryMethodLabel(method, paymentProvider, unknownFallback) {
  const fallback = unknownFallback == null ? '' : String(unknownFallback);
  if (method == null || String(method).trim() === '') {
    return fallback;
  }
  const key = String(method).trim();
  if (!Object.prototype.hasOwnProperty.call(MAPPING_PAYMENT_METHOD_LABELS, key)) {
    return fallback;
  }
  let label = MAPPING_PAYMENT_METHOD_LABELS[key];
  const provider =
    paymentProvider == null ? '' : String(paymentProvider).trim().toUpperCase();
  if (provider === PG_PROVIDER_IAMPORT) {
    label = `${label} · ${PAYMENT_PROVIDER_PORTONE_SURFACE}`;
  }
  return label;
}
