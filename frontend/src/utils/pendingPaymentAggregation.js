/**
 * PENDING_PAYMENT(결제 대기) 집계 SSOT
 *
 * Admin 대시보드 KPI · 통합 스케줄 사이드바 · ERP Money Cockpit 가 동일 공식으로
 * 건수·대기 금액을 계산한다. PAYMENT_CONFIRMED / 회기추가 입금대기는 포함하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import { MAPPING_STATUS, MAPPING_STATUS_LABELS } from '../constants/mapping';
import { toSafeNumber } from './safeDisplay';

/** 사이드바 STATUS_FILTER_OPTIONS · KPI 공통 라벨 */
export const PENDING_PAYMENT_KPI_LABEL =
  MAPPING_STATUS_LABELS[MAPPING_STATUS.PENDING_PAYMENT];

/**
 * pending-payment API 응답 등에서 매핑 배열을 꺼낸다.
 * 파싱 불가면 null (호출부에서 hide/0 처리).
 *
 * @param {unknown} raw
 * @returns {Array<object>|null}
 */
export function unwrapPendingPaymentMappings(raw) {
  if (raw == null) {
    return null;
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== 'object') {
    return null;
  }
  if (Array.isArray(raw.mappings)) {
    return raw.mappings;
  }
  const data = raw.data ?? raw;
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.mappings)) {
      return data.mappings;
    }
    if (Array.isArray(data.content)) {
      return data.content;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return null;
}

/**
 * PENDING_PAYMENT 집합만 유지.
 * status 부재 시 pending-payment API 스코프 응답으로 간주해 포함.
 * PAYMENT_CONFIRMED 등 다른 status는 제외.
 *
 * @param {unknown} list
 * @returns {Array<object>}
 */
export function selectPendingPaymentMappings(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((item) => {
    if (item == null || typeof item !== 'object') {
      return false;
    }
    const status = item.status;
    if (status == null || status === '') {
      return true;
    }
    return String(status) === MAPPING_STATUS.PENDING_PAYMENT;
  });
}

/**
 * @param {unknown} list
 * @returns {number}
 */
export function countPendingPaymentMappings(list) {
  return selectPendingPaymentMappings(list).length;
}

/**
 * packagePrice ?? paymentAmount 합 (사이드바·KPI·Money Cockpit 동일).
 *
 * @param {unknown} list
 * @returns {number}
 */
export function sumPendingPaymentAmount(list) {
  return selectPendingPaymentMappings(list).reduce(
    (sum, item) => sum + toSafeNumber(item?.packagePrice ?? item?.paymentAmount, 0),
    0
  );
}

/**
 * raw 응답 → { count, totalAmount }. 파싱 불가면 count/amount 0.
 *
 * @param {unknown} raw
 * @returns {{ count: number, totalAmount: number, mappings: Array<object> }}
 */
export function aggregatePendingPaymentStats(raw) {
  const unwrapped = unwrapPendingPaymentMappings(raw);
  const mappings = selectPendingPaymentMappings(unwrapped ?? []);
  return {
    mappings,
    count: mappings.length,
    totalAmount: sumPendingPaymentAmount(mappings)
  };
}
