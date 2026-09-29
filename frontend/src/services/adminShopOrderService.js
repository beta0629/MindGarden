/**
 * 테넌트 어드민 — 온라인 주문 API
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import StandardizedApi from '../utils/standardizedApi';
import {
  ADMIN_SHOP_API,
  ADMIN_SHOP_ORDERS_DEFAULT_LIMIT,
  ADMIN_SHOP_ORDERS_DEFAULT_PAGE,
  ADMIN_SHOP_ORDERS_DEFAULT_PAGE_SIZE,
  buildAdminShopOrderPath,
  buildAdminShopOrderExpiryExtensionsPath,
  buildAdminShopOrderFulfillRetryPath,
  buildAdminShopOrderReconcilePaymentPath,
  buildAdminShopOrderReconcileRefundPath,
  buildAdminShopOrderRefundPath,
  buildAdminShopReconcilePaymentBody,
  buildAdminShopRefundBody
} from '../constants/adminShopApi';

function unwrapData(raw) {
  if (raw && raw.success === true && raw.data !== undefined) {
    return raw.data;
  }
  if (raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

const LIST_FILTER_KEYS = Object.freeze(['segment', 'from', 'to', 'q']);

/**
 * 어드민 온라인 주문 목록 (서버 page/size · 세그먼트 · 기간 · 검색).
 *
 * @param {Object|number} [optionsOrLimit]
 *   number 이면 legacy limit (page=0, size=limit).
 *   object 이면 `{ page, size, limit, segment, from, to, q }`.
 * @returns {Promise<{ orders: Array, totalElements: number, page: number, size: number,
 *   counts: Record<string, number>, summary: object|null }>}
 */
export async function listAdminShopOrders(optionsOrLimit = {}) {
  let page = ADMIN_SHOP_ORDERS_DEFAULT_PAGE;
  let size = ADMIN_SHOP_ORDERS_DEFAULT_PAGE_SIZE;

  if (typeof optionsOrLimit === 'number') {
    size = optionsOrLimit > 0 ? optionsOrLimit : ADMIN_SHOP_ORDERS_DEFAULT_LIMIT;
  } else if (optionsOrLimit && typeof optionsOrLimit === 'object') {
    if (optionsOrLimit.page != null && Number.isFinite(Number(optionsOrLimit.page))) {
      page = Number(optionsOrLimit.page);
    }
    if (optionsOrLimit.size != null && Number.isFinite(Number(optionsOrLimit.size))) {
      size = Number(optionsOrLimit.size);
    } else if (optionsOrLimit.limit != null && Number.isFinite(Number(optionsOrLimit.limit))) {
      size = Number(optionsOrLimit.limit);
    }
  }

  const params = { page, size };
  if (optionsOrLimit && typeof optionsOrLimit === 'object') {
    LIST_FILTER_KEYS.forEach((key) => {
      const value = optionsOrLimit[key];
      if (value != null && String(value).trim() !== '') {
        params[key] = String(value).trim();
      }
    });
  }
  const raw = await StandardizedApi.get(ADMIN_SHOP_API.ORDERS, params);
  const data = unwrapData(raw);

  if (Array.isArray(data)) {
    return {
      orders: data,
      totalElements: data.length,
      page,
      size,
      counts: {},
      summary: null
    };
  }

  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const totalRaw = data?.totalElements ?? data?.count;
  const totalElements = Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : orders.length;

  return {
    orders,
    totalElements,
    page: data?.page != null && Number.isFinite(Number(data.page)) ? Number(data.page) : page,
    size: data?.size != null && Number.isFinite(Number(data.size)) ? Number(data.size) : size,
    counts: data?.counts && typeof data.counts === 'object' ? data.counts : {},
    summary: data?.summary && typeof data.summary === 'object' ? data.summary : null
  };
}

/**
 * 사용 기한 연장 (센터 관리자). 이력 INSERT 만 — 결제·회기 행은 바뀌지 않는다.
 *
 * @param {string} orderPublicId
 * @param {{ newExpireDate: string, reason: string }} body
 * @returns {Promise<Array<object>>} 연장 이력 (최신 먼저)
 */
export async function extendAdminShopOrderExpiry(orderPublicId, { newExpireDate, reason }) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const raw = await StandardizedApi.post(buildAdminShopOrderExpiryExtensionsPath(orderPublicId), {
    newExpireDate,
    reason: String(reason || '').trim()
  });
  const data = unwrapData(raw);
  return Array.isArray(data) ? data : [];
}

/**
 * 사용 기한 연장 이력.
 *
 * @param {string} orderPublicId
 * @returns {Promise<Array<object>>}
 */
export async function listAdminShopOrderExpiryExtensions(orderPublicId) {
  const raw = await StandardizedApi.get(buildAdminShopOrderExpiryExtensionsPath(orderPublicId));
  const data = unwrapData(raw);
  return Array.isArray(data) ? data : [];
}

/**
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function getAdminShopOrder(orderPublicId) {
  const raw = await StandardizedApi.get(buildAdminShopOrderPath(orderPublicId));
  return unwrapData(raw);
}

/**
 * @param {string} orderPublicId
 * @param {string} reasonCode
 * @returns {Promise<object|null>}
 */
export async function refundAdminShopOrder(orderPublicId, reasonCode) {
  const raw = await StandardizedApi.post(
    buildAdminShopOrderRefundPath(orderPublicId),
    buildAdminShopRefundBody(reasonCode)
  );
  return unwrapData(raw);
}

/**
 * PAID 주문 이행 재시도 (FAILED·retryable).
 *
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function retryAdminShopOrderFulfillment(orderPublicId) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const raw = await StandardizedApi.post(
    buildAdminShopOrderFulfillRetryPath(orderPublicId),
    {}
  );
  return unwrapData(raw);
}

/**
 * PortOne 결제 정합 — 미결제·만료 주문을 paymentId(또는 승인번호)로 복구.
 *
 * @param {string} orderPublicId
 * @param {{ paymentId?: string, cardApprovalNumber?: string }} payload
 * @returns {Promise<object|null>}
 */
export async function reconcileShopOrderPayment(orderPublicId, payload = {}) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const body = buildAdminShopReconcilePaymentBody(payload);
  if (!body.paymentId && !body.cardApprovalNumber) {
    throw new Error('paymentId 또는 cardApprovalNumber가 필요합니다.');
  }
  const raw = await StandardizedApi.post(
    buildAdminShopOrderReconcilePaymentPath(orderPublicId),
    body
  );
  return unwrapData(raw);
}

/**
 * PortOne 기취소 Clinic 환불 정합 (PG cancel 생략).
 *
 * @param {string} orderPublicId
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<object|null>}
 */
export async function reconcileShopOrderRefund(orderPublicId, options = {}) {
  if (!orderPublicId || !String(orderPublicId).trim()) {
    throw new Error('주문 번호가 없습니다.');
  }
  const force = options.force === true;
  const raw = await StandardizedApi.post(
    buildAdminShopOrderReconcileRefundPath(orderPublicId, force),
    {}
  );
  return unwrapData(raw);
}

/**
 * 허용 상태 주문 soft-delete.
 *
 * @param {string} orderPublicId
 * @returns {Promise<object|null>}
 */
export async function deleteAdminShopOrder(orderPublicId) {
  const raw = await StandardizedApi.delete(buildAdminShopOrderPath(orderPublicId));
  return unwrapData(raw);
}
