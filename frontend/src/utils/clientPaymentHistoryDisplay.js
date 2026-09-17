/**
 * 내담자 결제 내역 — title/amount/method 표시 SSOT (fail-closed).
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import {
  MAPPING_PAYMENT_METHOD_LABELS,
  PAYMENT_PROVIDER_PORTONE_SURFACE
} from '../constants/billing';
import { toDisplayString, toSafeNumber } from './safeDisplay';

const PG_PROVIDER_IAMPORT = 'IAMPORT';

/**
 * 행 금액: paymentAmount → lineTotalMinor → packagePrice → 0
 *
 * @param {object|null|undefined} mapping
 * @returns {number}
 */
export function resolveClientPaymentHistoryAmount(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return 0;
  }
  if (mapping.paymentAmount != null && mapping.paymentAmount !== '') {
    return toSafeNumber(mapping.paymentAmount, 0);
  }
  if (mapping.lineTotalMinor != null && mapping.lineTotalMinor !== '') {
    return toSafeNumber(mapping.lineTotalMinor, 0);
  }
  if (mapping.packagePrice != null && mapping.packagePrice !== '') {
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
